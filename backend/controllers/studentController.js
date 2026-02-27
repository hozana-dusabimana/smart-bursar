const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

exports.list = async (req, res) => {
  try {
    const { class: cls, stream, status, search, term_id } = req.query;

    // Get active term if not provided
    let termId = term_id;
    if (!termId) {
      const [[activeTerm]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 LIMIT 1');
      termId = activeTerm?.id;
    }

    let sql = `
      SELECT
        s.id, s.admission_no, s.full_name, c.name AS class, s.stream,
        s.guardian_name, s.guardian_tel, s.guardian_email, s.enrolled_at, s.is_active,
        i.id AS invoice_id, i.total_amount AS fee,
        COALESCE(SUM(p.amount), 0) AS paid,
        (i.total_amount - COALESCE(SUM(p.amount), 0)) AS balance
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN invoices i ON i.student_id = s.id AND i.term_id = ?
      LEFT JOIN payments p ON p.invoice_id = i.id
      WHERE s.is_active = 1 AND s.school_id = ?
    `;
    const params = [termId, req.user.school_id];

    if (cls) { sql += ' AND c.name = ?'; params.push(cls); }
    if (stream) { sql += ' AND s.stream = ?'; params.push(stream); }
    if (search) { sql += ' AND (s.full_name LIKE ? OR s.admission_no LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    // If parent, only show their children
    if (req.user.role === 'parent') {
      sql += ' AND s.guardian_email = ?';
      params.push(req.user.email);
    }

    sql += ' GROUP BY s.id, i.id ORDER BY s.full_name';

    const [rows] = await pool.query(sql, params);

    // Add status label
    const withStatus = rows.map(r => ({
      ...r,
      paid: Number(r.paid),
      balance: Math.max(0, Number(r.balance)),
      paymentStatus: !r.fee ? 'No Invoice'
        : r.paid >= r.fee ? 'Cleared'
          : r.paid > 0 ? 'Partial'
            : 'Unpaid'
    }));

    // Filter by status if requested
    const filtered = status ? withStatus.filter(s => s.paymentStatus === status) : withStatus;
    sendSuccess(res, filtered);
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const termId = req.query.term_id || (await getActiveTermId());

    const [[student]] = await pool.query(
      `SELECT s.*, c.name AS class
       FROM students s JOIN classes c ON s.class_id = c.id
       WHERE s.id = ? AND s.school_id = ?`,
      [id, req.user.school_id]
    );

    if (!student) return sendError(res, 'Student not found', 404);

    // Parent check: must be their guardian
    if (req.user.role === 'parent' && student.guardian_email !== req.user.email) {
      return sendError(res, 'Unauthorized access to student record', 403);
    }

    const [[invoice]] = await pool.query(
      `SELECT i.*,
         COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) AS paid
       FROM invoices i WHERE i.student_id = ? AND i.term_id = ?`,
      [id, termId]
    );

    const [payments] = await pool.query(
      `SELECT p.*, u.name AS cashier_name
       FROM payments p JOIN users u ON p.cashier_id = u.id
       WHERE p.student_id = ? AND p.term_id = ?
       ORDER BY p.payment_date DESC, p.payment_time DESC`,
      [id, termId]
    );

    const [[feeStructure]] = await pool.query(
      `SELECT fs.tuition, fs.activity, fs.transport
       FROM fee_structure fs
       JOIN classes c ON c.id = fs.class_id
       WHERE c.name = ? AND fs.term_id = ?`,
      [student.class, termId]
    );

    sendSuccess(res, {
      student,
      invoice: invoice || null,
      feeStructure: feeStructure || null,
      payments,
      summary: invoice ? {
        fee: Number(invoice.total_amount),
        paid: Number(invoice.paid),
        balance: Math.max(0, Number(invoice.total_amount) - Number(invoice.paid))
      } : null
    });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.create = async (req, res) => {
  const { admission_no, full_name, class_name, stream, guardian_name, guardian_tel, guardian_email, enrolled_at } = req.body;
  try {
    const [[cls]] = await pool.query('SELECT id FROM classes WHERE name = ?', [class_name]);
    if (!cls) return sendError(res, 'Invalid class', 400);

    const [result] = await pool.query(
      `INSERT INTO students (admission_no, full_name, class_id, stream, guardian_name, guardian_tel, guardian_email, enrolled_at, school_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [admission_no, full_name, cls.id, stream || 'A', guardian_name, guardian_tel, guardian_email, enrolled_at || new Date(), req.user.school_id]
    );

    const studentId = result.insertId;

    // --- Parent Account Automation ---
    if (guardian_email) {
      try {
        const bcrypt = require('bcryptjs');
        const { sendEmail } = require('../utils/email');

        // 1. Check if user already exists
        const [[existing]] = await pool.query('SELECT id, name FROM users WHERE email = ?', [guardian_email]);

        let parentUser = existing;

        if (!existing) {
          // 2. Get parent role id
          const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = "parent"');
          if (roleRow) {
            // 3. Create parent user with a random "memorable" password (as fallback)
            const adjectives = ['Safe', 'Smart', 'Bright', 'Firm'];
            const nouns = ['Home', 'Blue', 'Star', 'Key'];
            const tempPass = `${adjectives[Math.floor(Math.random() * 4)]}${nouns[Math.floor(Math.random() * 4)]}${Math.floor(100 + Math.random() * 899)}`;
            const hash = await bcrypt.hash(tempPass, 10);

            const [userRes] = await pool.query(
              'INSERT INTO users (name, email, password_hash, role_id, school_id) VALUES (?, ?, ?, ?, ?)',
              [guardian_name || 'Parent', guardian_email, hash, roleRow.id, req.user.school_id]
            );
            parentUser = { id: userRes.insertId, name: guardian_name || 'Parent', email: guardian_email };
          }
        }

        // 4. Send specialized invitation email
        if (parentUser) {
          const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
          const cfg = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));

          sendEmail({
            to: guardian_email,
            template: 'parentEnrollment',
            data: {
              user: { name: parentUser.name, email: guardian_email },
              student_name: full_name,
              school: { name: cfg.school_name || 'Smart Bursar' }
            }
          }).catch(e => console.error('Parent enrollment email failed:', e.message));
        }
      } catch (e) {
        console.error('Failed to automate parent creation:', e.message);
      }
    }

    sendSuccess(res, { id: studentId }, 'Student registered', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Admission number already exists', 409);
    console.error(err);
    sendError(res);
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { full_name, class_name, stream, guardian_name, guardian_tel, guardian_email } = req.body;
  try {
    let classId;
    if (class_name) {
      const [[cls]] = await pool.query('SELECT id FROM classes WHERE name = ?', [class_name]);
      if (!cls) return sendError(res, 'Invalid class', 400);
      classId = cls.id;
    }

    const fields = [
      full_name && ['full_name = ?', full_name],
      classId && ['class_id = ?', classId],
      stream && ['stream = ?', stream],
      guardian_name && ['guardian_name = ?', guardian_name],
      guardian_tel && ['guardian_tel = ?', guardian_tel],
      guardian_email && ['guardian_email = ?', guardian_email],
    ].filter(Boolean);

    if (!fields.length) return sendError(res, 'No fields to update', 400);

    const setClauses = fields.map(f => f[0]).join(', ');
    const values = fields.map(f => f[1]);

    await pool.query(`UPDATE students SET ${setClauses} WHERE id = ? AND school_id = ?`, [...values, id, req.user.school_id]);
    sendSuccess(res, null, 'Student updated');
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.resendInvitation = async (req, res) => {
  const { id } = req.params;
  try {
    const [[student]] = await pool.query(
      'SELECT full_name, guardian_email, school_id FROM students WHERE id = ? AND school_id = ?',
      [id, req.user.school_id]
    );
    if (!student) return sendError(res, 'Student not found', 404);
    if (!student.guardian_email) return sendError(res, 'Guardian email not found for this student', 400);

    const [[parentUser]] = await pool.query('SELECT name, email FROM users WHERE email = ?', [student.guardian_email]);
    if (!parentUser) return sendError(res, 'Parent account not found', 404);

    const { sendEmail } = require('../utils/email');
    const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
    const cfg = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));

    await sendEmail({
      to: student.guardian_email,
      template: 'parentEnrollment',
      schoolId: req.user.school_id,
      data: {
        user: { name: parentUser.name, email: student.guardian_email },
        student_name: student.full_name,
        school: { name: cfg.school_name || 'Smart Bursar' }
      }
    });

    sendSuccess(res, null, 'Invitation resent successfully');
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

async function getActiveTermId() {
  const [[t]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 LIMIT 1');
  return t?.id;
}
