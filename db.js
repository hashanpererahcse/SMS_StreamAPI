const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "data.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("🔴 Failed to open database:", err);
    process.exit(1);
  }
  console.log("⚪️  Connected to SQLite database:", dbPath);
});

// Function to select all records from gathered_messages
function selectAllMessages() {
  const query = "SELECT * FROM gathered_messages"; // Select all records from gathered_messages

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("🔴 Failed to retrieve records:", err);
      return;
    }

    // Log each record to the console
    console.log("🟢 Records retrieved successfully:");
    rows.forEach((row) => {
      console.log(row); // You can format this however you like
    });
  });
}

// Call the function to fetch and display records
selectAllMessages();
