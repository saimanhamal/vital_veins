# Appointment System - Route Integration Guide

## Overview

This guide explains how to integrate the improved appointment routes with the new validation middleware and business logic. All changes maintain **100% backward compatibility** with existing code.

## Files Created/Modified

| File | Purpose | Status |
|------|---------|--------|
| `backend/middleware/appointmentValidation.js` | Comprehensive validation middleware | ✅ NEW |
| `backend/routes/appointments-improved.js` | Enhanced route handlers with validation | ✅ NEW |
| `backend/models/Appointment.js` | Extended with 9 new fields, 9 methods | ✅ UPDATED |
| `backend/models/Donor.js` | Extended with metrics, 4 new methods | ✅ UPDATED |
| `backend/models/Hospital.js` | Extended with capacity fields | ✅ UPDATED |

## New Route Endpoints

### 1. List Appointments (Enhanced)
```http
GET /api/appointments?page=1&limit=10&status=pending&hospital=<id>&type=blood
```
**Improvements:**
- Pagination support
- Status filtering
- Hospital filtering
- Type filtering (blood/organ)

**Response:**
```json
{
  "appointments": [...],
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50,
    "limit": 10
  }
}
```

---

### 2. Get Single Appointment
```http
GET /api/appointments/:appointmentId
```
**Improvements:**
- Full population of donor, hospital, linked ticket info
- Includes all appointment metrics

---

### 3. Get Hospital Available Slots (NEW)
```http
GET /api/appointments/hospital/:hospitalId/available-slots?date=2024-02-15
```
**Purpose:** Show available appointment slots WITH capacity information

**Parameters:**
- `hospitalId` (required) - Hospital ID
- `date` (required) - YYYY-MM-DD format

**Response:**
```json
{
  "date": "2024-02-15T00:00:00.000Z",
  "hospitalId": "6582...",
  "maxDonorsPerSlot": 5,
  "availableSlots": [
    {
      "time": "09:00",
      "available": true,
      "capacity": {
        "max": 5,
        "booked": 2,
        "available": 3
      }
    },
    {
      "time": "10:00",
      "available": false,
      "capacity": {
        "max": 5,
        "booked": 5,
        "available": 0
      }
    }
  ],
  "totalSlots": 8,
  "availableCount": 6
}
```

---

### 4. Get Nearby Hospitals with Available Slots (NEW - Geo-Based)
```http
GET /api/appointments/hospital/nearby/suggestions?longitude=-74.006&latitude=40.7128&radiusKm=15&date=2024-02-15
```
**Purpose:** Find nearby hospitals with available appointment slots

**Authentication:** Required (Donor only)

**Parameters:**
- `longitude`, `latitude` (required) - Donor coordinates
- `radiusKm` (optional) - Search radius in km (default: 15)
- `date` (optional) - Preferred appointment date

**Response:**
```json
{
  "searchRadius": "15 km",
  "searchDate": "2024-02-15T00:00:00.000Z",
  "hospitalsFound": 3,
  "hospitals": [
    {
      "hospital": {
        "_id": "6582...",
        "hospitalName": "Central Blood Bank",
        "address": {...},
        "distance": 5.2  // km
      },
      "workingHours": {...},
      "isOpen": true,
      "availableSlots": [
        {
          "time": "09:00",
          "available": true,
          "capacity": {...}
        }
      ]
    }
  ]
}
```

---

### 5. Book Appointment (IMPROVED)
```http
POST /api/appointments/book
Content-Type: application/json
Authorization: Bearer <token>

{
  "hospitalId": "6582...",
  "type": "blood",
  "bloodType": "O+",
  "scheduledDate": "2024-02-15",
  "scheduledTime": "10:00",
  "notes": "I have a scheduling preference",
  "linkedTicketId": "optional-for-emergency"
}
```

**New Validations:**
1. ✅ Hospital must exist and be approved
2. ✅ Type must be 'blood' or 'organ'
3. ✅ bloodType required if type='blood' (8 valid types)
4. ✅ scheduledDate must be ISO8601, not past, not >90 days future
5. ✅ scheduledTime must be HH:MM format, 9 AM-5 PM
6. ✅ **Donor eligibility check**: donor status, availability, suspension
7. ✅ **90-day donation interval**: donor cannot donate if <90 days since last
8. ✅ **Cancellation flag check**: donor NOT flagged for >3 cancellations
9. ✅ **Slot capacity**: verifies hospital has capacity for this slot
10. ✅ **Working hours**: verifies hospital open at requested time
11. ✅ **Emergency linking**: if linkedTicketId provided, validates it's urgent

**Emergency Auto-Approval Feature:**
- If appointment linked to urgent ticket → auto-approved (status='approved')
- Otherwise → created as pending

**Response:**
```json
{
  "message": "Appointment booked successfully",
  "appointment": {...},
  "emergency": false
}
```

**Error Examples:**
```json
// 90-day interval violation
{
  "message": "Donor ineligible for donation",
  "reason": "Last donation too recent",
  "details": {
    "daysRemaining": 45,
    "nextEligibleDate": "2024-03-15"
  }
}

// Cancellation threshold exceeded
{
  "message": "Donor account flagged for review",
  "reason": "Cancellation pattern detected",
  "details": {
    "cancellationCount": 4,
    "threshold": 3,
    "period": "30 days"
  }
}

// Slot capacity full
{
  "message": "No capacity available for requested slot",
  "slotInfo": {
    "time": "10:00",
    "maxCapacity": 5,
    "currentBookings": 5
  }
}
```

---

### 6. Update Appointment Status (IMPROVED)
```http
PUT /api/appointments/:appointmentId/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "newStatus": "confirmed",
  "reason": "Donor confirmed attendance"
}
```

**Allowed Status Transitions:**
```
pending     → confirmed, cancelled
confirmed   → completed, no_show, cancelled
completed   → verified
no_show     → (terminal)
cancelled   → (terminal)
```

**Access:** Hospital/Admin only

**Response:**
```json
{
  "message": "Appointment status updated to confirmed",
  "appointment": {...},
  "workflow": {
    "from": "pending",
    "to": "confirmed",
    "reason": "Donor confirmed attendance"
  }
}
```

**Real-time Notifications:**
- Donor receives status change notification via Socket.IO

---

### 7. Cancel Appointment (IMPROVED)
```http
PUT /api/appointments/:appointmentId/cancel
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Scheduling conflict"
}
```

**Access:** Donor/Hospital/Admin

**Cancellation Tracking:**
- Records cancellation reason + timestamp
- Tracks donor's cancellations in 30-day rolling window
- Auto-flags donor if >3 cancellations in 30 days

**Response:**
```json
{
  "message": "Appointment cancelled successfully",
  "appointment": {...},
  "cancellationTracking": {
    "cancellationCount": 2,
    "threshold": 3,
    "shouldFlag": false,
    "flagReason": null,
    "period": "30 days"
  },
  "donorFlagged": false
}
```

**Donor Flagging:**
- First cancellation: tracked
- Second cancellation: tracked
- Third cancellation: tracked
- **Fourth cancellation: donor auto-flagged** 
  - Admin notified via Socket.IO
  - Future appointment bookings blocked until admin review

**Real-time Notifications:**
- Other party notified of cancellation
- Admin notified if donor flagged

---

### 8. Get Donor Appointment History (NEW)
```http
GET /api/appointments/donor/:donorId/history
Authorization: Bearer <token>
```

**Access:** Donor (for own history), Admin

**Response:**
```json
{
  "donor": {
    "_id": "6582...",
    "metrics": {
      "totalAppointments": 5,
      "completedAppointments": 3,
      "cancelledAppointments": 2,
      "cancellationRate": 40,
      "recentCancellations": [
        {
          "appointmentId": "...",
          "cancelledAt": "2024-02-10",
          "reason": "medical emergency"
        }
      ],
      "flaggedForReview": false,
      "flaggedReason": null,
      "flaggedAt": null,
      "reviewNotes": ""
    }
  },
  "appointments": [
    {
      "_id": "...",
      "status": "completed",
      "type": "blood",
      "hospital": {"hospitalName": "Central Blood Bank"},
      "createdAt": "2024-02-01"
    }
  ],
  "total": 5,
  "completed": 3,
  "cancelled": 2
}
```

---

## Migration Steps

### Step 1: Verify Models are Extended
Check that these files have been updated:
```bash
# Check Appointment model
grep -n "lastDonationDate\|slotCapacity\|isEmergencyLinked" backend/models/Appointment.js

# Check Donor model  
grep -n "appointmentMetrics\|lastCompletedDonationDate" backend/models/Donor.js

# Check Hospital model
grep -n "appointmentSlotCapacity\|maxDonorsPerDay" backend/models/Hospital.js
```

### Step 2: Register Validation Middleware
In `backend/server.js`, ensure validation middleware is available:
```javascript
// Already imported in appointments-improved.js
const appointmentValidation = require('./middleware/appointmentValidation');
```

### Step 3: Option A - Replace Existing Routes
To replace the existing appointments.js with the improved version:

```bash
# BACKUP EXISTING
cp backend/routes/appointments.js backend/routes/appointments.js.backup

# REPLACE WITH IMPROVED
cp backend/routes/appointments-improved.js backend/routes/appointments.js
```

### Step 3: Option B - Run Both Routes (Safer)
Keep both route files for incremental migration:

```javascript
// In backend/server.js
app.use('/api/appointments', require('./routes/appointments'));  // Old routes
app.use('/api/appointments-v2', require('./routes/appointments-improved'));  // New routes

// Then gradually migrate frontend to use /api/appointments-v2
```

### Step 4: Update Server Registration
Ensure server.js has the routes registered:
```javascript
// backend/server.js
app.use('/api/appointments', require('./routes/appointments'));
```

### Step 5: Test All Endpoints
```bash
# Run the test suite
npm test -- appointments

# Or manual tests
node backend/testAppointmentWorkflow.js
```

---

## Key Improvements Implemented

### 1. Slot Validation with Capacity Limits ✅
```javascript
// Backend does capacity checking before booking
POST /api/appointments/hospital/:id/available-slots
// Returns slots with: { time, available, capacity: {max, booked, available} }

// Prevents overbooking
await Appointment.findAvailableSlotsWithCapacity(hospitalId, date, duration, maxPerSlot);
```

### 2. 90-Day Donation Interval Safety ✅
```javascript
// Automatically checked on POST /api/appointments/book
const eligibility = await donor.checkDonationInterval();
// Returns: { canDonate, daysUntilEligible, lastDonationDate, message }

// Error response if ineligible:
// "Donor ineligible for donation - Last donation too recent: 45 days ago. 
//  Next eligible: 2024-03-15"
```

### 3. Emergency Priority Auto-Approval ✅
```javascript
// POST /api/appointments/book with linkedTicketId
// If ticket is 'urgent' or 'critical':
// - appointment.status = 'approved' (auto-approved)
// - appointment.priority = 'emergency'
// - appointment.isEmergencyLinked = true
// - Response includes: "Emergency appointment booked and auto-approved"
```

### 4. Auto Status Workflow Validation ✅
```javascript
// PUT /api/appointments/:id/status with newStatus
// Validates transitions: pending → confirmed/cancelled only
// Error if invalid: "Cannot move from pending to completed directly"

const validation = appointment.validateStatusTransition(newStatus, reason);
if (!validation.valid) return error(validation.message);
```

### 5. Cancellation Policy & Flagging ✅
```javascript
// PUT /api/appointments/:id/cancel
// Automatically tracks cancellation patterns
// Response includes: { cancellationCount, threshold: 3, shouldFlag, flagReason }
// If >3 in 30 days: donor.appointmentMetrics.flaggedForReview = true
// Admin notified when flagged
// Flagged donors cannot book new appointments until review
```

### 6. Hospital Capacity Management ✅
```javascript
// Hospital model extended:
capacity: {
  appointmentSlotCapacity: 5,        // Max donors per 1-hour slot
  maxDonorsPerDay: 50,               // Max donations per day
  ...
}

// Configurable per-hospital, enforced on all bookings
```

### 7. Geo-Based Hospital Suggestion ✅
```javascript
// GET /api/appointments/hospital/nearby/suggestions?longitude=X&latitude=Y&radiusKm=15
// Uses MongoDB 2dsphere geospatial queries
// Returns nearby hospitals within radiusKm with available slots for requested date
// Results sorted by distance, showing workingHours and currentAvailability
```

---

## Backward Compatibility

All existing endpoints are **preserved**:
- ✅ GET /api/appointments (enhanced with new filters)
- ✅ GET /api/appointments/:id (same response format)
- ✅ POST /api/appointments/book (same parameters, enhanced validation)
- ✅ PUT /api/appointments/:id/status (same parameters, enhanced workflow)
- ✅ PUT /api/appointments/:id/cancel (same parameters, enhanced tracking)

**No breaking changes** - existing client code will continue to work.

---

## Testing Checklist

### Unit Tests
```bash
# Test 90-day interval check
npm test -- checkDonationInterval

# Test slot capacity
npm test -- findAvailableSlotsWithCapacity

# Test status transitions
npm test -- validateStatusTransition

# Test cancellation flagging
npm test -- recordCancellation
```

### Integration Tests
```bash
# Test appointment booking workflow
node backend/testAppointmentWorkflow.js

# Test cancellation and flagging
node backend/testCancellationFlagging.js

# Test emergency auto-approval
node backend/testEmergencyApproval.js

# Test geospatial suggestions
node backend/testGeoSuggestions.js
```

### Manual Testing
```bash
# Start server
npm start

# Test endpoint via curl or Postman
curl http://localhost:5000/api/appointments

# Test new geospatial endpoint
curl "http://localhost:5000/api/appointments/hospital/nearby/suggestions?longitude=-74.006&latitude=40.7128&radiusKm=15"
```

---

## Performance Considerations

### Database Indexes Added
All new queries have supporting indexes:
```javascript
// Appointment model indexes
// - donor + status (for history queries)
// - hospital + scheduledDate (for availability queries)
// - status + priority + scheduledDate (for emergency queries)

// Donor model indexes
// - appointmentMetrics.flaggedForReview (for admin queries)
// - appointmentMetrics.recentCancellations (for pattern analysis)
// - lastCompletedDonationDate (for eligibility checks)
```

### Geospatial Query Optimization
```javascript
// Hospital model requires 2dsphere index on location
Hospital.collection.createIndex({ "address.location": "2dsphere" });

// This enables efficient nearby hospital queries:
// - Queries hospitals within radiusKm of coordinates
// - Returns results sorted by distance
// - No full table scans
```

### Caching Recommendations
For high-traffic deployment:
```javascript
// Cache hospital capacity info (update every 15 minutes)
// Cache available slots (update every 5 minutes)
// Cache donor eligibility (check on every booking)
```

---

## Error Handling

All endpoints return **standardized error responses**:

```json
{
  "message": "Human-readable error message",
  "reason": "Technical reason",
  "details": {
    "field": "value"
  }
}
```

Examples:
```json
// 90-day interval
{"message": "Donor ineligible for donation", "reason": "Last donation too recent", "details": {"daysRemaining": 45}}

// Slot capacity
{"message": "No capacity available for requested slot", "reason": "Slot at capacity", "details": {"current": 5, "max": 5}}

// Donor flagged
{"message": "Donor account flagged for review", "reason": "Cancellation pattern detected", "details": {"count": 4, "threshold": 3}}

// Invalid transition
{"message": "Invalid status transition", "reason": "Cannot move to completed from pending", "currentStatus": "pending", "attemptedStatus": "completed"}
```

---

## Deployment Checklist

- [ ] All 3 models extended (Appointment, Donor, Hospital)
- [ ] appointmentValidation.js created
- [ ] appointments-improved.js created or merged into appointments.js
- [ ] Server.js routes registered
- [ ] MongoDB indexes created
- [ ] All tests passing
- [ ] Frontend updated to use new geospatial endpoint (optional)
- [ ] Google Maps API key configured (optional - for geospatial)
- [ ] Admin dashboard updated for flagged donor review (recommended)
- [ ] Socket.IO events configured for real-time notifications

---

## Support & Debugging

### Check Donor Eligibility
```javascript
const donor = await Donor.findById(donorId);
const eligibility = await donor.checkDonationInterval();
console.log(eligibility);  // { canDonate, daysUntilEligible, lastDonationDate, message }
```

### Check Cancellation Pattern
```javascript
const pattern = await Appointment.checkCancellationPattern(donorId);
console.log(pattern);  // { cancellationCount, shouldFlag, flagReason }
```

### Clear Donor Flag (Admin)
```javascript
const donor = await Donor.findById(donorId);
await donor.clearReviewFlag("Reviewed and approved for continued use");
```

### Check Available Slots
```javascript
const slots = await Appointment.findAvailableSlotsWithCapacity(hospitalId, date, 60, 5);
console.log(slots);  
// [{ time: "09:00", available: true, capacity: {max: 5, booked: 3, available: 2} }]
```

### Find Nearby Hospitals
```javascript
const hospitals = await Appointment.getSuggestedHospitalsNearby(
  [-74.006, 40.7128],  // coordinates
  15,                  // radiusKm
  new Date()           // preferredDate
);
console.log(hospitals);
// [{ hospital, workingHours, isOpen, availableSlots }]
```

---

## Next Steps

1. **Route Integration**: Merge appointments-improved.js logic into appointments.js
2. **Frontend Updates**: Update booking form to show slot capacity and 90-day eligibility
3. **Admin Dashboard**: Create view for managing flagged donors
4. **Notifications**: Configure Socket.IO for real-time appointment updates
5. **Testing**: Run full integration test suite
6. **Deployment**: Push to production with database backups

---

## Questions & Issues

If you encounter issues during integration:

1. **Check MongoDB version**: Requires v4.2+ for 2dsphere geospatial indexes
2. **Verify indexes**: Run `db.appointments.getIndexes()` to confirm indexes
3. **Test middleware**: Each middleware is independently testable
4. **Check logs**: All validations logged with reasons for debugging
5. **Review error responses**: Error messages explain validation failures with context
