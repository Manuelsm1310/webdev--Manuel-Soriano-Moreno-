const db = require('./db');

class EventRepo {
  static getAllFutureEvents(callback) {
    const now = new Date().toISOString();
    db.all('SELECT * FROM events WHERE date > ? ORDER BY date ASC', [now], (err, rows) => {
      callback(err, rows);
    });
  }

  static getById(id, callback) {
    db.get('SELECT * FROM events WHERE id = ?', [id], (err, row) => {
      callback(err, row);
    });
  }
}

module.exports = EventRepo;
