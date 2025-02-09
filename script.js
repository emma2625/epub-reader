// Global references for book and rendition so event listeners use the latest instance
let book, rendition;

var controls = document.getElementById("controls");
var currentPage = document.getElementById("current-percent");
var next = document.getElementById("next");
var prev = document.getElementById("prev");
var slider = document.createElement("input");

let selectedBook = "files/the-last-words.epub";

const select = document.getElementById("select");

const books = [
  { title: "Finishing Well Small", book: "file/finishing-well.epub" },
  { title: "Learn", book: "file/learn.epub" },
  { title: "The Art of War", book: "file/The_Art_Of_War.epub" },
];

// Populate the select element
select.innerHTML = books
  .map((book) => `<option value="${book.book}">${book.title}</option>`)
  .join("");

// Get the container elements for the ePub viewer
var area = document.getElementById("area");
var dragarea = document.getElementById("dragarea");

// Touch & drag variables
var startX = 0,
  startY = 0,
  isDragging = false;
var threshold = 50; // Minimum pixels to consider as a swipe

// Helper function: loads an ePub book into the viewer
function loadBook(bookUrl) {
  area.innerHTML = ""; // Clear any existing viewer content

  // Initialize new ePub instance and rendition
  book = ePub(bookUrl);
  rendition = book.renderTo("area", {
    method: "continuous",
    width: "100%",
    height: 600,
    spread: "always",
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

  // Update navigation button visibility when the location changes
  rendition.on("relocated", function (location) {
    if (location && location.start && location.start.cfi) {
      localStorage.setItem("book-location", location.start.cfi);
    }

    var nextBtn = book.package.metadata.direction === "rtl" ? prev : next;
    var prevBtn = book.package.metadata.direction === "rtl" ? next : prev;

    nextBtn.style.visibility = location.atEnd ? "hidden" : "visible";
    prevBtn.style.visibility = location.atStart ? "hidden" : "visible";
  });
}

// Initial load of the book
loadBook(selectedBook);

// When a new book is selected, reload the viewer with that book
select.addEventListener("change", (e) => {
  selectedBook = select.value;
  loadBook(selectedBook);
});

// Navigation event listeners for next/prev buttons
next.addEventListener("click", function (e) {
  book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
  e.preventDefault();
  window.scroll({ top: 0, left: 0, behavior: "smooth" });
});

prev.addEventListener("click", function (e) {
  book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
  e.preventDefault();
  window.scroll({ top: 0, left: 0, behavior: "smooth" });
});

// Keyboard navigation listener
document.addEventListener("keyup", function (e) {
  if (e.keyCode === 37) {
    book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
  }
  if (e.keyCode === 39) {
    book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
  }
});

// --- Touch Events for Left/Right Swipe ---
dragarea.addEventListener("touchstart", function (e) {
  startX = e.changedTouches[0].clientX;
  startY = e.changedTouches[0].clientY;
}, false);

dragarea.addEventListener("touchend", function (e) {
  var endX = e.changedTouches[0].clientX;
  var endY = e.changedTouches[0].clientY;
  handleSwipe(endX - startX, endY - startY);
}, false);

// --- Mouse Events ---
dragarea.addEventListener("mousedown", function (e) {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
});

dragarea.addEventListener("mouseup", function (e) {
  if (!isDragging) return;
  isDragging = false;
  var endX = e.clientX;
  var endY = e.clientY;
  handleSwipe(endX - startX, endY - startY);
});

dragarea.addEventListener("mousemove", function (e) {
  if (isDragging) e.preventDefault();
}, false);

// Helper function to handle swipe/drag navigation
function handleSwipe(deltaX, deltaY) {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe (left/right)
    if (Math.abs(deltaX) >= threshold) {
      if (deltaX < 0) {
        // Swiped left
        book.package.metadata.direction === "rtl" ? rendition.prev() : rendition.next();
      } else {
        // Swiped right
        book.package.metadata.direction === "rtl" ? rendition.next() : rendition.prev();
      }
    }
  } else {
    // Vertical swipe (up/down)
    if (Math.abs(deltaY) >= threshold) {
      if (deltaY < 0) {
        // Swiped up (next page)
        rendition.next();
      } else {
        // Swiped down (previous page)
        rendition.prev();
      }
    }
  }
  window.scroll({ top: 0, left: 0, behavior: "smooth" });
}
