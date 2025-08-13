const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const { uploadImages, handleUploadError } = require('../middleware/upload');
const domainConfig = require('../../domain_config');

const router = express.Router();

// Get Physical Design stages
router.get('/pd-stages', async (req, res) => {
  try {
    const [stages] = await db.execute('SELECT * FROM pd_stages ORDER BY id');
    res.json({ stages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Physical Design issue categories for a specific stage
router.get('/pd-issue-categories/:stageId', async (req, res) => {
  try {
    const { stageId } = req.params;
    const [categories] = await db.execute(
      'SELECT * FROM pd_issue_categories WHERE stage_id = ? ORDER BY name',
      [stageId]
    );
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all Physical Design issue categories
router.get('/pd-issue-categories', async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT ic.*, ps.name as stage_name 
      FROM pd_issue_categories ic 
      JOIN pd_stages ps ON ic.stage_id = ps.id 
      ORDER BY ps.id, ic.name
    `);
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get domain-specific stages and issue categories
router.get('/domain-config/:domainName', async (req, res) => {
  try {
    const { domainName } = req.params;
    
    if (!domainConfig[domainName]) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    
    const config = domainConfig[domainName];
    res.json({ 
      domain: domainName,
      stages: config.stages,
      issueCategories: config.issueCategories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all domains with their stages and issue categories
router.get('/domain-config', async (req, res) => {
  try {
    res.json({ domains: domainConfig });
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
  body('stage_id').optional().isInt().withMessage('Stage ID must be a number'),
  body('custom_issue_category').optional(),
  body('debug_steps').optional(),
  body('resolution').optional()
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
      stage_id,
      custom_issue_category,
      debug_steps,
      resolution
    } = req.body;
    const studentId = req.user.userId;

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Build query fields and values
      const queryFields = ['student_id', 'title', 'description', 'tool_id', 'stage_id', 'debug_steps', 'resolution'];
      const queryValues = [studentId, title, description, tool_id, stage_id, debug_steps, resolution];
      
      // Handle custom issue category
      let issue_category_id = null;
      if (custom_issue_category) {
        // If custom category is provided, set issue_category_id to null and use custom_issue_category
        queryFields.push('custom_issue_category');
        queryValues.push(custom_issue_category);
      } else {
        // If no custom category, use the regular issue_category_id from the form
        queryFields.push('issue_category_id');
        queryValues.push(req.body.issue_category_id || null);
      }
      
      const [result] = await connection.execute(
        `INSERT INTO queries (${queryFields.join(', ')}) VALUES (${queryFields.map(() => '?').join(', ')})`,
        queryValues
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
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN domain_stages ds ON q.stage_id = ds.id
        LEFT JOIN domain_issue_categories ic ON q.issue_category_id = ic.id
        WHERE q.student_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [req.user.userId];
    } else if (req.user.role === 'expert_reviewer') {
      // Expert reviewers see queries from their assigned domain only
      query = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN domain_stages ds ON q.stage_id = ds.id
        LEFT JOIN domain_issue_categories ic ON q.issue_category_id = ic.id
        WHERE d.id = ?
        ORDER BY q.created_at DESC
      `;
      params = [req.user.domainId];
    } else {
      // Admin sees all queries
      query = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN domain_stages ds ON q.stage_id = ds.id
        LEFT JOIN domain_issue_categories ic ON q.issue_category_id = ic.id
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

// Export queries to ZIP with CSV and images (expert reviewers and admins)
router.get('/export', auth, checkRole(['expert_reviewer', 'admin']), async (req, res) => {
  try {
    const archiver = require('archiver');
    const fs = require('fs');
    const path = require('path');

    // Get all resolved queries with related data
    const [queries] = await db.execute(`
      SELECT 
        q.id,
        q.title,
        q.description,
        q.status,
        q.resolution_attempts,
        q.debug_steps,
        q.resolution,
        q.created_at,
        q.updated_at,
        u.full_name as student_name,
        d.name as student_domain,
        t.full_name as teacher_name,
        ds.name as design_stage_name,
        COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
        tool.name as tool_name,
        (SELECT COUNT(*) FROM responses r WHERE r.query_id = q.id) as response_count
      FROM queries q
      JOIN users u ON q.student_id = u.id
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN users t ON q.teacher_id = t.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN domain_stages ds ON q.stage_id = ds.id
      LEFT JOIN domain_issue_categories ic ON q.issue_category_id = ic.id
      WHERE q.status = 'resolved'
      ORDER BY q.created_at DESC
    `);

    // Create CSV content with answer column
    const csvHeaders = [
      'Title',
      'Description',
      'Status',
      'Student Name',
      'Student Domain',
      'Expert Reviewer Name',
      'Design Stage',
      'Issue Category',
      'Tool',
      'Debug Steps',
      'Resolution',
      'Created Date',
      'Updated Date',
      'Answer',
      'Images'
    ];

    // Get answers and images for all queries
    const csvRows = await Promise.all(queries.map(async (query) => {
      // Get the latest response for this query
      const [responses] = await db.execute(`
        SELECT answer FROM responses 
        WHERE query_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [query.id]);
      
      // Get images for this query
      const [images] = await db.execute(`
        SELECT original_name, file_path FROM query_images 
        WHERE query_id = ? 
        ORDER BY created_at ASC
      `, [query.id]);
      
      const answer = responses.length > 0 ? responses[0].answer : '';
      const imageNames = images.map(img => img.original_name).join('; ');
      
      // Format dates to show only date without timezone - use consistent format
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const day = days[date.getDay()];
        const month = months[date.getMonth()];
        const dateNum = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day} ${month} ${dateNum} ${year}`;
      };
      
      const createdDate = formatDate(query.created_at);
      const updatedDate = formatDate(query.updated_at);
      
      console.log(`Bulk export - Query ${query.id}:`, {
        title: query.title,
        responseCount: responses.length,
        hasAnswer: responses.length > 0,
        answerLength: answer.length,
        imageCount: images.length,
        imageNames: imageNames,
        createdDate: createdDate,
        updatedDate: updatedDate,
        resolution: query.resolution,
        resolutionAttempts: query.resolution_attempts,
        debugSteps: query.debug_steps,
        csvRow: [
          query.title,
          query.description,
          query.status,
          query.student_name,
          query.student_domain,
          query.teacher_name,
          query.design_stage_name,
          query.issue_category_name,
          query.tool_name,
          query.debug_steps,
          query.resolution,
          createdDate,
          updatedDate,
          answer,
          imageNames
        ]
      });
      
      return {
        csvRow: [
          `"${(query.title || '').replace(/"/g, '""')}"`,
          `"${(query.description || '').replace(/"/g, '""')}"`,
          query.status,
          `"${(query.student_name || '').replace(/"/g, '""')}"`,
          `"${(query.student_domain || '').replace(/"/g, '""')}"`,
          `"${(query.teacher_name || '').replace(/"/g, '""')}"`,
          `"${(query.design_stage_name || '').replace(/"/g, '""')}"`,
          `"${(query.issue_category_name || '').replace(/"/g, '""')}"`,
          `"${(query.tool_name || '').replace(/"/g, '""')}"`,
          `"${(query.debug_steps || '').replace(/"/g, '""')}"`,
          `"${(query.resolution || '').replace(/"/g, '""')}"`,
          createdDate,
          updatedDate,
          `"${answer.replace(/"/g, '""')}"`,
          `"${imageNames.replace(/"/g, '""')}"`
        ],
        images: images
      };
    }));

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.csvRow.join(','))].join('\n');

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    });

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="resolved_queries_${new Date().toISOString().split('T')[0]}.zip"`);

    // Pipe archive data to response
    archive.pipe(res);

    // Add CSV file to archive
    archive.append(csvContent, { name: 'queries.csv' });

    // Add images to archive
    for (const queryData of csvRows) {
      for (const image of queryData.images) {
        if (fs.existsSync(image.file_path)) {
          const fileName = `${image.original_name}`;
          archive.file(image.file_path, { name: `images/${fileName}` });
        }
      }
    }

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('ZIP export error:', error);
    res.status(500).json({ message: 'Failed to export queries' });
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
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN domain_stages ds ON q.stage_id = ds.id
        LEFT JOIN domain_issue_categories ic ON q.issue_category_id = ic.id
        WHERE q.id = ? AND q.student_id = ?
      `;
      params = [queryId, req.user.userId];
    } else {
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.teacher_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN domain_stages ds ON q.stage_id = ds.id
        LEFT JOIN domain_issue_categories ic ON q.issue_category_id = ic.id
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

// Add response to query (expert reviewers and admins)
router.post('/:id/responses', auth, checkRole(['expert_reviewer', 'admin']), [
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

          // Update query status and assign expert reviewer
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

// Update query status (expert reviewers and admins)
router.put('/:id/status', auth, checkRole(['expert_reviewer', 'admin']), [
  body('status').isIn(['open', 'in_progress', 'resolved']).withMessage('Invalid status')
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
  body('stage_id').optional().isInt(),
  body('issue_category_id').optional().isInt(),
  body('custom_issue_category').optional(),
  body('debug_steps').optional(),
  body('resolution').optional(),
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
      // Expert reviewers can edit any query
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

// Export single query to ZIP with CSV and images (expert reviewers and admins)
router.get('/:id/export', auth, checkRole(['expert_reviewer', 'admin']), async (req, res) => {
  try {
    const queryId = req.params.id;
    const archiver = require('archiver');
    const fs = require('fs');
    const path = require('path');
    
    // Get single query with related data
    const [queries] = await db.execute(`
      SELECT 
        q.id,
        q.title,
        q.description,
        q.status,
        q.resolution_attempts,
        q.debug_steps,
        q.resolution,
        q.created_at,
        q.updated_at,
        u.full_name as student_name,
        d.name as student_domain,
        t.full_name as teacher_name,
        ds.name as design_stage_name,
        COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
        tool.name as tool_name
      FROM queries q
      JOIN users u ON q.student_id = u.id
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN users t ON q.teacher_id = t.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN domain_stages ds ON q.stage_id = ds.id
      LEFT JOIN domain_issue_categories ic ON q.issue_category_id = ic.id
      WHERE q.id = ?
    `, [queryId]);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    const query = queries[0];

    // Check if query is resolved
    if (query.status !== 'resolved') {
      return res.status(400).json({ message: 'Only resolved queries can be exported' });
    }

    // Get responses for this query
    const [responses] = await db.execute(`
      SELECT 
        r.id,
        r.answer,
        r.created_at,
        u.full_name as teacher_name
      FROM responses r
      JOIN users u ON r.teacher_id = u.id
      WHERE r.query_id = ?
      ORDER BY r.created_at ASC
    `, [queryId]);

    // Get images for this query
    const [images] = await db.execute(`
      SELECT 
        id,
        filename,
        original_name,
        file_path,
        file_size,
        mime_type,
        created_at
      FROM query_images 
      WHERE query_id = ?
      ORDER BY created_at ASC
    `, [queryId]);

    // Create CSV content for single query with same columns as queries list
    const csvHeaders = [
      'Title',
      'Description',
      'Status',
      'Student Name',
      'Student Domain',
      'Expert Reviewer Name',
      'Design Stage',
      'Issue Category',
      'Tool',
      'Debug Steps',
      'Resolution',
      'Created Date',
      'Updated Date',
      'Answer',
      'Images'
    ];

    // Get the latest response as the answer
    const latestResponse = responses.length > 0 ? responses[responses.length - 1] : null;
    const answer = latestResponse ? latestResponse.answer : '';
    const imageNames = images.map(img => img.original_name).join('; ');
    
    // Format dates to show only date without timezone - use consistent format
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const day = days[date.getDay()];
      const month = months[date.getMonth()];
      const dateNum = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day} ${month} ${dateNum} ${year}`;
    };
    
    const createdDate = formatDate(query.created_at);
    const updatedDate = formatDate(query.updated_at);
    
    console.log(`Exporting query ${queryId}:`, {
      queryTitle: query.title,
      responseCount: responses.length,
      hasAnswer: !!latestResponse,
      answerLength: answer.length,
      imageCount: images.length,
      imageNames: imageNames,
      resolution: query.resolution,
      resolutionAttempts: query.resolution_attempts,
      debugSteps: query.debug_steps
    });

    const csvRows = [
      [
        `"${(query.title || '').replace(/"/g, '""')}"`,
        `"${(query.description || '').replace(/"/g, '""')}"`,
        query.status,
        `"${(query.student_name || '').replace(/"/g, '""')}"`,
        `"${(query.student_domain || '').replace(/"/g, '""')}"`,
        `"${(query.teacher_name || '').replace(/"/g, '""')}"`,
        `"${(query.design_stage_name || '').replace(/"/g, '""')}"`,
        `"${(query.issue_category_name || '').replace(/"/g, '""')}"`,
        `"${(query.tool_name || '').replace(/"/g, '""')}"`,
        `"${(query.debug_steps || '').replace(/"/g, '""')}"`,
        `"${(query.resolution || '').replace(/"/g, '""')}"`,
        createdDate,
        updatedDate,
        `"${answer.replace(/"/g, '""')}"`,
        `"${imageNames.replace(/"/g, '""')}"`
      ]
    ];

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    });

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="query_${queryId}_${query.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip"`);

    // Pipe archive data to response
    archive.pipe(res);

    // Add CSV file to archive
    archive.append(csvContent, { name: 'query.csv' });

    // Add images to archive
    for (const image of images) {
      if (fs.existsSync(image.file_path)) {
        const fileName = `${image.original_name}`;
        archive.file(image.file_path, { name: `images/${fileName}` });
      }
    }

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('Single query ZIP export error:', error);
    res.status(500).json({ message: 'Failed to export query' });
  }
});

// Delete query (admin only)
router.delete('/:id', auth, checkRole(['admin']), async (req, res) => {
  try {
    const queryId = req.params.id;

    // Check if query exists
    const [queries] = await db.execute(
      'SELECT * FROM queries WHERE id = ?',
      [queryId]
    );

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Delete query assignments first (due to foreign key constraint)
    await db.execute(
      'DELETE FROM query_assignments WHERE query_id = ?',
      [queryId]
    );

    // Delete responses first (due to foreign key constraint)
    await db.execute(
      'DELETE FROM responses WHERE query_id = ?',
      [queryId]
    );

    // Delete query images first (due to foreign key constraint)
    await db.execute(
      'DELETE FROM query_images WHERE query_id = ?',
      [queryId]
    );

    // Delete the query
    await db.execute(
      'DELETE FROM queries WHERE id = ?',
      [queryId]
    );

    res.json({ message: 'Query deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 