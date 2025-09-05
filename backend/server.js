const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const queryRoutes = require('./routes/queries');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for both localhost and production hosting
const corsOptions = {
  origin: [
    // Localhost URLs
    'http://localhost:3001',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000',
    
    // Production URLs (AWS server)
    'http://3.6.88.118:3001',
    'http://3.6.88.118:3000',
    'http://3.6.88.118',
    
    // Legacy VNC machine URLs (for backward compatibility)
    'http://192.168.92.34:3001',
    'http://192.168.92.34:3000',
    'http://192.168.92.34',
    'http://192.168.92.34:420',
    'http://192.168.122.1:3001',
    'http://192.168.122.1:3000',
    'http://192.168.122.1',
    'http://192.168.122.1:420',
    
    // Additional local network URLs
    'http://192.168.1.100:3001',
    'http://192.168.1.101:3001',
    'http://192.168.0.100:3001',
    'http://192.168.0.101:3001'
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
}); 