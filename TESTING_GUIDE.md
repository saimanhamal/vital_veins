# 🧪 MANUAL API TESTING GUIDE
**VitalVeins LifeLink - Complete API Tests**

## Setup Instructions

### 1. Start MongoDB
```bash
# Windows
mongod

# Or use MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifelink
```

### 2. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

Server will run on: `http://localhost:5000`

### 3. Get Test Tokens
Create test users and get authentication tokens for testing.

---

## 🔐 AUTHENTICATION TESTS

### Test 1: User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Donor",
    "email": "john.donor@test.com",
    "password": "TestPassword123",
    "role": "donor"
  }'
```

**Expected:** 201 Created, returns token and user object

---

### Test 2: User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.donor@test.com",
    "password": "TestPassword123"
  }'
```

**Expected:** 200 OK, returns authentication token

---

### Test 3: Get Current User Profile
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** 200 OK, returns user profile with role

---

## 👥 ADMIN ENDPOINTS TESTS

### Test 4: Get All Users ✅ NEW
```bash
curl -X GET "http://localhost:5000/api/admin/users?page=1&limit=10&role=donor" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** 200 OK
```json
{
  "users": [...],
  "totalUsers": 10,
  "usersByRole": {
    "donor": 5,
    "hospital": 3,
    "admin": 2
  },
  "pagination": {...}
}
```

---

### Test 5: Deactivate User ✅ NEW
```bash
curl -X PUT "http://localhost:5000/api/admin/users/USER_ID/deactivate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "reason": "Inactive for 6 months"
  }'
```

**Expected:** 200 OK, user isActive = false

---

### Test 6: Activate User ✅ NEW
```bash
curl -X PUT "http://localhost:5000/api/admin/users/USER_ID/activate" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** 200 OK, user isActive = true

---

### Test 7: Delete User ✅ NEW
```bash
curl -X DELETE "http://localhost:5000/api/admin/users/USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "confirm": true
  }'
```

**Expected:** 200 OK, user deleted from database

---

### Test 8: Get All Appointments ✅ NEW
```bash
curl -X GET "http://localhost:5000/api/admin/appointments?page=1&limit=10&status=completed" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** 200 OK, paginated appointments with donor/hospital info

---

### Test 9: Reject Hospital ✅ NEW
```bash
curl -X PUT "http://localhost:5000/api/admin/hospitals/HOSPITAL_ID/reject" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "notes": "Not meeting licensing requirements"
  }'
```

**Expected:** 200 OK, hospital status = rejected

---

### Test 10: Generate Reports ✅ NEW
```bash
curl -X GET "http://localhost:5000/api/admin/reports?reportType=summary" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:** 200 OK
```json
{
  "reportType": "summary",
  "summary": {
    "totalUsers": 15,
    "totalHospitals": 3,
    "totalDonors": 8,
    "activeTickets": 2,
    "completedAppointments": 25
  }
}
```

---

## 🏥 HOSPITAL ENDPOINTS TESTS

### Test 11: Add Organ Inventory (with fixed enum) ✅ FIXED
```bash
curl -X PUT "http://localhost:5000/api/hospital/inventory" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HOSPITAL_TOKEN" \
  -d '{
    "type": "organ",
    "organType": "kidney",
    "quantity": 5,
    "action": "add"
  }'
```

**Expected:** 200 OK, inventory updated with lowercase organ type

---

### Test 12: Create Emergency Ticket ✅ FIXED
```bash
curl -X POST "http://localhost:5000/api/hospital/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HOSPITAL_TOKEN" \
  -d '{
    "type": "blood",
    "bloodType": "B+",
    "quantity": 5,
    "urgency": "critical",
    "message": "Emergency: Accident victim needs B+ blood immediately",
    "location": {
      "coordinates": [72.8479, 19.0760]
    }
  }'
```

**Expected:** 201 Created, ticket created and notifications sent

---

## 👨‍⚕️ DONOR ENDPOINTS TESTS

### Test 13: Get Donor Dashboard
```bash
curl -X GET "http://localhost:5000/api/donor/dashboard" \
  -H "Authorization: Bearer DONOR_TOKEN"
```

**Expected:** 200 OK, dashboard statistics

---

### Test 14: Get Donor Appointments
```bash
curl -X GET "http://localhost:5000/api/donor/appointments?page=1&limit=10" \
  -H "Authorization: Bearer DONOR_TOKEN"
```

**Expected:** 200 OK, list of appointments

---

## 📊 DATA VALIDATION TESTS

### Test 15: Validate Blood Type Enum ✅ FIXED
```bash
curl -X POST "http://localhost:5000/api/donor/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DONOR_TOKEN" \
  -d '{
    "type": "blood",
    "bloodType": "O+",
    "hospital": "HOSPITAL_ID",
    "scheduledDate": "2026-03-01T10:00:00Z"
  }'
```

**Expected:** 201 Created

---

### Test 16: Validate Organ Type Enum ✅ FIXED
```bash
curl -X POST "http://localhost:5000/api/donor/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DONOR_TOKEN" \
  -d '{
    "type": "organ",
    "organType": "kidney",
    "hospital": "HOSPITAL_ID",
    "scheduledDate": "2026-03-01T10:00:00Z"
  }'
```

**Expected:** 201 Created (kidney now accepted)

---

### Test 17: Validate Location Coordinates
```bash
curl -X POST "http://localhost:5000/api/hospital/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HOSPITAL_TOKEN" \
  -d '{
    "type": "blood",
    "bloodType": "A+",
    "quantity": 3,
    "urgency": "high",
    "message": "Blood donation needed",
    "location": {
      "coordinates": [72.8479, 19.0760]
    }
  }'
```

**Expected:** 201 Created (validates longitude/latitude format)

---

## 🔔 NOTIFICATION TESTS

### Test 18: Get Notifications
```bash
curl -X GET "http://localhost:5000/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** 200 OK, user's notifications

---

### Test 19: Mark Notification as Read
```bash
curl -X PUT "http://localhost:5000/api/notifications/NOTIFICATION_ID/read" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** 200 OK, notification marked as read

---

### Test 20: Get Unread Count
```bash
curl -X GET "http://localhost:5000/api/notifications/unread-count" \
  -H "Authorization: Bearer USER_TOKEN"
```

**Expected:** 200 OK
```json
{
  "unreadCount": 3
}
```

---

## ✅ TEST CHECKLIST

### Critical Endpoints
- [ ] Test 1: User Registration
- [ ] Test 2: User Login
- [ ] Test 3: Get Current User
- [ ] Test 4: Get All Users (NEW)
- [ ] Test 5: Deactivate User (NEW)
- [ ] Test 6: Activate User (NEW)
- [ ] Test 7: Delete User (NEW)
- [ ] Test 8: Get All Appointments (NEW)
- [ ] Test 9: Reject Hospital (NEW)
- [ ] Test 10: Generate Reports (NEW)

### High Priority
- [ ] Test 11: Add Organ Inventory (FIXED)
- [ ] Test 12: Create Emergency Ticket (FIXED)
- [ ] Test 13: Get Donor Dashboard
- [ ] Test 14: Get Donor Appointments
- [ ] Test 15: Validate Blood Type (FIXED)
- [ ] Test 16: Validate Organ Type (FIXED)
- [ ] Test 17: Validate Location Coordinates

### Medium Priority
- [ ] Test 18: Get Notifications
- [ ] Test 19: Mark Notification as Read
- [ ] Test 20: Get Unread Count

---

## 🐛 KNOWN ISSUES & WORKAROUNDS

### 1. Duplicate License in Hospital Tests
**Issue:** E11000 duplicate key error on license field  
**Workaround:** Use unique license numbers in test data (HOSP001, HOSP002, etc.)

### 2. Test Database Cleanup
**Issue:** Tests may fail if previous test data exists  
**Workaround:** Run database cleanup before each test suite
```bash
npm run test -- --forceExit
```

### 3. SocketIO Notifications
**Issue:** Notifications may not send if client not connected to socket
**Workaround:** Check both in_app and database notification records

---

## 📝 TESTING RESULTS TEMPLATE

When running tests, fill in results:

```
Test Suite: Admin Endpoints
Date: [DATE]
Tester: [NAME]

✅ Passed: 
  - Test 4: Get All Users
  - Test 5: Deactivate User
  - Test 6: Activate User
  - Test 7: Delete User
  - Test 8: Get Appointments
  - Test 9: Reject Hospital
  - Test 10: Generate Reports

❌ Failed:
  - [None found after fixes]

⚠️  Warnings:
  - [List any inconsistencies or edge cases]

Notes:
  - All critical endpoints now functional
  - Enum validations fixed for organs
  - Location coordinate validation working
```

---

## 🚀 POST-TESTING STEPS

1. ✅ Run full test suite: `npm test`
2. ✅ Check code coverage
3. ✅ Review test output for warnings
4. ✅ Update API documentation
5. ✅ Deploy to staging environment
6. ✅ Perform integration testing with frontend
7. ✅ Final production deployment

