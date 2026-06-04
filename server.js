const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    date_time TEXT
  )`);
});

// Initialize CSV Writer (Excel compatible)
const csvPath = path.join(__dirname, 'database.csv');
const csvWriter = createObjectCsvWriter({
  path: csvPath,
  header: [
    { id: 'date_time', title: 'Date & Time' },
    { id: 'name', title: 'Full Name' },
    { id: 'email', title: 'Email Address' },
    { id: 'phone', title: 'Phone Number' },
    { id: 'message', title: 'Message' }
  ],
  append: fs.existsSync(csvPath) // Append if file exists
});

// API Endpoint for Contact Form
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  // Get current date and time
  const now = new Date();
  const date_time = now.toLocaleString(); // Format: MM/DD/YYYY, HH:MM:SS AM/PM

  // 1. Save to SQLite
  const stmt = db.prepare('INSERT INTO contacts (name, email, phone, message, date_time) VALUES (?, ?, ?, ?, ?)');
  stmt.run(name, email, phone, message, date_time, function(err) {
    if (err) {
      console.error("SQLite Error:", err);
      return res.status(500).json({ error: 'Failed to save to SQLite database' });
    }
    
    // 2. Save to CSV (Excel format)
    const record = [{ name, email, phone, message, date_time }];
    csvWriter.writeRecords(record)
      .then(() => {
        console.log(`[${date_time}] New contact saved: ${name} (${email})`);
        res.json({ success: true, message: 'Data successfully saved to SQLite and CSV!' });
      })
      .catch((csvErr) => {
        console.error("CSV Error:", csvErr);
        res.status(500).json({ error: 'Failed to save to Excel/CSV file' });
      });
  });
  stmt.finalize();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 FxStar Backend Server is Running!`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
  console.log(`💾 SQLite Database: database.sqlite`);
  console.log(`📊 Excel Database : database.csv`);
  console.log(`=========================================`);
});
