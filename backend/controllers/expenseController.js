const pool = require('../config/db');
const audit = require('../middleware/audit');
const { sendSuccess, sendError } = require('../utils/helpers');

exports.list = async (req, res) => {
  try {
    const { category, status, term_id } = req.query;

    let termId = term_id;
    if (!termId) {
      const [[t]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
      termId = t?.id;
    }

    let sql = `
      SELECT e.*,
             u1.name AS submitted_by_name,
             u2.name AS approved_by_name
      FROM expenses e
      JOIN users u1 ON e.submitted_by = u1.id
      LEFT JOIN users u2 ON e.approved_by = u2.id
      WHERE e.term_id = ? AND e.school_id = ?
    `;
    const params = [termId, req.user.school_id];
    if (category) { sql += ' AND e.category = ?'; params.push(category); }
    if (status) { sql += ' AND e.status = ?'; params.push(status); }
    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const [rows] = await pool.query(sql, params);
    sendSuccess(res, rows);
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.create = async (req, res) => {
  const { description, category, amount, vendor, reference, expense_date, notes } = req.body;
  if (!description || !category || !amount || !expense_date)
    return sendError(res, 'description, category, amount, expense_date are required', 400);

  try {
    const [[term]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
    if (!term) return sendError(res, 'No active term', 400);

    // Generate expense number
    const [[last]] = await pool.query(
      `SELECT expense_no FROM expenses WHERE term_id = ? AND school_id = ? ORDER BY id DESC LIMIT 1`, [term.id, req.user.school_id]
    );
    const seq = last ? parseInt(last.expense_no.split('-').pop()) + 1 : 1;
    const expNo = `EXP-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO expenses (expense_no, description, category, amount, vendor, reference, expense_date, term_id, submitted_by, notes, school_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [expNo, description, category, amount, vendor || null, reference || null, expense_date, term.id, req.user.id, notes || null, req.user.school_id]
    );

    await audit(req.user.id, 'EXPENSE_CREATED', 'expenses', result.insertId, { expNo, amount }, req.ip);
    sendSuccess(res, { id: result.insertId, expense_no: expNo }, 'Expense logged', 201);
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status))
    return sendError(res, 'Status must be Approved or Rejected', 400);

  try {
    await pool.query(
      `UPDATE expenses SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ? AND school_id = ?`,
      [status, req.user.id, id, req.user.school_id]
    );
    await audit(req.user.id, `EXPENSE_${status.toUpperCase()}`, 'expenses', id, { status }, req.ip);
    sendSuccess(res, null, `Expense ${status}`);
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};
