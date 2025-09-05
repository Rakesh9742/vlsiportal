const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const { uploadImages, handleUploadError } = require('../middleware/upload');
const domainConfig = require('../../domain_config');
const { generateUniqueCustomQueryId } = require('../utils/queryIdGenerator');
const archiver = require('archiver');

const router = express.Router();

// Get stages for a specific domain
router.get('/pd-stages', async (req, res) => {
  try {
    const { domainId } = req.query;
    
    if (!domainId) {
      return res.status(400).json({ message: 'Domain ID is required' });
    }
    
    const [stages] = await db.execute(
      'SELECT * FROM stages WHERE domain_id = ? ORDER BY order_sequence, id',
      [domainId]
    );
    res.json({ stages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Physical Design issue categories for a specific stage
router.get('/pd-issue-categories/:stageId', async (req, res) => {
  try {
    const { stageId } = req.params;
    const [categories] = await db.execute(
      'SELECT * FROM issue_categories WHERE stage_id = ? ORDER BY name',
      [stageId]
    );
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get domain-specific stages for any domain
router.get('/domain-stages/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;
    const [stages] = await db.execute(
      'SELECT * FROM stages WHERE domain_id = ? ORDER BY id',
      [domainId]
    );
    res.json({ stages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check specific category ID
router.get('/debug-category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [categories] = await db.execute(
      'SELECT id, name, domain_id, stage_id FROM issue_categories WHERE id = ?',
      [id]
    );
    res.json({ category: categories[0] || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get domain-specific issue categories for a specific stage
router.get('/domain-issue-categories/:stageId', async (req, res) => {
  try {
    const { stageId } = req.params;
    const [categories] = await db.execute(
      'SELECT * FROM issue_categories WHERE stage_id = ? ORDER BY name',
      [stageId]
    );
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get issue categories for a specific domain
router.get('/pd-issue-categories', async (req, res) => {
  try {
    const { domainId } = req.query;
    
    if (!domainId) {
      return res.status(400).json({ message: 'Domain ID is required' });
    }
    
    const [categories] = await db.execute(`
      SELECT ic.*, ps.name as stage_name 
      FROM issue_categories ic 
      JOIN stages ps ON ic.stage_id = ps.id 
      WHERE ps.domain_id = ?
      ORDER BY ps.order_sequence, ps.id, ic.name
    `, [domainId]);
    res.json({ categories });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Get domain stages and issue categories by domain ID
router.get('/domain-config-by-id/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;
    
    // Get domain name first
    const [domains] = await db.execute(
      'SELECT name FROM domains WHERE id = ?',
      [domainId]
    );
    
    if (domains.length === 0) {
      return res.status(404).json({ message: 'Domain not found' });
    }
    
    const domainName = domains[0].name;
    
    // Get stages for this domain
    const [stages] = await db.execute(
      'SELECT * FROM stages WHERE domain_id = ? ORDER BY id',
      [domainId]
    );
    
    // Get issue categories for this domain
    const [categories] = await db.execute(`
      SELECT ic.*, ds.name as stage_name 
      FROM issue_categories ic 
      JOIN stages ds ON ic.stage_id = ds.id 
      WHERE ic.domain_id = ?
      ORDER BY ds.id, ic.name
    `, [domainId]);
    
    // Group categories by stage
    const issueCategories = {};
    stages.forEach(stage => {
      issueCategories[stage.name] = categories
        .filter(cat => cat.stage_id === stage.id)
        .map(cat => cat.name);
    });
    
    res.json({ 
      domain: domainName,
      domainId: parseInt(domainId),
      stages: stages.map(stage => stage.name),
      issueCategories: issueCategories
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all domains with their stages and issue categories
router.get('/domain-config', async (req, res) => {
  try {
    res.json({ domains: domainConfig });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tools
router.get('/tools', async (req, res) => {
  try {
    const [tools] = await db.execute('SELECT * FROM tools ORDER BY name');
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tools by domain
router.get('/tools/:domainId', async (req, res) => {
  try {
    const { domainId } = req.params;
    const [tools] = await db.execute(
      'SELECT * FROM tools WHERE domain_id = ? ORDER BY name',
      [domainId]
    );
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all technologies (now stored as text in queries table)
router.get('/technologies', async (req, res) => {
  try {
    // Since technologies are now stored as text in queries table,
    // we can return an empty array or get unique technologies from existing queries
    const [technologies] = await db.execute(`
      SELECT DISTINCT technology as name 
      FROM queries 
      WHERE technology IS NOT NULL AND technology != '' 
      ORDER BY technology
    `);
    res.json({ technologies });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new query with image uploads (students and professionals)
router.post('/', auth, checkRole(['student', 'professional']), uploadImages, handleUploadError, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('tool_id').optional().isInt().withMessage('Tool ID must be a number'),
  body('technology').optional().isString().withMessage('Technology must be a string'),
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
      technology,
      stage_id,
      custom_issue_category,
      debug_steps,
      resolution
    } = req.body;
    const studentId = req.user.userId;

    // Get student's domain information for custom query ID generation
    const [studentInfo] = await db.execute(`
      SELECT u.id, u.full_name, d.name as domain_name 
      FROM users u 
      LEFT JOIN domains d ON u.domain_id = d.id 
      WHERE u.id = ?
    `, [studentId]);

    if (studentInfo.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const domainName = studentInfo[0].domain_name || 'General';

    // Generate custom query ID
    const customQueryId = await generateUniqueCustomQueryId(studentId, domainName);

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Build query fields and values (including custom_query_id)
      const queryFields = ['student_id', 'custom_query_id', 'title', 'description', 'tool_id', 'technology', 'stage_id', 'debug_steps', 'resolution'];
      const queryValues = [studentId, customQueryId, title, description, tool_id, technology, stage_id, debug_steps, resolution];
      
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
        customQueryId: customQueryId,
        imagesUploaded: req.files ? req.files.length : 0
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resolved queries from same domain (for students)
router.get('/resolved-domain', auth, checkRole(['student', 'professional']), async (req, res) => {
  try {
    // Get user's domain
    const [userDomain] = await db.execute(`
      SELECT d.id, d.name 
      FROM users u 
      JOIN domains d ON u.domain_id = d.id 
      WHERE u.id = ?
    `, [req.user.userId]);

    if (userDomain.length === 0) {
      return res.json({ queries: [] });
    }

    const domainId = userDomain[0].id;

    // Get all resolved queries from the same domain (excluding user's own queries)
    const query = `
      SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
             tool.name as tool_name, d.name as student_domain,
             ds.name as design_stage_name,
             COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
             q.custom_query_id
      FROM queries q
      JOIN users u ON q.student_id = u.id
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN users t ON q.expert_reviewer_id = t.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN stages ds ON q.stage_id = ds.id
      LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
      WHERE d.id = ? AND q.status = 'resolved' AND q.student_id != ?
      ORDER BY q.created_at DESC
    `;

    const [queries] = await db.execute(query, [domainId, req.user.userId]);
    res.json({ queries });
  } catch (error) {
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
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
               q.custom_query_id
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE q.student_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [req.user.userId];
    } else if (req.user.role === 'expert_reviewer') {
      // Expert reviewers see only queries assigned to them
      query = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
               q.custom_query_id, qa.status as assignment_status
        FROM queries q
        JOIN query_assignments qa ON q.id = qa.query_id
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE qa.expert_reviewer_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [req.user.userId];
    } else if (req.user.role === 'professional') {
      // Professionals see only their own queries (like students)
      query = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
               q.custom_query_id
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE q.student_id = ?
        ORDER BY q.created_at DESC
      `;
      params = [req.user.userId];
    } else {
      // Admin sees all queries
      query = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
               q.custom_query_id
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        ORDER BY q.created_at DESC
      `;
    }

    const [queries] = await db.execute(query, params);
    res.json({ queries });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Export resolved queries from same domain as ZIP (for students)
router.get('/export-resolved-domain', auth, checkRole(['student', 'professional']), async (req, res) => {
  try {
    // Get user's domain
    const [userDomain] = await db.execute(`
      SELECT d.id, d.name 
      FROM users u 
      JOIN domains d ON u.domain_id = d.id 
      WHERE u.id = ?
    `, [req.user.userId]);

    if (userDomain.length === 0) {
      return res.status(404).json({ message: 'User domain not found' });
    }

    const domainId = userDomain[0].id;
    const domainName = userDomain[0].name;

    // Get all resolved queries from the same domain (excluding user's own queries)
    const [queries] = await db.execute(`
      SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
             tool.name as tool_name, d.name as student_domain,
             ds.name as design_stage_name,
             COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
             q.custom_query_id
      FROM queries q
      JOIN users u ON q.student_id = u.id
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN users t ON q.expert_reviewer_id = t.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN stages ds ON q.stage_id = ds.id
      LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
      WHERE d.id = ? AND q.status = 'resolved' AND q.student_id != ?
      ORDER BY q.created_at DESC
    `, [domainId, req.user.userId]);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'No resolved queries found in your domain' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.attachment(`resolved_queries_${domainName}_${new Date().toISOString().split('T')[0]}.zip`);
    archive.pipe(res);

    // Create CSV content
    const csvHeader = 'Query ID,Custom Query ID,Title,Description,Student Name,Teacher Name,Tool,Domain,Design Stage,Issue Category,Status,Created At,Updated At\n';
    let csvContent = csvHeader;

    queries.forEach(query => {
      const row = [
        query.id,
        query.custom_query_id || '',
        `"${(query.title || '').replace(/"/g, '""')}"`,
        `"${(query.description || '').replace(/"/g, '""')}"`,
        `"${(query.student_name || '').replace(/"/g, '""')}"`,
        `"${(query.teacher_name || '').replace(/"/g, '""')}"`,
        `"${(query.tool_name || '').replace(/"/g, '""')}"`,
        `"${(query.student_domain || '').replace(/"/g, '""')}"`,
        `"${(query.design_stage_name || '').replace(/"/g, '""')}"`,
        `"${(query.issue_category_name || '').replace(/"/g, '""')}"`,
        query.status,
        query.created_at,
        query.updated_at
      ].join(',');
      csvContent += row + '\n';
    });

    archive.append(csvContent, { name: 'resolved_queries.csv' });

    // Add individual query files
    for (const query of queries) {
      const queryContent = `Query ID: ${query.id}\n` +
        `Custom Query ID: ${query.custom_query_id || 'N/A'}\n` +
        `Title: ${query.title}\n` +
        `Description: ${query.description}\n` +
        `Student: ${query.student_name}\n` +
        `Teacher: ${query.teacher_name || 'Not assigned'}\n` +
        `Tool: ${query.tool_name || 'N/A'}\n` +
        `Domain: ${query.student_domain}\n` +
        `Design Stage: ${query.design_stage_name || 'N/A'}\n` +
        `Issue Category: ${query.issue_category_name || 'N/A'}\n` +
        `Status: ${query.status}\n` +
        `Created: ${query.created_at}\n` +
        `Updated: ${query.updated_at}\n`;
      
      const filename = `query_${query.custom_query_id || query.id}.txt`;
      archive.append(queryContent, { name: filename });
    }

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Export queries to ZIP with CSV and images (admins only)
router.get('/export', auth, checkRole(['admin']), async (req, res) => {
  try {
    const archiver = require('archiver');
    const fs = require('fs');
    const path = require('path');


    // Get all resolved queries (admin access only)
    const query = `
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
      LEFT JOIN users t ON q.expert_reviewer_id = t.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN stages ds ON q.stage_id = ds.id
      LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
      WHERE q.status = 'resolved'
      ORDER BY q.created_at DESC
    `;
    const params = [];
    
    const [queries] = await db.execute(query, params);


    // Check if there are any resolved queries
    if (queries.length === 0) {
      return res.status(404).json({ message: 'No resolved queries found for export' });
    }

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
      try {
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
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
              return 'Invalid Date';
            }
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            const day = days[date.getDay()];
            const month = months[date.getMonth()];
            const dateNum = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear();
            
            return `${day} ${month} ${dateNum} ${year}`;
          } catch (dateError) {
            return 'Invalid Date';
          }
        };
        
        const createdDate = formatDate(query.created_at);
        const updatedDate = formatDate(query.updated_at);
        
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
      } catch (queryError) {
        // Return a basic row for this query to avoid breaking the entire export
        return {
          csvRow: [
            `"${(query.title || '').replace(/"/g, '""')}"`,
            `"${(query.description || '').replace(/"/g, '""')}"`,
            query.status || 'unknown',
            `"${(query.student_name || '').replace(/"/g, '""')}"`,
            `"${(query.student_domain || '').replace(/"/g, '""')}"`,
            `"${(query.teacher_name || '').replace(/"/g, '""')}"`,
            `"${(query.design_stage_name || '').replace(/"/g, '""')}"`,
            `"${(query.issue_category_name || '').replace(/"/g, '""')}"`,
            `"${(query.tool_name || '').replace(/"/g, '""')}"`,
            `"${(query.debug_steps || '').replace(/"/g, '""')}"`,
            `"${(query.resolution || '').replace(/"/g, '""')}"`,
            'Invalid Date',
            'Invalid Date',
            'Error retrieving answer',
            'Error retrieving images'
          ],
          images: []
        };
      }
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
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE q.id = ? AND (q.student_id = ? OR (q.status = 'resolved' AND d.id = ?))
      `;
      params = [queryId, req.user.userId, req.user.domainId];
    } else if (req.user.role === 'expert_reviewer') {
      // Expert reviewers see only queries assigned to them
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN query_assignments qa ON q.id = qa.query_id
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE q.id = ? AND qa.expert_reviewer_id = ?
      `;
      params = [queryId, req.user.userId];
    } else if (req.user.role === 'professional') {
      // Professionals see their own queries and resolved queries from their domain
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE q.id = ? AND (q.student_id = ? OR (q.status = 'resolved' AND d.id = ?))
      `;
      params = [queryId, req.user.userId, req.user.domainId];
    } else {
      // Admin sees all queries
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               ds.name as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
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
       JOIN users u ON r.responder_id = u.id
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

    // Check if query exists and if expert reviewer is assigned to it
    let queryCheckSql;
    let queryCheckParams;
    
    if (req.user.role === 'expert_reviewer') {
      queryCheckSql = `
        SELECT q.* FROM queries q
        JOIN query_assignments qa ON q.id = qa.query_id
        WHERE q.id = ? AND qa.expert_reviewer_id = ?
      `;
      queryCheckParams = [queryId, req.user.userId];
    } else {
      queryCheckSql = 'SELECT * FROM queries WHERE id = ?';
      queryCheckParams = [queryId];
    }
    
    const [queries] = await db.execute(queryCheckSql, queryCheckParams);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found or not assigned to you' });
    }

    // Add response
    await db.execute(
      'INSERT INTO responses (query_id, responder_id, content) VALUES (?, ?, ?)',
      [queryId, teacherId, answer]
    );

          // Update query status and assign expert reviewer
    await db.execute(
      'UPDATE queries SET status = ?, expert_reviewer_id = ? WHERE id = ?',
      ['in_progress', teacherId, queryId]
    );

    res.json({ message: 'Response added successfully' });
  } catch (error) {
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

    // Check if query exists and if expert reviewer is assigned to it
    let queryCheckSql;
    let queryCheckParams;
    
    if (req.user.role === 'expert_reviewer') {
      queryCheckSql = `
        SELECT q.* FROM queries q
        JOIN query_assignments qa ON q.id = qa.query_id
        WHERE q.id = ? AND qa.expert_reviewer_id = ?
      `;
      queryCheckParams = [queryId, req.user.userId];
    } else {
      queryCheckSql = 'SELECT * FROM queries WHERE id = ?';
      queryCheckParams = [queryId];
    }
    
    const [queries] = await db.execute(queryCheckSql, queryCheckParams);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found or not assigned to you' });
    }

    // Update query status
    await db.execute(
      'UPDATE queries SET status = ? WHERE id = ?',
      [status, queryId]
    );

    res.json({ message: 'Query status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update query (students and teachers)
router.put('/:id', auth, [
  body('title').optional(),
  body('description').optional(),
  body('tool_id').optional().isInt(),
  body('technology').optional().isString(),
  body('stage_id').optional().isInt(),
  body('issue_category_id').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return Number.isInteger(Number(value));
  }),
  body('custom_issue_category').optional(),
  body('debug_steps').optional(),
  body('resolution').optional(),
  body('resolution_attempts').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Update query validation errors:', errors.array());
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
    } else if (userRole === 'expert_reviewer') {
      // Expert reviewers can edit queries assigned to them only
      sqlQuery = `
        SELECT q.* FROM queries q
        JOIN query_assignments qa ON q.id = qa.query_id
        WHERE q.id = ? AND qa.expert_reviewer_id = ?
      `;
      params = [queryId, userId];
    } else if (userRole === 'professional') {
      // Professionals can only edit their own queries (like students)
      sqlQuery = 'SELECT * FROM queries WHERE id = ? AND student_id = ?';
      params = [queryId, userId];
    } else {
      // Admin can edit any query
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

    if (userRole === 'student' || userRole === 'professional') {
      // Students and professionals can only delete images from their own queries
      sqlQuery = 'SELECT * FROM queries WHERE id = ? AND student_id = ?';
      params = [queryId, userId];
    } else if (userRole === 'expert_reviewer') {
      // Expert reviewers can delete images from queries assigned to them
      sqlQuery = `
        SELECT q.* FROM queries q
        JOIN query_assignments qa ON q.id = qa.query_id
        WHERE q.id = ? AND qa.expert_reviewer_id = ?
      `;
      params = [queryId, userId];
    } else {
      // Admin can delete images from any query
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Export single query to ZIP with CSV and images (admins only)
router.get('/:id/export', auth, checkRole(['admin']), async (req, res) => {
  try {
    const queryId = req.params.id;
    const archiver = require('archiver');
    const fs = require('fs');
    const path = require('path');
    
    // Get single query with related data (admin access only)
    const query = `
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
      LEFT JOIN users t ON q.expert_reviewer_id = t.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN stages ds ON q.stage_id = ds.id
      LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
      WHERE q.id = ?
    `;
    const params = [queryId];
    
    const [queries] = await db.execute(query, params);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    const queryData = queries[0];

    // Check if query is resolved
    if (queryData.status !== 'resolved') {
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
    
    const createdDate = formatDate(queryData.created_at);
    const updatedDate = formatDate(queryData.updated_at);
    
    console.log(`Exporting query ${queryId}:`, {
      queryTitle: queryData.title,
      responseCount: responses.length,
      hasAnswer: !!latestResponse,
      answerLength: answer.length,
      imageCount: images.length,
      imageNames: imageNames,
      resolution: queryData.resolution,
      resolutionAttempts: queryData.resolution_attempts,
      debugSteps: queryData.debug_steps
    });

    const csvRows = [
      [
        `"${(queryData.title || '').replace(/"/g, '""')}"`,
        `"${(queryData.description || '').replace(/"/g, '""')}"`,
        queryData.status,
        `"${(queryData.student_name || '').replace(/"/g, '""')}"`,
        `"${(queryData.student_domain || '').replace(/"/g, '""')}"`,
        `"${(queryData.teacher_name || '').replace(/"/g, '""')}"`,
        `"${(queryData.design_stage_name || '').replace(/"/g, '""')}"`,
        `"${(queryData.issue_category_name || '').replace(/"/g, '""')}"`,
        `"${(queryData.tool_name || '').replace(/"/g, '""')}"`,
        `"${(queryData.debug_steps || '').replace(/"/g, '""')}"`,
        `"${(queryData.resolution || '').replace(/"/g, '""')}"`,
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
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;