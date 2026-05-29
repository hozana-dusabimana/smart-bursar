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
        'SELECT id FROM invoices WHERE student_id = ? AND term_id = ? AND school_id = ?', [sid, termId, req.user.school_id]
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
      const [[tc]] = await conn.query('SELECT last_seq FROM receipt_counter rc JOIN academic_terms t ON rc.term_id = t.id WHERE rc.term_id = ? AND t.school_id = ?', [termId, req.user.school_id]);

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

exports.generateAll = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get active term
    const [[term]] = await conn.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
    if (!term) return sendError(res, 'No active term found', 400);

    // 2. Find students WITHOUT an invoice for this term
    const [students] = await conn.query(
      `SELECT s.id, s.class_id, c.name AS class_name 
       FROM students s 
       JOIN classes c ON s.class_id = c.id
       WHERE s.is_active = 1 AND s.school_id = ?
       AND s.id NOT IN (SELECT student_id FROM invoices WHERE term_id = ? AND school_id = ?)`,
      [req.user.school_id, term.id, req.user.school_id]
    );

    const created = [], failed = [];

    for (const student of students) {
      // Get fee structure
      const [[fee]] = await conn.query(
        `SELECT tuition, activity, transport FROM fee_structure WHERE class_id = ? AND term_id = ? AND school_id = ?`,
        [student.class_id, term.id, req.user.school_id]
      );

      if (!fee) {
        failed.push({ id: student.id, class: student.class_name, reason: 'No fee structure set' });
        continue;
      }

      const total = Number(fee.tuition) + Number(fee.activity) + Number(fee.transport);
      const invNo = `INV-${new Date().getFullYear()}-${Date.now()}-${student.id}`;

      await conn.query(
        `INSERT INTO invoices
           (invoice_no, student_id, term_id, tuition_amount, activity_amount, transport_amount, total_amount, issued_date, created_by, school_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
        [invNo, student.id, term.id, fee.tuition, fee.activity, fee.transport, total, req.user.id, req.user.school_id]
      );
      created.push(student.id);
    }

    await conn.commit();
    sendSuccess(res, {
      created: created.length,
      failed: failed.length,
      failedDetails: failed
    }, `Bulk generation complete: ${created.length} created, ${failed.length} failed.`);
  } catch (err) {
    await conn.rollback();
    console.error('generateAll error:', err);
    sendError(res);
  } finally {
    conn.release();
  }
};

async function getClassId(conn, name, schoolId) {
  const [[row]] = await conn.query('SELECT id FROM classes WHERE name = ? AND school_id = ?', [name, schoolId]);
  return row?.id;
}

exports.getByStudent = async (req, res) => {
  try {
    const [invoices] = await pool.query(
      `SELECT i.*,
         COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id AND p.school_id = ?), 0) AS paid,
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

exports.listAll = async (req, res) => {
  try {
    const { term_id, class_id, status, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT i.*, s.full_name, s.admission_no, c.name AS class_name,
        COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id AND p.school_id = ?), 0) AS paid
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      JOIN classes c ON s.class_id = c.id
      WHERE i.school_id = ?
    `;
    const params = [req.user.school_id, req.user.school_id];

    if (term_id) { sql += ' AND i.term_id = ?'; params.push(term_id); }
    if (class_id) { sql += ' AND s.class_id = ?'; params.push(class_id); }

    sql += ' ORDER BY i.issued_date DESC, i.id DESC';
    sql += ` LIMIT ${Number(limit)} OFFSET ${(Number(page) - 1) * Number(limit)}`;

    const [rows] = await pool.query(sql, params);

    const data = rows.map(r => {
      const paid = Number(r.paid);
      const total = Number(r.total_amount);
      const balance = Math.max(0, total - paid);
      let s = 'Unpaid';
      if (paid >= total) s = 'Paid';
      else if (paid > 0) s = 'Partial';

      return { ...r, paid, balance, status: s };
    });

    // Apply status filter in JS if provided (simpler than complex SQL subqueries for status)
    const filtered = status ? data.filter(d => d.status.toLowerCase() === status.toLowerCase()) : data;

    sendSuccess(res, filtered);
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.sendEmail = async (req, res) => {
  const { id } = req.params;
  try {
    const [[invoice]] = await pool.query(
      `SELECT i.*, s.full_name, s.guardian_email, s.admission_no, c.name AS class_name
       FROM invoices i
       JOIN students s ON i.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       WHERE i.id = ? AND i.school_id = ?`,
      [id, req.user.school_id]
    );

    if (!invoice) return sendError(res, 'Invoice not found', 404);
    if (!invoice.guardian_email) return sendError(res, 'No parent email found for this student', 400);

    const { sendEmail } = require('../utils/email');
    const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
    const school = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));

    await sendEmail({
      to: invoice.guardian_email,
      template: 'invoice',
      schoolId: req.user.school_id,
      data: {
        student: { full_name: invoice.full_name, class_name: invoice.class_name },
        invoice: { invoice_no: invoice.invoice_no, total_amount: invoice.total_amount },
        school: { name: school.school_name || 'Smart Bursar' }
      }
    });

    sendSuccess(res, null, 'Invoice emailed successfully');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to send email');
  }
};
