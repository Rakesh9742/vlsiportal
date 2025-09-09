const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Admin: Get all queries with assignment status
router.get('/queries', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [queries] = await db.execute(`
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
      ORDER BY q.created_at DESC
    `);

    res.json({ queries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get unassigned queries
router.get('/queries/unassigned', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [queries] = await db.execute(`
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
      ORDER BY q.created_at DESC
    `);

    res.json({ queries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Assign query to expert reviewer
router.post('/queries/:id/assign', auth, checkRole(['admin']), [
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

    res.json({ message: 'Query assigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Reassign query to different expert reviewer
router.put('/queries/:id/reassign', auth, checkRole(['admin']), [
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

    res.json({ message: 'Query reassigned successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Remove query assignment
router.delete('/queries/:id/assign', auth, checkRole(['admin']), async (req, res) => {
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

// Admin: Get query assignments
router.get('/assignments', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [assignments] = await db.execute(`
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
      ORDER BY qa.assigned_at DESC
    `);

    res.json({ assignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get expert reviewer workload
router.get('/expert-reviewers/workload', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [workload] = await db.execute(`
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
      GROUP BY u.id, u.full_name, d.name
      ORDER BY u.full_name
    `);

    res.json({ workload });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get domain statistics
router.get('/statistics/domains', auth, checkRole(['admin']), async (req, res) => {
  try {
    const [statistics] = await db.execute(`
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
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);

    res.json({ statistics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Delete query
router.delete('/queries/:id', auth, checkRole(['admin']), async (req, res) => {
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
