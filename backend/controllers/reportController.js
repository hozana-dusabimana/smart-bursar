const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

// Class collection sheet
exports.classCollection = async (req, res) => {
  try {
    const { class: cls, term_id } = req.query;

    let termId = term_id;
    if (!termId) {
      const [[t]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
      termId = t?.id;
    }

    let sql = `
      SELECT
        s.id, s.admission_no, s.full_name, c.name AS class, s.stream,
        s.guardian_name, s.guardian_tel,
        i.total_amount AS fee,
        COALESCE(SUM(p.amount), 0) AS paid,
        (i.total_amount - COALESCE(SUM(p.amount), 0)) AS balance
      FROM students s
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN invoices i ON i.student_id = s.id AND i.term_id = ? AND i.school_id = ?
      LEFT JOIN payments p ON p.invoice_id = i.id AND p.school_id = ?
      WHERE s.is_active = 1 AND s.school_id = ?
    `;
    const params = [termId, req.user.school_id, req.user.school_id, req.user.school_id];
    if (cls) { sql += ' AND c.name = ?'; params.push(cls); }
    sql += ' GROUP BY s.id, i.id ORDER BY c.name, s.full_name';

    const [rows] = await pool.query(sql, params);

    const data = rows.map(r => ({
      ...r,
      fee: Number(r.fee) || 0,
      paid: Number(r.paid),
      balance: Math.max(0, Number(r.balance)),
      paymentStatus: !r.fee ? 'No Invoice'
        : r.paid >= r.fee ? 'Cleared'
          : r.paid > 0 ? 'Partial'
            : 'Unpaid'
    }));

    const totals = data.reduce((acc, s) => ({
      fee: acc.fee + s.fee,
      paid: acc.paid + s.paid,
      balance: acc.balance + s.balance
    }), { fee: 0, paid: 0, balance: 0 });

    sendSuccess(res, { students: data, totals });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

// Defaulters list
exports.defaulters = async (req, res) => {
  try {
    const { term_id } = req.query;

    let termId = term_id;
    if (!termId) {
      const [[t]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
      termId = t?.id;
    }

    const [rows] = await pool.query(
      `SELECT
         s.id, s.admission_no, s.full_name, c.name AS class, s.stream,
         s.guardian_name, s.guardian_tel,
         i.total_amount AS fee,
         COALESCE(SUM(p.amount), 0) AS paid,
         (i.total_amount - COALESCE(SUM(p.amount), 0)) AS balance
       FROM students s
       JOIN classes c ON s.class_id = c.id
       JOIN invoices i ON i.student_id = s.id AND i.term_id = ? AND i.school_id = ?
       LEFT JOIN payments p ON p.invoice_id = i.id AND p.school_id = ?
       WHERE s.is_active = 1 AND s.school_id = ?
       GROUP BY s.id, i.id
       HAVING balance > 0
       ORDER BY balance DESC`,
      [termId, req.user.school_id, req.user.school_id, req.user.school_id]
    );

    const data = rows.map(r => ({
      ...r,
      fee: Number(r.fee),
      paid: Number(r.paid),
      balance: Number(r.balance),
      paymentStatus: Number(r.paid) === 0 ? 'Unpaid' : 'Partial'
    }));

    const totalOutstanding = data.reduce((s, r) => s + r.balance, 0);

    sendSuccess(res, { defaulters: data, totalOutstanding, count: data.length });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};

// Daily operations summary
exports.dailySummary = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const [[term]] = await pool.query('SELECT * FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);

    const [[daySummary]] = await pool.query(
      `SELECT
         COUNT(*) AS entries,
         SUM(amount) AS total,
         SUM(IF(payment_method='Cash', amount, 0)) AS cash,
         SUM(IF(payment_method='MoMo', amount, 0)) AS momo,
         SUM(IF(payment_method='Bank', amount, 0)) AS bank
       FROM payments WHERE payment_date = ? AND term_id = ? AND school_id = ?`,
      [date, term?.id, req.user.school_id]
    );

    const [[termSummary]] = await pool.query(
      `SELECT
         COUNT(DISTINCT s.id) AS total_students,
         COALESCE(SUM(i.total_amount), 0) AS total_fees_expected,
         COALESCE(SUM(p_total.paid), 0) AS total_collected,
         COUNT(DISTINCT CASE WHEN COALESCE(p_total.paid,0) >= COALESCE(i.total_amount,0) AND i.id IS NOT NULL THEN s.id END) AS cleared,
         COUNT(DISTINCT CASE WHEN COALESCE(p_total.paid,0) > 0 AND COALESCE(p_total.paid,0) < i.total_amount THEN s.id END) AS partial,
         COUNT(DISTINCT CASE WHEN i.id IS NULL OR (COALESCE(p_total.paid,0) = 0 AND i.id IS NOT NULL) THEN s.id END) AS unpaid
       FROM students s
       LEFT JOIN invoices i ON i.student_id = s.id AND i.term_id = ? AND i.school_id = ?
       LEFT JOIN (
         SELECT invoice_id, SUM(amount) AS paid FROM payments WHERE term_id = ? AND school_id = ? GROUP BY invoice_id
       ) p_total ON p_total.invoice_id = i.id
       WHERE s.is_active = 1 AND s.school_id = ?`,
      [term?.id, req.user.school_id, term?.id, req.user.school_id, req.user.school_id]
    );

    sendSuccess(res, {
      date,
      term,
      day: daySummary,
      term: termSummary
    });
  } catch (err) {
    console.error(err);
    sendError(res);
  }
};
