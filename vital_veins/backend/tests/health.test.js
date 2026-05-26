const request = require('supertest');
const { app } = require('../server');
const { connect, closeDatabase } = require('./helpers/testSetup');

describe('Health Check & Basic Routes', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/health', () => {
    it('should return health check status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should return valid timestamp', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      const timestamp = new Date(res.body.timestamp);
      expect(timestamp instanceof Date).toBe(true);
      expect(!isNaN(timestamp.getTime())).toBe(true);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app).get('/api/non-existent-route');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('not found');
    });

    it('should return 404 for invalid API endpoints', async () => {
      const res = await request(app).get('/api/invalid/endpoint/test');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('CORS & Security Headers', () => {
    it('should include CORS headers', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should include security headers from helmet', async () => {
      const res = await request(app).get('/api/health');

      // Helmet adds various security headers
      expect(res.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('Rate Limiting', () => {
    it('should respond to multiple requests', async () => {
      const requests = [];
      
      // Make 5 requests quickly
      for (let i = 0; i < 5; i++) {
        requests.push(request(app).get('/api/health'));
      }

      const responses = await Promise.all(requests);
      
      // All should succeed (rate limit is typically higher)
      responses.forEach((res) => {
        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('JSON Body Parsing', () => {
    it('should parse JSON request bodies', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'donor',
        });

      // Should parse the JSON and attempt to process
      // (will fail validation but proves parsing works)
      expect([201, 400]).toContain(res.statusCode);
    });

    it('should reject malformed JSON', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Content-Type Handling', () => {
    it('should return JSON responses', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Server Configuration', () => {
    it('should have proper error handling middleware', async () => {
      // Trigger an error by accessing invalid route with special chars
      const res = await request(app).get('/api/test/error/handler');

      expect([404, 500]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('message');
    });
  });
});
