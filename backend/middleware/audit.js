const pool = require('../config/db');

/**
 * Log an action to audit_logs table
 */
const audit = async (userId, action, entity, entityId, detail, ip) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, detail, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, entity, entityId, JSON.stringify(detail || {}), ip || null]
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = audit;
