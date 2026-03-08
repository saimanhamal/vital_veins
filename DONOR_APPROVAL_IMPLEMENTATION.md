# ✅ Donor Verification Workflow - Implementation Complete

## Overview
When an admin accepts a pending donor, the system:
1. Creates a Donor profile in the database
2. Sets `verified: true` on the User
3. Allows the donor to login and access all donor functions

---

## Architecture

### User States
- **Pending Donor**: `User` record with `role: 'donor'` and `verified: false` (NOT in Donor DB)
- **Active Donor**: `User` with `verified: true` + `Donor` profile in database

### Single Source of Truth
- `User.verified` boolean field determines donor approval status
- Donor profiles are created ONLY when admin approves

---

## Implementation Details

### 1. Registration (No Donor Profile Created)
**File**: `backend/routes/auth.js`

```javascript
// When role === 'donor':
// - Create User with verified: false
// - DO NOT create Donor profile yet
console.log('✅ Donor user created with verified: false. Donor profile will be created upon admin approval.');
```

### 2. Login Blocking for Pending Donors
**File**: `backend/routes/auth.js` (Lines 267-275)

```javascript
// Check if donor is pending
if (user.role === 'donor' && !user.verified) {
  return res.status(403).json({
    message: 'Your account is under verification. Admin will review your profile soon.'
  });
}
```

### 3. Admin Views Pending Donors
**File**: `backend/routes/admin.js` (Lines 265-353)

GET `/api/admin/donors` returns:
- **Pending users**: Unverified Users with role='donor' (not in Donor DB)
- **Active donors**: Verified donors from Donor collection
- All formatted as donor objects with status ('pending' or 'active')

### 4. Admin Approves Donor
**File**: `backend/routes/admin.js` (Lines 356-445)

POST `/api/admin/donors/:id/approve`
1. Get the pending User
2. Create Donor profile with properly formatted name (handles single-word names)
3. Set `User.verified = true`
4. Send notification to donor

Key fix for single-word names:
```javascript
const nameParts = (user.name || 'User').split(' ').filter(p => p.trim());
const firstName = nameParts[0] || 'Donor';
const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';
```

### 5. Admin Rejects Donor
**File**: `backend/routes/admin.js` (Lines 447-487)

POST `/api/admin/donors/:id/reject`
- Keeps user as unverified (doesn't create Donor profile)
- Sends rejection notification

### 6. Frontend - Admin Dashboard
**File**: `frontend/src/pages/Admin/AdminDonors.js`

Updated mutation to call appropriate endpoint:
```javascript
const updateDonorMutation = useMutation(
  ({ id, status, notes }) => {
    if (status === 'active') return adminAPI.approveDonor(id);      // For pending
    if (status === 'inactive') return adminAPI.rejectDonor(id, { reason: notes }); // For pending
    return adminAPI.updateDonorStatus(id, { status, notes });      // For active donors
  }
);
```

### 7. Frontend - API Service
**File**: `frontend/src/services/api.js`

New endpoints:
```javascript
approveDonor: (id) => api.post(`/api/admin/donors/${id}/approve`),
rejectDonor: (id, data) => api.post(`/api/admin/donors/${id}/reject`, data),
```

---

## Complete Workflow

### 1. New Donor Signs Up
- User created with `verified: false`
- "Verification Underway" modal shown
- **Not in Donor DB yet**

### 2. Pending Donor Cannot Login
- Login endpoint checks `verified` field
- Returns: "Your account is under verification..."
- Status code: 403

### 3. Admin Views Pending Donors
- Dashboard tab shows pending donors (unverified users)
- Status displayed as "pending"
- `isPendingSignup: true` flag

### 4. Admin Clicks "Accept"
- Frontend calls `/api/admin/donors/:id/approve`
- Backend:
  - Creates Donor profile
  - Sets `verified: true`
  - Sends approval notification

### 5. Approved Donor Can Login
- `verified: true` check passes
- Donor receives JWT token
- Can access donor dashboard and all functions

---

## Testing

**Existing Test Donor**:
- Email: `kk123@gmail.com`
- Status: Pending (verified: false, not in Donor DB)

**Admin Account**:
- Email: `admin@vitalveins.com`
- Password: `Admin123`

**Test Flow**:
1. Admin logs in
2. Views donors list → sees pending donor
3. Clicks "Accept"
4. Donor profile created
5. Donor can now login

---

## Key Features

✅ Single source of truth (User.verified boolean)
✅ Pending donors blocked from login
✅ Admin can view all pending registrations
✅ Admin approval creates Donor profile
✅ Approved donors immediately gain access
✅ Handles single-word usernames correctly
✅ Notification system integrated
✅ Proper error handling and logging

---

## Files Modified

1. `backend/routes/auth.js` - Removed Donor creation at signup, added login blocking
2. `backend/routes/admin.js` - Updated donors endpoint, added approve/reject endpoints
3. `frontend/src/services/api.js` - Added approveDonor and rejectDonor methods
4. `frontend/src/pages/Admin/AdminDonors.js` - Updated mutation to call correct endpoints

---

## Database State

### User Collection
- `admin@vitalveins.com`: role='admin', verified=true
- `kk123@gmail.com`: role='donor', verified=false (pending)

### Donor Collection  
- Only created when admin approves (verified=true)
- Contains full profile (personalInfo, contact, address, etc.)

---

## Status: ✅ COMPLETE

The donor verification workflow is fully implemented and ready for testing.
When an admin accepts a pending user, they are registered as a donor and can immediately access all donor functions.
