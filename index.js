const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const port = 3010;

const drStatusMap = {
  0: "Successfully Submit",
  1: "Submit Failed",
  2: "Successfully Delivered",
  3: "Delivery Failed",
};

const dbPath = path.join(__dirname, "data.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("🔴 Failed to open database:", err);
    process.exit(1);
  }
  console.log("⚪️  Connected to SQLite database:", dbPath);
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS gathered_messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      userName    TEXT    NOT NULL,
      password    TEXT    NOT NULL,
      msgRefNum   TEXT    NOT NULL,
      source      TEXT    NOT NULL,
      destination TEXT    NOT NULL,
      msg         TEXT    NOT NULL,
      dr_status   TEXT    NOT NULL,
      dr_text     TEXT    NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error("🔴 Failed to create table:", err);
      }
    }
  );
});

app.get("/api/gather", (req, res) => {
  const {
    userName,
    password,
    msgRefNum,
    from: source,
    to: destination,
    msg,
    dr_status,
  } = req.query;

  const missing = [];
  [
    "userName",
    "password",
    "msgRefNum",
    "from",
    "to",
    "msg",
    "dr_status",
  ].forEach((key) => {
    if (!req.query[key]) {
      missing.push(key);
    }
  });

  if (missing.length) {
    return res.status(400).json({
      error: `Missing required query parameter(s): ${missing.join(", ")}`,
    });
  }

  if (!drStatusMap.hasOwnProperty(dr_status)) {
    return res.status(400).json({
      error: `Invalid dr_status value. Expected one of: ${Object.keys(
        drStatusMap
      ).join(", ")}`,
    });
  }

  console.log("Received request with parameters:", req.query);

  const drStatusText = drStatusMap[dr_status];

  const stmt = db.prepare(
    `INSERT INTO gathered_messages 
      (userName, password, msgRefNum, source, destination, msg, dr_status, dr_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run(
    userName,
    password,
    msgRefNum,
    source,
    destination,
    msg,
    dr_status,
    drStatusText,
    function (err) {
      if (err) {
        console.error("🔴 DB insert error:", err);
        return res.status(500).json({ error: "Failed to save to database" });
      }

      console.log("🟢 Saved to DB with ID:", this.lastID);

      return res.json({
        status: "success",
        id: this.lastID,
        received: {
          userName,
          msgRefNum,
          from: source,
          to: destination,
          msg,
          dr_status: {
            code: dr_status,
            description: drStatusText,
          },
        },
        message: "Parameters received and stored successfully.",
      });
    }
  );

  stmt.finalize();
});

process.on("SIGINT", () => {
  console.log("Closing database connection...");
  db.close((err) => {
    if (err) {
      console.error("🔴 Failed to close database:", err);
    } else {
      console.log("⚪️ Database connection closed.");
    }
    process.exit(0);
  });
});

app.get("/api/records", (req, res) => {
  const query = "SELECT * FROM gathered_messages";

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("🔴 Failed to retrieve records:", err);
      return res.status(500).json({ error: "Failed to fetch records" });
    }


    return res.json({
      status: "success",
      records: rows,
    });
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server listening on http://0.0.0.0:${port}`);
});

