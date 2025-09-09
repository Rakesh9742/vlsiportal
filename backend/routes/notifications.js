const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');

// ==============================================
// GET /notifications - Get user notifications
// ==============================================
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, unread_only = false } = req.query;
    
    // Build query with JOIN and string interpolation for LIMIT/OFFSET
    let query = 'SELECT n.id, n.type, n.title, n.message, n.is_read, n.created_at, n.read_at, n.metadata, q.custom_query_id, q.title as query_title FROM notifications n LEFT JOIN queries q ON n.query_id = q.id WHERE n.user_id = ?';
    const params = [userId];
    
    if (unread_only === 'true') {
      query += ' AND n.is_read = 0';
    }
    
    query += ' ORDER BY n.created_at DESC';
    
    // Use string interpolation for LIMIT and OFFSET to avoid MySQL parameter binding issues
    const limitValue = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offsetValue = Math.max(0, parseInt(offset) || 0);
    query += ` LIMIT ${limitValue} OFFSET ${offsetValue}`;

    const [notifications] = await db.execute(query, params);

    // Get unread count
    const [unreadCount] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.json({
      notifications,
      unread_count: unreadCount[0].count,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// ==============================================
// PUT /notifications/:id/read - Mark notification as read
// ==============================================
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    // Verify notification belongs to user
    const [notification] = await db.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notification.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Mark as read
    await db.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
      [notificationId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// ==============================================
// PUT /notifications/read-all - Mark all notifications as read
// ==============================================
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    await db.execute(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// ==============================================
// DELETE /notifications/:id - Delete notification
// ==============================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    // Verify notification belongs to user
    const [notification] = await db.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notification.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await db.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// ==============================================
// Helper function to create notifications
// ==============================================
const createNotification = async (userId, queryId, type, title, message, metadata = null) => {
  try {
    await db.execute(
      `INSERT INTO notifications (user_id, query_id, type, title, message, metadata) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, queryId, type, title, message, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Export the router and helper function
module.exports = {
  router,
  createNotification
};