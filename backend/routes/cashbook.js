const router = require('express').Router();
const ctrl   = require('../controllers/cashbookController');
const auth   = require('../middleware/auth');

router.get('/today',   auth, ctrl.today);
router.get('/summary', auth, ctrl.summary);

module.exports = router;
