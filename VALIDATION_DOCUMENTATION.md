# Appointment Management - Validation Documentation

## Overview
Comprehensive validation has been implemented for appointment management features, including:
- No-show marking by administrators
- Appointment cancellation (both admin and donor)
- Input validation and error handling
- Business logic validation
- Time-based constraints

---

## 1. Backend Validation Middleware

### A. Mark No-Show Validation (`validateMarkNoShow`)

**Location**: `backend/middleware/appointmentValidation.js`

**Validates**:
- ✅ Appointment exists and is found by ID
- ✅ Reason field (if provided):
  - Must be 5-500 characters
  - Must be a string
- ✅ Appointment status must be:
  - `pending` OR `confirmed` (cannot mark completed, cancelled, or no_show)
- ✅ Appointment time must have passed (past appointment only)
  - Prevents marking future appointments
  - Returns minutes remaining if future

**Request Body**:
```json
{
  "reason": "Optional reason, 5-500 characters"
}
```

**Error Responses**:
```json
{
  "message": "Validation failed",
  "errors": [{ "field": "reason", "message": "..." }]
}
```

---

### B. Admin Cancel Validation (`validateAdminCancelAppointment`)

**Location**: `backend/middleware/appointmentValidation.js`

**Validates**:
- ✅ Appointment exists and is found by ID
- ✅ Reason field (if provided):
  - Must be 5-500 characters
  - Must be a string
- ✅ Appointment status must be one of:
  - `pending` OR `confirmed` OR `approved`
  - Cannot cancel: completed, cancelled, or no_show
- ✅ Authorization: User must be admin

**Request Body**:
```json
{
  "reason": "Optional reason, 5-500 characters"
}
```

**Error Responses**:
```json
{
  "message": "Cannot cancel completed appointment",
  "currentStatus": "completed",
  "allowedStatuses": ["pending", "confirmed", "approved"]
}
```

---

### C. Donor Cancel Validation (`validateDonorCancelAppointment`)

**Location**: `backend/middleware/appointmentValidation.js`

**Validates**:
- ✅ Appointment exists and is found by ID
- ✅ Reason field (if provided):
  - Must be 5-500 characters
  - Must be a string
- ✅ Authorization: Donor must own the appointment
- ✅ Appointment status must be:
  - `pending` OR `confirmed` only
- ✅ Appointment must be in the future
  - Cannot cancel past appointments
- ✅ Cancellation lead time: minimum 24 hours
  - Cannot cancel within 24 hours of appointment
  - Returns hours remaining and minimum cancellation time

**Request Body**:
```json
{
  "reason": "Optional reason, 5-500 characters"
}
```

**Error Responses**:
```json
{
  "message": "Cannot cancel appointment within 24 hours",
  "requiredLeadTime": "24 hours",
  "hoursRemaining": 12,
  "minCancellationTime": "2026-03-08T10:00:00Z"
}
```

---

## 2. Frontend Validation (Client-Side)

### Location: `frontend/src/pages/Admin/AdminAppointments.js`

**Validates in Modal**:

#### No-Show Action:
- ✅ Appointment selected (not null)
- ✅ Reason length: 5-500 characters if provided
- ✅ Appointment time has passed
  - Prevents marking future appointments
- ✅ Empty reason uses default: "Donor did not show up"

#### Cancel Action:
- ✅ Appointment selected (not null)
- ✅ Reason length: 5-500 characters if provided
- ✅ Appointment status is cancellable (pending/confirmed/approved)
- ✅ Empty reason uses default: "Cancelled by administrator"

**Visual Feedback**:
- Real-time character counter (max 500)
- Character count validation message
- Shows "Reason must be at least 5 characters" warning
- Disables submit button when validation fails
- Info box explaining constraints

---

## 3. Route-Level Validation

### Admin No-Show Endpoint
```
PUT /api/admin/appointments/:id/mark-no-show
```

**Middleware Chain**:
1. `authenticate` - User must be logged in
2. `authorize('admin')` - Must have admin role
3. `validateObjectId('id')` - Valid MongoDB ID format
4. `validateMarkNoShow` - Business logic validation

---

### Admin Cancel Endpoint
```
PUT /api/admin/appointments/:id/cancel-admin
```

**Middleware Chain**:
1. `authenticate` - User must be logged in
2. `authorize('admin')` - Must have admin role
3. `validateObjectId('id')` - Valid MongoDB ID format
4. `validateAdminCancelAppointment` - Business logic validation

---

### Donor Cancel Endpoint
```
PUT /api/appointments/:id/cancel
```

**Middleware Chain**:
1. `authenticate` - User must be logged in
2. `validateObjectId('id')` - Valid MongoDB ID format
3. `validateDonorCancelAppointment` - Business logic validation (includes donor auth check)

---

## 4. Error Handling Examples

### Example 1: Invalid Appointment ID
```json
{
  "message": "Appointment not found",
  "appointmentId": "invalid-id"
}
```

### Example 2: Future Appointment (No-Show)
```json
{
  "message": "Cannot mark future appointments as no-show",
  "appointmentTime": "2026-03-10T14:00:00Z",
  "currentTime": "2026-03-07T10:00:00Z",
  "minutesUntilAppointment": 4320
}
```

### Example 3: Invalid Status
```json
{
  "message": "Cannot mark completed appointment as no-show",
  "currentStatus": "completed",
  "allowedStatuses": ["pending", "confirmed"]
}
```

### Example 4: Insufficient Cancellation Lead Time
```json
{
  "message": "Cannot cancel appointment within 24 hours of scheduled time",
  "requiredLeadTime": "24 hours",
  "hoursRemaining": 8,
  "minCancellationTime": "2026-03-08T10:00:00Z"
}
```

### Example 5: Authorization Error
```json
{
  "message": "Not authorized to cancel this appointment",
  "appointmentId": "507f1f77bcf86cd799439011"
}
```

---

## 5. Validation Rules Summary

| Field | Min | Max | Required | Default |
|-------|-----|-----|----------|---------|
| `appointmentId` | - | - | Yes | - |
| `reason` | 5 chars | 500 chars | No | Auto-generated |
| `appointment.status` | - | - | pending/confirmed | - |
| `cancellation.leadTime` | 24 hours | - | Donors only | - |

---

## 6. Response Validation

All responses include:
- ✅ Clear error messages
- ✅ Error field indicators (if validation errors)
- ✅ Current state information
- ✅ Allowed options/states
- ✅ Helpful guidance

---

## 7. Testing Checklist

- [ ] Mark no-show with valid appointment (past time)
- [ ] Attempt mark no-show on future appointment (should fail)
- [ ] Cancel with reason 4 characters (should fail)
- [ ] Cancel with reason 500+ characters (should fail)
- [ ] Donor cannot cancel within 24 hours (should fail)
- [ ] Donor cannot cancel past appointment (should fail)
- [ ] Admin can cancel any cancellable appointment
- [ ] Invalid appointment ID returns 404
- [ ] Unauthorized user gets 403 error
- [ ] Character counter works in modal
- [ ] Submit button disables on validation fail

---

## 8. Key Differences Between Validations

### No-Show vs Admin Cancel

| Feature | No-Show | Admin Cancel |
|---------|---------|--------------|
| Allowed by | Admin only | Admin only |
| Allowed statuses | pending, confirmed | pending, confirmed, approved |
| Time requirement | Must be past | Any time |
| Lead time | N/A | N/A |
| Notification | Both parties | Both parties |
| Track metrics | Donor flagging | Audit trail only |

### Admin Cancel vs Donor Cancel

| Feature | Admin | Donor |
|---------|-------|-------|
| Allowed by | Admin | Donor (own only) |
| Allowed statuses | pending, confirmed, approved | pending, confirmed |
| Time requirement | Any | Future only (24h lead) |
| Lead time | N/A | 24 hours minimum |
| Reason required | Optional | Optional |
| Notifications | Both parties | Both parties |

---

## 9. Security Measures

✅ **Authorization Checks**:
- Role-based validation (admin vs donor)
- Ownership validation (donor can only cancel own appointments)

✅ **Input Sanitization**:
- String trimming
- Length validation
- Character limits

✅ **Business Logic**:
- Status transition validation
- Time-based constraints
- Availability checks

✅ **Audit Trail**:
- Cancellation recorded with timestamp
- Reason logged
- Cancelled by tracked

---

## 10. API Response Codes

| Code | Scenario |
|------|----------|
| 200 | Success |
| 400 | Validation failed / Invalid status |
| 403 | Not authorized / Forbidden action |
| 404 | Appointment not found |
| 500 | Server error |

---

**Documentation Updated**: March 7, 2026  
**Status**: ✅ COMPLETE
