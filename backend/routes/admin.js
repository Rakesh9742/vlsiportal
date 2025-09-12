const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole, checkAdminRole } = require('../middleware/auth');

const router = express.Router();

// Admin: Get all queries with assignment status (super admin sees all, domain admin sees only their domain)
router.get('/queries', auth, checkAdminRole, async (req, res) => {
  try {
    let query = `
      SELECT 
        q.*,
        u.full_name as student_name,
        d.name as student_domain,
        ds.name as design_stage_name,
        COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
        tool.name as tool_name,
        qa.expert_reviewer_id,
        qa.status as assignment_status,
        qa.assigned_at,
        qa.notes as assignment_notes,
        er.full_name as assigned_expert_name
      FROM queries q
      JOIN users u ON q.student_id = u.id
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN stages ds ON q.stage_id = ds.id
      LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
      LEFT JOIN query_assignments qa ON q.id = qa.query_id
      LEFT JOIN users er ON qa.expert_reviewer_id = er.id
    `;
    let params = [];

    // If user is domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      query += ` WHERE u.domain_id = ?`;
      params.push(req.user.domainId);
    }

    query += ` ORDER BY q.created_at DESC`;

    const [queries] = await db.execute(query, params);

    res.json({ queries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get unassigned queries (super admin sees all, domain admin sees only their domain)
router.get('/queries/unassigned', auth, checkAdminRole, async (req, res) => {
  try {
    let query = `
      SELECT 
        q.*,
        u.full_name as student_name,
        d.name as student_domain,
        ds.name as design_stage_name,
        COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
        tool.name as tool_name
      FROM queries q
      JOIN users u ON q.student_id = u.id
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN tools tool ON q.tool_id = tool.id
      LEFT JOIN stages ds ON q.stage_id = ds.id
      LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
      WHERE q.id NOT IN (SELECT query_id FROM query_assignments)
    `;
    let params = [];

    // If user is domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      query += ` AND u.domain_id = ?`;
      params.push(req.user.domainId);
    }

    query += ` ORDER BY q.created_at DESC`;

    const [queries] = await db.execute(query, params);

    res.json({ queries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Assign query to expert reviewer
router.post('/queries/:id/assign', auth, checkAdminRole, [
  body('expert_reviewer_id').isInt().withMessage('Expert reviewer ID is required'),
  body('notes').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryId = req.params.id;
    const { expert_reviewer_id, notes } = req.body;
    const adminId = req.user.userId;

    // Check if query exists
    const [queries] = await db.execute(
      'SELECT * FROM queries WHERE id = ?',
      [queryId]
    );

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Check if assignee exists and is an expert reviewer or admin
    const [reviewers] = await db.execute(
      'SELECT * FROM users WHERE id = ? AND role IN (?, ?)',
      [expert_reviewer_id, 'expert_reviewer', 'admin']
    );

    if (reviewers.length === 0) {
      return res.status(400).json({ message: 'Invalid assignee - must be expert reviewer or admin' });
    }

    // Check if query is already assigned
    const [assignments] = await db.execute(
      'SELECT * FROM query_assignments WHERE query_id = ?',
      [queryId]
    );

    if (assignments.length > 0) {
      return res.status(400).json({ message: 'Query is already assigned' });
    }

    // Create assignment
    await db.execute(
      'INSERT INTO query_assignments (query_id, expert_reviewer_id, assigned_by, notes) VALUES (?, ?, ?, ?)',
      [queryId, expert_reviewer_id, adminId, notes]
    );

    // Update query status to in_progress
    await db.execute(
      'UPDATE queries SET status = ?, expert_reviewer_id = ? WHERE id = ?',
      ['in_progress', expert_reviewer_id, queryId]
    );

    // Send notifications for assignment
    try {
      const { createNotification } = require('./notifications');
      
      // Get query and student info
      const [queryInfo] = await db.execute(
        'SELECT q.title, u.full_name as student_name, u.domain_id FROM queries q JOIN users u ON q.student_id = u.id WHERE q.id = ?',
        [queryId]
      );
      
      // Get assigner info
      const [assignerInfo] = await db.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [adminId]
      );
      
      // Get assignee info
      const [assigneeInfo] = await db.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [expert_reviewer_id]
      );
      
      if (queryInfo.length > 0 && assignerInfo.length > 0 && assigneeInfo.length > 0) {
        // Notify the assigned expert reviewer
        await createNotification(
          expert_reviewer_id,
          queryId,
          'query_assigned',
          'Query Assigned to You',
          `${assignerInfo[0].full_name} has assigned you the query: "${queryInfo[0].title}"`,
          { 
            assigner_id: adminId, 
            assigner_name: assignerInfo[0].full_name,
            query_title: queryInfo[0].title
          }
        );
        
        // Notify domain admins for this query's domain
        const [domainAdmins] = await db.execute(
          'SELECT id FROM users WHERE role = "domain_admin" AND domain_id = ?',
          [queryInfo[0].domain_id]
        );
        
        for (const admin of domainAdmins) {
          await createNotification(
            admin.id,
            queryId,
            'query_assigned',
            'Query Assigned in Your Domain',
            `Query "${queryInfo[0].title}" has been assigned to ${assigneeInfo[0].full_name}`,
            { 
              assigner_id: adminId, 
              assigner_name: assignerInfo[0].full_name,
              assignee_id: expert_reviewer_id,
              assignee_name: assigneeInfo[0].full_name,
              query_title: queryInfo[0].title
            }
          );
        }
      }
    } catch (notificationError) {
      console.error('Error sending assignment notifications:', notificationError);
      // Don't fail the assignment if notification fails
    }

    res.json({ message: 'Query assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Reassign query to different expert reviewer
router.put('/queries/:id/reassign', auth, checkAdminRole, [
  body('expert_reviewer_id').isInt().withMessage('Expert reviewer ID is required'),
  body('notes').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const queryId = req.params.id;
    const { expert_reviewer_id, notes } = req.body;
    const adminId = req.user.userId;

    // Check if query exists
    const [queries] = await db.execute(
      'SELECT * FROM queries WHERE id = ?',
      [queryId]
    );

    if (queries.length === 0) {
      return res.status(404).json({ message: 'Query not found' });
    }

    // Check if assignee exists and is an expert reviewer or admin
    const [reviewers] = await db.execute(
      'SELECT * FROM users WHERE id = ? AND role IN (?, ?)',
      [expert_reviewer_id, 'expert_reviewer', 'admin']
    );

    if (reviewers.length === 0) {
      return res.status(400).json({ message: 'Invalid assignee - must be expert reviewer or admin' });
    }

    // Update assignment
    await db.execute(
      'UPDATE query_assignments SET expert_reviewer_id = ?, assigned_by = ?, notes = ?, status = ? WHERE query_id = ?',
      [expert_reviewer_id, adminId, notes, 'assigned', queryId]
    );

    // Update query expert_reviewer_id
    await db.execute(
      'UPDATE queries SET expert_reviewer_id = ? WHERE id = ?',
      [expert_reviewer_id, queryId]
    );

    // Send notifications for reassignment
    try {
      const { createNotification } = require('./notifications');
      
      // Get query and student info
      const [queryInfo] = await db.execute(
        'SELECT q.title, u.full_name as student_name, u.domain_id FROM queries q JOIN users u ON q.student_id = u.id WHERE q.id = ?',
        [queryId]
      );
      
      // Get reassigner info
      const [reassignerInfo] = await db.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [adminId]
      );
      
      // Get new assignee info
      const [assigneeInfo] = await db.execute(
        'SELECT full_name FROM users WHERE id = ?',
        [expert_reviewer_id]
      );
      
      if (queryInfo.length > 0 && reassignerInfo.length > 0 && assigneeInfo.length > 0) {
        // Notify the newly assigned expert reviewer
        await createNotification(
          expert_reviewer_id,
          queryId,
          'query_reassigned',
          'Query Reassigned to You',
          `${reassignerInfo[0].full_name} has reassigned you the query: "${queryInfo[0].title}"`,
          { 
            reassigner_id: adminId, 
            reassigner_name: reassignerInfo[0].full_name,
            query_title: queryInfo[0].title
          }
        );
        
        // Notify domain admins for this query's domain
        const [domainAdmins] = await db.execute(
          'SELECT id FROM users WHERE role = "domain_admin" AND domain_id = ?',
          [queryInfo[0].domain_id]
        );
        
        for (const admin of domainAdmins) {
          await createNotification(
            admin.id,
            queryId,
            'query_reassigned',
            'Query Reassigned in Your Domain',
            `Query "${queryInfo[0].title}" has been reassigned to ${assigneeInfo[0].full_name}`,
            { 
              reassigner_id: adminId, 
              reassigner_name: reassignerInfo[0].full_name,
              assignee_id: expert_reviewer_id,
              assignee_name: assigneeInfo[0].full_name,
              query_title: queryInfo[0].title
            }
          );
        }
      }
    } catch (notificationError) {
      console.error('Error sending reassignment notifications:', notificationError);
      // Don't fail the reassignment if notification fails
    }

    res.json({ message: 'Query reassigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Remove query assignment
router.delete('/queries/:id/assign', auth, checkAdminRole, async (req, res) => {
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

    // Delete assignment
    await db.execute(
      'DELETE FROM query_assignments WHERE query_id = ?',
      [queryId]
    );

    // Reset query status and expert_reviewer_id
    await db.execute(
      'UPDATE queries SET status = ?, expert_reviewer_id = NULL WHERE id = ?',
      ['open', queryId]
    );

    res.json({ message: 'Query assignment removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get query assignments (super admin sees all, domain admin sees only their domain)
router.get('/assignments', auth, checkAdminRole, async (req, res) => {
  try {
    let query = `
      SELECT 
        qa.*,
        q.title as query_title,
        q.status as query_status,
        s.full_name as student_name,
        er.full_name as expert_reviewer_name,
        d.name as student_domain,
        admin.full_name as assigned_by_name
      FROM query_assignments qa
      JOIN queries q ON qa.query_id = q.id
      JOIN users s ON q.student_id = s.id
      JOIN users er ON qa.expert_reviewer_id = er.id
      JOIN users admin ON qa.assigned_by = admin.id
      LEFT JOIN domains d ON s.domain_id = d.id
    `;
    let params = [];

    // If user is domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      query += ` WHERE s.domain_id = ?`;
      params.push(req.user.domainId);
    }

    query += ` ORDER BY qa.assigned_at DESC`;

    const [assignments] = await db.execute(query, params);

    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get expert reviewer workload (super admin sees all, domain admin sees only their domain)
router.get('/expert-reviewers/workload', auth, checkAdminRole, async (req, res) => {
  try {
    let query = `
      SELECT 
        u.id,
        u.full_name,
        d.name as domain_name,
        COUNT(qa.id) as total_assignments,
        SUM(CASE WHEN qa.status = 'assigned' THEN 1 ELSE 0 END) as pending_assignments,
        SUM(CASE WHEN qa.status = 'accepted' THEN 1 ELSE 0 END) as accepted_assignments,
        SUM(CASE WHEN qa.status = 'completed' THEN 1 ELSE 0 END) as completed_assignments
      FROM users u
      LEFT JOIN domains d ON u.domain_id = d.id
      LEFT JOIN query_assignments qa ON u.id = qa.expert_reviewer_id
      WHERE u.role = 'expert_reviewer'
    `;
    let params = [];

    // If user is domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      query += ` AND u.domain_id = ?`;
      params.push(req.user.domainId);
    }

    query += ` GROUP BY u.id, u.full_name, d.name ORDER BY u.full_name`;

    const [workload] = await db.execute(query, params);

    res.json({ workload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get domain statistics (super admin sees all, domain admin sees only their domain)
router.get('/statistics/domains', auth, checkAdminRole, async (req, res) => {
  try {
    let query = `
      SELECT 
        d.id,
        d.name as domain_name,
        COUNT(DISTINCT u.id) as total_students,
        COUNT(DISTINCT CASE WHEN u.role = 'expert_reviewer' THEN u.id END) as total_experts,
        COUNT(DISTINCT q.id) as total_queries,
        COUNT(DISTINCT CASE WHEN q.status = 'open' THEN q.id END) as open_queries,
        COUNT(DISTINCT CASE WHEN q.status = 'in_progress' THEN q.id END) as in_progress_queries,
        COUNT(DISTINCT CASE WHEN q.status = 'resolved' THEN q.id END) as resolved_queries
      FROM domains d
      LEFT JOIN users u ON d.id = u.domain_id
      LEFT JOIN queries q ON u.id = q.student_id
    `;
    let params = [];

    // If user is domain admin, filter by their domain
    if (req.user.role === 'domain_admin') {
      query += ` WHERE d.id = ?`;
      params.push(req.user.domainId);
    }

    query += ` GROUP BY d.id, d.name ORDER BY d.name`;

    const [statistics] = await db.execute(query, params);

    res.json({ statistics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete query
router.delete('/queries/:id', auth, checkAdminRole, async (req, res) => {
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
