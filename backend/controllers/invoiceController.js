const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

// Generate invoice for a single student or all students in a class
exports.generate = async (req, res) => {
  const { student_id, class_name, term_id } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get term
    let termId = term_id;
    if (!termId) {
      const [[t]] = await conn.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
      termId = t?.id;
    }
    if (!termId) return sendError(res, 'No active term', 400);

    let studentIds = [];

    if (student_id) {
      const [[s]] = await conn.query('SELECT id FROM students WHERE id = ? AND school_id = ?', [student_id, req.user.school_id]);
      studentIds = s ? [s.id] : [];
    } else if (class_name) {
      const [[cls]] = await conn.query('SELECT id FROM classes WHERE name = ? AND school_id = ?', [class_name, req.user.school_id]);
      if (!cls) return sendError(res, 'Invalid class', 400);
      const [students] = await conn.query('SELECT id FROM students WHERE class_id = ? AND is_active = 1 AND school_id = ?', [cls.id, req.user.school_id]);
      studentIds = students.map(s => s.id);
    } else {
      return sendError(res, 'Provide student_id or class_name', 400);
    }

    const created = [], skipped = [];

    for (const sid of studentIds) {
      // Check already has invoice
      const [[existing]] = await conn.query(
        'SELECT id FROM invoices WHERE student_id = ? AND term_id = ?', [sid, termId]
      );
      if (existing) { skipped.push(sid); continue; }

      // Get student class
      const [[student]] = await conn.query(
        `SELECT s.id, c.name AS class FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = ? AND s.school_id = ?`, [sid, req.user.school_id]
      );
      if (!student) continue;

      const [[fee]] = await conn.query(
        `SELECT tuition, activity, transport FROM fee_structure WHERE class_id = ? AND term_id = ? AND school_id = ?`,
        [student.class_id || (await getClassId(conn, student.class, req.user.school_id)), termId, req.user.school_id]
      );
      if (!fee) { skipped.push(sid); continue; }

      const total = fee.tuition + fee.activity + fee.transport;
      const invNo = `INV-${new Date().getFullYear()}-${Date.now()}`;
      const [[tc]] = await pool.query('SELECT last_seq FROM receipt_counter WHERE term_id = ?', [termId]);

      await conn.query(
        `INSERT INTO invoices
           (invoice_no, student_id, term_id, tuition_amount, activity_amount, transport_amount, total_amount, issued_date, created_by, school_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
        [invNo, sid, termId, fee.tuition, fee.activity, fee.transport, total, req.user.id, req.user.school_id]
      );
      created.push(sid);
    }

    await conn.commit();
    sendSuccess(res, { created: created.length, skipped: skipped.length }, 'Invoices generated', 201);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    sendError(res);
  } finally {
    conn.release();
  }
};

exports.getByStudent = async (req, res) => {
  try {
    const [invoices] = await pool.query(
      `SELECT i.*,
         COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) AS paid,
         t.term_name, t.academic_year
       FROM invoices i JOIN academic_terms t ON i.term_id = t.id
       WHERE i.student_id = ? AND i.school_id = ?
       ORDER BY i.issued_date DESC`,
      [req.params.studentId, req.user.school_id]
    );
    sendSuccess(res, invoices.map(i => ({
      ...i,
      paid: Number(i.paid),
      balance: Math.max(0, Number(i.total_amount) - Number(i.paid))
    })));
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};
