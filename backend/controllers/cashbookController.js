const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

exports.today = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const [[term]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);

    const [entries] = await pool.query(
      `SELECT p.receipt_no, p.payment_date, p.payment_time, p.amount,
              p.payment_method, p.reference,
              s.full_name AS student_name, s.admission_no,
              c.name AS class, s.stream,
              u.name AS cashier_name
       FROM payments p
       JOIN students s ON p.student_id = s.id
       JOIN classes c  ON s.class_id = c.id
       JOIN users u    ON p.cashier_id = u.id
       WHERE p.payment_date = ? AND p.term_id = ? AND p.school_id = ?
       ORDER BY p.payment_time ASC`,
      [date, term?.id, req.user.school_id]
    );

    // Compute totals
    const totals = entries.reduce(
      (acc, e) => {
        acc.total += Number(e.amount);
        acc[e.payment_method.toLowerCase()] = (acc[e.payment_method.toLowerCase()] || 0) + Number(e.amount);
        return acc;
      },
      { total: 0, cash: 0, momo: 0, bank: 0 }
    );

    sendSuccess(res, { date, entries, totals });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

exports.summary = async (req, res) => {
  try {
    const [[term]] = await pool.query('SELECT * FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);

    const [daily] = await pool.query(
      `SELECT payment_date AS date,
              SUM(amount) AS total,
              SUM(IF(payment_method='Cash', amount, 0)) AS cash,
              SUM(IF(payment_method='MoMo', amount, 0)) AS momo,
              SUM(IF(payment_method='Bank', amount, 0)) AS bank,
              COUNT(*) AS count
       FROM payments WHERE term_id = ? AND school_id = ?
       GROUP BY payment_date
       ORDER BY payment_date DESC
       LIMIT 30`,
      [term?.id, req.user.school_id]
    );

    sendSuccess(res, { term, daily });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};
