const pool = require('../config/db');

async function testSetupAPI() {
    console.log('--- Testing School Setup API ---');
    const userId = 1; // Assuming admin user with id 1 exists
    const schoolId = 1;

    try {
        // 1. Check current setup status
        const [[{ count: configCount }]] = await pool.query('SELECT COUNT(*) AS count FROM school_config WHERE school_id = ?', [schoolId]);
        console.log(`Current config count: ${configCount}`);

        // Mocking the request object as the controller would see it
        const req = { user: { id: userId, school_id: schoolId, role: 'admin' } };
        const res = {
            json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
            status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
        };

        const ctrl = require('../controllers/settingsController');

        console.log('\nTesting getSetupStatus:');
        await ctrl.getSetupStatus(req, res);

        console.log('\nTesting createClass:');
        await ctrl.createClass({ ...req, body: { name: 'Test Class ' + Date.now() } }, res);

        console.log('\nTesting createTerm:');
        await ctrl.createTerm({
            ...req, body: {
                term_name: 'Test Term ' + Date.now(),
                academic_year: '2024/2025',
                start_date: '2024-01-01',
                end_date: '2024-04-01',
                is_active: 0
            }
        }, res);

        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testSetupAPI();
