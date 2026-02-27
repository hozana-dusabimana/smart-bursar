/**
 * Atomically generate next receipt number for the active term.
 * Uses SELECT ... FOR UPDATE to prevent race conditions.
 */
const pool = require('../config/db');

async function nextReceiptNo(conn, termId, prefix = 'RCP') {
  const year = new Date().getFullYear();

  // Lock the row for this term
  await conn.query(
    `INSERT INTO receipt_counter (term_id, last_seq)
     VALUES (?, 0)
     ON DUPLICATE KEY UPDATE last_seq = last_seq`,
    [termId]
  );

  const [[row]] = await conn.query(
    `SELECT last_seq FROM receipt_counter WHERE term_id = ? FOR UPDATE`,
    [termId]
  );
  const nextSeq = row.last_seq + 1;

  await conn.query(
    `UPDATE receipt_counter SET last_seq = ? WHERE term_id = ?`,
    [nextSeq, termId]
  );

  return `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
}

module.exports = nextReceiptNo;
