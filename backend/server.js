const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const queryRoutes = require('./routes/queries');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const { router: notificationRoutes } = require('./routes/notifications');
const systemRoutes = require('./routes/system');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { error: logError } = require('./config/logger');

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration using environment variables
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3000',
        'http://vlsiforum.sumedhait.com',
        'https://vlsiforum.sumedhait.com'
      ];
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For VNC environments and development, allow common patterns
      const isAllowedPattern = 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.includes('vlsiforum.sumedhait.com') ||
        origin.includes('192.168.') ||  // Common VNC IP range
        origin.includes('10.') ||       // Common VNC IP range
        origin.includes('172.') ||      // Common VNC IP range
        origin.match(/^https?:\/\/[^\/]*:\d+$/) || // Allow any origin with port
        origin.match(/^https?:\/\/vlsiforum\.sumedhait\.com$/); // Allow HTTPS production domain
      
      if (isAllowedPattern) {
        console.log('CORS allowing origin:', origin);
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'VLSI Portal Backend is running!' });
});

// Error handling middleware (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Listen on all interfaces for both localhost and production hosting
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VLSI Portal Backend server started on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logError('Uncaught Exception', {
    message: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});