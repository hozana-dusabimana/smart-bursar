/**
 * Seed script — populates the database with initial data for development
 * Run: node utils/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── Users ────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [
      [1, 'System Admin', 'admin@kenza.rw', passwordHash, 1],
      [2, 'Uwimana Solange', 'bursar@kenza.rw', passwordHash, 2],
      [3, 'Nkurunziza Alain', 'accountant@kenza.rw', passwordHash, 3],
      [4, 'Dr. Mutesi Claire', 'principal@kenza.rw', passwordHash, 4],
    ];
    await conn.query(
      `INSERT IGNORE INTO users (id, name, email, password_hash, role_id) VALUES ?`,
      [users]
    );

    // ── Fee Structure for Term 1 (term_id = 1) ───────────────────
    // Get class IDs
    const [classes] = await conn.query('SELECT id, name FROM classes');
    const classMap = Object.fromEntries(classes.map(c => [c.name, c.id]));

    const fees = [
      ['Nursery', 180000, 20000, 0],
      ['P1', 240000, 25000, 0],
      ['P2', 240000, 25000, 0],
      ['P3', 260000, 25000, 0],
      ['P4', 260000, 30000, 0],
      ['P5', 280000, 30000, 0],
      ['P6', 280000, 30000, 0],
      ['S1', 380000, 40000, 0],
      ['S2', 380000, 40000, 0],
      ['S3', 400000, 40000, 0],
      ['S4', 420000, 45000, 0],
      ['S5', 420000, 45000, 0],
      ['S6', 450000, 50000, 0],
    ];

    for (const [cls, tuition, activity, transport] of fees) {
      await conn.query(
        `INSERT IGNORE INTO fee_structure (class_id, term_id, tuition, activity, transport)
         VALUES (?, 1, ?, ?, ?)`,
        [classMap[cls], tuition, activity, transport]
      );
    }

    // ── Students ─────────────────────────────────────────────────
    const students = [
      ['KIS/2024/0041', 'Amara Uwase', 'S3', 'A', 'Uwase Emmanuel', '+250 788 001 001'],
      ['KIS/2024/0089', 'Jean Pierre Nziza', 'P6', 'B', 'Nziza Théophile', '+250 788 002 002'],
      ['KIS/2024/0055', 'Eric Habimana', 'S5', 'A', 'Habimana Faustin', '+250 788 003 003'],
      ['KIS/2023/0120', 'Clarisse Mukamana', 'S1', 'C', 'Mukamana Vestine', '+250 788 004 004'],
      ['KIS/2023/0077', 'Divine Ineza', 'P4', 'A', 'Ineza Alexis', '+250 788 005 005'],
      ['KIS/2024/0033', 'Sandra Umutoni', 'S2', 'B', 'Umutoni Chantal', '+250 788 006 006'],
      ['KIS/2023/0088', 'Samuel Rukundo', 'S4', 'B', 'Rukundo Callixte', '+250 788 007 007'],
      ['KIS/2024/0102', 'Grace Mukamurenzi', 'P5', 'A', 'Mukamurenzi Pius', '+250 788 008 008'],
      ['KIS/2024/0114', 'Patrick Bizimana', 'S2', 'C', 'Bizimana Robert', '+250 788 009 009'],
      ['KIS/2024/0061', 'Josiane Ingabire', 'P3', 'B', 'Ingabire Odette', '+250 788 010 010'],
    ];

    const studentIdMap = {};
    for (const [admNo, name, cls, stream, guardian, tel] of students) {
      const [res] = await conn.query(
        `INSERT IGNORE INTO students (admission_no, full_name, class_id, stream, guardian_name, guardian_tel, enrolled_at)
         VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
        [admNo, name, classMap[cls], stream, guardian, tel]
      );
      const [[row]] = await conn.query('SELECT id FROM students WHERE admission_no = ?', [admNo]);
      studentIdMap[admNo] = row.id;
    }

    // ── Receipt counter for term 1 ────────────────────────────────
    await conn.query('INSERT IGNORE INTO receipt_counter (term_id, last_seq) VALUES (1, 123)');

    // ── Invoices for Term 1 ───────────────────────────────────────
    const invoiceData = [
      { admNo: 'KIS/2024/0041', cls: 'S3' },
      { admNo: 'KIS/2024/0089', cls: 'P6' },
      { admNo: 'KIS/2024/0055', cls: 'S5' },
      { admNo: 'KIS/2023/0120', cls: 'S1' },
      { admNo: 'KIS/2023/0077', cls: 'P4' },
      { admNo: 'KIS/2024/0033', cls: 'S2' },
      { admNo: 'KIS/2023/0088', cls: 'S4' },
      { admNo: 'KIS/2024/0102', cls: 'P5' },
      { admNo: 'KIS/2024/0114', cls: 'S2' },
      { admNo: 'KIS/2024/0061', cls: 'P3' },
    ];

    const invoiceIdMap = {};
    for (let i = 0; i < invoiceData.length; i++) {
      const { admNo, cls } = invoiceData[i];
      const feeRow = fees.find(f => f[0] === cls);
      const [tuition, activity, transport] = feeRow ? [feeRow[1], feeRow[2], feeRow[3]] : [0, 0, 0];
      const total = tuition + activity + transport;
      const invNo = `INV-2025-${String(i + 1).padStart(4, '0')}`;
      const studentId = studentIdMap[admNo];

      const [res] = await conn.query(
        `INSERT IGNORE INTO invoices
           (invoice_no, student_id, term_id, tuition_amount, activity_amount, transport_amount, total_amount, issued_date, created_by)
         VALUES (?, ?, 1, ?, ?, ?, ?, '2025-01-06', 2)`,
        [invNo, studentId, tuition, activity, transport, total]
      );
      const [[inv]] = await conn.query('SELECT id FROM invoices WHERE student_id = ? AND term_id = 1', [studentId]);
      invoiceIdMap[admNo] = inv.id;
    }

    // ── Payments ─────────────────────────────────────────────────
    const paymentsData = [
      {
        admNo: 'KIS/2024/0041', receipts: [
          { no: 'RCP-2025-0091', date: '2025-01-15', time: '09:20:00', amount: 220000, method: 'MoMo', ref: '250788001001' },
          { no: 'RCP-2025-0112', date: '2025-02-10', time: '10:05:00', amount: 220000, method: 'Bank', ref: 'BNK-4421' },
        ]
      },
      {
        admNo: 'KIS/2024/0089', receipts: [
          { no: 'RCP-2025-0077', date: '2025-01-12', time: '08:45:00', amount: 310000, method: 'Cash', ref: '' },
        ]
      },
      {
        admNo: 'KIS/2023/0120', receipts: [
          { no: 'RCP-2025-0055', date: '2025-01-10', time: '11:00:00', amount: 420000, method: 'MoMo', ref: '250788004004' },
        ]
      },
      {
        admNo: 'KIS/2023/0077', receipts: [
          { no: 'RCP-2025-0042', date: '2025-01-08', time: '09:10:00', amount: 290000, method: 'Cash', ref: '' },
        ]
      },
      {
        admNo: 'KIS/2023/0088', receipts: [
          { no: 'RCP-2025-0031', date: '2025-01-07', time: '08:30:00', amount: 150000, method: 'Cash', ref: '' },
        ]
      },
      {
        admNo: 'KIS/2024/0102', receipts: [
          { no: 'RCP-2025-0088', date: '2025-01-14', time: '10:30:00', amount: 310000, method: 'Bank', ref: 'BNK-3309' },
        ]
      },
      {
        admNo: 'KIS/2024/0114', receipts: [
          { no: 'RCP-2025-0099', date: '2025-02-01', time: '09:00:00', amount: 200000, method: 'MoMo', ref: '250788009009' },
          { no: 'RCP-2025-0121', date: '2025-02-20', time: '10:15:00', amount: 100000, method: 'Cash', ref: '' },
        ]
      },
    ];

    for (const { admNo, receipts } of paymentsData) {
      for (const r of receipts) {
        await conn.query(
          `INSERT IGNORE INTO payments
             (receipt_no, invoice_id, student_id, term_id, amount, payment_method, reference, payment_date, payment_time, cashier_id)
           VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, 2)`,
          [r.no, invoiceIdMap[admNo], studentIdMap[admNo], r.amount, r.method, r.ref || null, r.date, r.time]
        );
      }
    }

    // ── Expenses ─────────────────────────────────────────────────
    const expenses = [
      ['EXP-2025-001', 'Stationery Supplies', 'Administrative', 85000, 'Office Depot', 'REC-001', '2025-02-23', 'Approved'],
      ['EXP-2025-002', 'Bus Maintenance', 'Transport', 240000, 'Auto Care Ltd', 'REC-002', '2025-02-22', 'Approved'],
      ['EXP-2025-003', 'Internet Bill — MTN', 'Utilities', 45000, 'MTN Business', null, '2025-02-21', 'Pending'],
      ['EXP-2025-004', 'Cafeteria Groceries', 'Operations', 168000, 'Fresh Foods RW', 'REC-003', '2025-02-19', 'Approved'],
      ['EXP-2025-005', 'Security Guard Salary', 'Payroll', 120000, 'Internal', 'PAY-014', '2025-02-14', 'Approved'],
      ['EXP-2025-006', 'Generator Fuel', 'Utilities', 60000, 'Total Energies', 'REC-004', '2025-02-13', 'Approved'],
    ];

    for (const [no, desc, cat, amount, vendor, ref, date, status] of expenses) {
      await conn.query(
        `INSERT IGNORE INTO expenses
           (expense_no, description, category, amount, vendor, reference, expense_date, term_id, status, submitted_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 2)`,
        [no, desc, cat, amount, vendor, ref, date, status]
      );
    }

    // ── SuperAdmin ─────────────────────────────────────────────
    const superHash = await bcrypt.hash('superadmin123', 10);
    await conn.query(
      `INSERT IGNORE INTO superadmins (id, name, email, password_hash) VALUES (1, 'Platform Admin', 'superadmin@smartbursar.rw', ?)`,
      [superHash]
    );

    await conn.commit();
    console.log('✅ Database seeded successfully');
    console.log('   SuperAdmin: superadmin@smartbursar.rw / superadmin123');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Seed failed:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();


