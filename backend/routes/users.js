const express = require('express');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all domains (for profile editing)
router.get('/domains', auth, async (req, res) => {
  try {
    const [domains] = await db.execute('SELECT * FROM domains ORDER BY name');
    res.json({ domains });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
      `SELECT u.id, u.username, u.role, u.full_name, u.domain_id, u.created_at, u.updated_at, d.name as domain 
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

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, domain_id } = req.body;
    const userId = req.user.userId;

    // Validate domain_id if provided
    if (domain_id) {
      const [domains] = await db.execute(
        'SELECT id FROM domains WHERE id = ?',
        [domain_id]
      );
      
      if (domains.length === 0) {
        return res.status(400).json({ message: 'Invalid domain selected' });
      }
    }

    await db.execute(
      'UPDATE users SET full_name = ?, domain_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [full_name, domain_id || null, userId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 