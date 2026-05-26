const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Appointment = require('../models/Appointment');
const Ticket = require('../models/Ticket');
const { connect, closeDatabase, clearDatabase } = require('./helpers/testSetup');
const {
  createTestUser,
  createTestDonor,
  createTestHospital,
  generateAuthToken,
} = require('./helpers/testData');

describe('Donor Routes', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/donor/dashboard', () => {
    it('should return donor dashboard data', async () => {
      const user = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/donor/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('donor');
      expect(res.body).toHaveProperty('statistics');
      expect(res.body).toHaveProperty('upcomingAppointments');
      expect(res.body.donor.donorId).toBe(donor.donorId);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/donor/dashboard');

      expect(res.statusCode).toBe(401);
    });

    it('should return 403 for non-donor users', async () => {
      const user = await createTestUser({ role: 'hospital' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/donor/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/donor/profile', () => {
    it('should return donor profile', async () => {
      const user = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/donor/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.donor).toBeTruthy();
      expect(res.body.donor.personalInfo.bloodType).toBe('O+');
    });
  });

  describe('PUT /api/donor/profile', () => {
    it('should update donor profile', async () => {
      const user = await createTestUser({ role: 'donor' });
      await createTestDonor(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/donor/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact: {
            phone: '+9999999999',
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.donor.contact.phone).toBe('+9999999999');
    });

    it('should not allow updating donorId', async () => {
      const user = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(user);
      const token = generateAuthToken(user);
      const originalDonorId = donor.donorId;

      const res = await request(app)
        .put('/api/donor/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          donorId: 'HACK-12345',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.donor.donorId).toBe(originalDonorId);
    });
  });

  describe('GET /api/donor/hospitals', () => {
    it('should return nearby hospitals', async () => {
      const user = await createTestUser({ role: 'donor' });
      await createTestDonor(user, {
        location: { type: 'Point', coordinates: [0, 0] },
      });
      const token = generateAuthToken(user);

      // Create a nearby hospital
      await createTestHospital(null, {
        location: { type: 'Point', coordinates: [0.01, 0.01] },
      });

      const res = await request(app)
        .get('/api/donor/hospitals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.hospitals).toBeInstanceOf(Array);
    });

    it('should filter hospitals by distance', async () => {
      const user = await createTestUser({ role: 'donor' });
      await createTestDonor(user, {
        location: { type: 'Point', coordinates: [0, 0] },
      });
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/donor/hospitals?maxDistance=10000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/donor/appointments', () => {
    it('should book an appointment successfully', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);
      const donorToken = generateAuthToken(donorUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 7);

      const res = await request(app)
        .post('/api/donor/appointments')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          hospital: hospital._id,
          type: 'blood',
          bloodType: 'O+',
          scheduledDate: scheduledDate.toISOString(),
          scheduledTime: '10:00',
          duration: 60,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('appointment');
      expect(res.body.appointment.type).toBe('blood');
    });

    it('should reject appointment for ineligible donor', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser, {
        donationPreferences: {
          bloodDonation: {
            eligible: true,
            lastDonationDate: new Date(), // Just donated
            totalDonations: 1,
          },
        },
      });
      const donorToken = generateAuthToken(donorUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);

      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 7);

      const res = await request(app)
        .post('/api/donor/appointments')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          hospital: hospital._id,
          type: 'blood',
          bloodType: 'O+',
          scheduledDate: scheduledDate.toISOString(),
          scheduledTime: '10:00',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('not eligible');
    });

    it('should reject appointment with non-existent hospital', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      await createTestDonor(donorUser);
      const donorToken = generateAuthToken(donorUser);

      const fakeHospitalId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post('/api/donor/appointments')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          hospital: fakeHospitalId,
          type: 'blood',
          bloodType: 'O+',
          scheduledDate: new Date().toISOString(),
          scheduledTime: '10:00',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/donor/appointments', () => {
    it('should return donor appointments', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);

      // Create an appointment
      const appointment = new Appointment({
        donor: donor._id,
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        status: 'pending',
      });
      await appointment.save();

      const res = await request(app)
        .get('/api/donor/appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.appointments).toBeInstanceOf(Array);
      expect(res.body.appointments.length).toBe(1);
    });

    it('should support pagination', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const res = await request(app)
        .get('/api/donor/appointments?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  describe('PUT /api/donor/appointments/:id/cancel', () => {
    it('should cancel appointment successfully', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);

      const appointment = new Appointment({
        donor: donor._id,
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        status: 'pending',
      });
      await appointment.save();

      const res = await request(app)
        .put(`/api/donor/appointments/${appointment._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Personal emergency',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.appointment.status).toBe('cancelled');
    });

    it('should not allow cancelling completed appointment', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);

      const appointment = new Appointment({
        donor: donor._id,
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        scheduledDate: new Date(),
        scheduledTime: '10:00',
        status: 'completed',
      });
      await appointment.save();

      const res = await request(app)
        .put(`/api/donor/appointments/${appointment._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Changed mind',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Cannot cancel completed');
    });
  });

  describe('GET /api/donor/tickets', () => {
    it('should return nearby emergency tickets', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      await createTestDonor(donorUser, {
        location: { type: 'Point', coordinates: [0, 0] },
        personalInfo: { bloodType: 'O+' },
      });
      const token = generateAuthToken(donorUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser, {
        location: { type: 'Point', coordinates: [0.01, 0.01] },
      });

      // Create emergency ticket
      const ticket = new Ticket({
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        quantity: 2,
        urgency: 'critical',
        message: 'Urgent need',
        location: hospital.location,
        status: 'open',
      });
      await ticket.save();

      const res = await request(app)
        .get('/api/donor/tickets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tickets).toBeInstanceOf(Array);
    });

    it('should filter tickets by type', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const res = await request(app)
        .get('/api/donor/tickets?type=blood')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/donor/tickets/:id/respond', () => {
    it('should respond to ticket successfully', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);

      const ticket = new Ticket({
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        quantity: 2,
        urgency: 'critical',
        message: 'Urgent need',
        location: hospital.location,
        status: 'open',
      });
      await ticket.save();

      const res = await request(app)
        .post(`/api/donor/tickets/${ticket._id}/respond`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'I can help, available today',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Response sent');
    });

    it('should not allow responding to closed ticket', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);

      const ticket = new Ticket({
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        quantity: 2,
        urgency: 'critical',
        message: 'Urgent need',
        location: hospital.location,
        status: 'closed',
      });
      await ticket.save();

      const res = await request(app)
        .post(`/api/donor/tickets/${ticket._id}/respond`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'I can help',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('closed or resolved');
    });
  });

  describe('GET /api/donor/donation-history', () => {
    it('should return donation history', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const res = await request(app)
        .get('/api/donor/donation-history')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('donations');
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('PUT /api/donor/preferences', () => {
    it('should update donation preferences', async () => {
      const donorUser = await createTestUser({ role: 'donor' });
      await createTestDonor(donorUser);
      const token = generateAuthToken(donorUser);

      const res = await request(app)
        .put('/api/donor/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bloodDonation: {
            eligible: true,
          },
          organDonation: {
            consent: true,
            organs: [
              { type: 'kidney', consent: true },
              { type: 'liver', consent: true },
            ],
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.preferences.organDonation.consent).toBe(true);
    });
  });
});
