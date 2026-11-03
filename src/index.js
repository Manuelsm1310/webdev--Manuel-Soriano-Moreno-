require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserRepo = require('./data/userRepo');
const AuthService = require('./services/authService');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
  UserRepo.findByEmail(email, async (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect email.' });
    
    try {
      const isValid = await AuthService.verifyPassword(user, password);
      if (!isValid) return done(null, false, { message: 'Incorrect password.' });
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  });
}));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, (accessToken, refreshToken, profile, done) => {
    AuthService.findOrCreateGoogleUser(profile, done);
  }));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  UserRepo.findById(id, done);
});

app.use('/', authRoutes);
app.use('/', eventRoutes);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
