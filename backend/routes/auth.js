const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all domains
router.get('/domains', async (req, res) => {
  try {
    const [domains] = await db.execute('SELECT * FROM domains ORDER BY name');
    res.json({ domains });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Registration
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('domain_id').isInt().withMessage('Domain is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, full_name, domain_id } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if domain exists
    const [domains] = await db.execute(
      'SELECT id FROM domains WHERE id = ?',
      [domain_id]
    );

    if (domains.length === 0) {
      return res.status(400).json({ message: 'Invalid domain selected' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new student
    const [result] = await db.execute(
      'INSERT INTO users (username, password, role, full_name, domain_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, 'student', full_name, domain_id]
    );

    res.status(201).json({ 
      message: 'Student registered successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create Expert Reviewer
router.post('/expert-reviewer', auth, checkRole(['admin']), [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('domain_id').isInt().withMessage('Domain is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, full_name, domain_id } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if domain exists
    const [domains] = await db.execute(
      'SELECT id FROM domains WHERE id = ?',
      [domain_id]
    );

    if (domains.length === 0) {
      return res.status(400).json({ message: 'Invalid domain selected' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new expert reviewer
    const [result] = await db.execute(
      'INSERT INTO users (username, password, role, full_name, domain_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, 'expert_reviewer', full_name, domain_id]
    );

    res.status(201).json({ 
      message: 'Expert reviewer created successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all users
router.get('/users', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT u.id, u.username, u.role, u.full_name, u.created_at, d.name as domain_name
      FROM users u
      LEFT JOIN domains d ON u.domain_id = d.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get expert reviewers
router.get('/expert-reviewers', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [reviewers] = await db.execute(`
      SELECT u.id, u.username, u.full_name, u.created_at, d.name as domain_name
      FROM users u
      LEFT JOIN domains d ON u.domain_id = d.id
      WHERE u.role = 'expert_reviewer'
      ORDER BY u.full_name
    `);
    res.json({ reviewers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Create Admin User
router.post('/create-admin', auth, checkRole(['admin']), [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, full_name } = req.body;

    // Check if user already exists
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin user
    const [result] = await db.execute(
      'INSERT INTO users (username, password, role, full_name, domain_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, 'admin', full_name, null]
    );

    res.status(201).json({ 
      message: 'Admin user created successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete user
router.delete('/users/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user exists and is not admin
    const [users] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (users[0].role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Delete user
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user with domain name
    const [users] = await db.execute(
      `SELECT u.*, d.name as domain_name 
       FROM users u 
       LEFT JOIN domains d ON u.domain_id = d.id 
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        fullName: user.full_name,
        domainId: user.domain_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        domain: user.domain_name,
        domainId: user.domain_id
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.role, u.full_name, d.name as domain 
       FROM users u 
       LEFT JOIN domains d ON u.domain_id = d.id 
       WHERE u.id = ?`,
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 