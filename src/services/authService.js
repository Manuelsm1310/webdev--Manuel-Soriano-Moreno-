const bcrypt = require('bcrypt');
const UserRepo = require('../data/userRepo');

class AuthService {
  static async verifyPassword(user, password) {
    if (!user || !user.password_hash) return false;
    return await bcrypt.compare(password, user.password_hash);
  }

  static findOrCreateGoogleUser(profile, callback) {
    const googleId = profile.id;
    const email = profile.emails[0].value;

    UserRepo.findByGoogleId(googleId, (err, user) => {
      if (err) return callback(err);
      if (user) return callback(null, user);

      // Link by email if exists (AC-5)
      UserRepo.findByEmail(email, (err, existingUser) => {
        if (err) return callback(err);
        if (existingUser) {
          UserRepo.updateGoogleId(existingUser.id, googleId, (err) => {
            if (err) return callback(err);
            existingUser.google_id = googleId;
            return callback(null, existingUser);
          });
        } else {
          UserRepo.createUser({ email, google_id: googleId }, (err, userId) => {
            if (err) return callback(err);
            UserRepo.findById(userId, callback);
          });
        }
      });
    });
  }
}

module.exports = AuthService;
