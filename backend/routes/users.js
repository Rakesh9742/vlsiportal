const express = require('express');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all teachers (for students to see available teachers)
router.get('/teachers', auth, async (req, res) => {
  try {
    const [teachers] = await db.execute(
      'SELECT id, username, full_name, domain_id FROM users WHERE role = ?',
      ['teacher']
    );
    res.json({ teachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, role, full_name, domain_id, created_at FROM users WHERE id = ?',
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

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, domain_id } = req.body;
    const userId = req.user.userId;

    await db.execute(
      'UPDATE users SET full_name = ?, domain_id = ? WHERE id = ?',
      [full_name, domain_id, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 