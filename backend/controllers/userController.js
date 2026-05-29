const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

exports.list = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, r.name AS role, u.is_active, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.id 
       WHERE u.school_id = ?
       ORDER BY u.created_at DESC`,
      [req.user.school_id]
    );
    sendSuccess(res, users);
  } catch (err) { sendError(res); }
};

exports.create = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return sendError(res, 'name, email, password, role are required', 400);

  try {
    const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (!roleRow) return sendError(res, 'Invalid role', 400);

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role_id, school_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, roleRow.id, req.user.school_id]
    );

    // Send welcome email (non-blocking)
    try {
      const { sendEmail } = require('../utils/email');
      const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
      const cfg = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));

      sendEmail({
        to: email,
        template: 'welcome',
        schoolId: req.user.school_id,
        data: {
          user: { name, email, role },
          password: password,
          school: { name: cfg.school_name || 'Smart Bursar' }
        }
      }).catch(e => console.error('User welcome email failed:', e.message));
    } catch (e) {
      console.error('Failed to initiate welcome email:', e.message);
    }

    sendSuccess(res, { id: result.insertId }, 'User created', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Email already exists', 409);
    sendError(res);
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const [[roleRow]] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
    if (!roleRow) return sendError(res, 'Invalid role', 400);
    await pool.query('UPDATE users SET role_id = ? WHERE id = ? AND school_id = ?', [roleRow.id, id, req.user.school_id]);
    sendSuccess(res, null, 'Role updated');
  } catch (err) { sendError(res); }
};

exports.toggleActive = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ? AND school_id = ?', [id, req.user.school_id]);
    sendSuccess(res, null, 'Status toggled');
  } catch (err) { sendError(res); }
};

const ADJECTIVES = ['Safe', 'Smart', 'Quick', 'Bright', 'Firm', 'Cool', 'Pure', 'Kind', 'Wise', 'Bold'];
const NOUNS = ['Home', 'Blue', 'Star', 'Key', 'Gate', 'Bell', 'Peak', 'Bird', 'Moon', 'Tree'];

exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  try {
    const [[user]] = await pool.query('SELECT name, email, school_id FROM users WHERE id = ? AND school_id = ?', [id, req.user.school_id]);
    if (!user) return sendError(res, 'User not found', 404);

    // Generate memorable password: Word-Word-123
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(100 + Math.random() * 899);
    const newPassword = `${adj}${noun}${num}`;

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ? AND school_id = ?', [hash, id, req.user.school_id]);

    // Send email (non-blocking)
    try {
      const { sendEmail } = require('../utils/email');
      const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
      const cfg = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));

      sendEmail({
        to: user.email,
        template: 'welcome', // Reuse welcome template for reset notification
        schoolId: req.user.school_id,
        data: {
          user: { name: user.name, email: user.email, role: 'user' },
          password: newPassword,
          school: { name: cfg.school_name || 'Smart Bursar' }
        }
      }).catch(e => console.error('Reset email failed:', e.message));
    } catch (e) { console.error(e); }

    sendSuccess(res, null, `Password reset to: ${newPassword}`);
  } catch (err) { sendError(res); }
};

exports.getProfile = async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, u.tel, r.name AS role, u.role_id 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ? AND u.school_id = ?`,
      [req.user.id, req.user.school_id]
    );
    if (!user) return sendError(res, 'Profile not found', 404);
    sendSuccess(res, user);
  } catch (err) {
    console.error('getProfile Error:', err);
    sendError(res, 'Failed to fetch profile: ' + err.message);
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email, tel, password } = req.body;
  try {
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) { updates.push('email = ?'); params.push(email); }
    if (tel) { updates.push('tel = ?'); params.push(tel); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (updates.length === 0) return sendError(res, 'No fields to update', 400);

    params.push(req.user.id, req.user.school_id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND school_id = ?`, params);
    sendSuccess(res, null, 'Profile updated successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Email already in use', 409);
    sendError(res);
  }
};

exports.sendWelcome = async (req, res) => {
  const { id } = req.params;
  const { tempPassword } = req.body;
  try {
    const [[user]] = await pool.query('SELECT u.*, r.name AS role FROM users u JOIN roles r ON u.role_id=r.id WHERE u.id=? AND u.school_id=?', [id, req.user.school_id]);
    if (!user) return sendError(res, 'User not found', 404);
    const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
    const cfg = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));
    const { sendEmail } = require('../utils/email');
    await sendEmail({
      to: user.email,
      template: 'welcome',
      schoolId: req.user.school_id,
      data: { user, password: tempPassword || '(see your admin)', school: { name: cfg.school_name } }
    });
    sendSuccess(res, null, 'Welcome email sent');
  } catch (e) { console.error(e); sendError(res); }
};
