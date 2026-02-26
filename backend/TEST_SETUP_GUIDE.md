# LifeLink Backend Testing Guide

## 🎯 Test Infrastructure Setup Complete

### ✅ What Has Been Installed
- **Jest**: Testing framework
- **Supertest**: HTTP testing library
- **mongodb-memory-server**: In-memory MongoDB for testing
- **cross-env**: Cross-platform environment variables

### 📁 Test Files Created

```
backend/
├── tests/
│   ├── helpers/
│   │   ├── testSetup.js      # MongoDB test setup utilities
│   │   └── testData.js        # Test data factories
│   ├── auth.test.js           # Authentication route tests (29 tests)
│   ├── donor.test.js          # Donor functionality tests (25 tests)
│   ├── hospital.test.js       # Hospital functionality tests (25 tests)
│   ├── admin.test.js          # Admin functionality tests (25 tests)
│   ├── notification.test.js   # Notification system tests (20 tests)
│   └── health.test.js         # Health check & basic tests (11 tests)
├── jest.config.js             # Jest configuration
└── .env.test                  # Test environment variables
```

**Total Test Cases**: 135 tests covering all major API endpoints

### 🔧 Configuration Files

#### `jest.config.js`
```javascript
- Test environment: node
- Test timeout: 30 seconds
- Coverage thresholds: 70%+ for statements, lines, functions
- Verbose output enabled
```

#### `package.json` Scripts Added
```json
"test": "cross-env NODE_ENV=test jest --runInBand --detectOpenHandles"
"test:watch": "cross-env NODE_ENV=test jest --watch --runInBand"
"test:coverage": "cross-env NODE_ENV=test jest --coverage --runInBand"
"test:verbose": "cross-env NODE_ENV=test jest --verbose --runInBand"
```

### 📋 Test Coverage

#### **Authentication Tests** (`auth.test.js`)
- ✅ User registration (donor, hospital, admin)
- ✅ Login with valid/invalid credentials
- ✅ Profile retrieval and updates
- ✅ Password change functionality
- ✅ Email verification
- ✅ Logout functionality
- ✅ Role-based access checks

#### **Donor Tests** (`donor.test.js`)
- ✅ Dashboard data retrieval
- ✅ Profile management
- ✅ Hospital search (nearby)
- ✅ Appointment booking and cancellation
- ✅ Emergency ticket viewing and response
- ✅ Donation history
- ✅ Preference updates
- ✅ Eligibility validation

#### **Hospital Tests** (`hospital.test.js`)
- ✅ Dashboard statistics
- ✅ Profile management
- ✅ Inventory management (blood & organs)
- ✅ Emergency ticket creation
- ✅ Appointment handling (confirm/cancel)
- ✅ Donor relationship tracking
- ✅ Filtering and pagination

#### **Admin Tests** (`admin.test.js`)
- ✅ System analytics and dashboard
- ✅ Hospital approval/rejection
- ✅ User management (activate/deactivate)
- ✅ Donor oversight
- ✅ Ticket monitoring
- ✅ Appointment oversight
- ✅ Broadcasting notifications
- ✅ Report generation

#### **Notification Tests** (`notification.test.js`)
- ✅ Notification creation and delivery
- ✅ Mark as read functionality
- ✅ Bulk operations
- ✅ Filtering (type, priority, category)
- ✅ Socket.IO real-time events
- ✅ Notification preferences
- ✅ Expiry handling

#### **Health & System Tests** (`health.test.js`)
- ✅ API health check endpoint
- ✅ 404 error handling
- ✅ CORS configuration
- ✅ Security headers
- ✅ Rate limiting
- ✅ JSON parsing
- ✅ Error middleware

### 🚀 Running Tests

#### Run All Tests
```bash
npm test
```

#### Run Specific Test File
```bash
npm test -- tests/auth.test.js
npm test -- tests/donor.test.js
npm test -- tests/hospital.test.js
```

#### Run Tests in Watch Mode
```bash
npm run test:watch
```

#### Run Tests with Coverage Report
```bash
npm run test:coverage
```

#### Run Verbose Tests
```bash
npm run test:verbose
```

### 🔍 Test Helpers & Utilities

#### `testSetup.js`
- `connect()`: Connects to in-memory MongoDB
- `closeDatabase()`: Closes connection and stops MongoDB server
- `clearDatabase()`: Clears all collections between tests

#### `testData.js`
- `createTestUser()`: Creates a test user (any role)
- `createTestDonor()`: Creates donor with profile
- `createTestHospital()`: Creates hospital with profile
- `createTestAdmin()`: Creates admin user
- `generateAuthToken()`: Generates JWT token for testing

### 📊 Test Structure

Each test file follows this structure:
```javascript
describe('Route Group', () => {
  beforeAll(async () => {
    // Connect to test database
  });

  afterEach(async () => {
    // Clear database after each test
  });

  afterAll(async () => {
    // Close database connection
  });

  describe('GET /api/endpoint', () => {
    it('should do something', async () => {
      // Test implementation
    });
  });
});
```

### 🛠️ Troubleshooting

#### Issue: Tests Timeout
**Solution**: Increase timeout in `jest.config.js` or specific test:
```javascript
jest.setTimeout(60000); // 60 seconds
```

#### Issue: MongoDB Connection Errors
**Solution**: Ensure mongodb-memory-server is properly installed:
```bash
npm install --save-dev mongodb-memory-server
```

#### Issue: Port Already in Use
**Solution**: Tests run with NODE_ENV=test and don't start the server automatically

#### Issue: Validation Errors
**Solution**: Ensure test data matches validation rules:
- Passwords must be 6+ characters with uppercase, lowercase, and number
- Emails must be valid format
- Required fields must be present

### 📝 Password Requirements for Tests
All test passwords must meet these criteria:
- Minimum 6 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)

**Example valid passwords**:
- `Password123`
- `TestUser123`
- `Admin123`

### 🎯 Test Data Examples

#### Creating a Test Donor
```javascript
const user = await createTestUser({ role: 'donor' });
const donor = await createTestDonor(user, {
  personalInfo: { bloodType: 'O+' },
  location: { type: 'Point', coordinates: [0, 0] }
});
```

#### Creating a Test Hospital
```javascript
const user = await createTestUser({ role: 'hospital' });
const hospital = await createTestHospital(user, {
  status: 'approved',
  location: { type: 'Point', coordinates: [0, 0] }
});
```

#### Making Authenticated Requests
```javascript
const user = await createTestUser();
const token = generateAuthToken(user);

const res = await request(app)
  .get('/api/endpoint')
  .set('Authorization', `Bearer ${token}`);
```

### 🔐 Security Testing
Tests include security checks for:
- JWT authentication
- Role-based authorization
- Input validation
- SQL injection prevention (via Mongoose)
- XSS protection (via helmet)
- Rate limiting
- CORS configuration

### 📈 Performance Testing (Optional)

#### Using Autocannon for Load Testing
```bash
npm install -g autocannon

# Test health endpoint
autocannon -c 50 -d 15 http://localhost:5000/api/health

# Test hospital requests
autocannon -c 50 -d 15 http://localhost:5000/api/hospital/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Expected Performance Benchmarks
- Health check: < 50ms response time
- Simple GET requests: < 100ms
- POST with database writes: < 300ms
- Complex queries with joins: < 500ms

### 📊 Coverage Goals
- **Statements**: 70%+
- **Branches**: 60%+
- **Functions**: 70%+
- **Lines**: 70%+

### 🔄 Continuous Integration
For CI/CD pipeline integration:
```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Generate coverage
        run: npm run test:coverage
```

### ✅ Next Steps
1. **Fix any failing tests** by debugging specific endpoints
2. **Add integration tests** for complete user workflows
3. **Add performance tests** for high-load scenarios
4. **Set up CI/CD** for automatic testing
5. **Monitor coverage** and aim for 80%+ coverage

### 📞 Support
For test-related issues:
1. Check test logs: `npm test -- --verbose`
2. Review server logs in development mode
3. Verify database connections
4. Ensure all dependencies are installed

---

## 🎉 Summary

### Testing Infrastructure: ✅ COMPLETE
- ✅ 135 comprehensive test cases created
- ✅ Test utilities and helpers implemented
- ✅ Jest and Supertest configured
- ✅ In-memory MongoDB setup for isolated testing
- ✅ Coverage reporting configured
- ✅ Multiple test scripts available

### Ready to Test:
```bash
cd backend
npm test
```

**Happy Testing! 🧪**
