/**
 * Email Service — Nodemailer
 * Sends transactional emails and logs them to the DB
 */
require('dotenv').config();
const nodemailer = require('nodemailer');
const pool = require('../config/db');

// ── Transporter ──────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ── Base HTML wrapper ────────────────────────────────────────
const wrap = (content, schoolName = 'Smart Bursar') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#f1f5f9; color:#1e293b; }
    .wrapper { max-width:560px; margin:0 auto; padding:24px 16px; }
    .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.07); }
    .header { background:#1e3a8a; padding:28px 32px; }
    .header h1 { color:#fff; font-size:18px; font-weight:800; letter-spacing:-0.3px; }
    .header p  { color:#93c5fd; font-size:12px; margin-top:4px; }
    .body { padding:28px 32px; }
    .body p { font-size:14px; line-height:1.6; color:#475569; margin-bottom:12px; }
    .body strong { color:#1e293b; }
    .table { width:100%; border-collapse:collapse; margin:16px 0; font-size:13px; }
    .table th { background:#f8fafc; text-align:left; padding:10px 12px; font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; }
    .table td { padding:10px 12px; border-bottom:1px solid #f1f5f9; color:#374151; }
    .table .amount { font-weight:800; color:#1d4ed8; text-align:right; }
    .btn { display:inline-block; border:1px solid #1d4ed8; color:white; padding:12px 28px; border-radius:10px;
           text-decoration:none; font-weight:700; font-size:14px; margin:16px 0; }
    .badge-green { display:inline-block; background:#dcfce7; color:#166534; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }
    .badge-red   { display:inline-block; background:#fee2e2; color:#991b1b; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }
    .divider { border:none; border-top:1px solid #f1f5f9; margin:20px 0; }
    .footer { text-align:center; padding:20px 32px; background:#f8fafc; }
    .footer p { font-size:11px; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>📚 ${schoolName}</h1>
        <p>Smart Bursar System</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>This email was sent by Smart Bursar · ${schoolName}</p>
        <p style="margin-top:4px;">Please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

// ── Templates ────────────────────────────────────────────────

const templates = {

  // Payment receipt
  receipt: ({ student, receipt, school }) => ({
    subject: `Payment Receipt ${receipt.receiptNo} — ${student.full_name}`,
    html: wrap(`
      <p>Dear <strong>${student.guardian_name || student.full_name}</strong>,</p>
      <p>We have received a fee payment for <strong>${student.full_name}</strong>. Here are the details:</p>
      <table class="table">
        <tr><th>Field</th><th>Details</th></tr>
        <tr><td>Receipt No.</td><td><strong>${receipt.receiptNo}</strong></td></tr>
        <tr><td>Student</td><td>${student.full_name}</td></tr>
        <tr><td>Admission No.</td><td>${student.admission_no}</td></tr>
        <tr><td>Class</td><td>${student.class} ${student.stream}</td></tr>
        <tr><td>Term</td><td>${receipt.term?.term_name}</td></tr>
        <tr><td>Payment Method</td><td>${receipt.payment_method}</td></tr>
        <tr><td>Date</td><td>${receipt.date}</td></tr>
        <tr><td>Amount Paid</td><td class="amount">RWF ${Number(receipt.amount).toLocaleString()}</td></tr>
        <tr><td>Remaining Balance</td><td class="amount ${receipt.newBalance <= 0 ? '' : ''}">${receipt.newBalance <= 0 ? '<span class="badge-green">FULLY CLEARED ✓</span>' : `RWF ${Number(receipt.newBalance).toLocaleString()}`}</td></tr>
      </table>
      <p style="font-style:italic;font-size:12px;color:#94a3b8;">Amount in words: ${receipt.amountInWords}</p>
      <hr class="divider">
      <p>For any queries, contact the bursar's office at <strong>${school.tel || ''}</strong>.</p>
    `, school.school_name)
  }),

  // Welcome new user
  welcome: ({ user, password, school }) => ({
    subject: `Welcome to Smart Bursar — Your Account is Ready`,
    html: wrap(`
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>Your account for <strong>${school?.name || 'Smart Bursar'}</strong> has been created. You can now log in to your portal.</p>
      <table class="table">
        <tr><td>Email</td><td><strong>${user.email}</strong></td></tr>
        <tr><td>Role</td><td><strong style="text-transform:capitalize">${user.role}</strong></td></tr>
        <tr><td>Temporary Password</td><td><strong>${password}</strong></td></tr>
      </table>
      <a href="${process.env.APP_URL}/login" class="btn">Access Your Portal →</a>
      <p>Please change your password after your first login.</p>
      <hr class="divider">
      <p style="font-size:12px;color:#94a3b8;">If you did not expect this email, please contact your school administrator.</p>
    `, school?.name)
  }),

  // Parent Student Enrollment Notification
  parentEnrollment: ({ user, student_name, school }) => ({
    subject: `Student Enrollment Notification — ${school?.name || 'Smart Bursar'}`,
    html: wrap(`
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>We are pleased to inform you that your student, <strong>${student_name}</strong>, has been successfully enrolled at <strong>${school?.name || 'Smart Bursar'}</strong>.</p>
      <div style="background:#f0f9ff; padding:20px; border-radius:12px; margin:20px 0; border:1px solid #bae6fd;">
        <p style="margin:0 0 10px 0; font-size:14px; color:#0369a1; font-weight:bold;">Student Details:</p>
        <p style="margin:0; font-size:16px; color:#0c4a6e;">${student_name}</p>
      </div>
      <p>An account has been created for you to monitor payments, invoices, and school communications.</p>
      <table class="table" style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr><td style="padding:10px 0; border-bottom:1px solid #e2e8f0; color:#64748b;">Email Address</td><td style="padding:10px 0; border-bottom:1px solid #e2e8f0; text-align:right;"><strong>${user.email}</strong></td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #e2e8f0; color:#64748b;">Security</td><td style="padding:10px 0; border-bottom:1px solid #e2e8f0; text-align:right;"><strong>Passwordless (OTP Login)</strong></td></tr>
      </table>
      <div style="text-align:center; margin:30px 0;">
        <a href="${process.env.APP_URL}/login?mode=parent&email=${encodeURIComponent(user.email)}" style="background:#2563eb; color:white; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:bold; display:inline-block; border:1px solid #1d4ed8;">Access Parent Portal →</a>
      </div>
      <p>To access your account, simply use your email address on the login page and you'll receive a one-time code to your email.</p>
      <hr class="divider">
      <p style="font-size:12px;color:#94a3b8;">If you are not the guardian of this student, please contact the school immediately.</p>
    `, school?.name)
  }),

  // Password reset
  passwordReset: ({ user, resetUrl, school }) => ({
    subject: `Password Reset Request — Smart Bursar`,
    html: wrap(`
      <p>Dear <strong>${user.name}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <a href="${resetUrl}" class="btn">Reset My Password →</a>
      <p>This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
      <hr class="divider">
      <p style="font-size:12px;color:#94a3b8;">For security, never share this link with anyone. The Smart Bursar team will never ask for your password.</p>
    `, school?.name)
  }),

  // Low balance alert to parent
  lowBalance: ({ student, balance, term, school }) => ({
    subject: `Fee Balance Reminder — ${student.full_name}`,
    html: wrap(`
      <p>Dear <strong>${student.guardian_name}</strong>,</p>
      <p>This is a friendly reminder that <strong>${student.full_name}</strong> has an outstanding fee balance for <strong>${term.term_name} ${term.academic_year}</strong>.</p>
      <table class="table">
        <tr><td>Student</td><td>${student.full_name}</td></tr>
        <tr><td>Class</td><td>${student.class} ${student.stream}</td></tr>
        <tr><td>Term</td><td>${term.term_name}</td></tr>
        <tr><td>Balance Due</td><td class="amount"><span class="badge-red">RWF ${Number(balance).toLocaleString()}</span></td></tr>
      </table>
      <p>Please visit the bursar's office or call <strong>${school.tel}</strong> to make your payment at your earliest convenience.</p>
    `, school?.name || school?.school_name)
  }),

  // New school welcome (superadmin sends to school admin)
  newSchool: ({ school, admin, tempPassword }) => ({
    subject: `Your Smart Bursar Account is Ready — ${school.name}`,
    html: wrap(`
      <p>Dear <strong>${admin.name}</strong>,</p>
      <p>Welcome to Smart Bursar! Your school <strong>${school.name}</strong> has been set up on our platform.</p>
      <table class="table">
        <tr><td>School</td><td><strong>${school.name}</strong></td></tr>
        <tr><td>Subscription</td><td style="text-transform:capitalize">${school.subscription}</td></tr>
        <tr><td>Admin Email</td><td>${admin.email}</td></tr>
        <tr><td>Temporary Password</td><td><strong>${tempPassword}</strong></td></tr>
      </table>
      <a href="${process.env.APP_URL}/login" class="btn">Access Your Dashboard →</a>
      <p>Please change your password immediately after your first login.</p>
    `, 'Smart Bursar Platform')
  }),

  // SuperAdmin invitation
  superadminInvite: ({ name, email, password }) => ({
    subject: `You've been added as a Smart Bursar SuperAdmin`,
    html: wrap(`
      <p>Dear <strong>${name}</strong>,</p>
      <p>You have been granted <strong>SuperAdmin</strong> access to the Smart Bursar platform. Use the credentials below to log in.</p>
      <table class="table">
        <tr><td>Portal</td><td><strong>SuperAdmin</strong></td></tr>
        <tr><td>Login URL</td><td><a href="${process.env.APP_URL}/superadmin/login" style="color:#1d4ed8">${process.env.APP_URL}/superadmin/login</a></td></tr>
        <tr><td>Email</td><td><strong>${email}</strong></td></tr>
        <tr><td>Password</td><td><strong style="font-size:16px;letter-spacing:1px">${password}</strong></td></tr>
      </table>
      <a href="${process.env.APP_URL}/superadmin/login" class="btn">Log In to SuperAdmin Portal →</a>
      <p>Please change your password after your first login. Keep these credentials confidential.</p>
      <hr class="divider">
      <p style="font-size:12px;color:#94a3b8;">If you did not expect this email, please contact the platform administrator immediately.</p>
    `, 'Smart Bursar Platform')
  }),

  // OTP Login Code
  otp: ({ name, otp, email, school }) => ({
    subject: `${otp} is your Smart Bursar login code`,
    html: wrap(`
      <p>Dear <strong>${name}</strong>,</p>
      <p>Use the code below to sign in to your parent portal at <strong>${school?.name || 'Smart Bursar'}</strong>.</p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:24px; text-align:center; margin:20px 0;">
        <p style="text-transform:uppercase; font-size:11px; font-weight:bold; color:#64748b; margin-bottom:8px; letter-spacing:1px;">Your Login Code</p>
        <h2 style="font-size:32px; font-weight:800; color:#1e3a8a; letter-spacing:6px; margin:0;">${otp}</h2>
        <p style="font-size:12px; color:#94a3b8; margin-top:8px;">Expires in 10 minutes</p>
      </div>
      <div style="text-align:center; margin:30px 0;">
        <a href="${process.env.APP_URL || 'http://localhost:5173'}/login?mode=otp_verify&email=${encodeURIComponent(email)}" style="background:#2563eb; color:white; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:bold; display:inline-block; border:1px solid #1d4ed8;">Access Your Portal →</a>
      </div>
      <p style="font-size:13px; color:#64748b; text-align:center;">If you didn't request this code, you can safely ignore this email.</p>
    `, school?.name)
  }),

  // Invoice notification
  invoice: ({ student, invoice, school }) => ({
    subject: `New Invoice ${invoice.invoice_no} — ${student.full_name}`,
    html: wrap(`
      <p>Dear <strong>Parent/Guardian</strong>,</p>
      <p>A new invoice has been generated for <strong>${student.full_name}</strong> at ${school.name}.</p>
      <table class="table">
        <tr><th>Field</th><th>Details</th></tr>
        <tr><td>Invoice No.</td><td><strong>${invoice.invoice_no}</strong></td></tr>
        <tr><td>Student</td><td>${student.full_name}</td></tr>
        <tr><td>Class</td><td>${student.class_name}</td></tr>
        <tr><td>Total Amount</td><td class="amount">RWF ${Number(invoice.total_amount).toLocaleString()}</td></tr>
      </table>
      <p>You can view the full breakdown and make a payment through the parent portal.</p>
      <div style="text-align:center; margin:30px 0;">
        <a href="${process.env.APP_URL}/login?mode=parent" class="btn">Access Parent Portal →</a>
      </div>
      <hr class="divider">
      <p style="font-size:12px;color:#94a3b8;">For any queries, please contact the school office.</p>
    `, school.name)
  }),

};

// ── Send function ────────────────────────────────────────────
async function sendEmail({ to, template, data, schoolId, relatedId }) {
  const tpl = templates[template];
  if (!tpl) throw new Error(`Unknown email template: ${template}`);

  const { subject, html } = tpl(data);

  // Log to DB first
  let logId;
  try {
    const [res] = await pool.query(
      `INSERT INTO email_notifications (recipient, subject, template, status, school_id, related_id)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [to, subject, template, schoolId || null, relatedId || null]
    );
    logId = res.insertId;
  } catch (dbErr) {
    console.error('Email log insert failed:', dbErr.message);
  }

  // Send
  try {
    const fromName = data.school?.name || data.school?.school_name || "Smart Bursar";
    await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    if (logId) {
      await pool.query(
        `UPDATE email_notifications SET status='sent', sent_at=NOW() WHERE id=?`, [logId]
      );
    }
    return { success: true };
  } catch (err) {
    if (logId) {
      await pool.query(
        `UPDATE email_notifications SET status='failed', error_msg=? WHERE id=?`,
        [err.message, logId]
      );
    }
    console.error('Email send failed:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendEmail, templates };
