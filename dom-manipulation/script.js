
// ====================
// Dynamic Quote Generator with Web Storage, JSON, Category Filter, and Server Sync
// ====================

// Mock server URL for simulation
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// --------------------
// Load / Save Quotes
// --------------------

// Load quotes from local storage or use default
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Inspiration" }
];

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// --------------------
// Display Quotes
// --------------------

// Display a random quote or filtered list
function showRandomQuote(filteredQuotes = quotes) {
  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "<p>No quotes available for this category.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  const quoteDisplay = document.getElementById("quoteDisplay");
  quoteDisplay.innerHTML = `
    <p>"${quote.text}"</p>
    <small>- ${quote.category}</small>
  `;

  // Save last viewed quote in session storage
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

// --------------------
// Add Quote Form
// --------------------

function createAddQuoteForm() {
  const formContainer = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  document.body.appendChild(formContainer);
}

// Add new quotes
function addQuote() {
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (newQuoteText === "" || newQuoteCategory === "") {
    alert("Please enter both a quote and a category!");
    return;
  }

  quotes.push({ text: newQuoteText, category: newQuoteCategory });
  saveQuotes();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  populateCategories();
  showRandomQuote(getFilteredQuotes());
}

// --------------------
// Category Filter
// --------------------

function createCategoryFilter() {
  const filterContainer = document.createElement("div");
  const select = document.createElement("select");
  select.id = "categoryFilter";
  select.addEventListener("change", filterQuotes);

  filterContainer.appendChild(select);
  document.body.insertBefore(filterContainer, document.getElementById("quoteDisplay"));

  populateCategories();
}

// Populate categories dropdown
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  if (!select) return;

  const lastSelected = localStorage.getItem("lastSelectedCategory") || "all";

  const categories = [...new Set(quotes.map(q => q.category))];

  select.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Categories";
  select.appendChild(allOption);

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  select.value = lastSelected;
}

// Get filtered quotes
function getFilteredQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  return selectedCategory === "all" ? quotes : quotes.filter(q => q.category === selectedCategory);
}

// Handle filter change
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastSelectedCategory", selectedCategory);
  showRandomQuote(getFilteredQuotes());
}

// --------------------
// JSON Import / Export
// --------------------

function createImportExportUI() {
  const container = document.createElement("div");

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Quotes (JSON)";
  exportBtn.addEventListener("click", exportToJson);

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".json";
  importInput.addEventListener("change", importFromJsonFile);

  container.appendChild(exportBtn);
  container.appendChild(importInput);

  document.body.appendChild(container);
}

// Export quotes to JSON file
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        alert("Quotes imported successfully!");
        populateCategories();
        showRandomQuote(getFilteredQuotes());
      } else {
        alert("Invalid JSON file format.");
      }
    } catch (error) {
      alert("Error parsing JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// --------------------
// Server Sync Simulation
// --------------------

// Fetch server quotes (simulation)
async function fetchServerQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();

    const serverQuotes = data.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));

    resolveConflicts(serverQuotes);
  } catch (error) {
    console.error("Error fetching server data:", error);
  }
}

// Post local quotes to server (simulation)
async function postLocalQuotes() {
  try {
    for (const quote of quotes) {
      await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote)
      });
    }
  } catch (error) {
    console.error("Error posting quotes:", error);
  }
}

// Resolve conflicts: server takes precedence
function resolveConflicts(serverQuotes) {
  let updated = false;

  serverQuotes.forEach(serverQuote => {
    const exists = quotes.some(localQuote => localQuote.text === serverQuote.text);
    if (!exists) {
      quotes.push(serverQuote);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    alert("New quotes from server have been added and conflicts resolved.");
    populateCategories();
    showRandomQuote(getFilteredQuotes());
  }
}

// Start periodic sync
function startSyncing(interval = 30000) {
  setInterval(fetchServerQuotes, interval);
}

// --------------------
// Initialize Everything
// --------------------

document.getElementById("newQuote").addEventListener("click", () => showRandomQuote(getFilteredQuotes()));

showRandomQuote(getFilteredQuotes());
createAddQuoteForm();
createCategoryFilter();
createImportExportUI();
startSyncing();
postLocalQuotes();






















