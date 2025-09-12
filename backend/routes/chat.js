const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const { uploadImages, handleUploadError } = require('../middleware/upload');
const { createNotification } = require('./notifications');

const router = express.Router();

// Get chat by query ID
router.get('/query/:queryId', auth, async (req, res) => {
  try {
    const { queryId } = req.params;
    const userId = req.user.userId;
    
    // Determine if queryId is numeric (database ID) or custom_query_id
    const isNumericId = /^\d+$/.test(queryId);
    const idField = isNumericId ? 'q.id' : 'q.custom_query_id';
    const parsedUserId = parseInt(userId);

    // Check if user has access to this query
    const [queryCheck] = await db.execute(
      `SELECT q.id, q.student_id, q.expert_reviewer_id 
       FROM queries q 
       WHERE ${idField} = ?`,
      [queryId]
    );

    if (queryCheck.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    const query = queryCheck[0];
    const numericQueryId = query.id;
    const isStudent = query.student_id === parsedUserId;
    const isExpert = query.expert_reviewer_id === parsedUserId;
    const isSuperAdmin = req.user.role === 'admin';
    
    // For domain admin, check if they can access this query from their domain
    let isDomainAdmin = false;
    if (req.user.role === 'domain_admin') {
      const [domainCheck] = await db.execute(
        'SELECT u.domain_id FROM users u WHERE u.id = ?',
        [query.student_id]
      );
      if (domainCheck.length > 0 && domainCheck[0].domain_id === req.user.domainId) {
        isDomainAdmin = true;
      }
    }

    if (!isStudent && !isExpert && !isSuperAdmin && !isDomainAdmin) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Get or create chat for this query
    let [chat] = await db.execute(
      'SELECT * FROM query_chats WHERE query_id = ?',
      [numericQueryId]
    );

    if (chat.length === 0) {
      // Create chat if it doesn't exist
      const [chatResult] = await db.execute(
        'INSERT INTO query_chats (query_id, chat_status) VALUES (?, ?)',
        [numericQueryId, 'active']
      );
      
      const chatId = chatResult.insertId;
      
      // Add participants
      await db.execute(
        'INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, ?)',
        [chatId, query.student_id, 'student']
      );
      
      if (query.expert_reviewer_id) {
        await db.execute(
          'INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, ?)',
          [chatId, query.expert_reviewer_id, 'expert']
        );
      }
      
      // Get the newly created chat
      [chat] = await db.execute(
        'SELECT * FROM query_chats WHERE id = ?',
        [chatId]
      );
    }

    // Get chat participants
    const [participants] = await db.execute(
      `SELECT cp.*, u.username, u.full_name, u.role as user_role
       FROM chat_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.chat_id = ?`,
      [chat[0].id]
    );

    res.json({
      chat: chat[0],
      participants
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
    const offset = Math.max(0, (pageNum - 1) * limitNum);
    
    // Ensure all values are valid integers
    if (isNaN(pageNum) || isNaN(limitNum) || isNaN(offset)) {
      return res.status(400).json({ message: 'Invalid pagination parameters' });
    }
    const userId = req.user.userId;

    // Validate chatId
    const chatIdNum = parseInt(chatId);
    if (!chatIdNum || isNaN(chatIdNum)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    // Check if user is a participant in this chat
    const [participantCheck] = await db.execute(
      'SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatIdNum, parseInt(userId)]
    );

    if (participantCheck.length === 0 && !['admin', 'domain_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Get messages with sender information
    const sqlChatId = Number(chatIdNum);
    const sqlLimit = Number(limitNum);
    const sqlOffset = Number(offset);
    

    
    // Validate SQL parameters are valid positive integers
    if (!Number.isInteger(sqlChatId) || sqlChatId <= 0 || 
        !Number.isInteger(sqlLimit) || sqlLimit <= 0 || sqlLimit > 100 ||
        !Number.isInteger(sqlOffset) || sqlOffset < 0) {

      return res.status(400).json({ message: 'Invalid SQL parameters' });
    }
    
    const [messages] = await db.execute(
      `SELECT cm.*, u.username, u.full_name, u.role
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.chat_id = ?
       ORDER BY cm.created_at DESC
       LIMIT ${sqlLimit} OFFSET ${sqlOffset}`,
      [sqlChatId]
    );

    // Get total count for pagination
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM chat_messages WHERE chat_id = ?',
      [sqlChatId]
    );

    // Mark messages as read for current user
    if (messages.length > 0) {
      const messageIds = messages.map(m => m.id);
      const placeholders = messageIds.map(() => '?').join(',');
      
      await db.execute(
        `INSERT IGNORE INTO message_read_status (message_id, user_id) 
         VALUES ${messageIds.map(() => '(?, ?)').join(', ')}`,
        messageIds.flatMap(id => [parseInt(id), parseInt(userId)])
      );
    }

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/:chatId/messages', auth, uploadImages, handleUploadError, [
  body('content').notEmpty().withMessage('Message content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { content, message_type = 'text' } = req.body;
    const userId = req.user.userId;

    // Validate chatId
    const chatIdNum = parseInt(chatId);
    if (!chatIdNum || isNaN(chatIdNum)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    // Check if user is a participant in this chat
    const [participantCheck] = await db.execute(
      'SELECT id FROM chat_participants WHERE chat_id = ? AND user_id = ?',
      [chatIdNum, parseInt(userId)]
    );

    if (participantCheck.length === 0 && !['admin', 'domain_admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Check if chat is still active
    const [chatCheck] = await db.execute(
      'SELECT chat_status FROM query_chats WHERE id = ?',
      [chatIdNum]
    );

    if (chatCheck.length === 0) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (chatCheck[0].chat_status === 'closed') {
      return res.status(400).json({ message: 'Cannot send messages to a closed chat' });
    }

    // Handle file uploads
    let file_path = null;
    let file_name = null;
    let file_size = null;
    let mime_type = null;

    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      file_path = file.path || null;
      file_name = file.originalname || null;
      file_size = file.size || null;
      mime_type = file.mimetype || null;
    }

    // Insert message
    const [result] = await db.execute(
      `INSERT INTO chat_messages (chat_id, sender_id, message_type, content, file_path, file_name, file_size, mime_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chatIdNum,
        parseInt(userId),
        message_type || 'text',
        content || null,
        file_path,
        file_name,
        file_size,
        mime_type
      ]
    );

    // Get the created message with sender info
    const [newMessage] = await db.execute(
      `SELECT cm.*, u.username, u.full_name, u.role
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.id = ?`,
      [result.insertId]
    );

    // Create notifications for other participants
    try {
      // Get query info and other participants
      const [chatInfo] = await db.execute(
        `SELECT qc.query_id, q.custom_query_id, q.title as query_title
         FROM query_chats qc
         JOIN queries q ON qc.query_id = q.id
         WHERE qc.id = ?`,
        [chatIdNum]
      );

      if (chatInfo.length > 0) {
        const queryInfo = chatInfo[0];
        
        // Get other participants (exclude the sender)
        const [participants] = await db.execute(
          `SELECT cp.user_id, u.username, u.full_name
           FROM chat_participants cp
           JOIN users u ON cp.user_id = u.id
           WHERE cp.chat_id = ? AND cp.user_id != ?`,
          [chatIdNum, parseInt(userId)]
        );

        // Create notifications for each participant
        const senderName = newMessage[0].full_name || newMessage[0].username;
        for (const participant of participants) {
          await createNotification(
            participant.user_id,
            queryInfo.query_id,
            'chat_message',
            `New message in ${queryInfo.custom_query_id}`,
            `${senderName} sent a message: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
            {
              chat_id: chatIdNum,
              message_id: result.insertId,
              sender_id: parseInt(userId),
              sender_name: senderName
            }
          );
        }
      }
    } catch (notificationError) {
      console.error('Error creating chat notifications:', notificationError);
      // Don't fail the message creation if notification fails
    }

    res.status(201).json({ message: newMessage[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count for user
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get total unread count
    const [totalResult] = await db.execute(
      `SELECT COUNT(*) as unread_count
       FROM chat_messages cm
       JOIN chat_participants cp ON cm.chat_id = cp.chat_id
       LEFT JOIN message_read_status mrs ON cm.id = mrs.message_id AND mrs.user_id = ?
       WHERE cp.user_id = ? AND cm.sender_id != ? AND mrs.id IS NULL`,
      [userId, userId, userId]
    );

    // Get unread messages from other participants in chats where user is a participant
    const [expertMessages] = await db.execute(
      `SELECT DISTINCT cm.chat_id, q.id as query_id, q.title as query_title, u.full_name as sender_name, 
       COUNT(cm.id) as message_count,
       MAX(cm.created_at) as latest_message_time
       FROM chat_messages cm
       JOIN chat_participants cp ON cm.chat_id = cp.chat_id
       JOIN users u ON cm.sender_id = u.id
       JOIN query_chats qc ON cm.chat_id = qc.id
       JOIN queries q ON qc.query_id = q.id
       LEFT JOIN message_read_status mrs ON cm.id = mrs.message_id AND mrs.user_id = ?
       WHERE cp.user_id = ? AND cm.sender_id != ? AND mrs.id IS NULL
       GROUP BY cm.chat_id, q.id, q.title, u.full_name
       ORDER BY latest_message_time DESC`,
      [userId, userId, userId]
     );

    res.json({ 
      unread_count: totalResult[0].unread_count,
      expert_messages: expertMessages
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update chat status (for admins and experts)
router.put('/:chatId/status', auth, checkRole(['expert_reviewer', 'admin']), [
  body('status').isIn(['active', 'resolved', 'closed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { chatId } = req.params;
    const { status } = req.body;

    // Validate chatId
    const chatIdNum = parseInt(chatId);
    if (!chatIdNum || isNaN(chatIdNum)) {
      return res.status(400).json({ message: 'Invalid chat ID' });
    }

    await db.execute(
      'UPDATE query_chats SET chat_status = ? WHERE id = ?',
      [status, chatIdNum]
    );

    res.json({ message: 'Chat status updated successfully' });
  } catch (error) {
    console.error('Error updating chat status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all chats for admin
router.get('/admin/all', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const offset = Math.max(0, (pageNum - 1) * limitNum);

    let whereClause = '';
    let params = [];

    if (status) {
      whereClause = 'WHERE qc.chat_status = ?';
      params.push(status);
    }

    const [chats] = await db.execute(
      `SELECT qc.*, q.title as query_title, q.student_id,
              s.username as student_username, s.full_name as student_name,
              e.username as expert_username, e.full_name as expert_name,
              (SELECT COUNT(*) FROM chat_messages WHERE chat_id = qc.id) as message_count
       FROM query_chats qc
       JOIN queries q ON qc.query_id = q.id
       JOIN users s ON q.student_id = s.id
       LEFT JOIN users e ON q.expert_reviewer_id = e.id
       ${whereClause}
       ORDER BY qc.last_message_at DESC, qc.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      [...params]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM query_chats qc ${whereClause}`,
      params
    );

    res.json({
      chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting admin chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;