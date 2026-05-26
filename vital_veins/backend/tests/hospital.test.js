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

describe('Hospital Routes', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/hospital/dashboard', () => {
    it('should return hospital dashboard data', async () => {
      const user = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/hospital/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('hospital');
      expect(res.body).toHaveProperty('statistics');
      expect(res.body).toHaveProperty('inventory');
      expect(res.body.hospital.name).toBe(hospital.hospitalName);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/hospital/dashboard');

      expect(res.statusCode).toBe(401);
    });

    it('should return 403 for non-hospital users', async () => {
      const user = await createTestUser({ role: 'donor' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/hospital/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/hospital/profile', () => {
    it('should return hospital profile', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/hospital/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.hospital).toBeTruthy();
      expect(res.body.hospital.hospitalName).toBe('Test Hospital');
    });
  });

  describe('PUT /api/hospital/profile', () => {
    it('should update hospital profile', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/hospital/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contact: {
            phone: '+8888888888',
            email: user.email,
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.hospital.contact.phone).toBe('+8888888888');
    });

    it('should not allow changing status directly', async () => {
      const user = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(user, { status: 'approved' });
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/hospital/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'pending',
        });

      expect(res.statusCode).toBe(200);
      // Status should remain unchanged
      const updatedHospital = await require('../models/Hospital').findById(hospital._id);
      expect(updatedHospital.status).toBe('approved');
    });
  });

  describe('GET /api/hospital/inventory', () => {
    it('should return hospital inventory', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/hospital/inventory')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.inventory).toHaveProperty('blood');
      expect(res.body.inventory).toHaveProperty('organs');
    });
  });

  describe('PUT /api/hospital/inventory', () => {
    it('should add blood inventory successfully', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/hospital/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'blood',
          bloodType: 'AB+',
          quantity: 5,
          operation: 'add',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.inventory.blood).toBeTruthy();
    });

    it('should subtract blood inventory', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      // First add some inventory
      await request(app)
        .put('/api/hospital/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'blood',
          bloodType: 'A+',
          quantity: 10,
          operation: 'set',
        });

      // Then subtract
      const res = await request(app)
        .put('/api/hospital/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'blood',
          bloodType: 'A+',
          quantity: 3,
          operation: 'subtract',
        });

      expect(res.statusCode).toBe(200);
      const aPositive = res.body.inventory.blood.find((item) => item.type === 'A+');
      expect(aPositive.quantity).toBe(7);
    });

    it('should reject inventory update without required fields', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/hospital/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'blood',
          // Missing bloodType
          quantity: 5,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Blood type is required');
    });

    it('should add organ inventory successfully', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .put('/api/hospital/inventory')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'organ',
          organType: 'kidney',
          quantity: 1,
          operation: 'add',
        });

      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /api/hospital/tickets', () => {
    it('should create emergency ticket successfully', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .post('/api/hospital/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'blood',
          bloodType: 'O-',
          quantity: 3,
          urgency: 'critical',
          message: 'Emergency surgery patient needs O- blood immediately',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ticket).toBeTruthy();
      expect(res.body.ticket.urgency).toBe('critical');
      expect(res.body).toHaveProperty('notificationsSent');
    });

    it('should create organ donation ticket', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .post('/api/hospital/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'organ',
          organType: 'kidney',
          quantity: 1,
          urgency: 'high',
          message: 'Patient needs kidney transplant',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.ticket.type).toBe('organ');
      expect(res.body.ticket.organType).toBe('kidney');
    });

    it('should reject ticket without required fields', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .post('/api/hospital/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'blood',
          // Missing bloodType, quantity, urgency
          message: 'Need blood',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/hospital/tickets', () => {
    it('should return hospital tickets', async () => {
      const user = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(user);
      const token = generateAuthToken(user);

      // Create a ticket
      const ticket = new Ticket({
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'A+',
        quantity: 2,
        urgency: 'high',
        message: 'Need blood',
        location: hospital.location,
        status: 'open',
      });
      await ticket.save();

      const res = await request(app)
        .get('/api/hospital/tickets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.tickets).toBeInstanceOf(Array);
      expect(res.body.tickets.length).toBe(1);
    });

    it('should support filtering by status', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/hospital/tickets?status=open')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it('should support pagination', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/hospital/tickets?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pagination');
    });
  });

  describe('GET /api/hospital/appointments', () => {
    it('should return hospital appointments', async () => {
      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);
      const token = generateAuthToken(hospitalUser);

      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);

      // Create appointment
      const appointment = new Appointment({
        donor: donor._id,
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        scheduledDate: new Date(),
        scheduledTime: '14:00',
        status: 'pending',
      });
      await appointment.save();

      const res = await request(app)
        .get('/api/hospital/appointments')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.appointments).toBeInstanceOf(Array);
      expect(res.body.appointments.length).toBe(1);
    });

    it('should filter appointments by status', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/hospital/appointments?status=confirmed')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it('should filter appointments by date', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/hospital/appointments?date=${today}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });
  });

  describe('PUT /api/hospital/appointments/:id/confirm', () => {
    it('should confirm appointment successfully', async () => {
      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);
      const token = generateAuthToken(hospitalUser);

      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);

      const appointment = new Appointment({
        donor: donor._id,
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        scheduledDate: new Date(),
        scheduledTime: '14:00',
        status: 'pending',
      });
      await appointment.save();

      const res = await request(app)
        .put(`/api/hospital/appointments/${appointment._id}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'Confirmed for tomorrow',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.appointment.status).toBe('confirmed');
    });

    it('should return 404 for non-existent appointment', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/hospital/appointments/${fakeId}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          notes: 'Confirmed',
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/hospital/appointments/:id/cancel', () => {
    it('should cancel appointment successfully', async () => {
      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);
      const token = generateAuthToken(hospitalUser);

      const donorUser = await createTestUser({ role: 'donor' });
      const donor = await createTestDonor(donorUser);

      const appointment = new Appointment({
        donor: donor._id,
        hospital: hospital._id,
        type: 'blood',
        bloodType: 'O+',
        scheduledDate: new Date(),
        scheduledTime: '14:00',
        status: 'pending',
      });
      await appointment.save();

      const res = await request(app)
        .put(`/api/hospital/appointments/${appointment._id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Hospital staff shortage',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.appointment.status).toBe('cancelled');
      expect(res.body.appointment.cancellation.reason).toBe('Hospital staff shortage');
    });
  });

  describe('GET /api/hospital/donors', () => {
    it('should return donors who donated to hospital', async () => {
      const hospitalUser = await createTestUser({ role: 'hospital' });
      const hospital = await createTestHospital(hospitalUser);
      const token = generateAuthToken(hospitalUser);

      const donorUser = await createTestUser({ role: 'donor' });
      await createTestDonor(donorUser, {
        donationHistory: [
          {
            hospital: hospital._id,
            type: 'blood',
            bloodType: 'O+',
            date: new Date(),
          },
        ],
      });

      const res = await request(app)
        .get('/api/hospital/donors')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.donors).toBeInstanceOf(Array);
    });

    it('should support pagination for donors', async () => {
      const user = await createTestUser({ role: 'hospital' });
      await createTestHospital(user);
      const token = generateAuthToken(user);

      const res = await request(app)
        .get('/api/hospital/donors?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pagination');
    });
  });
});
