const pool = require('../config/db');
const nextReceiptNo = require('../utils/receiptNumber');
const audit = require('../middleware/audit');
const { sendEmail } = require('../utils/email');
const { sendSuccess, sendError, amountInWords } = require('../utils/helpers');

exports.create = async (req, res) => {
  const { student_id, amount, payment_method, reference, notes } = req.body;
  if (!student_id || !amount || !payment_method)
    return sendError(res, 'student_id, amount, and payment_method are required', 400);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[term]] = await conn.query('SELECT * FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
    if (!term) return sendError(res, 'No active term found', 400);

    const [[invoice]] = await conn.query(
      `SELECT i.*, COALESCE((SELECT SUM(p2.amount) FROM payments p2 WHERE p2.invoice_id = i.id AND p2.school_id = ?), 0) AS paid
       FROM invoices i WHERE i.student_id = ? AND i.term_id = ? AND i.school_id = ?`,
      [req.user.school_id, student_id, term.id, req.user.school_id]
    );
    if (!invoice) return sendError(res, 'No invoice found for this student this term', 404);

    const balance = Number(invoice.total_amount) - Number(invoice.paid);
    if (amount > balance) return sendError(res, `Amount exceeds balance. Max payable: ${balance}`, 400);

    const receiptNo = await nextReceiptNo(conn, term.id);
    const now = new Date();
    const paymentDate = now.toISOString().split('T')[0];
    const paymentTime = now.toTimeString().split(' ')[0];

    const [result] = await conn.query(
      `INSERT INTO payments (receipt_no, invoice_id, student_id, term_id, amount, payment_method, reference, payment_date, payment_time, cashier_id, notes, school_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [receiptNo, invoice.id, student_id, term.id, amount, payment_method, reference || null, paymentDate, paymentTime, req.user.id, notes || null, req.user.school_id]
    );

    await conn.commit();
    await audit(req.user.id, 'PAYMENT_CREATED', 'payments', result.insertId, { receiptNo, amount }, req.ip);

    // Fetch student + school for receipt
    const [[student]] = await pool.query(
      `SELECT s.*, c.name AS class FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = ? AND s.school_id = ?`,
      [student_id, req.user.school_id]
    );
    const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [req.user.school_id]);
    const school = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));
    const newBalance = balance - amount;

    const receiptData = {
      receiptNo, date: paymentDate, time: paymentTime, term,
      student, amount, amountInWords: amountInWords(amount),
      payment_method, reference: reference || null,
      cashier: req.user.name, school,
      fee: Number(invoice.total_amount),
      previouslyPaid: Number(invoice.paid),
      newBalance: Math.max(0, newBalance),
      isCleared: newBalance <= 0
    };

    // Send email receipt in background (don't block response)
    if (student.guardian_email) {
      sendEmail({
        to: student.guardian_email,
        template: 'receipt',
        data: { student, receipt: receiptData, school },
        schoolId: req.user.school_id,
        relatedId: result.insertId,
      }).catch(e => console.error('Receipt email failed:', e.message));
    }

    sendSuccess(res, { receipt: receiptData }, 'Payment recorded', 201);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    sendError(res, 'Payment failed');
  } finally {
    conn.release();
  }
};

exports.list = async (req, res) => {
  try {
    const { date, student_id, method, term_id, page = 1, limit = 50 } = req.query;
    let termId = term_id;
    if (!termId) { const [[t]] = await pool.query('SELECT id FROM academic_terms WHERE is_active=1 AND school_id=? LIMIT 1', [req.user.school_id]); termId = t?.id; }

    let sql = `SELECT p.id, p.receipt_no, p.amount, p.payment_method, p.reference,
      p.payment_date, p.payment_time, p.notes,
      s.full_name AS student_name, s.admission_no, c.name AS class, s.stream, u.name AS cashier_name
      FROM payments p JOIN students s ON p.student_id=s.id JOIN classes c ON s.class_id=c.id
      JOIN users u ON p.cashier_id=u.id WHERE p.term_id=? AND p.school_id=?`;
    const params = [termId, req.user.school_id];
    if (date) { sql += ' AND p.payment_date=?'; params.push(date); }
    if (student_id) { sql += ' AND p.student_id=?'; params.push(student_id); }
    if (method) { sql += ' AND p.payment_method=?'; params.push(method); }
    sql += ` ORDER BY p.payment_date DESC, p.payment_time DESC LIMIT ${Number(limit)} OFFSET ${(Number(page) - 1) * Number(limit)}`;

    const [rows] = await pool.query(sql, params);
    sendSuccess(res, rows);
  } catch (err) { console.error(err); sendError(res); }
};

exports.getByReceipt = async (req, res) => {
  try {
    const [[payment]] = await pool.query(
      `SELECT p.*, s.full_name, s.admission_no, c.name AS class, s.stream, s.guardian_name,
              u.name AS cashier_name, i.total_amount AS total_fee,
              (SELECT SUM(p2.amount) FROM payments p2 WHERE p2.invoice_id=i.id AND p2.id<=p.id) AS cumulative_paid
       FROM payments p JOIN students s ON p.student_id=s.id JOIN classes c ON s.class_id=c.id
       JOIN users u ON p.cashier_id=u.id JOIN invoices i ON p.invoice_id=i.id
        WHERE p.receipt_no=? AND p.school_id=?`,
      [req.params.receiptNo, req.user.school_id]
    );
    if (!payment) return sendError(res, 'Receipt not found', 404);
    const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [payment.school_id || req.user.school_id]);
    const school = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));
    sendSuccess(res, { ...payment, school, amountInWords: amountInWords(Number(payment.amount)) });
  } catch (err) { console.error(err); sendError(res); }
};

// Send receipt email manually (resend)
exports.resendReceipt = async (req, res) => {
  try {
    const [[payment]] = await pool.query(
      `SELECT p.*, s.full_name, s.guardian_email, s.guardian_name, s.admission_no,
              c.name AS class, s.stream, u.name AS cashier_name, i.total_amount
       FROM payments p JOIN students s ON p.student_id=s.id JOIN classes c ON s.class_id=c.id
       JOIN users u ON p.cashier_id=u.id JOIN invoices i ON p.invoice_id=i.id
        WHERE p.id=? AND p.school_id=?`,
      [req.params.id, req.user.school_id]
    );
    if (!payment) return sendError(res, 'Payment not found', 404);
    if (!payment.guardian_email) return sendError(res, 'No guardian email on file', 400);

    const [configs] = await pool.query('SELECT setting_key, setting_value FROM school_config WHERE school_id = ?', [payment.school_id || req.user.school_id]);
    const school = Object.fromEntries(configs.map(c => [c.setting_key, c.setting_value]));
    const [[term]] = await pool.query('SELECT * FROM academic_terms WHERE id=? AND school_id=?', [payment.term_id, req.user.school_id]);

    await sendEmail({
      to: payment.guardian_email,
      template: 'receipt',
      data: {
        student: { ...payment, class: payment.class, stream: payment.stream },
        receipt: {
          receiptNo: payment.receipt_no, date: String(payment.payment_date).slice(0, 10),
          term, amount: payment.amount, amountInWords: amountInWords(Number(payment.amount)),
          payment_method: payment.payment_method, cashier: payment.cashier_name,
          fee: payment.total_amount, newBalance: 0
        },
        school
      },
    });
    sendSuccess(res, null, 'Receipt email sent');
  } catch (err) { console.error(err); sendError(res); }
};

exports.submitParentPayment = async (req, res) => {
  const { student_id, amount, payment_method, reference, notes } = req.body;
  const proof_url = req.file ? `/uploads/proofs/${req.file.filename}` : null;

  if (!student_id || !amount || !payment_method)
    return sendError(res, 'Missing required fields', 400);

  try {
    const [[term]] = await pool.query('SELECT id FROM academic_terms WHERE is_active = 1 AND school_id = ? LIMIT 1', [req.user.school_id]);
    const [[invoice]] = await pool.query('SELECT id FROM invoices WHERE student_id = ? AND term_id = ? AND school_id = ?', [student_id, term.id, req.user.school_id]);

    if (!invoice) return sendError(res, 'No invoice found', 404);

    const status = payment_method === 'Bank' ? 'pending' : 'approved';

    const [result] = await pool.query(
      `INSERT INTO payments (invoice_id, student_id, term_id, amount, payment_method, reference, proof_url, status, payment_date, payment_time, school_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME(), ?, ?)`,
      [invoice.id, student_id, term.id, amount, payment_method, reference || null, proof_url, status, req.user.school_id, notes || null]
    );

    sendSuccess(res, { id: result.insertId, status }, 'Payment submitted for processing', 201);
  } catch (err) {
    console.error(err);
    sendError(res, 'Submission failed');
  }
};

exports.listPending = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.full_name, s.admission_no, c.name AS class_name
       FROM payments p
       JOIN students s ON p.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       WHERE p.status = 'pending' AND p.school_id = ?
       ORDER BY p.id DESC`,
      [req.user.school_id]
    );
    sendSuccess(res, rows);
  } catch (err) { console.error(err); sendError(res); }
};

exports.approvePayment = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[payment]] = await conn.query('SELECT * FROM payments WHERE id = ? AND school_id = ?', [id, req.user.school_id]);
    if (!payment) return sendError(res, 'Payment not found', 404);

    const receiptNo = await nextReceiptNo(conn, payment.term_id);

    await conn.query(
      'UPDATE payments SET status = "approved", receipt_no = ?, cashier_id = ? WHERE id = ?',
      [receiptNo, req.user.id, id]
    );

    await conn.commit();
    sendSuccess(res, { receiptNo }, 'Payment approved');
  } catch (err) {
    await conn.rollback();
    console.error(err);
    sendError(res, 'Approval failed');
  } finally { conn.release(); }
};

exports.rejectPayment = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    await pool.query(
      'UPDATE payments SET status = "rejected", rejection_reason = ? WHERE id = ? AND school_id = ?',
      [reason, id, req.user.school_id]
    );
    sendSuccess(res, null, 'Payment rejected');
  } catch (err) { console.error(err); sendError(res); }
};
