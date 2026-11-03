const EventRepo = require('../data/eventRepo');

class EventService {
  static getUpcomingEvents(callback) {
    EventRepo.getAllFutureEvents((err, events) => {
      if (err) return callback(err);
      callback(null, events);
    });
  }
}

module.exports = EventService;
