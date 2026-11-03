const request = require('supertest');
const app = require('../src/index');
const db = require('../src/data/db');

describe('Slice 1: Sign-in and Events List', () => {
  beforeAll((done) => {
    // Give some time for the database to seed
    setTimeout(done, 1000);
  });

  afterAll((done) => {
    db.close(done);
  });

  test('[AC-9] A visitor who opens /events without signing in lands on /login', async () => {
    const res = await request(app).get('/events');
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/login');
  });

  test('[AC-10] After signing in with a seeded account, /events shows the three seeded events', async () => {
    const agent = request.agent(app);
    
    // Sign in
    await agent
      .post('/login')
      .send({ email: 'member@example.com', password: 'password123' })
      .expect(302)
      .expect('Location', '/events');

    // Access /events (should be HTML)
    const resHtml = await agent.get('/events').expect(200);
    expect(resHtml.text).toContain('Upcoming Events');

    // Access /api/events (should be JSON)
    const resJson = await agent.get('/api/events').expect(200);
    
    expect(Array.isArray(resJson.body)).toBe(true);
    expect(resJson.body.length).toBe(3);
    expect(resJson.body[0]).toHaveProperty('title');
    expect(resJson.body[0]).toHaveProperty('date');
  });

  test('[AC-11] Deleting one event row in the database and reloading /events removes that event from the screen', async () => {
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
    expect(res2.body.length).toBe(res1.body.length - 1);
    expect(res2.body.find(e => e.id === eventIdToDelete)).toBeUndefined();
  });

  test('Submitting invalid credentials redirects to /login with an error message', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'member@example.com', password: 'wrongpassword' })
      .expect(302);
    expect(res.header.location).toContain('/login?error=');
  });
});
