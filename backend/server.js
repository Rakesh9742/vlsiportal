const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const queryRoutes = require('./routes/queries');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

dotenv.config();

console.log('🚀 Starting VLSI Portal Backend...');
console.log(`📡 Server will run on port: ${process.env.PORT || 5000}`);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for both localhost and production hosting
const corsOptions = {
  origin: [
    // Localhost URLs
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    
    // Production URLs (VNC machine)
    'http://192.168.92.34:3000',
    'http://192.168.92.34',
    'http://192.168.122.1:3000',
    'http://192.168.122.1',
    
    // Additional local network URLs
    'http://192.168.1.100:3000',
    'http://192.168.1.101:3000',
    'http://192.168.0.100:3000',
    'http://192.168.0.101:3000'
  ],
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

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'VLSI Portal Backend is running!' });
});

// Listen on all interfaces for both localhost and production hosting
app.listen(PORT, '0.0.0.0', () => {
  console.log('🎉 Server started successfully!');
  console.log('🌐 Available URLs:');
  console.log(`   Localhost: http://localhost:${PORT}`);
  console.log(`   Production: http://192.168.92.34:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   Health Check: http://192.168.92.34:${PORT}/api/health`);
  console.log(`   Uploads: http://localhost:${PORT}/uploads`);
  console.log(`   Uploads: http://192.168.92.34:${PORT}/uploads`);
  console.log('📝 API Endpoints:');
  console.log('   - POST /api/auth/register - Student registration');
  console.log('   - POST /api/auth/login - User login');
  console.log('   - GET /api/queries - Get all queries');
  console.log('   - POST /api/queries - Create new query with images');
  console.log('   - GET /api/users/profile - Get user profile');
}); 