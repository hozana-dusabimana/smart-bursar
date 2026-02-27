const router = require('express').Router();
const ctrl   = require('../controllers/paymentController');
const auth   = require('../middleware/auth');

router.get ('/',                      auth, ctrl.list);
router.post('/',                      auth, ctrl.create);
router.get ('/receipt/:receiptNo',    auth, ctrl.getByReceipt);
router.post('/:id/resend-receipt',    auth, ctrl.resendReceipt);

module.exports = router;
