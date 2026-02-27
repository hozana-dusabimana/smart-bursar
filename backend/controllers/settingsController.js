const pool  = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

exports.getAll = async (req, res) => {
  try {
    const [rows]  = await pool.query('SELECT setting_key, setting_value FROM school_config');
    const config  = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));

    const [feeRows] = await pool.query(
      `SELECT c.name AS class, fs.tuition, fs.activity, fs.transport,
              (fs.tuition + fs.activity + fs.transport) AS total
       FROM fee_structure fs
       JOIN classes c ON c.id = fs.class_id
       JOIN academic_terms t ON t.id = fs.term_id
       WHERE t.is_active = 1
       ORDER BY c.id`
    );

    const [terms] = await pool.query('SELECT * FROM academic_terms ORDER BY id');
    const [classes] = await pool.query('SELECT id, name FROM classes ORDER BY id');

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
        'INSERT INTO school_config (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
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
    const [[term]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 LIMIT 1');
    const [[classRow]] = await pool.query('SELECT id FROM classes WHERE name = ?', [cls]);
    if (!classRow) return sendError(res, 'Invalid class', 400);

    await pool.query(
      `INSERT INTO fee_structure (class_id, term_id, tuition, activity, transport)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE tuition = VALUES(tuition), activity = VALUES(activity), transport = VALUES(transport)`,
      [classRow.id, term.id, tuition || 0, activity || 0, transport || 0]
    );

    sendSuccess(res, null, 'Fee structure updated');
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};
