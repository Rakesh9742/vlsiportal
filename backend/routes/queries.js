const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');
const { uploadImages, handleUploadError } = require('../middleware/upload');
const domainConfig = require('../../domain_config');
const { generateUniqueCustomQueryId } = require('../utils/queryIdGenerator');
const { createNotification } = require('./notifications');
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
    console.error('Error in POST /:id/responses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Physical Design issue categories for a specific stage
router.get('/pd-issue-categories/:stageId', async (req, res) => {
  try {
    const { stageId } = req.params;
    console.log(`DEBUG: Fetching issue categories for stage_id: ${stageId}`);
    
    const [categories] = await db.execute(
      'SELECT * FROM issue_categories WHERE stage_id = ? ORDER BY name',
      [stageId]
    );
    
    console.log(`DEBUG: Found ${categories.length} categories for stage_id ${stageId}`);
    if (categories.length > 0) {
      console.log('DEBUG: Categories found:', categories.map(c => `${c.id}: ${c.name}`));
    } else {
      console.log('DEBUG: No categories found for this stage_id');
    }
    
    res.json({ categories });
  } catch (error) {
    console.error('DEBUG: Error in pd-issue-categories endpoint:', error);
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
    console.log(`DEBUG: Fetching domain issue categories for stage_id: ${stageId}`);
    
    // First, let's check if this stage exists and get its details
    const [stageInfo] = await db.execute(
      'SELECT * FROM stages WHERE id = ?',
      [stageId]
    );
    console.log(`DEBUG: Stage info for stage_id ${stageId}:`, stageInfo[0] || 'No stage found');
    
    const [categories] = await db.execute(
      'SELECT * FROM issue_categories WHERE stage_id = ? ORDER BY name',
      [stageId]
    );
    
    console.log(`DEBUG: Found ${categories.length} domain categories for stage_id ${stageId}`);
    if (categories.length > 0) {
      console.log('DEBUG: Domain categories found:', categories.map(c => `${c.id}: ${c.name}`));
    } else {
      console.log('DEBUG: No domain categories found for this stage_id');
      // Let's also check what issue_categories exist in the database
      const [allCategories] = await db.execute(
        'SELECT stage_id, COUNT(*) as count FROM issue_categories GROUP BY stage_id ORDER BY stage_id'
      );
      console.log('DEBUG: All stage_id counts in issue_categories:', allCategories);
    }
    
    res.json({ categories });
  } catch (error) {
    console.error('DEBUG: Error in domain-issue-categories endpoint:', error);
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

// DV Domain Routes
// Get DV issue categories
router.get('/dv-issue-categories', async (req, res) => {
  try {
    const [categories] = await db.execute(
      'SELECT * FROM dv_issue_categories WHERE is_active = 1 ORDER BY name'
    );
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get DV tools for a specific issue category
router.get('/dv-tools/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const [tools] = await db.execute(`
      SELECT t.* FROM tools t
      JOIN dv_category_tools dct ON t.id = dct.tool_id
      WHERE dct.category_id = ? AND t.is_active = 1 AND dct.is_active = 1
      ORDER BY t.name
    `, [categoryId]);
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all DV tools
router.get('/dv-tools', async (req, res) => {
  try {
    const [tools] = await db.execute(
      'SELECT * FROM tools WHERE domain_id = 3 AND is_active = 1 ORDER BY name'
    );
    res.json({ tools });
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
  body('stage_id').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    if (value === 'others') return true; // Allow custom stage
    return Number.isInteger(Number(value));
  }).withMessage('Stage ID must be a number, "others" for custom stage, or empty for domains without stages'),
  body('custom_issue_category').optional(),
  body('custom_stage').optional(),
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
      custom_stage,
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
      const queryFields = ['student_id', 'custom_query_id', 'title', 'description', 'tool_id', 'technology', 'stage_id', 'custom_stage', 'debug_steps', 'resolution'];
      // Handle custom stage - set stage_id to null when "others" is selected
      const processedStageId = stage_id === 'others' ? null : (stage_id || null);
      const processedCustomStage = stage_id === 'others' ? (custom_stage || null) : null;
      
      // For DV domain, tool_id should be a valid database ID from dv_tools table
      let processedToolId = tool_id || null;
      
      // Ensure all values are null instead of undefined
      const queryValues = [
        studentId, 
        customQueryId, 
        title, 
        description, 
        processedToolId, 
        technology || null, 
        processedStageId, 
        processedCustomStage, 
        debug_steps || null, 
        resolution || null
      ];
      
      // Handle custom issue category
      let issue_category_id = null;
      if (custom_issue_category) {
        // If custom category is provided, set issue_category_id to null and use custom_issue_category
        queryFields.push('custom_issue_category');
        queryValues.push(custom_issue_category || null);
      } else {
        // For DV domain, we need to check if this is a DV tool to determine the domain
        let isDVQuery = false;
        if (processedToolId) {
          // Check if the tool_id belongs to DV domain (domain_id = 3)
          const [dvToolCheck] = await connection.execute(
            'SELECT id FROM tools WHERE id = ? AND domain_id = 3',
            [processedToolId]
          );
          isDVQuery = dvToolCheck.length > 0;
        }
        
        if (isDVQuery) {
          // This is a DV domain query, store the issue category name in custom_issue_category
          const categoryName = req.body.issue_category_name || 'Unknown Category';
          queryFields.push('custom_issue_category');
          queryValues.push(categoryName);
        } else {
          // If no custom category, use the regular issue_category_id from the form
          queryFields.push('issue_category_id');
          queryValues.push(req.body.issue_category_id || null);
        }
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

      // Send notification to all admins when a new query is created
      try {
        // Get super admins
        const [superAdmins] = await db.execute(
          'SELECT id FROM users WHERE role = "admin"'
        );
        
        // Get domain admins for this student's domain
        const [domainAdmins] = await db.execute(
          'SELECT id FROM users WHERE role = "domain_admin" AND domain_id = ?',
          [studentInfo[0].domain_id]
        );
        
        // Send notifications to super admins
        for (const admin of superAdmins) {
          await createNotification(
            admin.id,
            queryId,
            'query_created',
            'New Query Created',
            `A new query "${title}" has been created by ${studentInfo[0].full_name}`,
            { student_id: studentId, student_name: studentInfo[0].full_name }
          );
        }
        
        // Send notifications to domain admins
        for (const admin of domainAdmins) {
          await createNotification(
            admin.id,
            queryId,
            'query_created',
            'New Query Created',
            `A new query "${title}" has been created by ${studentInfo[0].full_name} in your domain`,
            { student_id: studentId, student_name: studentInfo[0].full_name }
          );
        }
      } catch (notificationError) {
        console.error('Error sending notifications to admins:', notificationError);
        // Don't fail the query creation if notification fails
      }

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
    console.error('Error creating query:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get resolved queries from same domain (for students)
router.get('/resolved-domain', auth, checkRole(['student', 'professional']), async (req, res) => {
  try {
    // First, get user's complete info including domain
    const [userInfo] = await db.execute(`
      SELECT u.id, u.username, u.full_name, u.domain_id, d.name as domain_name
      FROM users u 
      LEFT JOIN domains d ON u.domain_id = d.id 
      WHERE u.id = ?
    `, [req.user.userId]);

    if (userInfo.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userInfo[0];
    if (!user.domain_id) {
      return res.json({ 
        queries: [],
        message: 'No domain assigned to user'
      });
    }

    // Get all resolved queries from the same domain (including user's own queries)
    const query = `
      SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
             tool.name as tool_name, d.name as student_domain,
             COALESCE(ds.name, q.custom_stage) as design_stage_name,
             COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
             q.custom_query_id
      FROM queries q
      JOIN users u ON q.student_id = u.id
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN users t ON q.expert_reviewer_id = t.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN stages ds ON q.stage_id = ds.id
      LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
      WHERE u.domain_id = ? AND q.status = 'resolved'
      ORDER BY q.created_at DESC
    `;

    const [queries] = await db.execute(query, [user.domain_id]);
    res.json({ queries });
  } catch (error) {
    console.error('Error in resolved-domain endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
             COALESCE(ds.name, q.custom_stage) as design_stage_name,
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

// New Export queries to ZIP with CSV and images (admins only) - Fixed version
router.get('/export-new', auth, checkRole(['admin']), async (req, res) => {
  try {
    console.log('NEW Export function called by user:', req.user.userId, 'role:', req.user.role);
    const archiver = require('archiver');
    const fs = require('fs');
    const path = require('path');

    // Get all resolved queries with a simpler query
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
      LEFT JOIN users t ON q.expert_reviewer_id = t.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN stages ds ON q.stage_id = ds.id
      LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
      WHERE q.status = 'resolved'
      ORDER BY q.created_at DESC
    `);

    console.log(`NEW Export: Found ${queries.length} resolved queries`);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'No resolved queries found for export' });
    }

    // Create CSV content
    const csvHeaders = [
      'Title', 'Description', 'Status', 'Student Name', 'Student Domain',
      'Expert Reviewer Name', 'Design Stage', 'Issue Category', 'Tool',
      'Debug Steps', 'Resolution', 'Created Date', 'Updated Date', 'Answer', 'Images'
    ];

    const csvRows = [];
    let totalImages = 0;
    let addedImages = 0;

    // Process each query
    for (const query of queries) {
      console.log(`Processing query ${query.id}: ${query.title}`);
      
      // Get responses
      const [responses] = await db.execute(`
        SELECT content FROM responses 
        WHERE query_id = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [query.id]);
      
      // Get images
      const [images] = await db.execute(`
        SELECT original_name, file_path FROM query_images 
        WHERE query_id = ? 
        ORDER BY created_at ASC
      `, [query.id]);
      
      console.log(`Query ${query.id}: Found ${images.length} images`);
      
      const answer = responses.length > 0 ? responses[0].content : '';
      const imageNames = images.map(img => img.original_name).join('; ');
      
      // Format dates
      const formatDate = (dateString) => {
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return 'Invalid Date';
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
      
      csvRows.push({
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
      });
      
      totalImages += images.length;
    }

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.csvRow.join(','))].join('\n');

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="resolved_queries_${new Date().toISOString().split('T')[0]}.zip"`);
    
    archive.pipe(res);
    
    // Add CSV file
    archive.append(csvContent, { name: 'queries.csv' });
    
    // Add images
    console.log('Adding images to archive...');
    for (const row of csvRows) {
      for (const image of row.images) {
        let imagePath = image.file_path;
        if (!path.isAbsolute(imagePath)) {
          imagePath = path.join(__dirname, imagePath);
        }
        
        if (fs.existsSync(imagePath)) {
          const fileName = `${image.original_name}`;
          archive.file(imagePath, { name: `images/${fileName}` });
          addedImages++;
          console.log(`Added image: ${fileName}`);
        } else {
          console.log(`Image not found: ${imagePath}`);
        }
      }
    }
    
    console.log(`NEW Export summary: ${addedImages}/${totalImages} images added to archive`);
    
    await archive.finalize();
    
  } catch (error) {
    console.error('NEW Export error:', error);
    res.status(500).json({ message: 'Failed to export queries' });
  }
});

// Export queries to ZIP with CSV and images (admins only)
router.get('/export', auth, checkRole(['admin']), async (req, res) => {
  try {
    console.log('Export function called by user:', req.user.userId, 'role:', req.user.role);
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

    console.log(`Found ${queries.length} resolved queries for export`);
    if (queries.length > 0) {
      console.log('Sample resolved query:', {
        id: queries[0].id,
        title: queries[0].title,
        status: queries[0].status
      });
    }

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
    console.log('Starting to process queries for CSV and images...');
    const csvRows = await Promise.all(queries.map(async (query) => {
      try {
        console.log(`Processing query ${query.id}: ${query.title}`);
        // Get the latest response for this query
        const [responses] = await db.execute(`
          SELECT content FROM responses 
          WHERE query_id = ? 
          ORDER BY created_at DESC 
          LIMIT 1
        `, [query.id]);
        
        // Get images for this query
        console.log(`Fetching images for query ${query.id}...`);
        const [images] = await db.execute(`
          SELECT original_name, file_path FROM query_images 
          WHERE query_id = ? 
          ORDER BY created_at ASC
        `, [query.id]);
        
        console.log(`Query ${query.id} (${query.title}): Found ${images.length} images`);
        if (images.length > 0) {
          console.log('Sample image:', images[0]);
        } else {
          // Debug: Check if there are any images for this query at all
          const [allImages] = await db.execute(`
            SELECT * FROM query_images WHERE query_id = ?
          `, [query.id]);
          console.log(`Debug: All images for query ${query.id}:`, allImages);
        }
        
        const answer = responses.length > 0 ? responses[0].content : '';
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
    console.log('Starting to add images to archive...');
    let totalImages = 0;
    let addedImages = 0;
    for (const queryData of csvRows) {
      console.log(`Processing ${queryData.images.length} images for query data`);
      for (const image of queryData.images) {
        totalImages++;
        console.log(`Processing image ${totalImages}: ${image.original_name} at ${image.file_path}`);
        // Handle both absolute and relative paths
        let imagePath = image.file_path;
        if (!path.isAbsolute(imagePath)) {
          // If it's a relative path, make it absolute
          imagePath = path.join(__dirname, imagePath);
        }
        // If it's already absolute, use it as is
        
        if (fs.existsSync(imagePath)) {
          const fileName = `${image.original_name}`;
          archive.file(imagePath, { name: `images/${fileName}` });
          addedImages++;
        } else {
          console.log(`Image file not found: ${imagePath} (original path: ${image.file_path})`);
        }
      }
    }
    
    console.log(`Export summary: ${addedImages}/${totalImages} images added to archive`);

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('Export queries error:', error);
    res.status(500).json({ message: 'Failed to export queries' });
  }
});

// Get single query with responses and images
router.get('/:id', auth, async (req, res) => {
  try {
    const queryId = req.params.id;
    let sqlQuery;
    let params = [queryId];
    
    // Determine if queryId is numeric (database ID) or custom_query_id
    const isNumericId = /^\d+$/.test(queryId);
    const idField = isNumericId ? 'q.id' : 'q.custom_query_id';

    if (req.user.role === 'student') {
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               COALESCE(ds.name, q.custom_stage) as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE ${idField} = ? AND (q.student_id = ? OR (q.status = 'resolved' AND d.id = ?))
      `;
      params = [queryId, req.user.userId, req.user.domainId];
    } else if (req.user.role === 'expert_reviewer') {
      // Expert reviewers see only queries assigned to them
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               COALESCE(ds.name, q.custom_stage) as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN query_assignments qa ON q.id = qa.query_id
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE ${idField} = ? AND qa.expert_reviewer_id = ?
      `;
      params = [queryId, req.user.userId];
    } else if (req.user.role === 'professional') {
      // Professionals see their own queries and resolved queries from their domain
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               COALESCE(ds.name, q.custom_stage) as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE ${idField} = ? AND (q.student_id = ? OR (q.status = 'resolved' AND d.id = ?))
      `;
      params = [queryId, req.user.userId, req.user.domainId];
    } else {
      // Admin sees all queries
      sqlQuery = `
        SELECT q.*, u.full_name as student_name, t.full_name as teacher_name,
               tool.name as tool_name, d.name as student_domain,
               COALESCE(ds.name, q.custom_stage) as design_stage_name,
               COALESCE(ic.name, q.custom_issue_category) as issue_category_name
        FROM queries q
        JOIN users u ON q.student_id = u.id
        LEFT JOIN domains d ON u.domain_id = d.id
        LEFT JOIN users t ON q.expert_reviewer_id = t.id
        LEFT JOIN tools tool ON q.tool_id = tool.id
        LEFT JOIN stages ds ON q.stage_id = ds.id
        LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
        WHERE ${idField} = ?
      `;
    }

    const [queries] = await db.execute(sqlQuery, params);

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    const query = queries[0];
    const numericQueryId = query.id; // Use the actual numeric ID from the database

    // Get responses for this query
    const [responses] = await db.execute(
      `SELECT r.*, u.full_name as teacher_name
       FROM responses r
       JOIN users u ON r.responder_id = u.id
       WHERE r.query_id = ?
       ORDER BY r.created_at ASC`,
      [numericQueryId]
    );

    // Get images for this query
    const [images] = await db.execute(
      `SELECT id, filename, original_name, file_size, mime_type, created_at
       FROM query_images 
       WHERE query_id = ?
       ORDER BY created_at ASC`,
      [numericQueryId]
    );

    query.responses = responses;
    query.images = images;

    res.json({ query });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add response to query (expert reviewers and admins)
router.post('/:id/responses', auth, checkRole(['expert_reviewer', 'admin', 'domain_admin']), [
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
    } else if (req.user.role === 'domain_admin') {
      // Domain admin can respond to queries from their domain
      queryCheckSql = `
        SELECT q.* FROM queries q
        JOIN users u ON q.student_id = u.id
        WHERE q.id = ? AND u.domain_id = ?
      `;
      queryCheckParams = [queryId, req.user.domainId];
    } else {
      // Super admin can respond to any query
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

    // Get responder name for notification
    const [responder] = await db.execute(
      'SELECT full_name FROM users WHERE id = ?',
      [teacherId]
    );

    // Create or get chat for this query and add response as first message
    const query = queries[0];
    let [chat] = await db.execute(
      'SELECT * FROM query_chats WHERE query_id = ?',
      [queryId]
    );

    let chatId;
    if (chat.length === 0) {
      // Create new chat
      const [chatResult] = await db.execute(
        'INSERT INTO query_chats (query_id, chat_status) VALUES (?, ?)',
        [queryId, 'active']
      );
      chatId = chatResult.insertId;
      
      // Add participants
      await db.execute(
        'INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, ?)',
        [chatId, query.student_id, 'student']
      );
      
      await db.execute(
        'INSERT INTO chat_participants (chat_id, user_id, role) VALUES (?, ?, ?)',
        [chatId, teacherId, 'expert']
      );
    } else {
      chatId = chat[0].id;
    }

    // Add the response as the first message in the chat
    await db.execute(
      'INSERT INTO chat_messages (chat_id, sender_id, message_type, content) VALUES (?, ?, ?, ?)',
      [chatId, teacherId, 'text', answer]
    );

    // Create notification for query owner
    await createNotification(
      query.student_id,
      queryId,
      'response_added',
      'New Response to Your Query',
      `${responder[0].full_name} has responded to your query: "${query.title}"`,
      { responder_id: teacherId, responder_name: responder[0].full_name }
    );

    res.json({ message: 'Response added successfully' });
  } catch (error) {
    console.error('Error in POST /:id/responses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update response (expert reviewers and admins)
router.put('/:id/responses/:responseId', auth, checkRole(['expert_reviewer', 'admin']), [
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryId = req.params.id;
    const responseId = req.params.responseId;
    const { content } = req.body;
    const userId = req.user.userId;

    // Check if response exists and belongs to the user (for expert reviewers) or allow admin to edit any
    let responseCheckSql;
    let responseCheckParams;
    
    if (req.user.role === 'expert_reviewer') {
      responseCheckSql = `
        SELECT r.* FROM responses r
        WHERE r.id = ? AND r.query_id = ? AND r.responder_id = ?
      `;
      responseCheckParams = [responseId, queryId, userId];
    } else {
      responseCheckSql = 'SELECT * FROM responses WHERE id = ? AND query_id = ?';
      responseCheckParams = [responseId, queryId];
    }
    
    const [responses] = await db.execute(responseCheckSql, responseCheckParams);

    if (responses.length === 0) {
      return res.status(404).json({ message: 'Response not found or not authorized to edit' });
    }

    // Update response
    await db.execute(
      'UPDATE responses SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content, responseId]
    );

    // Get query and responder info for notification
    const [queryInfo] = await db.execute(
      `SELECT q.student_id, q.title, u.full_name as responder_name 
       FROM queries q 
       JOIN responses r ON q.id = r.query_id 
       JOIN users u ON r.responder_id = u.id 
       WHERE q.id = ? AND r.id = ?`,
      [queryId, responseId]
    );

    if (queryInfo.length > 0) {
      // Add updated response to chat if chat exists
      const [chat] = await db.execute(
        'SELECT id FROM query_chats WHERE query_id = ?',
        [queryId]
      );

      if (chat.length > 0) {
        // Add the updated response as a new message in the chat
        await db.execute(
          'INSERT INTO chat_messages (chat_id, sender_id, message_type, content) VALUES (?, ?, ?, ?)',
          [chat[0].id, userId, 'text', content]
        );
      }

      // Create notification for query owner
      await createNotification(
        queryInfo[0].student_id,
        queryId,
        'response_updated',
        'Response Updated on Your Query',
        `${queryInfo[0].responder_name} has updated their response to your query: "${queryInfo[0].title}"`,
        { responder_id: userId, responder_name: queryInfo[0].responder_name }
      );
    }

    res.json({ message: 'Response updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update query status (expert reviewers and admins)
router.put('/:id/status', auth, checkRole(['expert_reviewer', 'admin', 'domain_admin']), [
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
    } else if (req.user.role === 'domain_admin') {
      // Domain admin can update status of queries from their domain
      queryCheckSql = `
        SELECT q.* FROM queries q
        JOIN users u ON q.student_id = u.id
        WHERE q.id = ? AND u.domain_id = ?
      `;
      queryCheckParams = [queryId, req.user.domainId];
    } else {
      // Super admin can update status of any query
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

    // Get query info for notification
    const query = queries[0];
    const [updaterInfo] = await db.execute(
      'SELECT full_name FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (updaterInfo.length > 0) {
      // Create notification for query owner
      await createNotification(
        query.student_id,
        queryId,
        'status_changed',
        'Query Status Updated',
        `${updaterInfo[0].full_name} has updated the status of your query "${query.title}" to ${status}`,
        { updater_id: req.user.userId, updater_name: updaterInfo[0].full_name, new_status: status }
      );
    }

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

    // Handle DV domain logic for updates
    let processedBody = { ...req.body };
    
    // Check if this is a DV domain query by checking the tool_id
    if (req.body.tool_id) {
      const [dvToolCheck] = await db.execute(
        'SELECT id FROM tools WHERE id = ? AND domain_id = 3',
        [req.body.tool_id]
      );
      
      if (dvToolCheck.length > 0) {
        // This is a DV domain query
        if (req.body.issue_category_name) {
          // Store the issue category name in custom_issue_category
          processedBody.custom_issue_category = req.body.issue_category_name;
          processedBody.issue_category_id = null;
        }
        // Remove issue_category_name from the update data as it's not a database field
        delete processedBody.issue_category_name;
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    Object.keys(processedBody).forEach(key => {
      if (processedBody[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(processedBody[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(queryId);

    // Store original query data for comparison
    const originalQuery = queries[0];
    
    // Track edit history for each changed field with readable values
    const editHistoryPromises = [];
    
    for (const fieldName of Object.keys(processedBody)) {
      if (processedBody[fieldName] !== undefined && originalQuery[fieldName] !== processedBody[fieldName]) {
        let oldValue = originalQuery[fieldName];
        let newValue = processedBody[fieldName];
        
        // Convert IDs to readable names for better history display
        if (fieldName === 'stage_id') {
          // Get stage names
          if (oldValue) {
            const [oldStage] = await db.execute('SELECT name FROM stages WHERE id = ?', [oldValue]);
            oldValue = oldStage.length > 0 ? oldStage[0].name : oldValue;
          }
          if (newValue) {
            const [newStage] = await db.execute('SELECT name FROM stages WHERE id = ?', [newValue]);
            newValue = newStage.length > 0 ? newStage[0].name : newValue;
          }
        } else if (fieldName === 'tool_id') {
          // Get tool names
          if (oldValue) {
            const [oldTool] = await db.execute('SELECT name FROM tools WHERE id = ?', [oldValue]);
            oldValue = oldTool.length > 0 ? oldTool[0].name : oldValue;
          }
          if (newValue) {
            const [newTool] = await db.execute('SELECT name FROM tools WHERE id = ?', [newValue]);
            newValue = newTool.length > 0 ? newTool[0].name : newValue;
          }
        } else if (fieldName === 'issue_category_id') {
          // Get issue category names
          if (oldValue) {
            const [oldCategory] = await db.execute('SELECT name FROM issue_categories WHERE id = ?', [oldValue]);
            oldValue = oldCategory.length > 0 ? oldCategory[0].name : oldValue;
          }
          if (newValue) {
            const [newCategory] = await db.execute('SELECT name FROM issue_categories WHERE id = ?', [newValue]);
            newValue = newCategory.length > 0 ? newCategory[0].name : newValue;
          }
        }
        
        editHistoryPromises.push(
          db.execute(
            `INSERT INTO query_edit_history (query_id, editor_id, editor_role, field_name, old_value, new_value) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [queryId, userId, userRole, fieldName, oldValue, newValue]
          )
        );
      }
    }
    
    // Execute all edit history inserts
    if (editHistoryPromises.length > 0) {
      await Promise.all(editHistoryPromises);
    }
    
    // Update the query with is_edited flag and increment edit_count
    const updateFieldsWithEdit = [...updateFields, 'is_edited = TRUE', 'edit_count = edit_count + 1', 'updated_at = CURRENT_TIMESTAMP'];
    await db.execute(
      `UPDATE queries SET ${updateFieldsWithEdit.join(', ')} WHERE id = ?`,
      [...updateValues.slice(0, -1), queryId] // Remove the last queryId and add it back
    );

    // Send notification if student or professional edited their own query
    if ((userRole === 'student' || userRole === 'professional') && originalQuery.student_id === userId) {
      // Get user info for notification
      const [userInfo] = await db.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [userId]
      );
      
      // Get assigned expert reviewer for notification
      const [assignedExpert] = await db.execute(
        `SELECT u.id, u.full_name 
         FROM users u 
         JOIN query_assignments qa ON u.id = qa.expert_reviewer_id 
         WHERE qa.query_id = ?`,
        [queryId]
      );
      
      if (assignedExpert.length > 0 && userInfo.length > 0) {
        // Create notification for assigned expert reviewer
        await createNotification(
          assignedExpert[0].id,
          queryId,
          'query_edited',
          'Query Updated by Student',
          `${userInfo[0].full_name} has edited their query: "${originalQuery.title}"`,
          { 
            editor_id: userId, 
            editor_name: userInfo[0].full_name,
            edited_fields: Object.keys(req.body)
          }
        );
      }
      
      // Also notify domain admins when students edit queries
      const [domainAdmins] = await db.execute(
        'SELECT id FROM users WHERE role = "domain_admin" AND domain_id = ?',
        [originalQuery.domain_id]
      );
      
      for (const admin of domainAdmins) {
        await createNotification(
          admin.id,
          queryId,
          'query_edited',
          'Query Updated by Student',
          `${userInfo[0].full_name} has edited their query: "${originalQuery.title}" in your domain`,
          { 
            editor_id: userId, 
            editor_name: userInfo[0].full_name,
            edited_fields: Object.keys(req.body)
          }
        );
      }
    }

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
    const path = require('path');
    
    // Handle both absolute and relative paths
    let imagePath = image.file_path;
    if (!path.isAbsolute(imagePath)) {
      // If it's a relative path, make it absolute
      imagePath = path.join(__dirname, imagePath);
    }
    // If it's already absolute, use it as is
    
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    } else {
      console.log(`Image file not found for deletion: ${imagePath} (original path: ${image.file_path})`);
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
        COALESCE(ds.name, q.custom_stage) as design_stage_name,
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
    let totalImages = 0;
    let addedImages = 0;
    for (const image of images) {
      totalImages++;
      // Handle both absolute and relative paths
      let imagePath = image.file_path;
      if (!path.isAbsolute(imagePath)) {
        // If it's a relative path, make it absolute
        imagePath = path.join(__dirname, imagePath);
      }
      // If it's already absolute, use it as is
      
      if (fs.existsSync(imagePath)) {
        const fileName = `${image.original_name}`;
        archive.file(imagePath, { name: `images/${fileName}` });
        addedImages++;
      } else {
        console.log(`Image file not found: ${imagePath} (original path: ${image.file_path})`);
      }
    }
    
    console.log(`Single query export summary: ${addedImages}/${totalImages} images added to archive`);

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

// Get edit history for a specific query
router.get('/:id/edit-history', auth, async (req, res) => {
  try {
    const { id: queryId } = req.params;
    const { userId, userRole } = req.user;

    // Check if user has permission to view edit history
    const [queries] = await db.execute(
      'SELECT * FROM queries WHERE id = ?',
      [queryId]
    );

    if (queries.length === 0) {
      return res.status(404).json({ error: 'Query not found' });
    }

    const query = queries[0];

    // Check permissions
    if (userRole === 'student' || userRole === 'professional') {
      if (query.student_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Fetch edit history with user details
    const [editHistory] = await db.execute(
      `SELECT 
        qeh.*,
        u.full_name as editor_name,
        u.email as editor_email
      FROM query_edit_history qeh
      JOIN users u ON qeh.editor_id = u.id
      WHERE qeh.query_id = ?
      ORDER BY qeh.created_at DESC`,
      [queryId]
    );

    res.json({
      query_id: queryId,
      edit_history: editHistory,
      total_edits: editHistory.length
    });
  } catch (error) {
    console.error('Error fetching edit history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve images with authentication
router.get('/images/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const { userId, role: userRole } = req.user;
    
    console.log(`DEBUG: ========== IMAGE REQUEST START ==========`);
    console.log(`DEBUG: User ${userId} (${userRole}) requesting image: ${filename}`);
    console.log(`DEBUG: Request URL: ${req.originalUrl}`);
    console.log(`DEBUG: Headers:`, req.headers.authorization ? 'Authorization header present' : 'No authorization header');
    console.log(`DEBUG: Full user object:`, req.user);

    // Get the image details and associated query
    const [images] = await db.execute(
      `SELECT qi.*, q.student_id 
       FROM query_images qi 
       JOIN queries q ON qi.query_id = q.id 
       WHERE qi.filename = ?`,
      [filename]
    );

    if (images.length === 0) {
      console.log(`DEBUG: Image not found: ${filename}`);
      return res.status(404).json({ message: 'Image not found' });
    }

    const image = images[0];
    const queryId = image.query_id;

    // Check if user has permission to view this image
    let hasPermission = false;
    let permissionReason = '';

    if (userRole === 'admin') {
      hasPermission = true;
      permissionReason = 'admin access';
    } else if (userRole === 'expert_reviewer') {
      // Expert reviewers can view images from queries they can access
      // First check if they're assigned to this query
      const [assignments] = await db.execute(
        'SELECT id FROM query_assignments WHERE query_id = ? AND expert_reviewer_id = ?',
        [queryId, userId]
      );
      if (assignments.length > 0) {
        hasPermission = true;
        permissionReason = 'assigned query';
      } else {
        // If not assigned, but they can view the query (which means they should see images too)
        hasPermission = true;
        permissionReason = 'expert reviewer access';
      }
    } else if (userRole === 'student' || userRole === 'professional') {
      // Students/professionals can view their own images or resolved images from their domain
      if (image.student_id === userId) {
        hasPermission = true;
        permissionReason = 'own image';
      } else {
        // Check if this is a resolved query from the same domain
        const [queryInfo] = await db.execute(
          `SELECT q.status, u.domain_id as student_domain_id 
           FROM queries q 
           JOIN users u ON q.student_id = u.id 
           WHERE q.id = ?`,
          [queryId]
        );
        
        if (queryInfo.length > 0 && queryInfo[0].status === 'resolved' && 
            queryInfo[0].student_domain_id === req.user.domain_id) {
          hasPermission = true;
          permissionReason = 'resolved query from same domain';
        } else {
          permissionReason = `query status: ${queryInfo[0]?.status || 'unknown'}, domain mismatch`;
        }
      }
    }

    console.log(`DEBUG: Permission check result: ${hasPermission ? 'GRANTED' : 'DENIED'} - ${permissionReason}`);

    if (!hasPermission) {
      console.log(`DEBUG: User ${userId} (${userRole}) denied access to image: ${filename}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    // Serve the image file
    const path = require('path');
    const fs = require('fs');
    
    let imagePath = image.file_path;
    if (!path.isAbsolute(imagePath)) {
      imagePath = path.join(__dirname, '..', imagePath);
    }

    if (!fs.existsSync(imagePath)) {
      console.log(`DEBUG: Image file not found on filesystem: ${imagePath}`);
      return res.status(404).json({ message: 'Image file not found' });
    }

    console.log(`DEBUG: Serving image: ${filename} to user ${userId} (${userRole})`);
    console.log(`DEBUG: Image path: ${imagePath}`);
    console.log(`DEBUG: MIME type: ${image.mime_type}`);
    console.log(`DEBUG: File size: ${image.file_size}`);
    
    // Set appropriate headers
    res.setHeader('Content-Type', image.mime_type);
    res.setHeader('Content-Length', image.file_size);
    
    // Send the file
    res.sendFile(imagePath);
    console.log(`DEBUG: ========== IMAGE REQUEST END ==========`);
    
  } catch (error) {
    console.error('DEBUG: ========== IMAGE REQUEST ERROR ==========');
    console.error('Error serving image:', error);
    console.error('DEBUG: ========== IMAGE REQUEST ERROR END ==========');
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;