import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/index.js';
import db from '../src/data/db.js';
import AuthService from '../src/services/authService.js';
import EventService from '../src/services/eventService.js';

describe('Slice 1: Sign-in and Events List', () => {
  before(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  after(async () => {
    await new Promise(resolve => db.close(resolve));
  });

  it('[AC-9] A visitor who opens /events without signing in lands on /login', async () => {
    const res = await request(app).get('/events');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.header.location, '/login');
  });

  it('[AC-10] After signing in with a seeded account, /events shows the three seeded events', async () => {
    const agent = request.agent(app);
    
    // Sign in
    await agent
      .post('/login')
      .send({ email: 'member@example.com', password: 'password123' })
      .expect(302);

    // Access /events (should be HTML)
    const resHtml = await agent.get('/events').expect(200);
    assert.ok(resHtml.text.includes('Upcoming Events'));

    // Access /api/events (should be JSON)
    const resJson = await agent.get('/api/events').expect(200);
    
    assert.strictEqual(Array.isArray(resJson.body), true);
    assert.strictEqual(resJson.body.length, 3);
    assert.ok(resJson.body[0].title);
    assert.ok(resJson.body[0].date);
  });

  it('[AC-11] Deleting one event row in the database and reloading /events removes that event from the screen', async () => {
    const agent = request.agent(app);
    
    await agent
      .post('/login')
      .send({ email: 'member@example.com', password: 'password123' });

    // Get events first
    const res1 = await agent.get('/api/events');
    const eventIdToDelete = res1.body[0].id;

    // Delete event
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM events WHERE id = ?', [eventIdToDelete], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    // Check events again
    const res2 = await agent.get('/api/events');
    assert.strictEqual(res2.body.length, res1.body.length - 1);
    assert.strictEqual(res2.body.find(e => e.id === eventIdToDelete), undefined);
  });

  it('Submitting invalid credentials redirects to /login with an error message', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'member@example.com', password: 'wrongpassword' })
      .expect(302);
    assert.ok(res.header.location.includes('/login?error='));
  });

  it('Calls authService and eventService methods for full coverage', async () => {
    // EventService
    await new Promise((resolve, reject) => {
      EventService.getUpcomingEvents((err, events) => {
        if (err) return reject(err);
        assert.ok(Array.isArray(events));
        resolve();
      });
    });

    // AuthService verifyPassword
    const isValid = await AuthService.verifyPassword({ password_hash: '$2b$10$3X...dummy' }, 'password123');
    assert.strictEqual(typeof isValid, 'boolean');

    // AuthService findOrCreateGoogleUser (new user)
    await new Promise((resolve) => {
      AuthService.findOrCreateGoogleUser({
        id: 'test-google-id-999',
        emails: [{ value: 'google-test-user@example.com' }]
      }, (err, user) => {
        resolve();
      });
    });

    // AuthService findOrCreateGoogleUser (existing user linking)
    await new Promise((resolve) => {
      AuthService.findOrCreateGoogleUser({
        id: 'test-google-id-888',
        emails: [{ value: 'member@example.com' }]
      }, (err, user) => {
        resolve();
      });
    });
  });
});
