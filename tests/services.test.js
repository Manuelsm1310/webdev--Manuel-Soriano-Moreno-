import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcrypt';
import AuthService from '../src/services/authService.js';
import EventService from '../src/services/eventService.js';
import UserRepo from '../src/data/userRepo.js';
import EventRepo from '../src/data/eventRepo.js';

describe('AuthService & EventService Unit Tests', () => {
  describe('AuthService.verifyPassword', () => {
    it('returns false when user is null or undefined', async () => {
      const res1 = await AuthService.verifyPassword(null, 'password');
      assert.strictEqual(res1, false);

      const res2 = await AuthService.verifyPassword(undefined, 'password');
      assert.strictEqual(res2, false);
    });

    it('returns false when user has no password_hash', async () => {
      const res = await AuthService.verifyPassword({ email: 'test@example.com' }, 'password');
      assert.strictEqual(res, false);
    });

    it('returns true when password matches', async () => {
      const hash = await bcrypt.hash('secret123', 10);
      const res = await AuthService.verifyPassword({ password_hash: hash }, 'secret123');
      assert.strictEqual(res, true);
    });

    it('returns false when password does not match', async () => {
      const hash = await bcrypt.hash('secret123', 10);
      const res = await AuthService.verifyPassword({ password_hash: hash }, 'wrongpassword');
      assert.strictEqual(res, false);
    });
  });

  describe('AuthService.findOrCreateGoogleUser', () => {
    const originalFindByGoogleId = UserRepo.findByGoogleId;
    const originalFindByEmail = UserRepo.findByEmail;
    const originalUpdateGoogleId = UserRepo.updateGoogleId;
    const originalCreateUser = UserRepo.createUser;
    const originalFindById = UserRepo.findById;

    afterEach(() => {
      UserRepo.findByGoogleId = originalFindByGoogleId;
      UserRepo.findByEmail = originalFindByEmail;
      UserRepo.updateGoogleId = originalUpdateGoogleId;
      UserRepo.createUser = originalCreateUser;
      UserRepo.findById = originalFindById;
    });

    it('handles error when findByGoogleId fails', async () => {
      UserRepo.findByGoogleId = (googleId, cb) => cb(new Error('DB error'));

      await new Promise((resolve, reject) => {
        AuthService.findOrCreateGoogleUser({ id: '123', emails: [{ value: 'test@example.com' }] }, (err, user) => {
          try {
            assert.ok(err);
            assert.strictEqual(err.message, 'DB error');
            assert.strictEqual(user, undefined);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('returns user when findByGoogleId finds existing user', async () => {
      const existingUser = { id: 1, email: 'test@example.com', google_id: '123' };
      UserRepo.findByGoogleId = (googleId, cb) => cb(null, existingUser);

      await new Promise((resolve, reject) => {
        AuthService.findOrCreateGoogleUser({ id: '123', emails: [{ value: 'test@example.com' }] }, (err, user) => {
          try {
            assert.ifError(err);
            assert.deepStrictEqual(user, existingUser);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('handles error when findByEmail fails during link', async () => {
      UserRepo.findByGoogleId = (googleId, cb) => cb(null, null);
      UserRepo.findByEmail = (email, cb) => cb(new Error('Email DB error'));

      await new Promise((resolve, reject) => {
        AuthService.findOrCreateGoogleUser({ id: '123', emails: [{ value: 'test@example.com' }] }, (err, user) => {
          try {
            assert.ok(err);
            assert.strictEqual(err.message, 'Email DB error');
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('handles error when updateGoogleId fails for existing user by email', async () => {
      const userFoundByEmail = { id: 2, email: 'test@example.com' };
      UserRepo.findByGoogleId = (googleId, cb) => cb(null, null);
      UserRepo.findByEmail = (email, cb) => cb(null, userFoundByEmail);
      UserRepo.updateGoogleId = (userId, googleId, cb) => cb(new Error('Update error'));

      await new Promise((resolve, reject) => {
        AuthService.findOrCreateGoogleUser({ id: '123', emails: [{ value: 'test@example.com' }] }, (err, user) => {
          try {
            assert.ok(err);
            assert.strictEqual(err.message, 'Update error');
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('links google_id and returns user when existing user found by email', async () => {
      const userFoundByEmail = { id: 2, email: 'test@example.com' };
      UserRepo.findByGoogleId = (googleId, cb) => cb(null, null);
      UserRepo.findByEmail = (email, cb) => cb(null, userFoundByEmail);
      UserRepo.updateGoogleId = (userId, googleId, cb) => cb(null);

      await new Promise((resolve, reject) => {
        AuthService.findOrCreateGoogleUser({ id: '123', emails: [{ value: 'test@example.com' }] }, (err, user) => {
          try {
            assert.ifError(err);
            assert.strictEqual(user.id, 2);
            assert.strictEqual(user.google_id, '123');
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('handles error when createUser fails for new user', async () => {
      UserRepo.findByGoogleId = (googleId, cb) => cb(null, null);
      UserRepo.findByEmail = (email, cb) => cb(null, null);
      UserRepo.createUser = (data, cb) => cb(new Error('Create error'));

      await new Promise((resolve, reject) => {
        AuthService.findOrCreateGoogleUser({ id: '123', emails: [{ value: 'new@example.com' }] }, (err, user) => {
          try {
            assert.ok(err);
            assert.strictEqual(err.message, 'Create error');
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('creates new user and finds by id when no existing user found', async () => {
      const newUser = { id: 5, email: 'new@example.com', google_id: '123' };
      UserRepo.findByGoogleId = (googleId, cb) => cb(null, null);
      UserRepo.findByEmail = (email, cb) => cb(null, null);
      UserRepo.createUser = (data, cb) => cb(null, 5);
      UserRepo.findById = (id, cb) => cb(null, newUser);

      await new Promise((resolve, reject) => {
        AuthService.findOrCreateGoogleUser({ id: '123', emails: [{ value: 'new@example.com' }] }, (err, user) => {
          try {
            assert.ifError(err);
            assert.deepStrictEqual(user, newUser);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });

  describe('EventService.getUpcomingEvents', () => {
    const originalGetAllFutureEvents = EventRepo.getAllFutureEvents;

    afterEach(() => {
      EventRepo.getAllFutureEvents = originalGetAllFutureEvents;
    });

    it('handles error when getAllFutureEvents fails', async () => {
      EventRepo.getAllFutureEvents = (cb) => cb(new Error('Events DB error'));

      await new Promise((resolve, reject) => {
        EventService.getUpcomingEvents((err, events) => {
          try {
            assert.ok(err);
            assert.strictEqual(err.message, 'Events DB error');
            assert.strictEqual(events, undefined);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('returns events when getAllFutureEvents succeeds', async () => {
      const mockEvents = [{ id: 1, title: 'Event 1' }];
      EventRepo.getAllFutureEvents = (cb) => cb(null, mockEvents);

      await new Promise((resolve, reject) => {
        EventService.getUpcomingEvents((err, events) => {
          try {
            assert.ifError(err);
            assert.deepStrictEqual(events, mockEvents);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });
});
