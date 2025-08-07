const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const { uploadImages, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Get all design stages
router.get('/design-stages', async (req, res) => {
  try {
    const [stages] = await db.execute('SELECT * FROM design_stages ORDER BY name');
    res.json({ stages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all issue categories
router.get('/issue-categories', async (req, res) => {
  try {
    const [categories] = await db.execute('SELECT * FROM issue_categories ORDER BY name');
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tools
router.get('/tools', async (req, res) => {
  try {
    const [tools] = await db.execute('SELECT * FROM tools ORDER BY name');
    res.json({ tools });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new query with image uploads (students only)
router.post('/', auth, checkRole(['student']), uploadImages, handleUploadError, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('tool_id').optional().isInt().withMessage('Tool ID must be a number'),
  body('design_stage_id').optional().isInt().withMessage('Design stage ID must be a number'),
  body('issue_category_id').optional().isInt().withMessage('Issue category ID must be a number'),
  body('debug_steps').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      description, 
      tool_id,
      design_stage_id,
      issue_category_id,
      debug_steps
    } = req.body;
    const studentId = req.user.userId;

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert query
      const [result] = await connection.execute(
        `INSERT INTO queries (
          student_id, title, description, 
          tool_id, design_stage_id, issue_category_id, debug_steps
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [studentId, title, description, tool_id, design_stage_id, issue_category_id, debug_steps]
      );

      const queryId = result.insertId;

      // Handle image uploads if any
      if (req.files && req.files.length > 0) {
        // Insert images one by one to avoid SQL syntax issues
        for (const file of req.files) {
          await connection.execute(
            `INSERT INTO query_images (
              query_id, filename, original_name, file_path, file_size, mime_type
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [queryId, file.filename, file.originalname, file.path, file.size, file.mimetype]
          );
        }
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: 'Query created successfully',
        queryId: queryId,
        imagesUploaded: req.files ? req.files.length : 0
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all queries (with role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'student') {
      // Students see only their own queries
      query = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               ds.name as design_stage_name, ic.name as issue_category_name, 
               tool.name as tool_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN design_stages ds ON q.design_stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        WHERE q.student_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [req.user.userId];
    } else {
      // Teachers see all queries
      query = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               ds.name as design_stage_name, ic.name as issue_category_name, 
               tool.name as tool_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN design_stages ds ON q.design_stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        ORDER BY q.created_at DESC
      `;
    }

    const [queries] = await db.execute(query, params);
    res.json({ queries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single query with responses and images
router.get('/:id', auth, async (req, res) => {
  try {
    const queryId = req.params.id;
    let sqlQuery;
    let params = [queryId];

    if (req.user.role === 'student') {
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               ds.name as design_stage_name, ic.name as issue_category_name, 
               tool.name as tool_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN design_stages ds ON q.design_stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        WHERE q.id = ? AND q.student_id = ?
      `;
      params = [queryId, req.user.userId];
    } else {
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               ds.name as design_stage_name, ic.name as issue_category_name, 
               tool.name as tool_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN design_stages ds ON q.design_stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        WHERE q.id = ?
      `;
    }

    const [queries] = await db.execute(sqlQuery, params);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Get responses for this query
    const [responses] = await db.execute(
      `SELECT r.*, u.full_name as teacher_name
       FROM responses r
       JOIN users u ON r.teacher_id = u.id
       WHERE r.query_id = ?
       ORDER BY r.created_at ASC`,
      [queryId]
    );

    // Get images for this query
    const [images] = await db.execute(
      `SELECT id, filename, original_name, file_size, mime_type, created_at
       FROM query_images 
       WHERE query_id = ?
       ORDER BY created_at ASC`,
      [queryId]
    );

    const query = queries[0];
    query.responses = responses;
    query.images = images;

    res.json({ query });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add response to query (teachers only)
router.post('/:id/responses', auth, checkRole(['teacher']), [
  body('answer').notEmpty().withMessage('Answer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryId = req.params.id;
    const { answer } = req.body;
    const teacherId = req.user.userId;

    // Check if query exists
    const [queries] = await db.execute(
      'SELECT * FROM queries WHERE id = ?',
      [queryId]
    );

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Add response
    await db.execute(
      'INSERT INTO responses (query_id, teacher_id, answer) VALUES (?, ?, ?)',
      [queryId, teacherId, answer]
    );

    // Update query status and assign teacher
    await db.execute(
      'UPDATE queries SET status = ?, teacher_id = ? WHERE id = ?',
      ['in_progress', teacherId, queryId]
    );

    res.json({ message: 'Response added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update query status (teachers only)
router.put('/:id/status', auth, checkRole(['teacher']), [
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryId = req.params.id;
    const { status } = req.body;

    // Check if query exists
    const [queries] = await db.execute(
      'SELECT * FROM queries WHERE id = ?',
      [queryId]
    );

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Update query status
    await db.execute(
      'UPDATE queries SET status = ? WHERE id = ?',
      [status, queryId]
    );

    res.json({ message: 'Query status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update query (students and teachers)
router.put('/:id', auth, [
  body('title').optional(),
  body('description').optional(),
  body('tool_id').optional().isInt(),
  body('design_stage_id').optional().isInt(),
  body('issue_category_id').optional().isInt(),
  body('debug_steps').optional(),
  body('resolution_attempts').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryId = req.params.id;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check if query exists
    let sqlQuery;
    let params = [queryId];

    if (userRole === 'student') {
      // Students can only edit their own queries
      sqlQuery = 'SELECT * FROM queries WHERE id = ? AND student_id = ?';
      params = [queryId, userId];
    } else {
      // Teachers can edit any query
      sqlQuery = 'SELECT * FROM queries WHERE id = ?';
    }

    const [queries] = await db.execute(sqlQuery, params);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(req.body[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(queryId);

    await db.execute(
      `UPDATE queries SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Query updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete query image (students and teachers)
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const queryId = req.params.id;
    const imageId = req.params.imageId;
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Check if query exists and user has permission
    let sqlQuery;
    let params = [queryId];

    if (userRole === 'student') {
      sqlQuery = 'SELECT * FROM queries WHERE id = ? AND student_id = ?';
      params = [queryId, userId];
    } else {
      sqlQuery = 'SELECT * FROM queries WHERE id = ?';
    }

    const [queries] = await db.execute(sqlQuery, params);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Get image details
    const [images] = await db.execute(
      'SELECT * FROM query_images WHERE id = ? AND query_id = ?',
      [imageId, queryId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = images[0];

    // Delete file from filesystem
    const fs = require('fs');
    if (fs.existsSync(image.file_path)) {
      fs.unlinkSync(image.file_path);
    }

    // Delete from database
    await db.execute(
      'DELETE FROM query_images WHERE id = ?',
      [imageId]
    );

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 