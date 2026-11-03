const express = require('express');
const passport = require('passport');
const path = require('path');
const router = express.Router();

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/login.html'));
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      const message = encodeURIComponent(info?.message || 'Invalid credentials');
      return res.redirect(`/login?error=${message}`);
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.save((err) => {
        if (err) return next(err);
        return res.redirect('/events');
      });
    });
  })(req, res, next);
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/events');
  }
);

module.exports = router;
