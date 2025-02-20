// DOM Elements
const controls = document.getElementById("controls");
const next = document.getElementById("next");
const prev = document.getElementById("prev");
const slider = document.createElement("input");
const reduceFontBtn = document.getElementById("reduceFont");
const increaseFontBtn = document.getElementById("increaseFont");
const fontSizeDisplay = document.getElementById("fontSize");
const notePopup = document.querySelector("#noteSaver");
const selectedTextInput = document.getElementById("selectedTextInput");
const cancelBtn = notePopup.querySelector("#cancelNoteSaver");
const saveBtn = notePopup.querySelector("#saveNote");
const noteViewToggle = document.getElementById("noteViewToggle");
const notesSidebar = document.querySelector("#mainNav #sideBar");
const notesList = notesSidebar.querySelector("ul");
const notesNav = document.querySelector("#mainNav");
const notesNavIcon = document.querySelector("#noteViewToggle i");
const area = document.getElementById("area");
const dragarea = document.getElementById("area");
const mainLoader = document.getElementById("mainLoader");

const settingsToggle = document.getElementById("settingsToggle");
const settingsDropdown = document.getElementById("settingsDropdown");

const themebuttons = document.querySelectorAll('.theme-button');
const lightThemeBtn = document.getElementById("lightTheme");
const sepiaThemeBtn = document.getElementById("sepiaTheme");
const darkThemeBtn = document.getElementById("darkTheme");
const themeButtons = document.querySelectorAll(".theme-button");

// Theme configuration
const themes = {
  light: {
    background: "#ffffff",
    text: "#000000", 
    links: "#0066cc",
    border: "#e5e7eb"
  },
  sepia: {
    background: "#f8f3e8",
    text: "#5f4b32",
    links: "#9e7e5a",
    border: "#e8d7c3"
  },
  dark: {
    background: "#1a1a1a",
    text: "#e6e6e6",
    links: "#6ba6ff",
    border: "#4d4d4d"
  }
};


// Theme state management
let currentTheme = localStorage.getItem("readerTheme") || "light";

// State Management
let book, rendition;
let uniquePages = JSON.parse(localStorage.getItem("uniquePages")) || [];
let allElements = [];
let selectedBook = "files/hilton-time-and-time-again.epub";
let isHighlighting = false;
let highlightTimeout = null;
let startX = 0,
  startY = 0;
const threshold = 50;
let readPages = JSON.parse(localStorage.getItem("readPages")) || {};
let currentChapter = null;
let currentPage = null;

// Font size state management
const MIN_FONT_SIZE = 0.5;
const MAX_FONT_SIZE = 4;
const FONT_SIZE_STEP = 0.25;
let fontSize = parseFloat(localStorage.getItem("epubFontSize")) || 1.5;

// Initialize font size display
fontSizeDisplay.innerText = fontSize;






// Function to apply theme to renderer
function applyTheme(themeName) {
  if (!themes[themeName]) {
    console.error(`Theme "${themeName}" not found`);
    return;
  }
  
  const theme = themes[themeName];
  currentTheme = themeName;
  localStorage.setItem("readerTheme", themeName);
  
  // Update UI to show active theme
  themeButtons.forEach(button => {
    button.classList.remove("ring-2", "ring-orange-500");
  });
  
  document.getElementById(`${themeName}Theme`).classList.add("ring-2", "ring-orange-500");
  
  if (rendition) {
    // Apply theme to epub rendition
    rendition.themes.default({
      body: {
        background: theme.background,
        color: theme.text
      },
      "a": {
        color: theme.links,
        "text-decoration": "none"
      },
      "p, div, span, h1, h2, h3, h4, h5, h6": {
        color: theme.text
      },
      "img": {
        "max-width": "100%"
      },
      "hr": {
        border: `1px solid ${theme.border}`
      }
    });
    
    // Force a redraw if needed
    rendition.views().forEach(view => {
      if (view && view.pane) {
        view.pane.render();
      }
    });
  }
}

// Initialize theme on page load
function initializeTheme() {
  applyTheme(currentTheme);
}

// Function to position dropdown within viewport
function positionDropdown() {
  // Reset any transform for measurement
  settingsDropdown.style.transform = "translate(0, 0)";
  
  // Get dimensions and positions
  const toggleRect = settingsToggle.getBoundingClientRect();
  const dropdownRect = settingsDropdown.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  
  // Calculate if dropdown extends beyond right edge
  const rightEdge = toggleRect.right;
  const dropdownWidth = dropdownRect.width;
  const overflowRight = rightEdge + dropdownWidth - viewportWidth;
  
  // Position dropdown to be fully visible
  if (overflowRight > 0) {
    // Position dropdown more to the left to keep it in viewport
    const offset = Math.min(dropdownWidth / 2, overflowRight + 20); // 20px buffer
    settingsDropdown.style.transform = `translateX(-${offset}px)`;
  } else {
    // Reset transform if not needed
    settingsDropdown.style.transform = "translateX(0)";
  }
}

// Toggle settings dropdown when clicking the settings button
settingsToggle.addEventListener("click", function(e) {
  e.stopPropagation();
  settingsDropdown.classList.toggle("hidden");
  
  if (!settingsDropdown.classList.contains("hidden")) {
    positionDropdown();
  }
});

// Close dropdown when clicking elsewhere
document.addEventListener("click", function(e) {
  if (!settingsToggle.contains(e.target) && !settingsDropdown.contains(e.target)) {
    settingsDropdown.classList.add("hidden");
  }
});

// Reposition on window resize
window.addEventListener("resize", function() {
  if (!settingsDropdown.classList.contains("hidden")) {
    positionDropdown();
  }
});

// Prevent dropdown from closing when interacting with content inside it
settingsDropdown.addEventListener("click", function(e) {
  e.stopPropagation();
});



// Helper Functions
function trackPage(cfi) {
  if (!uniquePages.includes(cfi)) {
    uniquePages.push(cfi);
    localStorage.setItem("uniquePages", JSON.stringify(uniquePages));
    console.log("Tracked Pages:", uniquePages);
  }
}

function normalizePage(cfi) {
  let match = cfi.match(/(\d+)\[(\d+)\]/);
  if (match) {
    let chapter = match[1];
    let pageIndex = Math.floor(parseInt(match[2]) / 100);
    return `Chapter ${chapter} - Page ${pageIndex}`;
  }
  return cfi;
}

function updateFontSize(newSize) {
  if (newSize < MIN_FONT_SIZE || newSize > MAX_FONT_SIZE) return;

  const currentLocation = rendition.currentLocation();
  const previousPageId = currentLocation?.start?.cfi
    ? generatePageId(currentLocation.start.cfi)
    : null;

  fontSize = newSize;
  localStorage.setItem("epubFontSize", fontSize);
  fontSizeDisplay.innerText = fontSize;

  if (rendition) {
    const contents = rendition.getContents();
    contents.forEach((content) => {
      const doc = content.document;
      const elements = doc.querySelector("body").querySelectorAll("*");
      elements.forEach((el) => {
        el.style.fontSize = `${fontSize}rem`;
      });
    });

    // After font size change, check if page split occurred
    setTimeout(() => {
      const newLocation = rendition.currentLocation();
      const newPageId = newLocation?.start?.cfi
        ? generatePageId(newLocation.start.cfi)
        : null;

      if (previousPageId && newPageId && previousPageId !== newPageId) {
        // Page split detected, track both pages
        trackReadPage(currentLocation.start.cfi);
        trackReadPage(newLocation.start.cfi);
      }
    }, 100);
  }
}

// Add a function to get reading statistics
function getReadingStats() {
  const stats = {
    totalPagesRead: Object.keys(readPages).length,
    readingSessionsCount: Object.values(readPages).reduce(
      (acc, page) => acc + page.visits,
      0
    ),
    averageFontSize:
      Object.values(readPages).reduce((acc, page) => {
        const avgSize =
          page.fontSizeHistory.reduce((a, b) => a + b, 0) /
          page.fontSizeHistory.length;
        return acc + avgSize;
      }, 0) / Object.keys(readPages).length,
    mostUsedFontSizes: Object.values(readPages)
      .flatMap((page) => page.fontSizeHistory)
      .reduce((acc, size) => {
        acc[size] = (acc[size] || 0) + 1;
        return acc;
      }, {}),
    readingTime: Object.values(readPages).reduce((acc, page) => {
      const firstRead = new Date(page.firstRead);
      const lastRead = new Date(page.lastRead);
      return acc + (lastRead - firstRead);
    }, 0),
  };

  return stats;
}

function loadNotes() {
  notesList.innerHTML = "";
  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.forEach((note) => {
    const li = document.createElement("li");
    li.classList.add("mb-2", "flex", "justify-between", "items-center");

    const noteBtn = document.createElement("button");
    noteBtn.classList.add(
      "hover:bg-orange-500",
      "border-none",
      "bg-transparent",
      "w-full",
      "p-1",
      "text-left"
    );
    noteBtn.textContent = note.text.substring(0, 30) + "...";

    noteBtn.addEventListener("click", function () {
      if (rendition) {
        rendition.display(note.page);
      }
      notesSidebar.classList.toggle("-translate-x-full");
      notesNavIcon.classList.toggle("fa-bars");
      notesNavIcon.classList.toggle("fa-times");
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add(
      "bg-red-500",
      "text-white",
      "rounded",
      "px-2",
      "py-1",
      "ml-2"
    );
    deleteBtn.innerHTML = `<i class="fa-solid fa-trash-alt text-white text-sm"></i>`;

    deleteBtn.addEventListener("click", function () {
      deleteNote(note.id);
    });

    li.appendChild(noteBtn);
    li.appendChild(deleteBtn);
    notesList.appendChild(li);
  });
}

function deleteNote(noteId) {
  let notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes = notes.filter((note) => note.id !== noteId);
  localStorage.setItem("notes", JSON.stringify(notes));
  loadNotes();
}

function handleSwipe(deltaX, deltaY) {
  if (isHighlighting) return;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (Math.abs(deltaX) >= threshold) {
      mainLoader.classList.remove("hidden");
      if (deltaX < 0) {
        book.package.metadata.direction === "rtl"
          ? rendition.prev()
          : rendition.next();
      } else {
        book.package.metadata.direction === "rtl"
          ? rendition.next()
          : rendition.prev();
      }
    }
  } else {
    if (Math.abs(deltaY) >= threshold) {
      mainLoader.classList.remove("hidden");
      if (deltaY < 0) {
        rendition.next();
      } else {
        rendition.prev();
      }
    }
  }
  window.scroll({ top: 0, left: 0, behavior: "smooth" });
}

function loadBook(bookUrl) {
  area.innerHTML = "";

  mainLoader.classList.remove("hidden");

  book = ePub(bookUrl);
  rendition = book.renderTo("area", {
    flow: "scrolled-doc",
    method: "continuous",
    width: "100%",
    height: 600,
    spread: "none",
    overflow: 'auto'
  });

  rendition.display();

  book.ready.then(() => {
    rendition.display();
    mainLoader.classList.add("hidden");
    applyTheme(currentTheme);
  });

  rendition.hooks.content.register((contents) => {
    let win = contents.window;
    let doc = contents.document;

    allElements = doc.querySelector("body").querySelectorAll("*");
    allElements.forEach((el) => {
      el.style.fontSize = `${fontSize}rem`;
    });

    doc.addEventListener("selectionchange", function () {
      if (highlightTimeout) clearTimeout(highlightTimeout);

      highlightTimeout = setTimeout(() => {
        let selection = win.getSelection();
        let selectedText = selection.toString().trim();

        if (!selectedText) {
          isHighlighting = false;
          notePopup.classList.add("hidden");
          return;
        }

        isHighlighting = true;
        selectedTextInput.value = selectedText;

        let range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();

        if (rect.width === 0 && rect.height === 0) return;

        let iframe = document.querySelector("#area iframe");
        let iframeRect = iframe.getBoundingClientRect();
        let topPosition = iframeRect.top + rect.top + window.scrollY;

        if (topPosition - notePopup.offsetHeight - 10 > 0) {
          notePopup.style.top = `${
            topPosition - notePopup.offsetHeight - 10
          }px`;
        } else {
          notePopup.style.top = `${topPosition + rect.height + 10}px`;
        }

        notePopup.classList.remove("hidden");
      }, 800);
    });

    let startX = 0,
      startY = 0;

    win.addEventListener("touchstart", function (e) {
      if (isHighlighting) return;
      if (e.touches.length > 1 || e.touches[0].clientY > 0) {
        e.preventDefault();
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    win.addEventListener("touchmove", function (e) {
      if (isHighlighting) {
        e.stopPropagation();
        return;
      }
    });

    win.addEventListener("touchend", function (e) {
      if (isHighlighting) return;
      let endX = e.changedTouches[0].clientX;
      let endY = e.changedTouches[0].clientY;
      let deltaX = endX - startX;
      let deltaY = endY - startY;

      handleSwipe(deltaX, deltaY);
    });

    doc.addEventListener("click", function () {
      if (!win.getSelection().toString().trim()) {
        isHighlighting = false;
      }
    });
  });

  rendition.on("rendered", (section) => {
    mainLoader.classList.add("hidden");
    const currentLocation = rendition.currentLocation();
    if (currentLocation?.start?.cfi) {
      trackPage(currentLocation.start.cfi);
      trackReadPage(currentLocation.start.cfi);
    }
  });

  rendition.on("started", () => {
    mainLoader.classList.remove("hidden"); // Show loader when page turn starts
  });

  // Add location change tracking
  rendition.on("locationChanged", (location) => {
    mainLoader.classList.remove("hidden");
    if (location?.start?.cfi) {
      // Track both unique pages and read pages
      trackPage(location.start.cfi);
      trackReadPage(location.start.cfi);

      // Update current chapter/page info
      const pageId = generatePageId(location.start.cfi);
      if (pageId) {
        const [chapter, page] = pageId.split("-");
        currentChapter = parseInt(chapter);
        currentPage = parseInt(page);
      }
    }
    mainLoader.classList.add("hidden"); // Ensure it hides after change
  });

  setTimeout(() => {
    mainLoader.classList.add("hidden"); // Ensure it hides after a timeout
  }, 2000);
}

function generatePageId(cfi) {
  const chapterMatch = cfi.match(/\[(\d+)\]/);
  const pageMatch = cfi.match(/\!\/(\d+)/);

  if (chapterMatch && pageMatch) {
    const chapter = parseInt(chapterMatch[1]);
    const page = parseInt(pageMatch[1]);
    return `${chapter}-${page}`;
  }
  return null;
}

function trackReadPage(cfi) {
  const pageId = generatePageId(cfi);
  if (!pageId) return;

  if (!readPages[pageId]) {
    readPages[pageId] = {
      firstRead: new Date().toISOString(),
      lastRead: new Date().toISOString(),
      visits: 1,
      fontSizeHistory: [fontSize],
    };
  } else {
    readPages[pageId].lastRead = new Date().toISOString();
    readPages[pageId].visits++;
    if (!readPages[pageId].fontSizeHistory.includes(fontSize)) {
      readPages[pageId].fontSizeHistory.push(fontSize);
    }
  }

  localStorage.setItem("readPages", JSON.stringify(readPages));
}

function getUniquePageStats() {
  return {
    totalUniquePages: uniquePages.length,
    uniquePagesList: uniquePages.map(cfi => ({
      cfi,
      normalizedPage: normalizePage(cfi)
    })),
    firstPageTracked: uniquePages[0],
    lastPageTracked: uniquePages[uniquePages.length - 1]
  };
}


function getReadProgress() {
  const totalPages = Object.keys(readPages).length;
  const uniquePagesCount = uniquePages.length;
  const uniqueChapters = new Set(
    Object.keys(readPages).map((pageId) => pageId.split("-")[0])
  ).size;

  return {
    pagesRead: totalPages,
    uniquePagesVisited: uniquePagesCount,
    chaptersStarted: uniqueChapters,
    lastReadDate: Math.max(
      ...Object.values(readPages).map((p) => new Date(p.lastRead))
    ),
    mostVisitedPages: Object.entries(readPages)
      .sort((a, b) => b[1].visits - a[1].visits)
      .slice(0, 5)
  };
}



// Event listeners for theme buttons
lightThemeBtn.addEventListener("click", () => applyTheme("light"));
sepiaThemeBtn.addEventListener("click", () => applyTheme("sepia"));
darkThemeBtn.addEventListener("click", () => applyTheme("dark"));


// Event Listeners
increaseFontBtn.addEventListener("click", () => {
  updateFontSize(Math.min(fontSize + FONT_SIZE_STEP, MAX_FONT_SIZE));
});

reduceFontBtn.addEventListener("click", () => {
  updateFontSize(Math.max(fontSize - FONT_SIZE_STEP, MIN_FONT_SIZE));
});

noteViewToggle.addEventListener("click", function () {
  notesSidebar.classList.toggle("-translate-x-full");
  notesNavIcon.classList.toggle("fa-bars");
  notesNavIcon.classList.toggle("fa-times");
});

document.addEventListener("click", function (event) {
  if (
    !noteViewToggle.contains(event.target) &&
    !notesSidebar.contains(event.target)
  ) {
    notesSidebar.classList.add("-translate-x-full");
    notesNavIcon.classList.add("fa-bars");
    notesNavIcon.classList.remove("fa-times");
  }
});

next.addEventListener("click", function (e) {
  mainLoader.classList.remove("hidden");
  book.package.metadata.direction === "rtl"
    ? rendition.prev()
    : rendition.next();
  e.preventDefault();
  window.scroll({ top: 0, left: 0, behavior: "smooth" });
});

prev.addEventListener("click", function (e) {
  mainLoader.classList.remove("hidden");
  book.package.metadata.direction === "rtl"
    ? rendition.next()
    : rendition.prev();
  e.preventDefault();
  window.scroll({ top: 0, left: 0, behavior: "smooth" });
});

document.addEventListener("keyup", function (e) {
  if (e.keyCode === 37) {
    mainLoader.classList.remove("hidden");
    book.package.metadata.direction === "rtl"
      ? rendition.next()
      : rendition.prev();
  }
  if (e.keyCode === 39) {
    mainLoader.classList.remove("hidden");
    book.package.metadata.direction === "rtl"
      ? rendition.prev()
      : rendition.next();
  }
});

cancelBtn.addEventListener("click", function () {
  selectedTextInput.value = "";
  isHighlighting = false;
  notePopup.classList.add("hidden");
  window.getSelection().removeAllRanges();
});

saveBtn.addEventListener("click", function () {
  const highlightedText = selectedTextInput.value.trim();
  if (!highlightedText) return;

  const bookTitle = book?.package?.metadata?.title || "Unknown Book";
  const bookId = book?.package?.metadata?.identifier || "unknown_id";
  const location = rendition.currentLocation();
  const cfi = location?.start?.cfi || "unknown_location";
  const notes = JSON.parse(localStorage.getItem("notes")) || [];

  const newNote = {
    id: Date.now(),
    book: bookTitle,
    text: highlightedText,
    page: cfi,
    bookId: bookId,
  };

  notes.push(newNote);
  localStorage.setItem("notes", JSON.stringify(notes));

  selectedTextInput.value = "";
  isHighlighting = false;
  notePopup.classList.add("hidden");
  window.getSelection().removeAllRanges();
  loadNotes();
  alert("Note Saved");
});

// Initialize
loadBook(selectedBook);
loadNotes();
document.addEventListener("DOMContentLoaded", initializeTheme);