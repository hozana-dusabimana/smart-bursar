const router = require('express').Router();
const ctrl   = require('../controllers/expenseController');
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');

router.get('/',             auth, ctrl.list);
router.post('/',            auth, ctrl.create);
router.put('/:id/status',   auth, rbac('accountant','principal','admin'), ctrl.updateStatus);

module.exports = router;
