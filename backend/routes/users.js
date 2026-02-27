const router = require('express').Router();
const ctrl = require('../controllers/userController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

router.get('/', auth, rbac('admin'), ctrl.list);
router.post('/', auth, rbac('admin'), ctrl.create);
router.put('/:id/role', auth, rbac('admin'), ctrl.updateRole);
router.put('/:id/toggle-active', auth, rbac('admin'), ctrl.toggleActive);
router.put('/:id/reset-password', auth, rbac('admin'), ctrl.resetPassword);

module.exports = router;
