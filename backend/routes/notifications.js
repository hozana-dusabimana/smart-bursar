const router = require('express').Router();
const ctrl   = require('../controllers/notificationController');
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');

router.get ('/',                auth, ctrl.list);
router.get ('/stats',           auth, ctrl.stats);
router.post('/send-reminders',  auth, rbac(['admin','bursar','accountant']), ctrl.sendReminders);

module.exports = router;
