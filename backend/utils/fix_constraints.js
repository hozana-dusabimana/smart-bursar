const pool = require('../config/db');

async function fixConstraints() {
    console.log('--- Starting Database Constraint Migration ---');
    const conn = await pool.getConnection();
    try {
        // 1. academic_terms
        console.log('Updating academic_terms...');
        try { await conn.query('ALTER TABLE academic_terms DROP INDEX uq_term_year'); } catch (e) { }
        await conn.query('ALTER TABLE academic_terms ADD UNIQUE KEY uq_term_year_school (term_name, academic_year, school_id)');

        // 2. classes
        console.log('Updating classes...');
        try { await conn.query('ALTER TABLE classes DROP INDEX name'); } catch (e) { }
        await conn.query('ALTER TABLE classes ADD UNIQUE KEY uq_class_name_school (name, school_id)');

        // 3. students
        console.log('Updating students...');
        try { await conn.query('ALTER TABLE students DROP INDEX admission_no'); } catch (e) { }
        await conn.query('ALTER TABLE students ADD UNIQUE KEY uq_admission_no_school (admission_no, school_id)');

        // 4. expenses
        console.log('Updating expenses...');
        try { await conn.query('ALTER TABLE expenses DROP INDEX expense_no'); } catch (e) { }
        await conn.query('ALTER TABLE expenses ADD UNIQUE KEY uq_expense_no_school (expense_no, school_id)');

        // 5. invoices
        console.log('Updating invoices...');
        try { await conn.query('ALTER TABLE invoices DROP INDEX invoice_no'); } catch (e) { }
        await conn.query('ALTER TABLE invoices ADD UNIQUE KEY uq_invoice_no_school (invoice_no, school_id)');

        // 6. payments
        console.log('Updating payments...');
        try { await conn.query('ALTER TABLE payments DROP INDEX receipt_no'); } catch (e) { }
        await conn.query('ALTER TABLE payments ADD UNIQUE KEY uq_receipt_no_school (receipt_no, school_id)');

        // 7. school_config (already has uq_school_setting)

        console.log('--- Migration Completed Successfully ---');
    } catch (err) {
        console.error('Migration Failed:', err);
    } finally {
        conn.release();
        process.exit();
    }
}

fixConstraints();
