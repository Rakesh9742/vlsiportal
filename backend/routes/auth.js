const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole, checkSuperAdminRole } = require('../middleware/auth');

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

// Admin: Get all users (super admin sees all, domain admin sees only their domain)
router.get('/users', auth, checkRole(['admin', 'domain_admin']), async (req, res) => {
  try {
    let query = `
      SELECT u.id, u.username, u.role, u.full_name, u.created_at, d.name as domain_name
      FROM users u
      LEFT JOIN domains d ON u.domain_id = d.id
    `;
    let params = [];

    // If user is domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      query += ` WHERE u.domain_id = ?`;
      params.push(req.user.domainId);
    }

    query += ` ORDER BY u.created_at DESC`;

    const [users] = await db.execute(query, params);
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get expert reviewers (super admin sees all, domain admin sees only their domain)
router.get('/expert-reviewers', auth, checkRole(['admin', 'domain_admin']), async (req, res) => {
  try {
    let query = `
      SELECT u.id, u.username, u.full_name, u.created_at, d.name as domain_name
      FROM users u
      LEFT JOIN domains d ON u.domain_id = d.id
      WHERE u.role = 'expert_reviewer'
    `;
    let params = [];

    // If user is domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      query += ` AND u.domain_id = ?`;
      params.push(req.user.domainId);
    }

    query += ` ORDER BY u.full_name`;

    const [reviewers] = await db.execute(query, params);
    res.json({ reviewers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get expert reviewers by domain
router.get('/expert-reviewers/domain/:domainName', auth, checkRole(['admin']), async (req, res) => {
  try {
    const domainName = req.params.domainName;
    
    const [reviewers] = await db.execute(`
      SELECT u.id, u.username, u.full_name, u.created_at, d.name as domain_name
      FROM users u
      LEFT JOIN domains d ON u.domain_id = d.id
      WHERE u.role = 'expert_reviewer' AND d.name = ?
      ORDER BY u.full_name
    `, [domainName]);
    
    res.json({ reviewers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Professional Registration
router.post('/register-professional', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('domain_id').isInt().withMessage('Domain is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name, domain_id } = req.body;
    const username = email; // Use email as username

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

    // Insert new professional
    const [result] = await db.execute(
      'INSERT INTO users (username, password, role, full_name, domain_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, 'professional', full_name, domain_id]
    );

    res.status(201).json({
      message: 'Professional registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Super Admin: Create Admin User
router.post('/create-admin', auth, checkSuperAdminRole, [
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

// Super Admin: Create Domain Admin User
router.post('/create-domain-admin', auth, checkSuperAdminRole, [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('domain_id').isInt().withMessage('Domain ID is required')
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
      'SELECT id, name FROM domains WHERE id = ?',
      [domain_id]
    );

    if (domains.length === 0) {
      return res.status(400).json({ message: 'Invalid domain selected' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new domain admin user
    const [result] = await db.execute(
      'INSERT INTO users (username, password, role, full_name, domain_id) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, 'domain_admin', full_name, domain_id]
    );

    res.status(201).json({
      message: 'Domain admin user created successfully',
      userId: result.insertId,
      domain: domains[0].name
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
      `SELECT u.id, u.username, u.role, u.full_name, u.domain_id, d.name as domain 
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

// Get assignees (only admin and expert reviewer users) for query assignment
router.get('/assignees', auth, async (req, res) => {
  try {
    const [assignees] = await db.execute(
      `SELECT u.id, u.username, u.full_name, u.role, d.name as domain_name
       FROM users u
       LEFT JOIN domains d ON u.domain_id = d.id
       WHERE u.role IN ('admin', 'expert_reviewer')
       ORDER BY u.role DESC, u.full_name ASC`
    );

    res.json({ assignees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignees filtered by domain (only admin users)
router.get('/assignees/domain/:domain', auth, async (req, res) => {
  try {
    const domain = decodeURIComponent(req.params.domain);
    
    const [assignees] = await db.execute(
      `SELECT u.id, u.username, u.full_name, u.role, d.name as domain_name
       FROM users u
       LEFT JOIN domains d ON u.domain_id = d.id
       WHERE u.role IN ('admin', 'expert_reviewer')
         AND (d.name = ? OR u.role = 'admin')
       ORDER BY u.role DESC, u.full_name ASC`,
      [domain]
    );

    res.json({ assignees });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - Verify username exists
router.post('/forgot-password', [
  body('username').notEmpty().withMessage('Username is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;

    // Find user with domain name
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.role, u.full_name, u.domain_id, d.name as domain_name 
       FROM users u 
       LEFT JOIN domains d ON u.domain_id = d.id 
       WHERE u.username = ?`,
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Username not found' });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id]
    );

    res.json({
      message: 'Username verified successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        domain: user.domain_name,
        domainId: user.domain_id,
        resetToken: resetToken
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password - Update password with token
router.post('/reset-password', [
  body('username').notEmpty().withMessage('Username is required'),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, token, password } = req.body;

    // Find user with reset token
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.reset_token, u.reset_token_expiry 
       FROM users u 
       WHERE u.username = ? AND u.reset_token = ?`,
      [username, token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const user = users[0];

    // Check if token is expired
    if (new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await db.execute(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;