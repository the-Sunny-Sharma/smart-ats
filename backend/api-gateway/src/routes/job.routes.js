const router = require('express').Router();
const { body } = require('express-validator');
const jobController = require('../controllers/job.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const jobRules = [
  body('title').trim().notEmpty(),
  body('department').trim().notEmpty(),
  body('location').trim().notEmpty(),
  body('description').trim().notEmpty(),
];

router.use(authenticate);

router.get('/', jobController.getAll);
router.get('/stats', jobController.getStats);
router.get('/:id', jobController.getById);
router.post('/', authorize('admin', 'recruiter'), jobRules, jobController.create);
router.put('/:id', authorize('admin', 'recruiter'), jobController.update);
router.delete('/:id', authorize('admin'), jobController.remove);
router.patch('/:id/status', authorize('admin', 'recruiter'), jobController.updateStatus);

module.exports = router;