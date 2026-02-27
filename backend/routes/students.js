const router = require('express').Router();
const ctrl = require('../controllers/studentController');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.list);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.put('/:id', auth, ctrl.update);
router.post('/:id/resend-invitation', auth, ctrl.resendInvitation);

module.exports = router;
