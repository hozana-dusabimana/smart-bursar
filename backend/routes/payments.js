const router = require('express').Router();
const ctrl = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/proofs/'),
    filename: (req, file, cb) => cb(null, `proof-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

router.get('/', auth, ctrl.list);
router.post('/', auth, ctrl.create);
router.get('/receipt/:receiptNo', auth, ctrl.getByReceipt);
router.post('/:id/resend-receipt', auth, ctrl.resendReceipt);

// Parent & Approval flows
router.get('/pending', auth, ctrl.listPending);
router.post('/parent-submit', auth, upload.single('proof'), ctrl.submitParentPayment);
router.post('/:id/approve', auth, ctrl.approvePayment);
router.post('/:id/reject', auth, ctrl.rejectPayment);

module.exports = router;
