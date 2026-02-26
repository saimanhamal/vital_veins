const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const { connect, closeDatabase, clearDatabase } = require('./helpers/testSetup');
const { createTestUser, createTestDonor, generateAuthToken } = require('./helpers/testData');

describe('Authentication Routes', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new donor successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password123',
          role: 'donor',
          personalInfo: {
            bloodType: 'A+',
            dateOfBirth: '1990-01-01',
            gender: 'male',
          },
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('john@example.com');
      expect(res.body.user.role).toBe('donor');

      // Verify donor profile was created
      const donor = await Donor.findOne({ user: res.body.user.id });
      expect(donor).toBeTruthy();
    });

    it('should register a new hospital successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'City Hospital',
          email: 'hospital@example.com',
          password: 'Hospital123',
          role: 'hospital',
          hospitalName: 'City Hospital',
          license: 'LIC-123456',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('hospital');

      // Verify hospital profile was created
      const hospital = await Hospital.findOne({ user: res.body.user.id });
      expect(hospital).toBeTruthy();
      expect(hospital.hospitalName).toBe('City Hospital');
    });

    it('should reject registration with existing email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'existing@example.com',
          password: 'Password123',
          role: 'donor',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123',
          role: 'donor',
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Ab1',
          role: 'donor',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'LoginPass123',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should reject login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    it('should reject login with invalid password', async () => {
      await createTestUser({
        email: 'user@example.com',
        password: 'CorrectPass123',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPass123',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    it('should reject login for inactive account', async () => {
      await createTestUser({
        email: 'inactive@example.com',
        password: 'Password123',
        isActive: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'Password123',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('deactivated');
    });

    it('should update lastLogin timestamp on successful login', async () => {
      const user = await createTestUser({
        email: 'timestamp@example.com',
        password: 'TimeStamp123',
      });

      const originalLastLogin = user.lastLogin;

      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'timestamp@example.com',
          password: 'TimeStamp123',
        });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLogin).not.toEqual(originalLastLogin);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.role).toBe(user.role);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const user = await createTestUser({ name: 'Old Name' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Name',
          phone: '+1234567890',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe('New Name');
      expect(res.body.user.phone).toBe('+1234567890');
    });

    it('should not allow updating role', async () => {
      const user = await createTestUser({ role: 'donor' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: 'admin',
        });

      expect(res.statusCode).toBe(200);
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.role).toBe('donor');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const user = await createTestUser({ password: 'OldPassword123' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'NewPassword123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Password changed');

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'NewPassword123',
        });

      expect(loginRes.statusCode).toBe(200);
    });

    it('should reject with incorrect current password', async () => {
      const user = await createTestUser({ password: 'CorrectPass123' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPass123',
          newPassword: 'NewPassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('incorrect');
    });

    it('should reject short new password', async () => {
      const user = await createTestUser({ password: 'OldPassword123' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123',
          newPassword: 'Ab1',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('at least 6 characters');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const token = generateAuthToken(user);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Logged out');
    });
  });

  describe('GET /api/auth/check-role/:role', () => {
    it('should confirm user has correct role', async () => {
      const user = await createTestUser({ role: 'donor' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/auth/check-role/donor')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.hasRole).toBe(true);
      expect(res.body.userRole).toBe('donor');
    });

    it('should deny user does not have role', async () => {
      const user = await createTestUser({ role: 'donor' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/auth/check-role/admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.hasRole).toBe(false);
    });
  });
});
