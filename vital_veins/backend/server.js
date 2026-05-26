const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:3002",
      "http://127.0.0.1:3002",
      "http://localhost:3003",
      "http://127.0.0.1:3003",
      "http://localhost:3004",
      "http://127.0.0.1:3004"
    ],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());

// CORS debugging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request');
  }
  next();
});

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
    "http://localhost:3004",
    "http://127.0.0.1:3004"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection - only auto-connect when not running tests. Tests
// create their own in-memory connections to avoid conflicts.
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.log('ℹ️  Test environment detected - skipping automatic MongoDB connect');
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hospitals', require('./routes/hospitals-public'));
app.use('/api/hospital', require('./routes/hospital'));
app.use('/api/donor', require('./routes/donor'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));

// NEW FEATURE ROUTES
app.use('/api/location', require('./routes/location'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/admin/fraud', require('./routes/fraud'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin/events', require('./routes/events'));
app.use('/api/donor/events', require('./routes/events'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/admin/rewards', require('./routes/rewards'));
app.use('/api/donor/rewards', require('./routes/rewards'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LifeLink API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
// Error handling middleware
app.use((err, req, res, next) => {
  // Handle malformed JSON body parse errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && err.type === 'entity.parse.failed') {
    console.error('Malformed JSON body:', err.message);
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }

  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = parseInt(process.env.PORT) || 5000;

// Function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const testServer = require('http').createServer();
    const portToTry = parseInt(startPort);
    
    testServer.listen(portToTry, () => {
      testServer.close(() => {
        resolve(portToTry);
      });
    });
    
    testServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(portToTry + 1));
      } else {
        reject(err);
      }
    });
  });
};

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  findAvailablePort(PORT).then((availablePort) => {
    const httpServer = server.listen(availablePort, () => {
      console.log(`🚀 LifeLink server running on port ${availablePort}`);
      console.log(`📊 Health check: http://localhost:${availablePort}/api/health`);
      if (availablePort !== PORT) {
        console.log(`ℹ️  Port ${PORT} was in use, switched to ${availablePort}`);
      }
    });

    httpServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Unable to find available port starting from ${PORT}`);
        process.exit(1);
      }
    });
  }).catch((err) => {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  });
}

module.exports = { app, io, server };
