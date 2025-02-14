var controls = document.getElementById("controls");
var currentPage = document.getElementById("current-percent");
var next = document.getElementById("next");
var prev = document.getElementById("prev");
var slider = document.createElement("input");
const playAllButton = document.querySelector("#playAllButton");

// Talkify
talkify.config.remoteService.host = "https://talkify.net";
talkify.config.remoteService.apiKey = "";

var player = new talkify.TtsPlayer().enableTextHighlighting();
var speech;

function playText(text, voiceName = "Google US English") {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel(); // Stop any ongoing speech before starting new
  }

  speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US"; // Change language if needed
  speech.rate = 1; // Adjust speed (0.5 - 2)
  speech.pitch = 1; // Adjust pitch (0 - 2)

  // Set the selected voice
  let voices = getVoices();
  let selectedVoice = voices.find(v => v.name === voiceName);
  if (selectedVoice) {
      speech.voice = selectedVoice;
  }

  speechSynthesis.speak(speech);
}


function populateVoiceList() {
  let voices = getVoices();
  let voiceSelect = document.getElementById("voiceSelect");
  voiceSelect.innerHTML = ""; // Clear existing options

  console.log(voices);
  

  voices.forEach(voice => {
      let option = document.createElement("option");
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      voiceSelect.appendChild(option);
  });
}

function getVoices() {
  return speechSynthesis.getVoices();
}

function stopSpeech() {
  speechSynthesis.cancel(); // Stop the speech
}

populateVoiceList();
playAllButton.addEventListener("click", function () {
  let iframe = document.querySelector("#area iframe");
  if (!iframe) {
    alert("No content found!");
    return;
  }

  let doc = iframe.contentDocument || iframe.contentWindow.document;
  let paragraphs = doc.querySelectorAll("p");
  let texts = Array.from(paragraphs)
    .map((p) => p.textContent.trim())
    .filter((t) => t !== "");
    if (texts.length > 0) {
    console.log(texts);
    texts = texts.join(" ")
    console.log(texts);
    
    playText(texts);
  } else {
    alert("No text found to play!");
  }
});

// POP UP
const notePopup = document.querySelector("#noteSaver"); // Note pop-up
const selectedTextInput = document.getElementById("selectedTextInput");
const cancelBtn = notePopup.querySelector("#cancelNoteSaver");
const saveBtn = notePopup.querySelector("#saveNote");

// Notes View
const noteViewToggle = document.getElementById("noteViewToggle");
const notesSidebar = document.querySelector("#mainNav #sideBar");
const notesList = notesSidebar.querySelector("ul");
const notesNav = document.querySelector("#mainNav");
const notesNavIcon = document.querySelector("#noteViewToggle i");

// Global references for book and rendition so event listeners use the latest instance
let book, rendition;

let selectedBook = "files/lastwords.epub";

// Get the container elements for the ePub viewer
var area = document.getElementById("area");
var dragarea = document.getElementById("area");

// Touch & drag variables
var startX = 0,
  startY = 0,
  isDragging = false;
var threshold = 50; // Minimum pixels to consider as a swipe

// Global flag to check if text is being highlighted
let isHighlighting = false;
let highlightTimeout = null; // For debouncing

/**************************************************************************************************************** */

// 1️⃣ Toggle Notes View
noteViewToggle.addEventListener("click", function () {
  notesSidebar.classList.toggle("-translate-x-full");
  notesNavIcon.classList.toggle("fa-bars");
  notesNavIcon.classList.toggle("fa-times");
});
// Add event listener to document for clicks outside of the noteViewToggle or notesSidebar
document.addEventListener("click", function (event) {
  // Check if the click was outside the toggle button or sidebar
  if (
    !noteViewToggle.contains(event.target) &&
    !notesSidebar.contains(event.target)
  ) {
    // Close the sidebar and reset the icon classes if clicked outside
    notesSidebar.classList.add("-translate-x-full");
    notesNavIcon.classList.add("fa-bars");
    notesNavIcon.classList.remove("fa-times");
  }
});

// Helper function to help save notes
function loadNotes() {
  notesList.innerHTML = ""; // Clear list before reloading

  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.forEach((note) => {
    const li = document.createElement("li");
    li.classList.add("mb-2", "flex", "justify-between", "items-center");

    // Note Button (Navigates to location)
    const noteBtn = document.createElement("button");
    noteBtn.classList.add(
      "hover:bg-orange-500",
      "border-none",
      "bg-transparent",
      "w-full",
      "p-1",
      "text-left"
    );
    noteBtn.textContent = note.text.substring(0, 30) + "..."; // Show preview

    noteBtn.addEventListener("click", function () {
      if (rendition) {
        rendition.display(note.page); // Navigate to the highlighted text
      }
    });

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add(
      "bg-red-500",
      "text-white",
      "rounded",
      "px-2",
      "py-1",
      "ml-2"
    );
    deleteBtn.innerHTML = `<i class="fa-solid fa-trash-alt text-white text-sm"></i>`; // Trash icon

    deleteBtn.addEventListener("click", function () {
      deleteNote(note.id);
    });

    // Append elements
    li.appendChild(noteBtn);
    li.appendChild(deleteBtn);
    notesList.appendChild(li);
  });
}

// Helper Function Delete a note from local storage
function deleteNote(noteId) {
  let notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes = notes.filter((note) => note.id !== noteId); // Remove note by ID
  localStorage.setItem("notes", JSON.stringify(notes));

  loadNotes(); // Refresh notes list
}

// Initial Load of all Notes
loadNotes();

// Helper function: loads an ePub book into the viewer
function loadBook(bookUrl) {
  area.innerHTML = ""; // Clear existing viewer content

  book = ePub(bookUrl);
  rendition = book.renderTo("area", {
    flow: "paginated",
    method: "continuous",
    width: "100%",
    height: 600,
    spread: "none",
  });

  rendition.display();

  book.ready.then(() => {
    const storedLocation = localStorage.getItem("book-location");
    if (storedLocation) {
      rendition.display(storedLocation);
    } else {
      rendition.display();
    }
  });

  // Register event listeners inside ePub iframe
  rendition.hooks.content.register((contents) => {
    let win = contents.window;
    let doc = contents.document;

    // Handle Click Events
    // win.addEventListener("click", function () {
    //   window.parent.postMessage({ type: "epub-clicked" }, "*");
    // });

    // Detect text selection (highlight) with debounce
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

        // Get the position of the selected text
        let range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();

        if (rect.width === 0 && rect.height === 0) return;

        // Get the position relative to the main document
        let iframe = document.querySelector("#area iframe");
        let iframeRect = iframe.getBoundingClientRect();

        let topPosition = iframeRect.top + rect.top + window.scrollY;

        // Check if there's enough space above, otherwise place below
        if (topPosition - notePopup.offsetHeight - 10 > 0) {
          notePopup.style.top = `${
            topPosition - notePopup.offsetHeight - 10
          }px`; // Above selection
        } else {
          notePopup.style.top = `${topPosition + rect.height + 10}px`; // Below selection
        }

        notePopup.classList.remove("hidden");
      }, 800);
    });

    // Handle Touch Events (for swipes)
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

    // Handle Mouse Drag Events
    // let isDragging = false;
    // win.addEventListener("mousedown", function (e) {
    //   if (isHighlighting) return; // Ignore drag if highlighting
    //   isDragging = true;
    //   startX = e.clientX;
    //   startY = e.clientY;
    // });

    // win.addEventListener("mouseup", function (e) {
    //   if (!isDragging || isHighlighting) return; // Ignore swipe if highlighting
    //   isDragging = false;
    //   let deltaX = e.clientX - startX;
    //   let deltaY = e.clientY - startY;

    //   handleSwipe(deltaX, deltaY);
    // });

    // win.addEventListener("mousemove", function (e) {
    //   if (isDragging && !isHighlighting) e.preventDefault();
    // });

    // Clear highlighting when clicking elsewhere
    doc.addEventListener("click", function () {
      if (!win.getSelection().toString().trim()) {
        isHighlighting = false;
      }
    });
  });

  // Handle swipe actions
  function handleSwipe(deltaX, deltaY) {
    if (isHighlighting) return; // Prevent swipe if highlighting

    let threshold = 50; // Minimum movement to consider a swipe

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe (left/right)
      if (Math.abs(deltaX) >= threshold) {
        if (deltaX < 0) {
          // Swiped left → Next page
          book.package.metadata.direction === "rtl"
            ? rendition.prev()
            : rendition.next();
        } else {
          // Swiped right → Previous page
          book.package.metadata.direction === "rtl"
            ? rendition.next()
            : rendition.prev();
        }
      }
    } else {
      // Vertical swipe (up/down)
      if (Math.abs(deltaY) >= threshold) {
        if (deltaY < 0) {
          // Swiped up → Next page
          rendition.next();
        } else {
          // Swiped down → Previous page
          rendition.prev();
        }
      }
    }
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
  }
}

// Initial load of the book
loadBook(selectedBook);

// Navigation event listeners for next/prev buttons
next.addEventListener("click", function (e) {
  book.package.metadata.direction === "rtl"
    ? rendition.prev()
    : rendition.next();
  e.preventDefault();
  window.scroll({ top: 0, left: 0, behavior: "smooth" });

  stopSpeech();
});

prev.addEventListener("click", function (e) {
  book.package.metadata.direction === "rtl"
    ? rendition.next()
    : rendition.prev();
  e.preventDefault();
  window.scroll({ top: 0, left: 0, behavior: "smooth" });
  stopSpeech();
});

// Keyboard navigation listener
document.addEventListener("keyup", function (e) {
  if (e.keyCode === 37) {
    book.package.metadata.direction === "rtl"
      ? rendition.next()
      : rendition.prev();
  }
  if (e.keyCode === 39) {
    book.package.metadata.direction === "rtl"
      ? rendition.prev()
      : rendition.next();
  }
});

// SAVE NOTE EVENTS:

cancelBtn.addEventListener("click", function () {
  selectedTextInput.value = "";
  isHighlighting = false;
  notePopup.classList.add("hidden");
  window.getSelection().removeAllRanges(); // Clear selection
});

// Save button: Save the note to localStorage
saveBtn.addEventListener("click", function () {
  const highlightedText = selectedTextInput.value.trim();
  if (!highlightedText) return;

  // Ensure book metadata exists
  const bookTitle = book?.package?.metadata?.title || "Unknown Book";
  const bookId = book?.package?.metadata?.identifier || "unknown_id";

  // Get current book location
  const location = rendition.currentLocation();
  const cfi = location?.start?.cfi || "unknown_location"; // Prevents undefined errors

  // Load existing notes from local storage or create a new array
  const notes = JSON.parse(localStorage.getItem("notes")) || [];

  const newNote = {
    id: Date.now(),
    book: bookTitle,
    text: highlightedText,
    page: cfi, // Save the exact location of the highlighted text
    bookId: bookId,
  };

  // Save the note to local storage
  notes.push(newNote);
  localStorage.setItem("notes", JSON.stringify(notes));

  // console.log("Note Saved:", newNote);

  // Clear input & hide popup
  selectedTextInput.value = "";
  isHighlighting = false;
  notePopup.classList.add("hidden");
  window.getSelection().removeAllRanges(); // Clear selection
  loadNotes();
  alert("Note Saved");
});
