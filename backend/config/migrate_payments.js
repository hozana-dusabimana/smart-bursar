const pool = require('./db');

async function migrate() {
    try {
        console.log('Starting migration...');
        const conn = await pool.getConnection();

        // Check if columns exist first to be safe
        const [columns] = await conn.query('SHOW COLUMNS FROM payments');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('proof_url')) {
            await conn.query('ALTER TABLE payments ADD COLUMN proof_url VARCHAR(255) DEFAULT NULL');
            console.log('Added proof_url');
        }

        if (!columnNames.includes('status')) {
            await conn.query("ALTER TABLE payments ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'");
            console.log('Added status');
        }

        if (!columnNames.includes('rejection_reason')) {
            await conn.query('ALTER TABLE payments ADD COLUMN rejection_reason TEXT DEFAULT NULL');
            console.log('Added rejection_reason');
        }

        // Update existing to approved if they were NULL (though default is approved)
        await conn.query("UPDATE payments SET status = 'approved' WHERE status IS NULL");

        conn.release();
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
