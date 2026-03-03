const pool = require('../config/db');
const { sendEmail } = require('../utils/email');
const { sendSuccess, sendError } = require('../utils/helpers');

// GET /api/notifications — list email log
exports.list = async (req, res) => {
  try {
    const { status, template, page = 1, limit = 100 } = req.query;
    let sql = `SELECT n.*, 
               CONCAT(s.full_name, ' (', s.admission_no, ')') AS student_info
               FROM email_notifications n
               LEFT JOIN payments p ON n.related_id = p.id AND n.template = 'receipt'
               LEFT JOIN students s ON p.student_id = s.id
               WHERE n.school_id = ?`;
    const params = [req.user.school_id];
    if (status && status !== 'All') { sql += ' AND n.status = ?'; params.push(status); }
    if (template) { sql += ' AND n.template = ?'; params.push(template); }
    sql += ` ORDER BY n.created_at DESC LIMIT ${Number(limit)} OFFSET ${(Number(page) - 1) * Number(limit)}`;
    const [rows] = await pool.query(sql, params);
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM email_notifications WHERE school_id = ? ${status && status !== 'All' ? ' AND status=?' : ''}`,
      status && status !== 'All' ? [req.user.school_id, status] : [req.user.school_id]
    );
    sendSuccess(res, { notifications: rows, total });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

// GET /api/notifications/stats
exports.stats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT template, status, COUNT(*) AS count
       FROM email_notifications
       WHERE school_id = ?
       GROUP BY template, status
       ORDER BY template, status`,
      [req.user.school_id]
    );
    sendSuccess(res, rows);
  } catch (err) { sendError(res); }
};

// POST /api/notifications/send-reminders — send balance reminder to all defaulters
exports.sendReminders = async (req, res) => {
  try {
    // Get active term
    const [[term]] = await pool.query('SELECT * FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
    if (!term) return sendError(res, 'No active term', 400);

    // Get all students with outstanding balances who have guardian email
    const [defaulters] = await pool.query(`
      SELECT s.id, s.full_name, s.admission_no, s.guardian_name, s.guardian_email,
             c.name AS class, s.stream,
             i.total_amount,
             COALESCE(SUM(p.amount), 0) AS paid,
             i.total_amount - COALESCE(SUM(p.amount), 0) AS balance
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN invoices i ON i.student_id = s.id AND i.term_id = ? AND i.school_id = ?
      LEFT JOIN payments p ON p.invoice_id = i.id AND p.school_id = ?
      WHERE s.is_active = 1 AND s.guardian_email IS NOT NULL AND s.guardian_email != ''
        AND s.school_id = ?
      GROUP BY s.id, i.id
      HAVING balance > 0
    `, [term.id, req.user.school_id, req.user.school_id, req.user.school_id]);

    // Get school config (scoped to the school if possible, or use global as fallback)
    const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
    const school = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));

    let sent = 0, skipped = 0;
    for (const student of defaulters) {
      try {
        await sendEmail({
          to: student.guardian_email,
          template: 'lowBalance',
          data: { student, balance: student.balance, term, school },
          schoolId: req.user.school_id,
          relatedId: student.id,
        });
        sent++;
      } catch {
        skipped++;
      }
    }

    // Also count those without emails
    const [[{ noEmail }]] = await pool.query(`
      SELECT COUNT(*) AS noEmail
      FROM students s
      JOIN invoices i ON i.student_id = s.id AND i.term_id = ? AND i.school_id = ?
      LEFT JOIN payments p ON p.invoice_id = i.id AND p.school_id = ?
      WHERE s.is_active = 1 AND (s.guardian_email IS NULL OR s.guardian_email = '')
        AND s.school_id = ?
      GROUP BY 1 HAVING (i.total_amount - COALESCE(SUM(p.amount),0)) > 0
    `, [term.id, req.user.school_id, req.user.school_id, req.user.school_id]).catch(() => [[{ noEmail: 0 }]]);

    sendSuccess(res, {
      sent,
      skipped: skipped + (noEmail || 0),
      message: `${sent} reminder emails dispatched`
    });
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to send reminders');
  }
};
