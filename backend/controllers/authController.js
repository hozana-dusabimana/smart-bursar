const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendEmail } = require('../utils/email');
const { sendSuccess, sendError } = require('../utils/helpers');

// ── Login ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 'Email and password required', 400);

  try {
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.is_active, u.school_id,
              r.name AS role, s.name AS school_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN schools s ON s.id = u.school_id
       WHERE u.email = ?`,
      [email]
    );
    if (!user) return sendError(res, 'Invalid email or password', 401);
    if (!user.is_active) return sendError(res, 'Your account has been disabled', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return sendError(res, 'Invalid email or password', 401);

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, school_id: user.school_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    sendSuccess(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, school_id: user.school_id, school_name: user.school_name }
    }, 'Login successful');
  } catch (err) {
    console.error(err);
    sendError(res, 'Login failed');
  }
};

// ── OTP Logic ───────────────────────────────────────────────
exports.requestOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, 'Email is required', 400);

  try {
    // 1. Check if email belongs to a parent
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role, u.school_id 
       FROM users u JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ? AND u.is_active = 1`, [email]
    );

    if (!user) return sendError(res, 'Account not found or inactive', 404);
    if (user.role !== 'parent') return sendError(res, 'OTP login is only for parents', 403);

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 3. Save to database
    await pool.query(
      'INSERT INTO login_otps (email, otp_hash, expires_at) VALUES (?, ?, ?)',
      [email, hash, expiresAt]
    );

    const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [user.school_id]);
    const cfg = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));

    // 4. Send email
    await sendEmail({
      to: email,
      template: 'otp',
      schoolId: user.school_id,
      data: {
        name: user.name,
        otp,
        email,
        school: { name: cfg.school_name || user.school_name || 'Smart Bursar' }
      }
    }).catch(e => console.error('OTP Email failed:', e.message));

    sendSuccess(res, null, 'Login code sent to your email');
  } catch (err) {
    console.error(err);
    sendError(res, 'Failed to request code');
  }
};

exports.loginWithOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return sendError(res, 'Email and code are required', 400);

  try {
    // 1. Find latest unused OTP for this email
    const [[row]] = await pool.query(
      `SELECT * FROM login_otps 
       WHERE email = ? AND used = 0 AND expires_at > ? 
       ORDER BY created_at DESC LIMIT 1`, [email, new Date()]
    );

    if (!row) return sendError(res, 'Invalid or expired code', 401);

    // 2. Verify hash
    const valid = await bcrypt.compare(otp, row.otp_hash);
    if (!valid) return sendError(res, 'Invalid code', 401);

    // 3. Get user info
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, u.school_id, u.is_active, r.name AS role, s.name AS school_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN schools s ON s.id = u.school_id
       WHERE u.email = ?`, [email]
    );

    if (!user || !user.is_active) return sendError(res, 'Account error', 403);

    // 4. Mark OTP as used
    await pool.query('UPDATE login_otps SET used = 1 WHERE id = ?', [row.id]);

    // 5. Issue token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, school_id: user.school_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    sendSuccess(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, school_id: user.school_id, school_name: user.school_name }
    }, 'Login successful');
  } catch (err) {
    console.error(err);
    sendError(res, 'Code verification failed');
  }
};

exports.me = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role, u.is_active, u.school_id
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user);
  } catch (err) { sendError(res); }
};

// ── Forgot Password ───────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return sendError(res, 'Email is required', 400);

  try {
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, s.name AS school_name, s.tel AS school_tel
       FROM users u LEFT JOIN schools s ON s.id = u.school_id WHERE u.email = ?`,
      [email]
    );

    // Always return success to prevent email enumeration
    if (!user) {
      return sendSuccess(res, null, 'If that email is registered, a reset link has been sent.');
    }

    // Delete any existing tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

    // Generate secure token
    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [user.id, token, expiresAt]
    );

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    // Send email
    await sendEmail({
      to: user.email,
      template: 'passwordReset',
      data: { user, resetUrl, school: { name: user.school_name, tel: user.school_tel } },
    });

    sendSuccess(res, null, 'If that email is registered, a reset link has been sent.');
  } catch (err) {
    console.error(err);
    sendError(res, 'Request failed');
  }
};

// ── Reset Password ────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return sendError(res, 'Token and new password are required', 400);
  if (password.length < 8) return sendError(res, 'Password must be at least 8 characters', 400);

  try {
    const [[row]] = await pool.query(
      `SELECT prt.*, u.id AS uid, u.name, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = ? AND prt.used_at IS NULL AND prt.expires_at > ?`,
      [token, new Date()]
    );

    if (!row) return sendError(res, 'Invalid or expired reset token', 400);

    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, row.uid]);
    await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [row.id]);

    sendSuccess(res, null, 'Password reset successfully. You can now log in.');
  } catch (err) {
    console.error(err);
    sendError(res, 'Reset failed');
  }
};

// ── Validate Token ────────────────────────────────────────────
exports.validateResetToken = async (req, res) => {
  const { token } = req.params;
  try {
    const [[row]] = await pool.query(
      `SELECT prt.id, u.email, u.name
       FROM password_reset_tokens prt JOIN users u ON prt.user_id = u.id
       WHERE prt.token = ? AND prt.used_at IS NULL AND prt.expires_at > ?`,
      [token, new Date()]
    );
    if (!row) return sendError(res, 'Invalid or expired token', 400);
    sendSuccess(res, { email: row.email, name: row.name });
  } catch (err) {
    sendError(res);
  }
};
