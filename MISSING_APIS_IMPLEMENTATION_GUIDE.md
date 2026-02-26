# 🔴 MISSING API ENDPOINTS & IMPLEMENTATION GUIDE

## Missing Endpoints Summary

**Total Missing: 12-15 endpoints**

---

## 1. 🎯 DONATION MILESTONES & BADGES (4 endpoints)

### Models Needed:
```javascript
// Badge Model
Badge {
  badgeId: String (unique)
  name: String (e.g., "First Donor", "Blood Diamond")
  description: String
  icon: String (URL)
  requirement: {
    type: 'donation_count' | 'donation_volume' | 'consecutive' | 'time_based'
    value: Number (e.g., 1st donation, 10 donations, etc.)
  }
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  reward: {
    points: Number
    description: String
  }
  createdAt: Date
}

// Donor Milestones (add to Donor model)
milestones: [{
  badge: Schema.Types.ObjectId // ref: Badge
  awardedAt: Date
  acknowledged: Boolean
}]

donationPoints: {
  total: Number (default: 0)
  lifetime: Number (default: 0)
  current: Number (default: 0) // reset monthly?
}
```

### APIs to Implement:

#### A. GET /api/donor/badges
**Purpose:** Get all badges earned by donor
**Auth:** Donor only
**Response:**
```json
{
  "badges": [
    {
      "_id": "...",
      "badgeId": "FIRST_DONOR",
      "name": "First Donor",
      "icon": "...",
      "awardedAt": "2025-01-15",
      "description": "Completed your first donation"
    }
  ],
  "totalPoints": 150,
  "nextMilestone": {
    "badge": "10_DONATIONS",
    "name": "Dedicated Donor",
    "progress": "3/10",
    "reward": 50
  }
}
```

#### B. GET /api/donor/milestones
**Purpose:** Get milestone progress
**Auth:** Donor only
**Response:**
```json
{
  "currentLevel": "silver",
  "milestones": [
    { "name": "First Donation", "achieved": true, "date": "2025-01-15" },
    { "name": "5 Donations", "achieved": true, "progress": "5/5" },
    { "name": "10 Donations", "achieved": false, "progress": "7/10" },
    { "name": "50 Donations", "achieved": false, "progress": "7/50" }
  ],
  "statistics": {
    "totalDonations": 7,
    "totalVolumeML": 3500,
    "monthlyDonations": 2,
    "lifetimeDonations": 7
  }
}
```

#### C. GET /api/admin/badges (Admin Dashboard)
**Purpose:** Manage badges system
**Auth:** Admin only
**Query Params:** ?filter=active&sort=reward
**Response:** List of all badges with stats

#### D. POST /api/admin/badges (Create Badge)
**Purpose:** Create new badge
**Auth:** Admin only
**Body:**
```json
{
  "name": "Blood Diamond",
  "description": "50+ donations",
  "requirement": {
    "type": "donation_count",
    "value": 50
  },
  "tier": "platinum",
  "reward": { "points": 500 }
}
```

---

## 2. 🚨 FRAUD DETECTION SYSTEM (3 endpoints)

### Models Needed:
```javascript
// Fraud Rule Model
FraudRule {
  ruleId: String (unique)
  name: String
  description: String
  condition: String (e.g., "same_bank_multiple_requests", "high_frequency_donations")
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'flag' | 'freeze' | 'alert' | 'verify'
  enabled: Boolean
  createdAt: Date
}

// Fraud Alert Model
FraudAlert {
  alertId: String (unique)
  user: ObjectId (ref: User)
  rule: ObjectId (ref: FraudRule)
  type: 'suspicious_activity' | 'duplicate_request' | 'high_frequency' | 'anomaly'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: String
  evidence: { // proof of fraud
    ticketIds: [ObjectId],
    appointmentIds: [ObjectId],
    suspiciousPattern: Object
  }
  status: 'open' | 'investigating' | 'confirmed' | 'false_alarm'
  adminNotes: String
  resolvedBy: ObjectId (ref: User)
  resolvedAt: Date
  autoResolved: Boolean
  createdAt: Date
}
```

### Fraud Detection Rules to Implement:

1. **Duplicate Request Detection**
   - Same blood type requested within 24 hours by same hospital = FLAG

2. **High Frequency Detection**
   - Donor attempting >2 donations per month = FLAG (normal is 1/month)

3. **Location Anomaly**
   - Donation location vastly different from registered address = VERIFY

4. **Repeated Cancellations**
   - >50% cancellation rate in last month = FLAG

5. **Low Match Response Rate**
   - Donor responses to <20% of matching requests = VERIFY

6. **Bank/Payment Anomalies**
   - Multiple refund requests for same appointment = FLAG

### APIs to Implement:

#### A. POST /api/admin/fraud/detect
**Purpose:** Trigger fraud detection scan
**Auth:** Admin only
**Body:**
```json
{
  "scanType": "full" | "recent" | "user_id",
  "userId": "optional_specific_user_id",
  "days": 30
}
```
**Response:**
```json
{
  "scanId": "SCAN_2025_02_21_001",
  "startTime": "2025-02-21T10:00:00Z",
  "status": "completed",
  "alertsFound": 5,
  "alerts": [
    {
      "alertId": "ALERT_001",
      "user": { "name": "John Doe", "email": "john@..." },
      "type": "high_frequency",
      "severity": "high",
      "description": "User made 5 donation requests in 48 hours",
      "evidence": { ... }
    }
  ]
}
```

#### B. GET /api/admin/fraud/alerts
**Purpose:** List all fraud alerts
**Auth:** Admin only
**Query Params:** ?status=open&severity=high&page=1&limit=20
**Response:**
```json
{
  "total": 45,
  "alerts": [ /* alert objects */ ],
  "stats": {
    "openAlerts": 12,
    "highSeverity": 5,
    "investigatingCount": 8
  }
}
```

#### C. PUT /api/admin/fraud/alerts/:alertId
**Purpose:** Resolve fraud alert
**Auth:** Admin only
**Body:**
```json
{
  "status": "confirmed" | "false_alarm" | "investigating",
  "action": "flag_user" | "freeze_user" | "verify_user",
  "notes": "User verified with ID, no fraud detected"
}
```

---

## 3. 🎪 DONATION EVENTS & CAMPAIGNS (5-6 endpoints)

### Models Needed:
```javascript
// Event Model
Event {
  eventId: String (unique)
  name: String (e.g., "Blood Drive - Downtown")
  description: String
  type: 'blood_drive' | 'awareness' | 'recruitment'
  location: {
    type: 'Point',
    coordinates: [lng, lat]
  },
  address: {
    street, city, state, country, zipCode
  },
  hospital: ObjectId (ref: Hospital) // which hospital running the event
  startDate: Date
  endDate: Date
  capacity: Number (max donors)
  registeredDonors: Number
  status: 'planning' | 'live' | 'completed' | 'cancelled'
  registrations: [{
    donor: ObjectId (ref: Donor),
    registeredAt: Date,
    attended: Boolean,
    bloodCollected: Number (ml)
  }],
  incentives: {
    description: String
    rewardPoints: Number
    giftDescription: String
  },
  targetBloodTypes: ['O+', 'O-', ...],
  statistics: {
    totalDonorsRegistered: Number,
    totalDonorsAttended: Number,
    totalBloodCollected: Number,
    successRate: Number (percent)
  },
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}

// Campaign Model
Campaign {
  campaignId: String
  name: String (e.g., "National Blood Donation Drive 2025")
  description: String
  type: 'seasonal' | 'emergency' | 'routine' | 'recruitment'
  bannerImage: String (URL)
  startDate: Date
  endDate: Date
  targetDonors: Number
  targetVolume: Number (liters)
  events: [ObjectId] (ref: Event)
  incentives: { ... },
  statistics: { ... },
  status: 'draft' | 'active' | 'completed',
  createdBy: ObjectId (ref: User)
}
```

### APIs to Implement:

#### A. POST /api/admin/events/create
**Purpose:** Create new donation event
**Auth:** Admin only
**Body:**
```json
{
  "name": "Blood Drive - Downtown Medical Center",
  "description": "Free blood donation drive for all eligible donors",
  "type": "blood_drive",
  "location": { "coordinates": [-74.006, 40.7128] },
  "address": { "street": "123 Main St", "city": "NYC", "state": "NY", "country": "USA", "zipCode": "10001" },
  "hospital": "hospital_id",
  "startDate": "2025-03-15T09:00:00Z",
  "endDate": "2025-03-15T17:00:00Z",
  "capacity": 100,
  "targetBloodTypes": ["O+", "O-", "A+"],
  "incentives": {
    "description": "Free t-shirt & certificate",
    "rewardPoints": 50
  }
}
```

#### B. GET /api/events?filter=nearby&lat=40.7128&lng=-74.006&radius=10
**Purpose:** Get nearby donation events (Public)
**Auth:** Optional (shows more for logged-in users)
**Response:**
```json
{
  "events": [
    {
      "eventId": "EVT_001",
      "name": "Blood Drive - Downtown",
      "startDate": "2025-03-15",
      "location": { ... },
      "spotsAvailable": 23,
      "incentives": { ... },
      "hospital": { "name": "..."  },
      "distance": "2.5 km"
    }
  ]
}
```

#### C. POST /api/donor/events/:eventId/register
**Purpose:** Register donor for event
**Auth:** Donor only
**Response:**
```json
{
  "registered": true,
  "registrationId": "REG_001",
  "event": { ... },
  "confirmationEmail": "sent"
}
```

#### D. GET /api/donor/events/registered
**Purpose:** Get all registered events for donor
**Auth:** Donor only
**Response:**
```json
{
  "registered": [
    {
      "event": { ...event details... },
      "registeredAt": "2025-02-21",
      "reminder": {
        "email": "sent",
        "sms": "pending"
      }
    }
  ]
}
```

#### E. PUT /api/donor/events/:eventId/unregister
**Purpose:** Cancel event registration
**Auth:** Donor only

#### F. GET /api/admin/events
**Purpose:** Manage events (admin dashboard)
**Auth:** Admin only
**Response:** Full event list with statistics

#### G. POST /api/admin/campaigns/create
**Purpose:** Create campaign
**Auth:** Admin only

---

## 4. 💰 INCENTIVE & REWARD SYSTEM (3-4 endpoints)

### Models Needed:
```javascript
// Reward Model
Reward {
  rewardId: String (unique)
  type: 'points' | 'badge' | 'certificate' | 'merchandise',
  name: String,
  description: String,
  redemptionPoints: Number,
  value: Number (if merchandise, what's the price),
  stock: Number (if merchandise),
  expirayDate: Date,
  active: Boolean,
  createdAt: Date
}

// DonorRewards (add to Donor model)
rewards: {
  totalPointsEarned: Number,
  totalPointsRedeemed: Number,
  currentPoints: Number,
  redemptionHistory: [{
    reward: ObjectId (ref: Reward),
    pointsUsed: Number,
    redeemedAt: Date,
    shippingTrackingId: String (if applicable)
  }],
  certificates: [{
    certificateNumber: String,
    type: String (e.g., "100 Donations"),
    issuedAt: Date
  }]
}
```

### APIs to Implement:

#### A. GET /api/donor/rewards
**Purpose:** See available rewards & redemption options
**Auth:** Donor only
**Response:**
```json
{
  "account": {
    "currentPoints": 450,
    "totalEarned": 2000,
    "totalRedeemed": 1550
  },
  "availableRewards": [
    {
      "rewardId": "RWD_001",
      "name": "Free Donation Certificate",
      "description": "Printed certificate for wall",
      "pointsCost": 0,
      "type": "certificate"
    },
    {
      "rewardId": "RWD_002",
      "name": "Red Cross T-Shirt",
      "type": "merchandise",
      "pointsCost": 100,
      "stock": 45
    }
  ]
}
```

#### B. POST /api/donor/rewards/:rewardId/redeem
**Purpose:** Redeem reward with points
**Auth:** Donor only
**Body:**
```json
{
  "quantity": 1,
  "shippingAddress": "optional_for_merchandise"
}
```

#### C. GET /api/admin/rewards
**Purpose:** Manage reward catalog
**Auth:** Admin only

#### D. POST /api/admin/rewards/create
**Purpose:** Create new reward
**Auth:** Admin only

---

## 5. ⚙️ AUTO-MATCH ALGORITHM ENHANCEMENT (1-2 endpoints)

### Algorithm Logic Needed:

**Current:** Simple blood type match  
**Enhanced:** Scoring system

```
Match Score = 
  (Geography Weight × Proximity Score) +
  (Blood Type Weight × Compatibility 0/1) +
  (Time Weight × EligibilityScore) +
  (Reliability Weight × DonorRating) +
  (Urgency Weight × UrgencyImpact)
```

#### A. PUT /api/admin/matching-config
**Purpose:** Configure matching algorithm
**Auth:** Admin only
**Body:**
```json
{
  "weights": {
    "geography": 0.35,
    "bloodType": 0.25,
    "timing": 0.15,
    "reliability": 0.15,
    "urgency": 0.10
  },
  "radius": {
    "default": 25,
    "max": 50,
    "critical": 100
  },
  "minReliabilityScore": 3.5
}
```

#### B. POST /api/donor/tickets/:ticketId/match-status
**Purpose:** Get match status for specific ticket
**Auth:** Donor only
**Response:**
```json
{
  "matchScore": 8.5,
  "matchReason": "4km away, perfect blood type, high reliability",
  "notificationSent": true
}
```

---

## 6. ✨ AVAILABILITY STATUS ENHANCEMENT (1 endpoint)

#### A. PUT /api/donor/availability
**Purpose:** Toggle availability status
**Auth:** Donor only
**Body:**
```json
{
  "available": true,
  "unavailableUntil": null,
  "reason": "on_vacation" | "post_donation_rest" | "medical" | "other"
}
```
**Response:**
```json
{
  "available": true,
  "lastUpdated": "2025-02-21T14:30:00Z",
  "eligibleOn": "2025-03-15"
}
```

---

## API Endpoint Checklist

```
DONATION BADGES & MILESTONES:
☐ GET /api/donor/badges
☐ GET /api/donor/milestones
☐ GET /api/admin/badges
☐ POST /api/admin/badges

FRAUD DETECTION:
☐ POST /api/admin/fraud/detect
☐ GET /api/admin/fraud/alerts
☐ PUT /api/admin/fraud/alerts/:alertId

EVENTS & CAMPAIGNS:
☐ POST /api/admin/events/create
☐ GET /api/events/nearby
☐ POST /api/donor/events/:eventId/register
☐ GET /api/donor/events/registered
☐ PUT /api/donor/events/:eventId/unregister
☐ GET /api/admin/events
☐ POST /api/admin/campaigns/create
☐ GET /api/admin/campaigns

REWARDS & INCENTIVES:
☐ GET /api/donor/rewards
☐ POST /api/donor/rewards/:rewardId/redeem
☐ GET /api/admin/rewards
☐ POST /api/admin/rewards/create

ENHANCED FEATURES:
☐ PUT /api/admin/matching-config
☐ POST /api/donor/tickets/:ticketId/match-status
☐ PUT /api/donor/availability

TOTAL: ~15 new endpoints
```

---

## Frontend Components Needed

```
Donor Components:
☐ DonorBadges.js
☐ DonorMilestones.js
☐ DonorRewards.js
☐ DonorAvailabilityToggle.js
☐ EventNearby.js
☐ EventRegistration.js

Admin Components:
☐ AdminBadges.js
☐ AdminFraudAlerts.js
☐ AdminEvents.js
☐ AdminCampaigns.js
☐ AdminRewards.js
☐ AdminMatchConfig.js
☐ FraudDetectionDashboard.js

Hospital Components:
☐ HospitalEventCreate.js
```

---

**STATUS: Ready for implementation**

Next: Implement these features step-by-step.
