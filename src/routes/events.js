const express = require('express');
const path = require('path');
const router = express.Router();
const EventService = require('../services/eventService');

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

router.get('/events', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/events.html'));
});

router.get('/api/events', isAuthenticated, (req, res) => {
  EventService.getUpcomingEvents((err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
    res.json(events);
  });
});

module.exports = router;
