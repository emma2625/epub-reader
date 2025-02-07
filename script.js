// Global references for book and rendition so event listeners use the latest instance
let book, rendition;

var controls = document.getElementById("controls");
var currentPage = document.getElementById("current-percent");
var next = document.getElementById("next");
var prev = document.getElementById("prev");
var slider = document.createElement("input");

let selectedBook = "files/Finishing well (ebook) - Greater.epub";

const select = document.getElementById("select");

const books = [
  {
    title: "Finishing Well Small",
    book: "file/finishing-well.epub",
  },
  {
    title: "Learn",
    book: "file/learn.epub",
  },
  {
    title: "The Art of War",
    book: "file/The_Art_Of_War.epub",
  },
];

// Populate the select element
select.innerHTML = books
  .map((book) => `<option value="${book.book}">${book.title}</option>`)
  .join("");

// Get the container elements for the ePub viewer
var area = document.getElementById("area");
var dragarea = document.getElementById("dragarea");

// Touch & drag variables
var startX = 0;
var isDragging = false;
var threshold = 50; // Minimum pixels to consider as a swipe

// Helper function: loads an ePub book into the viewer
function loadBook(bookUrl) {
  // Clear any existing viewer content
  area.innerHTML = "";
  
  // Initialize new ePub instance and rendition
  book = ePub(bookUrl);
  rendition = book.renderTo("area", {
    width: "100%",
    height: 600,
    spread: "always",
  });
  rendition.display();

  // After the book is ready, check for a stored location (or display default)
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

    // Determine the correct buttons based on text direction
    var nextBtn =
      book.package.metadata.direction === "rtl" ? prev : next;
    var prevBtn =
      book.package.metadata.direction === "rtl" ? next : prev;

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
next.addEventListener(
  "click",
  function (e) {
    // For RTL languages, swap next/prev behavior
    if (book.package.metadata.direction === "rtl") {
      rendition.prev();
    } else {
      rendition.next();
    }
    e.preventDefault();
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
  },
  false
);

prev.addEventListener(
  "click",
  function (e) {
    if (book.package.metadata.direction === "rtl") {
      rendition.next();
    } else {
      rendition.prev();
    }
    e.preventDefault();
    window.scroll({ top: 0, left: 0, behavior: "smooth" });
  },
  false
);

// Keyboard navigation listener
var keyListener = function (e) {
  if ((e.keyCode || e.which) === 37) {
    book.package.metadata.direction === "rtl"
      ? rendition.next()
      : rendition.prev();
  }
  if ((e.keyCode || e.which) === 39) {
    book.package.metadata.direction === "rtl"
      ? rendition.prev()
      : rendition.next();
  }
};
document.addEventListener("keyup", keyListener, false);

// --- Touch Events ---
dragarea.addEventListener(
  "touchstart",
  function (e) {
    startX = e.changedTouches[0].clientX;
  },
  false
);

dragarea.addEventListener(
  "touchend",
  function (e) {
    var endX = e.changedTouches[0].clientX;
    handleDrag(endX - startX);
  },
  false
);

// --- Mouse Events ---
dragarea.addEventListener("mousedown", function (e) {
  isDragging = true;
  startX = e.clientX;
});

dragarea.addEventListener("mouseup", function (e) {
  if (!isDragging) return;
  isDragging = false;
  var endX = e.clientX;
  handleDrag(endX - startX);
});

dragarea.addEventListener(
  "mousemove",
  function (e) {
    if (isDragging) e.preventDefault();
  },
  false
);

// Helper function to handle swipe/drag navigation
function handleDrag(deltaX) {
  if (Math.abs(deltaX) < threshold) return; // Not enough movement

  if (deltaX < 0) {
    // Dragged left: for LTR, go to next; for RTL, go to previous
    book.package.metadata.direction === "rtl"
      ? rendition.prev()
      : rendition.next();
  } else {
    // Dragged right: for LTR, go to previous; for RTL, go to next
    book.package.metadata.direction === "rtl"
      ? rendition.next()
      : rendition.prev();
  }

  window.scroll({ top: 0, left: 0, behavior: "smooth" });
}
