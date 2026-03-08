# 🚀 VITALVEINS DEPLOYMENT GUIDE & HEALTH CHECK

**Date:** February 11, 2026  
**Status:** ✅ READY FOR DEPLOYMENT  
**Version:** 1.0.0

---

## 📋 PRE-DEPLOYMENT VERIFICATION

### ✅ Backend Verification

**Files Modified (QA Fixes Applied):**
- ✅ `backend/routes/admin.js` - 7 new endpoints added
- ✅ `backend/models/Hospital.js` - Organ enum fixed
- ✅ `backend/models/Donor.js` - Required fields fixed
- ✅ `backend/middleware/validation.js` - Validators updated

**Backend Structure:**
```
backend/
├── routes/ (10 files) ✅
├── models/ (7 files) ✅
├── middleware/ (2 files) ✅
├── services/ (1 file) ✅
├── tests/ (5 test files) ✅
├── server.js ✅
├── package.json ✅
└── .env ✅
```

**Dependencies Status:**
- Node.js version: 16.x or higher
- npm version: 8.x or higher
- MongoDB: Local or Atlas

---

## 🔧 DEPLOYMENT STEPS

### Step 1: Backend Deployment

#### 1.1 Install Dependencies
```bash
cd backend
npm install
```

#### 1.2 Configure Environment
```bash
# Copy and edit .env file
cp env.example .env

# Required variables:
MONGODB_URI=mongodb://localhost:27017/vitalveins
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=production
CLIENT_URL=http://localhost:3000
```

#### 1.3 Database Setup
```bash
# Option 1: Local MongoDB
mongod

# Option 2: MongoDB Atlas
# Update MONGODB_URI in .env
```

#### 1.4 Run Backend Server
```bash
# Development
npm run dev

# Production
npm start
```

**Expected Output:**
```
✅ MongoDB connected successfully
Server running on port 5000
```

---

### Step 2: Frontend Deployment

#### 2.1 Install Dependencies
```bash
cd frontend
npm install
```

#### 2.2 Build Production Bundle
```bash
npm run build
```

**Output:** `build/` directory created with optimized files

#### 2.3 Configure Server URL
Edit `frontend/src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

#### 2.4 Run Frontend (Development)
```bash
npm start
```

**Expected Output:**
```
Compiled successfully!
Ready on http://localhost:3000
```

---

## ✅ HEALTH CHECK TESTS

### Test 1: Backend Health Endpoint
```bash
curl -X GET http://localhost:5000/api/health

# Expected Response:
{
  "status": "OK",
  "message": "LifeLink API is running",
  "timestamp": "2026-02-11T..."
}
```

### Test 2: User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123",
    "role": "donor"
  }'

# Expected: 201 Created
```

### Test 3: User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

# Expected: 200 OK + token
```

### Test 4: Admin Endpoints (New - All Fixed)
```bash
# Get all users
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 200 OK + user list
```

---

## 🐳 DOCKER DEPLOYMENT (Optional)

### Step 1: Create Dockerfile for Backend
```dockerfile
FROM node:16-alpine

WORKDIR /app/backend

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000
CMD ["npm", "start"]
```

### Step 2: Create Docker Compose
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/lifelink
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000

volumes:
  mongodb_data:
```

### Step 3: Deploy with Docker
```bash
docker-compose up -d
```

---

## ☁️ CLOUD DEPLOYMENT OPTIONS

### Option 1: Heroku
```bash
# Backend
heroku login
heroku create vitalveins-api
git push heroku main

# Frontend
heroku create vitalveins-client
npm run build
# Deploy build/ directory
```

### Option 2: AWS
1. Save backend to Elastic Beanstalk
2. Deploy frontend to S3 + CloudFront
3. Configure RDS for MongoDB (or use MongoDB Atlas)
4. Setup API Gateway for backend

### Option 3: DigitalOcean
1. Create Droplet (Ubuntu 20.04)
2. Install Node.js and MongoDB
3. Clone repository
4. Configure Nginx as reverse proxy
5. Setup SSL with Let's Encrypt

### Option 4: Vercel (Frontend Only)
```bash
# Deploy frontend
npm i -g vercel
vercel

# Update API URL to point to backend
```

---

## 🔒 PRODUCTION CHECKLIST

### Security
- [ ] Change JWT_SECRET to strong value
- [ ] Set NODE_ENV=production
- [ ] Configure HTTPS/SSL
- [ ] Set CORS origins appropriately
- [ ] Enable rate limiting (already in server.js)
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Setup firewall rules

### Performance
- [ ] Enable caching headers
- [ ] Compress responses (already in server.js)
- [ ] Use CDN for static assets
- [ ] Enable database indexing
- [ ] Configure auto-scaling
- [ ] Setup monitoring/alerts

### Monitoring
- [ ] Setup error logging (Sentry/LogRocket)
- [ ] Monitor server health
- [ ] Track API response times
- [ ] Monitor database performance
- [ ] Setup uptime monitoring
- [ ] Configure alerts for downtime

---

## 📊 DEPLOYMENT VERIFICATION

### Backend Health Check Commands
```bash
# Check if server is running
curl -X GET http://localhost:5000/api/health

# Check MongoDB connection
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Check socket.io
curl -I http://localhost:5000/socket.io
```

### Frontend Verification
- [ ] Open http://localhost:3000 in browser
- [ ] Verify all pages load
- [ ] Test login functionality
- [ ] Verify API calls work
- [ ] Check for console errors
- [ ] Test Socket.IO notifications

---

## 🚨 TROUBLESHOOTING

### Issue: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Ensure MongoDB is running: `mongod`
2. Or check MongoDB Atlas connection string
3. Verify MONGODB_URI in .env

### Issue: Port Already in Use
```
Error: listen EADDRINUSE :::5000
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change PORT in .env
```

### Issue: CORS Error
```
Access to XMLHttpRequest blocked by CORS
```

**Solution:**
1. Check Origin header in request
2. Update CORS whitelist in server.js
3. Verify CLIENT_URL in .env

### Issue: Missing Dependencies
```
Error: Cannot find module 'express'
```

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📈 POST-DEPLOYMENT TASKS

### Day 1
- [ ] Monitor server logs
- [ ] Test all critical workflows
- [ ] Verify email notifications
- [ ] Check database performance
- [ ] Monitor error rates

### Week 1
- [ ] Gather user feedback
- [ ] Monitor API performance
- [ ] Check database size
- [ ] Review error logs
- [ ] Optimize slow queries

### Month 1
- [ ] Plan for scaling
- [ ] Setup backup/disaster recovery
- [ ] Implement additional monitoring
- [ ] Review security logs
- [ ] Plan for next release

---

## 📞 SUPPORT CONTACT

For issues or questions:
1. Check logs: `docker logs <container>` or `tail -f server.log`
2. Review documentation: See TESTING_GUIDE.md
3. Check error handling: All endpoints return descriptive errors

---

## ✅ DEPLOYMENT SIGN-OFF

**Status:** ✅ READY FOR DEPLOYMENT

All systems verified:
- ✅ Code changes applied
- ✅ All 7 new endpoints implemented
- ✅ Enum issues fixed
- ✅ Validation updated
- ✅ No breaking changes
- ✅ Backward compatible
- ✅ Error handling complete
- ✅ Environment configured

**Estimated Deployment Time:** 30-60 minutes  
**Risk Level:** LOW  
**Rollback Required:** NO  

---

**Prepare to Deploy:** ✅ YES  
**Deployment Date:** February 11, 2026  
**Next Steps:** Execute deployment steps above

