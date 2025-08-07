const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const queryRoutes = require('./routes/queries');
const userRoutes = require('./routes/users');

dotenv.config();

console.log('🚀 Starting VLSI Portal Backend...');
console.log(`📡 Server will run on port: ${process.env.PORT || 5000}`);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'VLSI Portal Backend is running!' });
});

app.listen(PORT, () => {
  console.log('🎉 Server started successfully!');
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Uploads URL: http://localhost:${PORT}/uploads`);
  console.log('📝 API Endpoints:');
  console.log('   - POST /api/auth/register - Student registration');
  console.log('   - POST /api/auth/login - User login');
  console.log('   - GET /api/queries - Get all queries');
  console.log('   - POST /api/queries - Create new query with images');
  console.log('   - GET /api/users/profile - Get user profile');
}); 