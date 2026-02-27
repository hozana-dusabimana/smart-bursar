const router = require('express').Router();
const ctrl   = require('../controllers/reportController');
const auth   = require('../middleware/auth');

router.get('/class-collection', auth, ctrl.classCollection);
router.get('/defaulters',       auth, ctrl.defaulters);
router.get('/daily-summary',    auth, ctrl.dailySummary);

module.exports = router;
