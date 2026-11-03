const db = require('./db');

class UserRepo {
  static findByEmail(email, callback) {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      callback(err, row);
    });
  }

  static findById(id, callback) {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      callback(err, row);
    });
  }

  static findByGoogleId(googleId, callback) {
    db.get('SELECT * FROM users WHERE google_id = ?', [googleId], (err, row) => {
      callback(err, row);
    });
  }

  static createUser(userData, callback) {
    const { email, password_hash, google_id } = userData;
    db.run(
      'INSERT INTO users (email, password_hash, google_id) VALUES (?, ?, ?)',
      [email, password_hash, google_id],
      function(err) {
        callback(err, this ? this.lastID : null);
      }
    );
  }

  static updateGoogleId(userId, googleId, callback) {
    db.run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, userId], (err) => {
      callback(err);
    });
  }
}

module.exports = UserRepo;
