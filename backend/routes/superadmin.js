const router = require('express').Router();
const ctrl = require('../controllers/superadminController');
const superauth = require('../middleware/superauth');

router.post('/login', ctrl.login);
router.get('/stats', superauth, ctrl.stats);
router.get('/schools', superauth, ctrl.listSchools);
router.post('/schools', superauth, ctrl.createSchool);
router.put('/schools/:id', superauth, ctrl.updateSchool);
router.put('/schools/:id/toggle', superauth, ctrl.toggleSchool);
router.get('/schools/:id/admins', superauth, ctrl.getSchoolAdmins);
router.put('/schools/:id/users/:userId/toggle', superauth, ctrl.toggleSchoolUser);
router.get('/email-log', superauth, ctrl.emailLog);
router.post('/email-log/:id/resend', superauth, ctrl.resendEmail);

// ── SuperAdmin management ──────────────────────────────────────
router.get('/admins', superauth, ctrl.listAdmins);
router.post('/admins', superauth, ctrl.createAdmin);
router.put('/admins/:id/toggle', superauth, ctrl.toggleAdmin);
router.delete('/admins/:id', superauth, ctrl.deleteAdmin);

module.exports = router;
