const router = require('express').Router();
const ctrl = require('../controllers/invoiceController');
const auth = require('../middleware/auth');

router.post('/generate', auth, ctrl.generate);
router.post('/generate-all', auth, ctrl.generateAll);
router.get('/', auth, ctrl.listAll);
router.post('/:id/send-email', auth, ctrl.sendEmail);
router.get('/student/:studentId', auth, ctrl.getByStudent);

module.exports = router;
