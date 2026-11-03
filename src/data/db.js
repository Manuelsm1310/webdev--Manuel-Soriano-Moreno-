const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    capacity INTEGER NOT NULL
  )`);

  // Clear tables for deterministic seeding (AC-10, AC-11)
  db.run('DELETE FROM users');
  db.run('DELETE FROM events');

  // Seed data for AC-10
  const bcrypt = require('bcrypt');
  const saltRounds = 10;
  const password = 'password123';
  const hash = bcrypt.hashSync(password, saltRounds);
  db.run(`INSERT OR IGNORE INTO users (email, password_hash) VALUES (?, ?)`, ['member@example.com', hash]);

  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 1);
  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 7);
  const futureDate3 = new Date();
  futureDate3.setDate(futureDate3.getDate() + 30);

  db.run(`INSERT OR IGNORE INTO events (title, description, date, capacity) VALUES (?, ?, ?, ?)`, 
    ['Study Group A', 'Math study group', futureDate1.toISOString(), 10]);
  db.run(`INSERT OR IGNORE INTO events (title, description, date, capacity) VALUES (?, ?, ?, ?)`, 
    ['Study Group B', 'History study group', futureDate2.toISOString(), 5]);
  db.run(`INSERT OR IGNORE INTO events (title, description, date, capacity) VALUES (?, ?, ?, ?)`, 
    ['Study Group C', 'Physics study group', futureDate3.toISOString(), 8]);
});

module.exports = db;
