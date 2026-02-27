const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendEmail } = require('../utils/email');
const { sendSuccess, sendError } = require('../utils/helpers');

// ── SuperAdmin Login ───────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 'Email and password required', 400);

  try {
    const [[admin]] = await pool.query(
      'SELECT * FROM superadmins WHERE email = ?', [email]
    );
    if (!admin || !admin.is_active) return sendError(res, 'Invalid credentials', 401);

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return sendError(res, 'Invalid credentials', 401);

    await pool.query('UPDATE superadmins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: 'superadmin' },
      process.env.SUPERADMIN_JWT_SECRET || process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    sendSuccess(res, { token, admin: { id: admin.id, name: admin.name, email: admin.email, role: 'superadmin' } });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

// ── List Schools ──────────────────────────────────────────────
exports.listSchools = async (req, res) => {
  try {
    const [schools] = await pool.query(
      `SELECT s.*,
              COUNT(DISTINCT u.id) AS user_count,
              COUNT(DISTINCT st.id) AS student_count
       FROM schools s
       LEFT JOIN users u ON u.school_id = s.id
       LEFT JOIN students st ON 1=1
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    );
    sendSuccess(res, schools);
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

// ── Create School ─────────────────────────────────────────────
exports.createSchool = async (req, res) => {
  const { name, address, tel, email, subscription = 'trial',
    admin_name, admin_email } = req.body;

  if (!name || !admin_name || !admin_email)
    return sendError(res, 'name, admin_name, admin_email are required', 400);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

    const [schoolRes] = await conn.query(
      `INSERT INTO schools (name, slug, address, tel, email, subscription, trial_ends_at)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 30 DAY))`,
      [name, slug, address || null, tel || null, email || null, subscription]
    );
    const schoolId = schoolRes.insertId;

    // Create school config defaults
    const configDefaults = [
      ['school_name', name], ['address', address || ''], ['tel', tel || ''],
      ['email', email || ''], ['current_term', 'Term 1'], ['current_year', new Date().getFullYear() + '/' + (new Date().getFullYear() + 1)],
      ['receipt_prefix', 'RCP'], ['invoice_prefix', 'INV'], ['expense_prefix', 'EXP'],
    ];

    for (const [key, val] of configDefaults) {
      await conn.query(
        'INSERT INTO school_config (setting_key, setting_value, school_id) VALUES (?, ?, ?)',
        [key, val, schoolId]
      );
    }

    // Generate temp password
    const tempPassword = 'Admin' + crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);

    // Get admin role id
    const [[adminRole]] = await conn.query('SELECT id FROM roles WHERE name = ?', ['admin']);

    const [userRes] = await conn.query(
      `INSERT INTO users (name, email, password_hash, role_id, school_id) VALUES (?, ?, ?, ?, ?)`,
      [admin_name, admin_email, hash, adminRole.id, schoolId]
    );

    await conn.commit();

    // Send welcome email
    await sendEmail({
      to: admin_email,
      template: 'newSchool',
      data: { school: { name, subscription }, admin: { name: admin_name, email: admin_email }, tempPassword },
    }).catch(e => console.error('School welcome email failed:', e.message));

    sendSuccess(res, { schoolId, userId: userRes.insertId, tempPassword }, 'School created successfully', 201);
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Email or slug already exists', 409);
    console.error(err);
    sendError(res);
  } finally {
    conn.release();
  }
};

// ── Toggle School Active ──────────────────────────────────────
exports.toggleSchool = async (req, res) => {
  try {
    await pool.query('UPDATE schools SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    sendSuccess(res, null, 'School status updated');
  } catch (err) { sendError(res); }
};

// ── Update School ─────────────────────────────────────────────
exports.updateSchool = async (req, res) => {
  const { name, address, tel, email, subscription } = req.body;
  try {
    await pool.query(
      `UPDATE schools SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        tel = COALESCE(?, tel),
        email = COALESCE(?, email),
        subscription = COALESCE(?, subscription)
       WHERE id = ?`,
      [name || null, address || null, tel || null, email || null, subscription || null, req.params.id]
    );
    sendSuccess(res, null, 'School updated');
  } catch (err) { sendError(res); }
};

// ── Get School Admins ─────────────────────────────────────────
exports.getSchoolAdmins = async (req, res) => {
  try {
    const [admins] = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_active, u.created_at, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.school_id = ? AND r.name IN ('admin','bursar','accountant','principal')
       ORDER BY u.created_at`,
      [req.params.id]
    );
    sendSuccess(res, admins);
  } catch (err) { sendError(res); }
};

// ── Toggle School User ────────────────────────────────────────
exports.toggleSchoolUser = async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.userId]);
    sendSuccess(res, null, 'User status updated');
  } catch (err) { sendError(res); }
};

// ── Notifications Log ─────────────────────────────────────────
exports.emailLog = async (req, res) => {
  try {
    const { school_id, status, page = 1, limit = 50 } = req.query;
    let sql = `SELECT n.*, s.name AS school_name FROM email_notifications n
               LEFT JOIN schools s ON s.id = n.school_id WHERE 1=1`;
    const params = [];
    if (school_id) { sql += ' AND n.school_id=?'; params.push(school_id); }
    if (status) { sql += ' AND n.status=?'; params.push(status); }
    sql += ` ORDER BY n.created_at DESC LIMIT ${Number(limit)} OFFSET ${(Number(page) - 1) * Number(limit)}`;
    const [rows] = await pool.query(sql, params);
    sendSuccess(res, rows);
  } catch (err) { console.error(err); sendError(res); }
};

// ── Resend Email ───────────────────────────────────────────────
exports.resendEmail = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch the logged email
    const [[log]] = await pool.query(
      `SELECT * FROM email_notifications WHERE id = ?`, [id]
    );
    if (!log) return sendError(res, 'Email log not found', 404);

    let templateData = {};

    // Reconstruct template data based on type
    switch (log.template) {

      case 'receipt': {
        if (!log.related_id) return sendError(res, 'Cannot resend — no related payment ID', 400);
        const [[pay]] = await pool.query(
          `SELECT p.*, s.full_name, s.admission_no, s.guardian_name, s.guardian_email,
                  c.name AS class, s.stream,
                  t.term_name, sc.setting_value AS school_name
           FROM payments p
           JOIN students s ON s.id = p.student_id
           JOIN classes c ON c.id = s.class_id
           JOIN academic_terms t ON t.id = p.term_id
           LEFT JOIN school_config sc ON sc.setting_key = 'school_name'
           WHERE p.id = ?`, [log.related_id]
        );
        if (!pay) return sendError(res, 'Related payment not found', 404);
        templateData = {
          student: { full_name: pay.full_name, admission_no: pay.admission_no, guardian_name: pay.guardian_name, class: pay.class, stream: pay.stream },
          receipt: { receiptNo: pay.receipt_no, payment_method: pay.payment_method, date: pay.payment_date, amount: pay.amount, term: { term_name: pay.term_name }, newBalance: 0, amountInWords: '' },
          school: { school_name: pay.school_name, tel: '' },
        };
        break;
      }

      case 'welcome': {
        if (!log.related_id) return sendError(res, 'Cannot resend — no related user ID', 400);
        const [[u]] = await pool.query(`SELECT name, email FROM users WHERE id = ?`, [log.related_id]);
        if (!u) return sendError(res, 'Related user not found', 404);
        templateData = { user: u, password: '(contact administrator for password)', school: null };
        break;
      }

      case 'passwordReset': {
        return sendError(res, 'Password reset emails cannot be resent — user must request a new reset', 400);
      }

      case 'lowBalance': {
        return sendError(res, 'Balance reminders must be re-triggered from the Notifications page', 400);
      }

      case 'newSchool': {
        if (!log.school_id) return sendError(res, 'Cannot resend — no related school', 400);
        const [[sc]] = await pool.query(`SELECT * FROM schools WHERE id = ?`, [log.school_id]);
        if (!sc) return sendError(res, 'Related school not found', 404);
        templateData = { school: { name: sc.name, subscription: sc.subscription }, admin: { name: '(Admin)', email: log.recipient }, tempPassword: '(contact administrator for password)' };
        break;
      }

      case 'superadminInvite': {
        // Resend with placeholder password since we don't store it
        const [[sa]] = await pool.query(`SELECT name, email FROM superadmins WHERE email = ?`, [log.recipient]);
        templateData = {
          name: sa?.name || log.recipient,
          email: log.recipient,
          password: '(Your original password — contact the platform administrator if you have lost it)',
        };
        break;
      }

      default:
        return sendError(res, `Resend not supported for template: ${log.template}`, 400);
    }

    // Re-send
    const result = await sendEmail({
      to: log.recipient,
      template: log.template,
      data: templateData,
      schoolId: log.school_id,
      relatedId: log.related_id,
    });

    if (result.success) {
      sendSuccess(res, null, 'Email resent successfully');
    } else {
      sendError(res, `Resend failed: ${result.error}`, 500);
    }
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

// ── Stats ─────────────────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const [[schools]] = await pool.query('SELECT COUNT(*) AS total, SUM(is_active) AS active FROM schools');
    const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    const [[emails]] = await pool.query('SELECT COUNT(*) AS total, SUM(status="sent") AS sent, SUM(status="failed") AS failed FROM email_notifications');
    sendSuccess(res, { schools, users, emails });
  } catch (err) { sendError(res); }
};

// ── List SuperAdmins ──────────────────────────────────────────
exports.listAdmins = async (req, res) => {
  try {
    const [admins] = await pool.query(
      `SELECT id, name, email, is_active, last_login, created_at FROM superadmins ORDER BY created_at ASC`
    );
    sendSuccess(res, admins);
  } catch (err) { console.error(err); sendError(res); }
};

// ── Create SuperAdmin ─────────────────────────────────────────
exports.createAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return sendError(res, 'name, email and password are required', 400);
  if (password.length < 8)
    return sendError(res, 'Password must be at least 8 characters', 400);
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO superadmins (name, email, password_hash) VALUES (?, ?, ?)`,
      [name, email, hash]
    );

    // Send invitation email (non-blocking — failure does not fail the request)
    sendEmail({
      to: email,
      template: 'superadminInvite',
      data: { name, email, password },
    }).catch(e => console.error('SuperAdmin invite email failed:', e.message));

    sendSuccess(res, { id: result.insertId, name, email, is_active: true }, 'SuperAdmin created', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Email already exists', 409);
    console.error(err); sendError(res);
  }
};

// ── Toggle SuperAdmin Active ──────────────────────────────────
exports.toggleAdmin = async (req, res) => {
  const { id } = req.params;
  // prevent self-disable
  if (Number(id) === Number(req.superadmin.id))
    return sendError(res, 'You cannot disable your own account', 400);
  try {
    await pool.query('UPDATE superadmins SET is_active = NOT is_active WHERE id = ?', [id]);
    sendSuccess(res, null, 'Status updated');
  } catch (err) { sendError(res); }
};

// ── Delete SuperAdmin ─────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  if (Number(id) === Number(req.superadmin.id))
    return sendError(res, 'You cannot delete your own account', 400);
  try {
    await pool.query('DELETE FROM superadmins WHERE id = ?', [id]);
    sendSuccess(res, null, 'SuperAdmin deleted');
  } catch (err) { sendError(res); }
};
