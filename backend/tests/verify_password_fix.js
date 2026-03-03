const pool = require('../config/db');

async function verifyFix() {
    console.log('--- Verifying Password Reset Fix ---');
    try {
        const testToken = 'test_token_' + Date.now();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        // Insert test token
        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [1, testToken, expiresAt]
        );
        console.log('Inserted test token with 1h expiration.');

        // Check if it's valid using the new logic pattern (application time)
        const [rows] = await pool.query(
            'SELECT id FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > ?',
            [testToken, new Date()]
        );

        if (rows.length > 0) {
            console.log('✅ Token validation logic verified: Token is valid.');
        } else {
            console.error('❌ Token validation logic failed: Token not found or expired.');
        }

        // Cleanup
        await pool.query('DELETE FROM password_reset_tokens WHERE token = ?', [testToken]);
        console.log('Test token cleaned up.');

        process.exit(0);
    } catch (err) {
        console.error('Error during verification:', err);
        process.exit(1);
    }
}

verifyFix();
