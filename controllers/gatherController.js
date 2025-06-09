// controllers/gatherController.js
const config = require("../config");
const drStatusMap = require("../utils/drStatusMap");
const db = require("../db"); // ← new import

/**
 * Handler for GET /api/gather
 */
exports.gatherHandler = (req, res) => {
  const {
    userName,
    password,
    msgRefNum,
    from: source,
    to: destination,
    msg,
    dr_status,
  } = req.query;

  // 1️⃣ Authenticate
  if (userName !== config.apiUser || password !== config.apiPass) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 2️⃣ Look up the human-readable text for dr_status
  const drText = drStatusMap[dr_status];
  if (!drText) {
    // (In practice, this shouldn’t happen because we validate earlier,
    // but just in case…)
    return res.status(400).json({
      error: `Invalid dr_status. Must be one of: ${Object.keys(
        drStatusMap
      ).join(", ")}`,
    });
  }

  // 3️⃣ Insert into SQLite
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
    drText,
    function (err) {
      if (err) {
        console.error("🔴 DB insert error:", err);
        return res.status(500).json({ error: "Failed to save to database" });
      }

      // `this.lastID` is the auto-incremented ID of the new row
      console.log("🟢 Saved to DB with ID:", this.lastID);

      // 4️⃣ Return a 200, echo back code + text
      return res.json({
        status: "success",
        id: this.lastID,
        received: {
          msgRefNum,
          from: source,
          to: destination,
          msg,
          dr_status: { code: dr_status, description: drText },
        },
      });
    }
  );

  stmt.finalize();
};
