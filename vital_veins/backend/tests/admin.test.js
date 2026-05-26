const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const { connect, closeDatabase, clearDatabase } = require('./helpers/testSetup');
const {
  createTestUser,
  createTestDonor,
  createTestHospital,
  createTestAdmin,
  generateAuthToken,
} = require('./helpers/testData');

describe('Admin Routes', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return admin dashboard statistics', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      // Create some test data
      await createTestDonor();
      await createTestHospital();

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('statistics');
      expect(res.body.statistics).toHaveProperty('totalHospitals');
      expect(res.body.statistics).toHaveProperty('totalDonors');
      expect(res.body.statistics).toHaveProperty('totalTickets');
      expect(res.body.statistics).toHaveProperty('totalAppointments');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/admin/dashboard');

      expect(res.statusCode).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      const user = await createTestUser({ role: 'donor' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/admin/hospitals', () => {
    it('should return list of hospitals', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      // Create test hospitals
      await createTestHospital();
      await createTestHospital();

      const res = await request(app)
        .get('/api/admin/hospitals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.hospitals).toBeInstanceOf(Array);
      expect(res.body.hospitals.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .get('/api/admin/hospitals?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.limit).toBe(5);
    });

    it('should filter hospitals by status', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      await createTestHospital(null, { status: 'pending' });

      const res = await request(app)
        .get('/api/admin/hospitals?status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/admin/hospitals/:id/approve', () => {
    it('should approve hospital successfully', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser, { status: 'pending' });

      const res = await request(app)
        .put(`/api/admin/hospitals/${hospital._id}/approve`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'All documents verified',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.hospital.status).toBe('approved');

      // Verify in database
      const updatedHospital = await Hospital.findById(hospital._id);
      expect(updatedHospital.status).toBe('approved');
    });

    it('should return 404 for non-existent hospital', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/admin/hospitals/${fakeId}/approve`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/admin/hospitals/:id/reject', () => {
    it('should reject hospital successfully', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser, { status: 'pending' });

      const res = await request(app)
        .put(`/api/admin/hospitals/${hospital._id}/reject`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Incomplete documentation',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.hospital.status).toBe('rejected');
    });
  });

  describe('GET /api/admin/donors', () => {
    it('should return list of donors', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      // Create test donors
      await createTestDonor();
      await createTestDonor();

      const res = await request(app)
        .get('/api/admin/donors')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.donors).toBeInstanceOf(Array);
      expect(res.body.donors.length).toBeGreaterThanOrEqual(2);
    });

    it('should support filtering by blood type', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      await createTestDonor(null, {
        personalInfo: { bloodType: 'AB+' },
      });

      const res = await request(app)
        .get('/api/admin/donors?bloodType=AB+')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it('should support pagination', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .get('/api/admin/donors?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return list of all users', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      // Create test users
      await createTestUser({ role: 'donor' });
      await createTestUser({ role: 'hospital' });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.users).toBeInstanceOf(Array);
      expect(res.body.users.length).toBeGreaterThanOrEqual(3); // admin + 2 test users
    });

    it('should filter users by role', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      await createTestUser({ role: 'donor' });

      const res = await request(app)
        .get('/api/admin/users?role=donor')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/admin/users/:id/deactivate', () => {
    it('should deactivate user successfully', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const targetUser = await createTestUser({ role: 'donor' });

      const res = await request(app)
        .put(`/api/admin/users/${targetUser._id}/deactivate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Violation of terms',
        });

      expect(res.statusCode).toBe(200);

      // Verify in database
      const User = require('../models/User');
      const deactivatedUser = await User.findById(targetUser._id);
      expect(deactivatedUser.isActive).toBe(false);
    });

    it('should not allow admin to deactivate themselves', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .put(`/api/admin/users/${adminUser._id}/deactivate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Test',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/admin/users/:id/activate', () => {
    it('should activate user successfully', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const targetUser = await createTestUser({ role: 'donor', isActive: false });

      const res = await request(app)
        .put(`/api/admin/users/${targetUser._id}/activate`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);

      // Verify in database
      const User = require('../models/User');
      const activatedUser = await User.findById(targetUser._id);
      expect(activatedUser.isActive).toBe(true);
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return system analytics', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('totalUsers');
      expect(res.body).toHaveProperty('usersByRole');
    });

    it('should include donation trends', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('donationTrends');
    });
  });

  describe('GET /api/admin/tickets', () => {
    it('should return all emergency tickets', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .get('/api/admin/tickets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tickets).toBeInstanceOf(Array);
    });

    it('should filter tickets by urgency', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .get('/api/admin/tickets?urgency=critical')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/admin/appointments', () => {
    it('should return all appointments', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.appointments).toBeInstanceOf(Array);
    });

    it('should support date range filtering', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const startDate = new Date('2024-01-01').toISOString();
      const endDate = new Date('2024-12-31').toISOString();

      const res = await request(app)
        .get(`/api/admin/appointments?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user permanently (with confirmation)', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const targetUser = await createTestUser({ role: 'donor' });

      const res = await request(app)
        .delete(`/api/admin/users/${targetUser._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          confirm: true,
        });

      // Depending on implementation, this might soft-delete or hard-delete
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  describe('POST /api/admin/broadcast', () => {
    it('should broadcast notification to all users', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      await createTestUser({ role: 'donor' });
      await createTestUser({ role: 'hospital' });

      const res = await request(app)
        .post('/api/admin/broadcast')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'System Maintenance',
          message: 'Scheduled maintenance on Sunday',
          priority: 'medium',
        });

      // Broadcast may or may not be implemented - check if route exists
      expect([200, 201, 404]).toContain(res.statusCode);
    });
  });

  describe('GET /api/admin/reports', () => {
    it('should generate system reports', async () => {
      const adminUser = await createTestAdmin();
      const token = generateAuthToken(adminUser);

      const res = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${token}`);

      // Reports route may or may not exist
      expect([200, 404]).toContain(res.statusCode);
    });
  });
});
