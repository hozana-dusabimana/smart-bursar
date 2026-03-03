const router = require('express').Router();
const ctrl = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `logo-${req.user.school_id}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

router.get('/', auth, ctrl.getAll);
router.get('/setup-status', auth, ctrl.getSetupStatus);

router.put('/config', auth, rbac('admin'), ctrl.updateConfig);
router.post('/upload-logo', auth, rbac('admin'), upload.single('logo'), ctrl.uploadLogo);
router.put('/fees', auth, rbac('admin', 'accountant'), ctrl.updateFeeStructure);

router.post('/terms', auth, rbac('admin'), ctrl.createTerm);
router.put('/terms/:id', auth, rbac('admin'), ctrl.updateTerm);
router.delete('/terms/:id', auth, rbac('admin'), ctrl.deleteTerm);

router.post('/classes', auth, rbac('admin'), ctrl.createClass);
router.delete('/classes/:id', auth, rbac('admin'), ctrl.deleteClass);

module.exports = router;
