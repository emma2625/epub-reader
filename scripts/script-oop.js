class EpubReaderApp {
    constructor() {
      // === DOM ELEMENTS ===
      this.controls = document.getElementById("controls");
      this.next = document.getElementById("next");
      this.prev = document.getElementById("prev");
      this.slider = document.createElement("input");
      this.reduceFontBtn = document.getElementById("reduceFont");
      this.increaseFontBtn = document.getElementById("increaseFont");
      this.fontSizeDisplay = document.getElementById("fontSize");
      this.notePopup = document.querySelector("#noteSaver");
      this.noteTitle = document.getElementById("noteTitle");
      this.selectedTextInput = document.getElementById("selectedTextInput");
      this.cancelBtn = document.querySelector("#cancelNoteSaver");
      this.saveBtn = document.querySelector("#saveNote");
      this.noteViewToggle = document.getElementById("noteViewToggle");
      this.toggleTocSidebar = document.getElementById("toggleTocSidebar");
      this.tocSideBar = document.getElementById("sideBarTOC");
      this.notesSidebar = document.querySelector("#mainNav #sideBar");
      this.notesList = this.notesSidebar.querySelector("ul");
      this.notesNav = document.querySelector("#mainNav");
      this.notesNavIcon = document.querySelector("#noteViewToggle i");
      this.area = document.getElementById("area");
      this.dragarea = document.getElementById("area");
      this.mainLoader = document.getElementById("mainLoader");
      this.settingsToggle = document.getElementById("settingsToggle");
      this.settingsDropdown = document.getElementById("settingsDropdown");
      this.themebuttons = document.querySelectorAll(".theme-button");
      this.lightThemeBtn = document.getElementById("lightTheme");
      this.sepiaThemeBtn = document.getElementById("sepiaTheme");
      this.darkThemeBtn = document.getElementById("darkTheme");
      this.themeButtons = document.querySelectorAll(".theme-button");
  
      // === THEME CONFIGURATION ===
      this.themes = {
        light: {
          background: "#ffffff",
          text: "#000000",
          links: "#0066cc",
          border: "#e5e7eb",
          shadow: "rgba(2, 2, 2, 0.146)",
          noteBg: "#f8f8f8",
          accentShadow: "rgba(249, 115, 22, 0.2)",
          navBg: "#f0f0f0",
          buttonBg: "#e5e7eb",
          buttonHover: "#d1d5db",
          inputBg: "#f5f5f5",
          highlightColor: "rgba(255, 213, 0, 0.3)",
        },
        sepia: {
          background: "#f8f3e8",
          text: "#5f4b32",
          links: "#9e7e5a",
          border: "#e8d7c3",
          shadow: "rgba(95, 75, 50, 0.15)",
          noteBg: "#f0e6d6",
          accentShadow: "rgba(156, 126, 90, 0.3)",
          navBg: "#eee5d6",
          buttonBg: "#e8d7c3",
          buttonHover: "#dac8b0",
          inputBg: "#f2ece0",
          highlightColor: "rgba(210, 180, 140, 0.4)",
        },
        dark: {
          background: "#1a1a1a",
          text: "#e6e6e6",
          links: "#6ba6ff",
          border: "#4d4d4d",
          shadow: "rgba(0, 0, 0, 0.5)",
          noteBg: "#2d2d2d",
          accentShadow: "rgba(249, 115, 22, 0.4)",
          navBg: "#2d2d2d",
          buttonBg: "#3d3d3d",
          buttonHover: "#505050",
          inputBg: "#333333",
          highlightColor: "rgba(255, 170, 0, 0.25)",
        },
      };
  
      // === STATE VARIABLES ===
      this.currentHighlightRange = null;
      this.currentTheme = localStorage.getItem("readerTheme") || "light";
      this.book = null;
      this.rendition = null;
      this.uniquePages = JSON.parse(localStorage.getItem("uniquePages")) || [];
      this.allElements = [];
      this.selectedBook = "../files/lesson-plan.epub";
      this.isHighlighting = false;
      this.highlightTimeout = null;
      this.startX = 0;
      this.startY = 0;
      this.threshold = 50;
      this.readPages = JSON.parse(localStorage.getItem("readPages")) || {};
      this.currentChapter = null;
      this.currentPage = null;
  
      // === FONT SIZE STATE ===
      this.MIN_FONT_SIZE = 0.5;
      this.MAX_FONT_SIZE = 4;
      this.FONT_SIZE_STEP = 0.25;
      this.fontSize = parseFloat(localStorage.getItem("epubFontSize")) || 1.5;
      if (this.fontSizeDisplay) {
        this.fontSizeDisplay.innerText = this.fontSize;
      }
    }
  
    // === THEME METHODS ===
    applyTheme(themeName) {
      if (!this.themes[themeName]) {
        console.error(`Theme "${themeName}" not found`);
        return;
      }
      const theme = this.themes[themeName];
      this.currentTheme = themeName;
      localStorage.setItem("readerTheme", themeName);
  
      // Update theme button UI
      this.themeButtons.forEach((button) => {
        button.classList.remove("ring-2", "ring-orange-500");
      });
      document.getElementById(`${themeName}Theme`).classList.add("ring-2", "ring-orange-500");
  
      // Document body styling
      document.body.style.backgroundColor = theme.background;
      document.body.style.color = theme.text;
  
      // Main nav styling
      const mainNav = document.getElementById("mainNav");
      if (mainNav) {
        mainNav.style.backgroundColor = theme.navBg;
        mainNav.style.color = theme.text;
        mainNav.style.boxShadow = `0 2px 10px ${theme.shadow}`;
      }
  
      // Reader area styling
      if (this.area) {
        this.area.style.backgroundColor = theme.background;
        this.area.style.color = theme.text;
        this.area.style.borderColor = theme.border;
        this.area.style.boxShadow = `0 4px 20px ${theme.shadow}`;
      }
  
      // Button styling
      const allButtons = document.querySelectorAll("button:not(.theme-button)");
      allButtons.forEach((button) => {
        if (button.id === "saveNote") {
          button.style.color = "#ffffff";
        } else if (button.id === "cancelNoteSaver") {
          button.style.color = "#ffffff";
        } else {
          button.style.color = theme.text;
          button.style.borderColor = theme.border;
        }
        button.dataset.hoverBg = theme.buttonHover;
      });
  
      const navButtons = document.querySelectorAll("#mainNav button");
      navButtons.forEach((button) => {
        button.style.backgroundColor = theme.buttonBg;
        button.style.color = theme.text;
      });
  
      // Sidebar styling for notes and TOC
      if (this.notesSidebar) {
        const navBody = document.getElementById("navBody");
        if (navBody) {
          navBody.style.backgroundColor = theme.noteBg;
          navBody.style.color = theme.text;
          navBody.style.boxShadow = `2px 0 15px ${theme.shadow}`;
          navBody.querySelectorAll("*").forEach((el) => {
            if (el.tagName === "BUTTON") el.style.color = theme.text;
          });
        }
      }
      if (this.tocSideBar) {
        const navBody = this.tocSideBar.querySelector("#navBody");
        if (navBody) {
          navBody.style.backgroundColor = theme.noteBg;
          navBody.style.color = theme.text;
          navBody.style.boxShadow = `2px 0 15px ${theme.shadow}`;
          navBody.querySelectorAll("*").forEach((el) => {
            if (el.tagName === "BUTTON") el.style.color = theme.text;
          });
        }
      }
  
      // Note popup styling
      if (this.notePopup) {
        this.notePopup.style.backgroundColor = theme.noteBg;
        this.notePopup.style.color = theme.text;
        this.notePopup.style.borderColor = theme.border;
        this.notePopup.style.boxShadow = `0 4px 20px ${theme.shadow}`;
        const textarea = this.notePopup.querySelector("textarea");
        if (textarea) {
          textarea.style.backgroundColor = theme.inputBg;
          textarea.style.color = theme.text;
          textarea.style.borderColor = theme.border;
        }
        const input = this.notePopup.querySelector("input");
        if (input) {
          input.style.backgroundColor = theme.inputBg;
          input.style.color = theme.text;
          input.style.borderColor = theme.border;
        }
      }
  
      // Settings dropdown styling
      if (this.settingsDropdown) {
        this.settingsDropdown.style.backgroundColor = theme.background;
        this.settingsDropdown.style.color = theme.text;
        this.settingsDropdown.style.borderColor = theme.border;
        this.settingsDropdown.style.boxShadow = `0 4px 20px ${theme.shadow}`;
        this.settingsDropdown.querySelectorAll("h3").forEach((heading) => {
          heading.style.color = theme.text;
          heading.style.borderColor = theme.border;
        });
        this.settingsDropdown.querySelectorAll("button:not(.theme-button)").forEach((button) => {
          button.style.borderColor = theme.border;
          button.style.color = theme.text;
        });
        if (this.fontSizeDisplay) {
          this.fontSizeDisplay.style.backgroundColor = theme.inputBg;
          this.fontSizeDisplay.style.color = theme.text;
          this.fontSizeDisplay.style.borderColor = theme.border;
        }
      }
  
      // Loader styling
      if (this.mainLoader) {
        this.mainLoader.style.backgroundColor =
          themeName === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(200, 200, 200, 0.3)";
      }
  
      // Navigation arrows styling
      const navArrows = document.querySelectorAll("#next, #prev");
      navArrows.forEach((arrow) => {
        arrow.style.color = theme.text;
        arrow.addEventListener("mouseenter", () => {
          arrow.style.backgroundColor = `${theme.background}80`;
          arrow.style.boxShadow = `0 0 15px ${theme.shadow}`;
        });
        arrow.addEventListener("mouseleave", () => {
          arrow.style.backgroundColor = "transparent";
          arrow.style.boxShadow = "none";
        });
      });
  
      // Apply theme to epub rendition if available
      if (this.rendition) {
        this.rendition.themes.default({
          body: { background: theme.background, color: theme.text },
          a: { color: theme.links, "text-decoration": "none" },
          "p, div, span, h1, h2, h3, h4, h5, h6": { color: theme.text },
          img: { "max-width": "100%" },
          hr: { border: `1px solid ${theme.border}` },
        });
        this.rendition.views().forEach((view) => {
          if (view && view.iframe) {
            const iframeDoc = view.iframe.contentDocument;
            if (iframeDoc) {
              const existingStyle = iframeDoc.getElementById("theme-background");
              if (existingStyle) existingStyle.remove();
              const style = iframeDoc.createElement("style");
              style.id = "theme-background";
              style.textContent = `
                html, body {
                  background-color: ${theme.background} !important;
                  min-height: 100%;
                }
              `;
              iframeDoc.head.appendChild(style);
              iframeDoc.documentElement.style.backgroundColor = theme.background;
              iframeDoc.body.style.backgroundColor = theme.background;
            }
          }
        });
        this.rendition.views().forEach((view) => {
          if (view && view.pane) view.pane.render();
        });
      }
    }
  
    addThemeVariables() {
      const existingStyle = document.getElementById("theme-variables");
      if (existingStyle) existingStyle.remove();
      const theme = this.themes[this.currentTheme];
      const style = document.createElement("style");
      style.id = "theme-variables";
      style.textContent = `
        :root {
          --background-color: ${theme.background};
          --text-color: ${theme.text};
          --link-color: ${theme.links};
          --border-color: ${theme.border};
          --shadow-color: ${theme.shadow};
          --note-bg-color: ${theme.noteBg};
          --button-bg-color: ${theme.buttonBg};
          --button-hover-color: ${theme.buttonHover};
          --input-bg-color: ${theme.inputBg};
        }
        
        body, nav, aside, #area, #noteSaver, button, input, textarea, #settingsDropdown,
        .theme-aware, .theme-aware-button {
          transition: background-color 0.3s ease, 
                     color 0.3s ease, 
                     border-color 0.3s ease,
                     box-shadow 0.3s ease;
        }
        
        .theme-aware {
          background-color: var(--background-color);
          color: var(--text-color);
          border-color: var(--border-color);
          box-shadow: 0 4px 10px var(--shadow-color);
        }
        .theme-aware-button {
          background-color: var(--button-bg-color);
          color: var(--text-color);
          border-color: var(--border-color);
        }
        .theme-aware-button:hover {
          background-color: var(--button-hover-color);
        }
        .theme-aware-input {
          background-color: var(--input-bg-color);
          color: var(--text-color);
          border-color: var(--border-color);
        }
        .highlighted-note {
          background-color: var(--highlight-color);
          cursor: pointer;
          border-radius: 2px;
          transition: background-color 0.2s ease;
        }
        
        .highlighted-note:hover {
          filter: brightness(1.1);
        }
        
        #note-tooltip {
          max-width: 400px;
          width: auto;
        }
      `;
      style.textContent = style.textContent.replace(
        ":root {",
        `:root {
        --highlight-color: ${this.themes[this.currentTheme].highlightColor};`
      );
      document.head.appendChild(style);
    }
  
    initializeTheme() {
      this.addThemeVariables();
      this.applyTheme(this.currentTheme);
      this.setupDynamicHoverEffects();
    }
  
    setupDynamicHoverEffects() {
      const buttons = document.querySelectorAll("button");
      buttons.forEach((button) => {
        if (button.classList.contains("theme-button")) return;
        button.addEventListener("mouseenter", function () {
          if (this.dataset.hoverBg) this.style.backgroundColor = this.dataset.hoverBg;
        });
        button.addEventListener("mouseleave", function () {
          if (this.id === "cancelNoteSaver") {
            this.style.backgroundColor = "#ef4444";
          } else if (this.id === "saveNote") {
            this.style.backgroundColor = "#4b5563";
          } else if (this.parentElement.id === "mainNav") {
            this.style.backgroundColor = this.parentElement.dataset.themeButtonBg || "";
          } else {
            this.style.backgroundColor = "";
          }
        });
      });
    }
  
    // === HIGHLIGHT & NOTE METHODS ===
    applyHighlightsToSavedNotes() {
      if (!this.rendition) return;
      const notes = JSON.parse(localStorage.getItem("notes")) || [];
      const bookTitle = this.book?.package?.metadata?.title || "Unknown Book";
      const bookId = this.book?.package?.metadata?.identifier || "unknown_id";
      const currentBookNotes = notes.filter((note) => note.bookId === bookId);
      const location = this.rendition.currentLocation();
      const currentCfi = location?.start?.cfi;
      if (!currentCfi) return;
      const pageNotes = currentBookNotes.filter((note) => note.page === currentCfi);
      this.rendition.getContents().forEach((content) => {
        const doc = content.document;
        const win = content.window;
        pageNotes.forEach((note) => {
          this.highlightTextInDocument(doc, win, note.text, note.id);
        });
      });
    }
  
    highlightTextInDocument(doc, win, textToFind, noteId) {
      const textNodes = [];
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }
      for (let i = 0; i < textNodes.length; i++) {
        const currentNode = textNodes[i];
        const content = currentNode.textContent;
        const index = content.indexOf(textToFind);
        if (index >= 0) {
          const range = doc.createRange();
          range.setStart(currentNode, index);
          range.setEnd(currentNode, index + textToFind.length);
          const highlightSpan = doc.createElement("span");
          highlightSpan.style.backgroundColor = this.themes[this.currentTheme].highlightColor;
          highlightSpan.classList.add("highlighted-note");
          highlightSpan.dataset.noteId = noteId;
          range.surroundContents(highlightSpan);
          highlightSpan.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showNoteDetails(noteId);
          });
          break;
        }
      }
    }
  
    // Stub for note details – implement if desired
    showNoteDetails(noteId) {
      console.log("Show note details for note:", noteId);
    }
  
    // === DROPDOWN POSITIONING ===
    positionDropdown() {
      this.settingsDropdown.style.transform = "translate(0, 0)";
      const toggleRect = this.settingsToggle.getBoundingClientRect();
      const dropdownRect = this.settingsDropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const rightEdge = toggleRect.right;
      const dropdownWidth = dropdownRect.width;
      const overflowRight = rightEdge + dropdownWidth - viewportWidth;
      if (overflowRight > 0) {
        const offset = Math.min(dropdownWidth / 2, overflowRight + 20);
        this.settingsDropdown.style.transform = `translateX(-${offset}px)`;
      } else {
        this.settingsDropdown.style.transform = "translateX(0)";
      }
    }
  
    // === PAGE & FONT TRACKING METHODS ===
    trackPage(cfi) {
      if (!this.uniquePages.includes(cfi)) {
        this.uniquePages.push(cfi);
        localStorage.setItem("uniquePages", JSON.stringify(this.uniquePages));
        console.log("Tracked Pages:", this.uniquePages);
      }
    }
  
    normalizePage(cfi) {
      let match = cfi.match(/(\d+)\[(\d+)\]/);
      if (match) {
        let chapter = match[1];
        let pageIndex = Math.floor(parseInt(match[2]) / 100);
        return `Chapter ${chapter} - Page ${pageIndex}`;
      }
      return cfi;
    }
  
    updateFontSize(newSize) {
      if (newSize < this.MIN_FONT_SIZE || newSize > this.MAX_FONT_SIZE) return;
      const currentLocation = this.rendition.currentLocation();
      const previousPageId = currentLocation?.start?.cfi ? this.generatePageId(currentLocation.start.cfi) : null;
      this.fontSize = newSize;
      localStorage.setItem("epubFontSize", this.fontSize);
      if (this.fontSizeDisplay) {
        this.fontSizeDisplay.innerText = this.fontSize;
      }
      if (this.rendition) {
        const contents = this.rendition.getContents();
        contents.forEach((content) => {
          const doc = content.document;
          const elements = doc.querySelector("body").querySelectorAll("*");
          elements.forEach((el) => {
            el.style.fontSize = `${this.fontSize}rem`;
          });
        });
        setTimeout(() => {
          const newLocation = this.rendition.currentLocation();
          const newPageId = newLocation?.start?.cfi ? this.generatePageId(newLocation.start.cfi) : null;
          if (previousPageId && newPageId && previousPageId !== newPageId) {
            this.trackReadPage(currentLocation.start.cfi);
            this.trackReadPage(newLocation.start.cfi);
          }
        }, 100);
      }
    }
  
    getReadingStats() {
      const stats = {
        totalPagesRead: Object.keys(this.readPages).length,
        readingSessionsCount: Object.values(this.readPages).reduce((acc, page) => acc + page.visits, 0),
        averageFontSize:
          Object.values(this.readPages).reduce((acc, page) => {
            const avgSize = page.fontSizeHistory.reduce((a, b) => a + b, 0) / page.fontSizeHistory.length;
            return acc + avgSize;
          }, 0) / Object.keys(this.readPages).length,
        mostUsedFontSizes: Object.values(this.readPages)
          .flatMap((page) => page.fontSizeHistory)
          .reduce((acc, size) => {
            acc[size] = (acc[size] || 0) + 1;
            return acc;
          }, {}),
        readingTime: Object.values(this.readPages).reduce((acc, page) => {
          const firstRead = new Date(page.firstRead);
          const lastRead = new Date(page.lastRead);
          return acc + (lastRead - firstRead);
        }, 0),
      };
      return stats;
    }
  
    deleteNote(noteId) {
      let notes = JSON.parse(localStorage.getItem("notes")) || [];
      const noteToDelete = notes.find((note) => note.id === noteId);
      notes = notes.filter((note) => note.id !== noteId);
      localStorage.setItem("notes", JSON.stringify(notes));
      if (this.rendition && noteToDelete) {
        this.rendition.getContents().forEach((content) => {
          const doc = content.document;
          const highlightElements = doc.querySelectorAll(`.highlighted-note[data-note-id="${noteId}"]`);
          highlightElements.forEach((highlightSpan) => {
            const highlightedText = highlightSpan.textContent;
            const textNode = doc.createTextNode(highlightedText);
            highlightSpan.parentNode.replaceChild(textNode, highlightSpan);
          });
        });
      }
      this.loadNotes();
    }
  
    handleSwipe(deltaX, deltaY) {
      if (this.isHighlighting) return;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) >= this.threshold) {
          this.mainLoader.classList.remove("hidden");
          if (deltaX < 0) {
            this.book.package.metadata.direction === "rtl" ? this.rendition.prev() : this.rendition.next();
          } else {
            this.book.package.metadata.direction === "rtl" ? this.rendition.next() : this.rendition.prev();
          }
        }
      } else {
        if (Math.abs(deltaY) >= this.threshold) {
          this.mainLoader.classList.remove("hidden");
          deltaY < 0 ? this.rendition.next() : this.rendition.prev();
        }
      }
      window.scroll({ top: 0, left: 0, behavior: "smooth" });
    }
  
    loadNotes() {
      this.notesList.innerHTML = "";
      const notes = JSON.parse(localStorage.getItem("notes")) || [];
      notes.forEach((note) => {
        const li = document.createElement("li");
        li.classList.add("mb-2", "flex", "justify-between", "items-center");
        const noteBtn = document.createElement("button");
        noteBtn.classList.add("hover:bg-orange-500", "border-none", "bg-transparent", "w-full", "p-1", "text-left");
        noteBtn.textContent = note.title.length >= 30 ? note.title.substring(0, 30) + "..." : note.title;
        noteBtn.addEventListener("click", () => {
          if (this.rendition) {
            this.rendition.display(note.page);
          }
          this.notesSidebar.classList.toggle("-translate-x-full");
          this.notesNavIcon.classList.toggle("fa-bars");
          this.notesNavIcon.classList.toggle("fa-times");
        });
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("bg-red-500", "text-white", "rounded", "px-2", "py-1", "ml-2");
        deleteBtn.innerHTML = `<i class="fa-solid fa-trash-alt text-white text-sm"></i>`;
        deleteBtn.addEventListener("click", () => {
          this.deleteNote(note.id);
        });
        li.appendChild(noteBtn);
        li.appendChild(deleteBtn);
        this.notesList.appendChild(li);
      });
    }
  
    loadToc(book, container) {
      const tocList = container.querySelector("ul");
      tocList.innerHTML = "";
      const loadingItem = document.createElement("li");
      loadingItem.textContent = "Loading table of contents...";
      tocList.appendChild(loadingItem);
      book.loaded.navigation
        .then((nav) => {
          tocList.innerHTML = "";
          if (!nav.toc || nav.toc.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.textContent = "No table of contents available";
            tocList.appendChild(emptyItem);
            return;
          }
          nav.toc.forEach((chapter) => {
            const li = document.createElement("li");
            const button = document.createElement("button");
            button.className = "hover:bg-orange-500 border-none bg-transparent w-full p-2 text-left text-white";
            button.textContent = chapter.label.length >= 30 ? chapter.label.slice(0, 30) : chapter.label;
            button.addEventListener("click", () => {
              this.mainLoader.classList.remove("hidden");
              this.rendition.display(chapter.href).then(() => {
                setTimeout(() => {
                  this.mainLoader.classList.add("hidden");
                }, 300);
                this.applyTheme(this.currentTheme);
                setTimeout(() => {
                  this.applyHighlightsToSavedNotes();
                }, 200);
              });
              this.tocSideBar.classList.remove("translate-x-0");
              this.tocSideBar.classList.add("-translate-x-full");
            });
            li.appendChild(button);
            tocList.appendChild(li);
            if (chapter.subitems && chapter.subitems.length > 0) {
              const nestedUl = document.createElement("ul");
              nestedUl.className = "pl-4 space-y-1 mt-1";
              chapter.subitems.forEach((subitem) => {
                const subLi = document.createElement("li");
                const subButton = document.createElement("button");
                subButton.className = "hover:bg-orange-500 border-none bg-transparent w-full p-2 text-left text-white text-sm";
                subButton.textContent = subitem.label;
                subButton.addEventListener("click", () => {
                  this.mainLoader.classList.remove("hidden");
                  this.rendition.display(subitem.href).then(() => {
                    setTimeout(() => {
                      this.mainLoader.classList.add("hidden");
                    }, 300);
                    this.applyTheme(this.currentTheme);
                    setTimeout(() => {
                      this.applyHighlightsToSavedNotes();
                    }, 200);
                  });
                  this.tocSideBar.classList.remove("translate-x-0");
                  this.tocSideBar.classList.add("-translate-x-full");
                });
                subLi.appendChild(subButton);
                nestedUl.appendChild(subLi);
              });
              li.appendChild(nestedUl);
            }
          });
        })
        .catch((error) => {
          console.error("Error loading TOC:", error);
          tocList.innerHTML = "";
          const errorItem = document.createElement("li");
          errorItem.textContent = "Failed to load table of contents";
          tocList.appendChild(errorItem);
        });
    }
  
    loadBook(bookUrl) {
      this.area.innerHTML = "";
      this.mainLoader.classList.remove("hidden");
      this.book = ePub(bookUrl);
      this.rendition = this.book.renderTo("area", {
        flow: "scrolled-doc",
        method: "continuous",
        width: "100%",
        height: 600,
        spread: "none",
        overflow: "auto",
      });
      this.rendition.display();
      this.book.ready.then(() => {
        this.rendition.display();
        this.mainLoader.classList.add("hidden");
        this.applyTheme(this.currentTheme);
        this.loadToc(this.book, this.tocSideBar);
      });
      this.rendition.hooks.content.register((contents) => {
        let win = contents.window;
        let doc = contents.document;
        const observer = new MutationObserver(() => {
          doc.documentElement.style.backgroundColor = this.themes[this.currentTheme].background;
          doc.body.style.backgroundColor = this.themes[this.currentTheme].background;
        });
        observer.observe(doc, { childList: true, subtree: true });
        doc.documentElement.style.backgroundColor = this.themes[this.currentTheme].background;
        doc.body.style.backgroundColor = this.themes[this.currentTheme].background;
        const style = doc.createElement("style");
        style.id = "theme-background";
        style.textContent = `
          html, body {
            background-color: ${this.themes[this.currentTheme].background} !important;
            min-height: 100%;
          }
        `;
        doc.head.appendChild(style);
        const frameWrapper = document.querySelector("#area > div");
        if (frameWrapper) {
          frameWrapper.style.width = "100%";
          frameWrapper.style.overflowX = "hidden";
          frameWrapper.style.paddingLeft = "10px";
        }
        this.allElements = doc.querySelector("body").querySelectorAll("*");
        this.allElements.forEach((el) => {
          el.style.fontSize = `${this.fontSize}rem`;
          el.style.overflowX = "hidden";
          el.style.width = "100%";
          el.style.lineHeight = 1.5;
          if (el.tagName === "TABLE") {
            el.style.display = "block";
            el.style.maxWidth = "100%";
            el.style.overflowX = "auto";
            el.style.overflowY = "hidden";
          }
        });
        doc.addEventListener("click", (e) => {
          if (!this.settingsDropdown.classList.contains("hidden")) {
            this.settingsDropdown.classList.toggle("hidden");
          }
        });
        doc.addEventListener("selectionchange", () => {
          if (this.highlightTimeout) clearTimeout(this.highlightTimeout);
          this.highlightTimeout = setTimeout(() => {
            let selection = win.getSelection();
            if (!selection) return;
            let selectedText = selection.toString().trim();
            if (!selectedText) {
              this.isHighlighting = false;
              this.notePopup.classList.add("hidden");
              return;
            }
            this.isHighlighting = true;
            this.selectedTextInput.value = selectedText;
            let range = selection.getRangeAt(0);
            let rect = range.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return;
            let iframe = document.querySelector("#area iframe");
            let iframeRect = iframe.getBoundingClientRect();
            let topPosition = iframeRect.top + rect.top + window.scrollY;
            if (topPosition - this.notePopup.offsetHeight - 10 > 0) {
              this.notePopup.style.top = `${topPosition - this.notePopup.offsetHeight - 10}px`;
            } else {
              this.notePopup.style.top = `${topPosition + rect.height + 10}px`;
            }
            this.notePopup.classList.remove("hidden");
            setTimeout(() => this.noteTitle.focus(), 100);
          }, 800);
        });
        let startX = 0, startY = 0;
        win.addEventListener("touchstart", (e) => {
          if (this.isHighlighting) return;
          if (e.touches.length > 1 || e.touches[0].clientY > 0) e.preventDefault();
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        });
        win.addEventListener("touchmove", (e) => {
          if (this.isHighlighting) {
            e.stopPropagation();
            return;
          }
        });
        win.addEventListener("touchend", (e) => {
          if (this.isHighlighting) return;
          let endX = e.changedTouches[0].clientX;
          let endY = e.changedTouches[0].clientY;
          let deltaX = endX - startX;
          let deltaY = endY - startY;
          this.handleSwipe(deltaX, deltaY);
        });
        doc.addEventListener("click", () => {
          if (!win.getSelection().toString().trim()) this.isHighlighting = false;
        });
        setTimeout(() => {
          this.applyHighlightsToSavedNotes();
        }, 200);
        win.addEventListener("copy", (e) => {
          e.preventDefault();
          alert("Copying is disabled in this reader.");
        });
        doc.addEventListener("contextmenu", (e) => e.preventDefault());
        doc.addEventListener("copy", (e) => e.preventDefault());
        doc.addEventListener("cut", (e) => e.preventDefault());
        doc.addEventListener("dragstart", (e) => e.preventDefault());
        doc.addEventListener("drop", (e) => e.preventDefault());
      });
      this.rendition.on("rendered", (section) => {
        this.mainLoader.classList.add("hidden");
        const currentLocation = this.rendition.currentLocation();
        if (currentLocation?.start?.cfi) {
          this.trackPage(currentLocation.start.cfi);
          this.trackReadPage(currentLocation.start.cfi);
          setTimeout(() => {
            this.applyHighlightsToSavedNotes();
          }, 200);
        }
      });
      this.rendition.on("started", () => {
        this.mainLoader.classList.remove("hidden");
      });
      this.rendition.on("locationChanged", (location) => {
        this.mainLoader.classList.remove("hidden");
        if (location?.start?.cfi) {
          this.trackPage(location.start.cfi);
          this.trackReadPage(location.start.cfi);
          const pageId = this.generatePageId(location.start.cfi);
          if (pageId) {
            const [chapter, page] = pageId.split("-");
            this.currentChapter = parseInt(chapter);
            this.currentPage = parseInt(page);
          }
        }
        this.mainLoader.classList.add("hidden");
      });
      setTimeout(() => {
        this.mainLoader.classList.add("hidden");
      }, 2000);
    }
  
    generatePageId(cfi) {
      const chapterMatch = cfi.match(/\[(\d+)\]/);
      const pageMatch = cfi.match(/\!\/(\d+)/);
      if (chapterMatch && pageMatch) {
        const chapter = parseInt(chapterMatch[1]);
        const page = parseInt(pageMatch[1]);
        return `${chapter}-${page}`;
      }
      return null;
    }
  
    trackReadPage(cfi) {
      const pageId = this.generatePageId(cfi);
      if (!pageId) return;
      if (!this.readPages[pageId]) {
        this.readPages[pageId] = {
          firstRead: new Date().toISOString(),
          lastRead: new Date().toISOString(),
          visits: 1,
          fontSizeHistory: [this.fontSize],
        };
      } else {
        this.readPages[pageId].lastRead = new Date().toISOString();
        this.readPages[pageId].visits++;
        if (!this.readPages[pageId].fontSizeHistory.includes(this.fontSize)) {
          this.readPages[pageId].fontSizeHistory.push(this.fontSize);
        }
      }
      localStorage.setItem("readPages", JSON.stringify(this.readPages));
    }
  
    getUniquePageStats() {
      return {
        totalUniquePages: this.uniquePages.length,
        uniquePagesList: this.uniquePages.map((cfi) => ({
          cfi,
          normalizedPage: this.normalizePage(cfi),
        })),
        firstPageTracked: this.uniquePages[0],
        lastPageTracked: this.uniquePages[this.uniquePages.length - 1],
      };
    }
  
    getReadProgress() {
      const totalPages = Object.keys(this.readPages).length;
      const uniquePagesCount = this.uniquePages.length;
      const uniqueChapters = new Set(
        Object.keys(this.readPages).map((pageId) => pageId.split("-")[0])
      ).size;
      return {
        pagesRead: totalPages,
        uniquePagesVisited: uniquePagesCount,
        chaptersStarted: uniqueChapters,
        lastReadDate: new Date(
          Math.max(...Object.values(this.readPages).map((p) => new Date(p.lastRead)))
        ),
        mostVisitedPages: Object.entries(this.readPages)
          .sort((a, b) => b[1].visits - a[1].visits)
          .slice(0, 5),
      };
    }
  
    // === SCREENSHOT & COPY PROTECTION METHODS ===
    detectScreenCapture() {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true })
          .then(() => {
            this.handleScreenshotAttempt();
          })
          .catch(() => {});
      }
    }
  
    handleScreenshotAttempt() {
      document.body.style.filter = "blur(20px)";
      setTimeout(() => {
        document.body.style.filter = "none";
      }, 1000);
      alert("Screenshots are not permitted in this reader");
    }
  
    // === EVENT LISTENER SETUP ===
    setupEventListeners() {
      // Settings dropdown toggle
      this.settingsToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        this.settingsDropdown.classList.toggle("hidden");
        if (!this.settingsDropdown.classList.contains("hidden")) {
          this.positionDropdown();
        }
      });
      document.addEventListener("click", (e) => {
        if (
          !this.settingsToggle.contains(e.target) &&
          !this.settingsDropdown.contains(e.target)
        ) {
          this.settingsDropdown.classList.add("hidden");
        }
      });
      window.addEventListener("resize", () => {
        if (!this.settingsDropdown.classList.contains("hidden")) {
          this.positionDropdown();
        }
      });
      this.settingsDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
      });
  
      // Font size adjustment
      this.increaseFontBtn.addEventListener("click", () => {
        this.updateFontSize(Math.min(this.fontSize + this.FONT_SIZE_STEP, this.MAX_FONT_SIZE));
      });
      this.reduceFontBtn.addEventListener("click", () => {
        this.updateFontSize(Math.max(this.fontSize - this.FONT_SIZE_STEP, this.MIN_FONT_SIZE));
      });
  
      // Note view toggle
      this.noteViewToggle.addEventListener("click", () => {
        this.notesSidebar.classList.toggle("-translate-x-full");
        this.notesNavIcon.classList.toggle("fa-bars");
        this.notesNavIcon.classList.toggle("fa-times");
        if (
          !this.tocSideBar.classList.contains("-translate-x-full") &&
          this.tocSideBar.classList.contains("translate-x-0")
        ) {
          this.tocSideBar.classList.toggle("-translate-x-full");
          this.tocSideBar.classList.toggle("translate-x-0");
        }
      });
      document.addEventListener("click", (event) => {
        if (
          !this.noteViewToggle.contains(event.target) &&
          !this.notesSidebar.contains(event.target)
        ) {
          this.notesSidebar.classList.add("-translate-x-full");
          this.notesNavIcon.classList.add("fa-bars");
          this.notesNavIcon.classList.remove("fa-times");
        }
        if (
          !this.toggleTocSidebar.contains(event.target) &&
          !this.tocSideBar.contains(event.target)
        ) {
          this.tocSideBar.classList.add("-translate-x-full");
        }
      });
  
      // Next & Previous navigation
      this.next.addEventListener("click", (e) => {
        this.mainLoader.classList.remove("hidden");
        this.book.package.metadata.direction === "rtl" ? this.rendition.prev() : this.rendition.next();
        e.preventDefault();
        window.scroll({ top: 0, left: 0, behavior: "smooth" });
      });
      this.prev.addEventListener("click", (e) => {
        this.mainLoader.classList.remove("hidden");
        this.book.package.metadata.direction === "rtl" ? this.rendition.next() : this.rendition.prev();
        e.preventDefault();
        window.scroll({ top: 0, left: 0, behavior: "smooth" });
      });
      document.addEventListener("keyup", (e) => {
        if (e.keyCode === 37) {
          this.mainLoader.classList.remove("hidden");
          this.book.package.metadata.direction === "rtl" ? this.rendition.next() : this.rendition.prev();
        }
        if (e.keyCode === 39) {
          this.mainLoader.classList.remove("hidden");
          this.book.package.metadata.direction === "rtl" ? this.rendition.prev() : this.rendition.next();
        }
      });
  
      // Note cancel and save
      this.cancelBtn.addEventListener("click", () => {
        this.selectedTextInput.value = "";
        this.isHighlighting = false;
        this.notePopup.classList.add("hidden");
        window.getSelection().removeAllRanges();
      });
      this.saveBtn.addEventListener("click", () => {
        const highlightedText = this.selectedTextInput.value.trim();
        const title = this.noteTitle.value.trim();
        if (!highlightedText) return;
        if (!title) {
          alert("Enter a title");
          return;
        }
        const bookTitle = this.book?.package?.metadata?.title || "Unknown Book";
        const bookId = this.book?.package?.metadata?.identifier || "unknown_id";
        const location = this.rendition.currentLocation();
        const cfi = location?.start?.cfi || "unknown_location";
        const notes = JSON.parse(localStorage.getItem("notes")) || [];
        const newNote = {
          id: Date.now(),
          title: title,
          book: bookTitle,
          text: highlightedText,
          page: cfi,
          bookId: bookId,
        };
        notes.push(newNote);
        localStorage.setItem("notes", JSON.stringify(notes));
        this.selectedTextInput.value = "";
        this.isHighlighting = false;
        this.notePopup.classList.add("hidden");
        window.getSelection().removeAllRanges();
        this.loadNotes();
        setTimeout(() => {
          this.applyHighlightsToSavedNotes();
        }, 100);
        alert("Note Saved");
      });
  
      // Theme button event listeners
      this.lightThemeBtn.addEventListener("click", () => this.applyTheme("light"));
      this.sepiaThemeBtn.addEventListener("click", () => this.applyTheme("sepia"));
      this.darkThemeBtn.addEventListener("click", () => this.applyTheme("dark"));
  
      // Global copy, contextmenu, cut, drag, drop prevention
      document.addEventListener("copy", (e) => {
        e.preventDefault();
        alert("Copying is disabled in this reader.");
      });
      document.addEventListener("contextmenu", (e) => e.preventDefault());
      document.addEventListener("cut", (e) => e.preventDefault());
      document.addEventListener("dragstart", (e) => e.preventDefault());
      document.addEventListener("drop", (e) => e.preventDefault());
  
      window.addEventListener("resize", () => {
        setTimeout(() => this.initializeTheme(), 100);
      });
  
      // Keyboard protection and screenshot prevention
      document.addEventListener("keydown", (e) => {
        if (e.metaKey && e.shiftKey) {
          e.preventDefault();
          let areaEl = document.getElementById("area");
          if (areaEl) {
            areaEl.style.filter = "blur(20px)";
          } else {
            return;
          }
          let cancelButton = document.getElementById("cancelBlur");
          if (!cancelButton) {
            cancelButton = document.createElement("button");
            cancelButton.id = "cancelBlur";
            cancelButton.innerText = "You cannot screenshot this page  - Cancel Blur";
            cancelButton.style.filter = "none";
            cancelButton.style.position = "fixed";
            cancelButton.style.top = "20%";
            cancelButton.style.left = "20%";
            cancelButton.style.padding = "10px 20px";
            cancelButton.style.fontSize = "16px";
            cancelButton.style.color = "#fff";
            cancelButton.style.backgroundColor = "#ef4444";
            cancelButton.style.borderRadius = "6px";
            cancelButton.style.border = "2px solid black";
            cancelButton.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
            cancelButton.style.cursor = "pointer";
            cancelButton.style.transition = "all 0.3s ease-in-out";
            cancelButton.style.zIndex = "9999";
            setTimeout(() => {
              document.body.appendChild(cancelButton);
            }, 100);
            cancelButton.addEventListener("click", () => {
              let areaElement = document.getElementById("area");
              if (areaElement) areaElement.style.filter = "none";
              cancelButton.remove();
            });
            cancelButton.addEventListener("mouseover", () => {
              cancelButton.style.backgroundColor = "#dc2626";
            });
            cancelButton.addEventListener("mouseout", () => {
              cancelButton.style.backgroundColor = "#ef4444";
            });
          }
          return false;
        }
        if (
          (e.key === "3" || e.key === "4" || e.key === "5") &&
          ((e.metaKey && e.shiftKey) || (e.ctrlKey && e.shiftKey))
        ) {
          e.preventDefault();
          this.handleScreenshotAttempt();
          return false;
        }
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === "c" ||
            e.key === "C" ||
            e.key === "v" ||
            e.key === "V" ||
            e.key === "p" ||
            e.key === "P" ||
            e.key === "s" ||
            e.key === "S" ||
            e.key === "a" ||
            e.key === "A")
        ) {
          e.preventDefault();
          return false;
        }
      });
  
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.handleScreenshotAttempt();
        }
      });
  
      document.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches.length >= 3) {
            e.preventDefault();
            this.handleScreenshotAttempt();
          }
        },
        { passive: false }
      );
  
      this.toggleTocSidebar.addEventListener("click", () => {
        this.tocSideBar.classList.toggle("-translate-x-full");
        this.tocSideBar.classList.toggle("translate-x-0");
        if (!this.notesSidebar.classList.contains("-translate-x-full")) {
          this.notesSidebar.classList.toggle("-translate-x-full");
          this.notesNavIcon.classList.toggle("fa-bars");
          this.notesNavIcon.classList.toggle("fa-times");
        }
      });
    }
  
    // === INITIALIZATION ===
    init() {
      this.initializeTheme();
      this.loadBook(this.selectedBook);
      this.loadNotes();
      this.setupEventListeners();
    }
  }
  
  // Instantiate the application when the DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    const app = new EpubReaderApp();
    app.init();
  });
  