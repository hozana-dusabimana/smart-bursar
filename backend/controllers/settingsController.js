const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
    const config = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));

    const [feeRows] = await pool.query(
      `SELECT c.name AS class, fs.tuition, fs.activity, fs.transport,
              (fs.tuition + fs.activity + fs.transport) AS total
       FROM fee_structure fs
       JOIN classes c ON c.id = fs.class_id
       JOIN academic_terms t ON t.id = fs.term_id
        WHERE t.is_active = 1 AND fs.school_id = ?
        ORDER BY c.id`,
      [req.user.school_id]
    );

    const [terms] = await pool.query('SELECT * FROM academic_terms WHERE school_id = ? ORDER BY id', [req.user.school_id]);
    const [classes] = await pool.query('SELECT id, name FROM classes WHERE school_id = ? ORDER BY id', [req.user.school_id]);

    sendSuccess(res, { config, feeStructure: feeRows, terms, classes });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.updateConfig = async (req, res) => {
  const { settings } = req.body; // { key: value, ... }
  if (!settings || typeof settings !== 'object')
    return sendError(res, 'Provide settings object', 400);

  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO school_config (setting_key, setting_value, school_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, req.user.school_id, value]
      );
    }
    sendSuccess(res, null, 'Settings saved');
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.updateFeeStructure = async (req, res) => {
  const { class: cls, tuition, activity, transport } = req.body;
  if (!cls) return sendError(res, 'class is required', 400);

  try {
    const [[term]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
    const [[classRow]] = await pool.query('SELECT id FROM classes WHERE name = ? AND school_id = ?', [cls, req.user.school_id]);
    if (!classRow) return sendError(res, 'Invalid class', 400);

    await pool.query(
      `INSERT INTO fee_structure (class_id, term_id, tuition, activity, transport, school_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE tuition = VALUES(tuition), activity = VALUES(activity), transport = VALUES(transport)`,
      [classRow.id, term.id, tuition || 0, activity || 0, transport || 0, req.user.school_id]
    );

    sendSuccess(res, null, 'Fee structure updated');
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.getSetupStatus = async (req, res) => {
  try {
    const [[{ count: configCount }]] = await pool.query('SELECT COUNT(*) AS count FROM school_config WHERE school_id = ?', [req.user.school_id]);
    const [[{ count: termCount }]] = await pool.query('SELECT COUNT(*) AS count FROM academic_terms WHERE school_id = ?', [req.user.school_id]);
    const [[{ count: classCount }]] = await pool.query('SELECT COUNT(*) AS count FROM classes WHERE school_id = ?', [req.user.school_id]);
    const [[{ count: feeCount }]] = await pool.query('SELECT COUNT(*) AS count FROM fee_structure WHERE school_id = ?', [req.user.school_id]);

    sendSuccess(res, {
      isComplete: configCount > 5 && termCount > 0 && classCount > 0 && feeCount > 0,
      steps: {
        config: configCount > 5,
        terms: termCount > 0,
        classes: classCount > 0,
        fees: feeCount > 0
      }
    });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.createTerm = async (req, res) => {
  const { term_name, academic_year, start_date, end_date, is_active } = req.body;
  if (!term_name || !academic_year) return sendError(res, 'term_name and academic_year are required', 400);

  try {
    // If setting as active, deactivate others
    if (is_active) {
      await pool.query('UPDATE academic_terms SET is_active = 0 WHERE school_id = ?', [req.user.school_id]);
    }

    const [result] = await pool.query(
      `INSERT INTO academic_terms (term_name, academic_year, start_date, end_date, is_active, school_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [term_name, academic_year, start_date, end_date, is_active ? 1 : 0, req.user.school_id]
    );

    sendSuccess(res, { id: result.insertId }, 'Term created successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Term already exists for this year', 409);
    console.error(err);
    sendError(res);
  }
};

exports.updateTerm = async (req, res) => {
  const { id } = req.params;
  const { term_name, academic_year, start_date, end_date, is_active } = req.body;

  try {
    // If setting as active, deactivate others
    if (is_active) {
      await pool.query('UPDATE academic_terms SET is_active = 0 WHERE school_id = ?', [req.user.school_id]);
    }

    await pool.query(
      `UPDATE academic_terms
       SET term_name = ?, academic_year = ?, start_date = ?, end_date = ?, is_active = ?
       WHERE id = ? AND school_id = ?`,
      [term_name, academic_year, start_date, end_date, is_active ? 1 : 0, id, req.user.school_id]
    );

    sendSuccess(res, null, 'Term updated successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Term already exists for this year', 409);
    console.error(err);
    sendError(res);
  }
};

exports.deleteTerm = async (req, res) => {
  try {
    await pool.query('DELETE FROM academic_terms WHERE id = ? AND school_id = ?', [req.params.id, req.user.school_id]);
    sendSuccess(res, null, 'Term deleted');
  } catch (err) {
    sendError(res);
  }
};

exports.createClass = async (req, res) => {
  const { name } = req.body;
  if (!name) return sendError(res, 'Name is required', 400);

  try {
    const [result] = await pool.query('INSERT INTO classes (name, school_id) VALUES (?, ?)', [name, req.user.school_id]);
    sendSuccess(res, { id: result.insertId }, 'Class created successfully');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return sendError(res, 'Class already exists', 409);
    sendError(res);
  }
};

exports.deleteClass = async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = ? AND school_id = ?', [req.params.id, req.user.school_id]);
    sendSuccess(res, null, 'Class deleted');
  } catch (err) {
    sendError(res);
  }
};

exports.uploadLogo = async (req, res) => {
  if (!req.file) return sendError(res, 'No file uploaded', 400);

  const logoUrl = `/uploads/${req.file.filename}`;
  try {
    await pool.query(
      'INSERT INTO school_config (setting_key, setting_value, school_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      ['school_logo', logoUrl, req.user.school_id, logoUrl]
    );
    sendSuccess(res, { logoUrl }, 'Logo uploaded successfully');
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};
