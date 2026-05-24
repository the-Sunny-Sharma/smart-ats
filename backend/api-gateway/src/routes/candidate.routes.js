const router = require('express').Router();
const { body } = require('express-validator');
const candidateController = require('../controllers/candidate.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
];

router.use(authenticate);

router.get('/', candidateController.getAll);
router.get('/:id', candidateController.getById);
router.get('/:id/applications', candidateController.getApplications);
router.post('/', createRules, candidateController.create);
router.post(
  '/upload-resume',
  upload.single('resume'),
  candidateController.uploadResume
);
router.put('/:id', candidateController.update);
router.delete('/:id', authorize('admin', 'recruiter'), candidateController.remove);

module.exports = router;