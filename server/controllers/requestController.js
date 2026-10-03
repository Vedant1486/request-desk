const db = require('../db');

const VALID_STATUSES = ['NEW', 'QUALIFIED', 'CLOSED'];

// -------------------------------------------------------
// GET /api/requests
// -------------------------------------------------------
async function listRequests(req, res) {
  const { workspaceId } = req.user;
  const { status } = req.query;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
  }

  try {
    let sql = `
      SELECT r.*, u.name AS created_by_name,
             (SELECT COUNT(*) FROM work_items wi WHERE wi.request_id = r.id) AS has_work_item
      FROM requests r
      JOIN users u ON r.created_by = u.id
      WHERE r.workspace_id = ?
    `;
    const params = [workspaceId];

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY r.created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('listRequests error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// -------------------------------------------------------
// POST /api/requests
// -------------------------------------------------------
async function createRequest(req, res) {
  const { workspaceId, userId } = req.user;
  const { customer_name, customer_email, requested_service, description, scheduled_date, status } = req.body;

  if (!customer_name || !customer_email || !requested_service || !description || !scheduled_date || !status) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return res.status(400).json({ message: 'Invalid customer email address.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO requests (customer_name, customer_email, requested_service, description, scheduled_date, status, workspace_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_email, requested_service, description, scheduled_date, status, workspaceId, userId]
    );

    const requestId = result.insertId;

    await db.query(
      `INSERT INTO activities (request_id, user_id, activity_type, message)
       VALUES (?, ?, 'REQUEST_CREATED', ?)`,
      [requestId, userId, `Request created with status ${status}.`]
    );

    const [rows] = await db.query('SELECT * FROM requests WHERE id = ?', [requestId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createRequest error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// -------------------------------------------------------
// GET /api/requests/:id
// -------------------------------------------------------
async function getRequest(req, res) {
  const { workspaceId } = req.user;
  const { id } = req.params;

  try {
    // Enforce workspace isolation: id AND workspace_id must match
    const [rows] = await db.query(
      `SELECT r.*, u.name AS created_by_name
       FROM requests r JOIN users u ON r.created_by = u.id
       WHERE r.id = ? AND r.workspace_id = ?`,
      [id, workspaceId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    const request = rows[0];

    // Fetch activities
    const [activities] = await db.query(
      `SELECT a.*, u.name AS user_name
       FROM activities a JOIN users u ON a.user_id = u.id
       WHERE a.request_id = ?
       ORDER BY a.created_at ASC`,
      [id]
    );

    // Fetch work item if exists
    const [workItems] = await db.query(
      'SELECT wi.*, u.name AS created_by_name FROM work_items wi JOIN users u ON wi.created_by = u.id WHERE wi.request_id = ?',
      [id]
    );

    res.json({ ...request, activities, work_item: workItems[0] || null });
  } catch (err) {
    console.error('getRequest error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// -------------------------------------------------------
// PATCH /api/requests/:id
// -------------------------------------------------------
async function updateRequest(req, res) {
  const { workspaceId, userId } = req.user;
  const { id } = req.params;
  const { customer_name, customer_email, requested_service, description, scheduled_date, status } = req.body;

  try {
    // Verify ownership
    const [rows] = await db.query(
      'SELECT * FROM requests WHERE id = ? AND workspace_id = ?',
      [id, workspaceId]
    );
    if (!rows.length) return res.status(404).json({ message: 'Request not found.' });

    const existing = rows[0];

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
    }
    if (customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return res.status(400).json({ message: 'Invalid customer email address.' });
    }

    const updated = {
      customer_name:    customer_name    ?? existing.customer_name,
      customer_email:   customer_email   ?? existing.customer_email,
      requested_service: requested_service ?? existing.requested_service,
      description:      description      ?? existing.description,
      scheduled_date:   scheduled_date   ?? existing.scheduled_date,
      status:           status           ?? existing.status,
    };

    await db.query(
      `UPDATE requests SET customer_name=?, customer_email=?, requested_service=?, description=?, scheduled_date=?, status=?
       WHERE id = ? AND workspace_id = ?`,
      [updated.customer_name, updated.customer_email, updated.requested_service,
       updated.description, updated.scheduled_date, updated.status, id, workspaceId]
    );

    // Build activity message
    const changes = [];
    if (status && status !== existing.status) changes.push(`Status changed from ${existing.status} to ${status}`);
    if (customer_name && customer_name !== existing.customer_name) changes.push('Customer name updated');
    if (requested_service && requested_service !== existing.requested_service) changes.push('Service updated');
    if (scheduled_date && scheduled_date !== existing.scheduled_date) changes.push('Scheduled date updated');
    const message = changes.length ? changes.join('; ') + '.' : 'Request updated.';

    await db.query(
      `INSERT INTO activities (request_id, user_id, activity_type, message) VALUES (?, ?, 'REQUEST_UPDATED', ?)`,
      [id, userId, message]
    );

    const [updated_rows] = await db.query('SELECT * FROM requests WHERE id = ?', [id]);
    res.json(updated_rows[0]);
  } catch (err) {
    console.error('updateRequest error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// -------------------------------------------------------
// POST /api/requests/:id/convert
// -------------------------------------------------------
async function convertRequest(req, res) {
  const { workspaceId, userId } = req.user;
  const { id } = req.params;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Find request — enforce workspace isolation
    const [rows] = await conn.query(
      'SELECT * FROM requests WHERE id = ? AND workspace_id = ?',
      [id, workspaceId]
    );
    if (!rows.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Request not found.' });
    }

    const request = rows[0];

    // 2. Must be QUALIFIED
    if (request.status !== 'QUALIFIED') {
      await conn.rollback();
      return res.status(409).json({ message: 'Only QUALIFIED requests can be converted into a work item.' });
    }

    // 3. Check if already converted
    const [existing] = await conn.query(
      'SELECT id FROM work_items WHERE request_id = ?',
      [id]
    );
    if (existing.length) {
      await conn.rollback();
      return res.status(409).json({ message: 'This request has already been converted into a work item.' });
    }

    // 4. Create work item
    const title = `${request.requested_service} — ${request.customer_name}`;
    const [wiResult] = await conn.query(
      `INSERT INTO work_items (request_id, title, customer_name, requested_service, scheduled_date, workspace_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, request.customer_name, request.requested_service, request.scheduled_date, workspaceId, userId]
    );

    // 5. Create activity
    const [userRows] = await conn.query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRows[0]?.name || 'Unknown';
    await conn.query(
      `INSERT INTO activities (request_id, user_id, activity_type, message) VALUES (?, ?, 'WORK_ITEM_CREATED', ?)`,
      [id, userId, `Work item created by ${userName}.`]
    );

    await conn.commit();

    const [wiRows] = await db.query(
      'SELECT wi.*, u.name AS created_by_name FROM work_items wi JOIN users u ON wi.created_by = u.id WHERE wi.id = ?',
      [wiResult.insertId]
    );
    res.status(201).json(wiRows[0]);
  } catch (err) {
    await conn.rollback();
    // Duplicate key = race condition, someone already converted
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'This request has already been converted into a work item.' });
    }
    console.error('convertRequest error:', err);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    conn.release();
  }
}

// -------------------------------------------------------
// GET /api/requests/:id/activities
// -------------------------------------------------------
async function getActivities(req, res) {
  const { workspaceId } = req.user;
  const { id } = req.params;

  try {
    // Verify workspace ownership
    const [reqRows] = await db.query(
      'SELECT id FROM requests WHERE id = ? AND workspace_id = ?',
      [id, workspaceId]
    );
    if (!reqRows.length) return res.status(404).json({ message: 'Request not found.' });

    const [activities] = await db.query(
      `SELECT a.*, u.name AS user_name FROM activities a
       JOIN users u ON a.user_id = u.id
       WHERE a.request_id = ? ORDER BY a.created_at ASC`,
      [id]
    );
    res.json(activities);
  } catch (err) {
    console.error('getActivities error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
}

// -------------------------------------------------------
// GET /api/requests/:id/work-item
// -------------------------------------------------------
async function getWorkItem(req, res) {
  const { workspaceId } = req.user;
  const { id } = req.params;

  try {
    const [reqRows] = await db.query(
      'SELECT id FROM requests WHERE id = ? AND workspace_id = ?',
      [id, workspaceId]
    );
    if (!reqRows.length) return res.status(404).json({ message: 'Request not found.' });

    const [wiRows] = await db.query(
      'SELECT wi.*, u.name AS created_by_name FROM work_items wi JOIN users u ON wi.created_by = u.id WHERE wi.request_id = ?',
      [id]
    );

    if (!wiRows.length) return res.status(404).json({ message: 'No work item found for this request.' });
    res.json(wiRows[0]);
  } catch (err) {
    console.error('getWorkItem error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
}

module.exports = { listRequests, createRequest, getRequest, updateRequest, convertRequest, getActivities, getWorkItem };
