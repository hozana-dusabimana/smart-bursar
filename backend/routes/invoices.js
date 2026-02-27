const router = require('express').Router();
const ctrl   = require('../controllers/invoiceController');
const auth   = require('../middleware/auth');

router.post('/generate',           auth, ctrl.generate);
router.get('/student/:studentId',  auth, ctrl.getByStudent);

module.exports = router;
