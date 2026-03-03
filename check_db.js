const pool = require('./backend/config/db');
(async () => {
    try {
        const [cols] = await pool.query('SHOW COLUMNS FROM users');
        console.log('USERS COLUMNS:', cols.map(c => c.Field));
        const [roles] = await pool.query('SHOW COLUMNS FROM roles');
        console.log('ROLES COLUMNS:', roles.map(c => c.Field));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
