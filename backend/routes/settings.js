const router = require('express').Router();
const ctrl   = require('../controllers/settingsController');
const auth   = require('../middleware/auth');
const rbac   = require('../middleware/rbac');

router.get('/',           auth, ctrl.getAll);
router.put('/config',     auth, rbac('admin'), ctrl.updateConfig);
router.put('/fees',       auth, rbac('admin','accountant'), ctrl.updateFeeStructure);

module.exports = router;
