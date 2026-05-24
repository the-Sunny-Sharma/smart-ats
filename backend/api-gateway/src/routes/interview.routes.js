const router = require('express').Router();
const { body } = require('express-validator');
const interviewController = require('../controllers/interview.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', interviewController.getAll);
router.get('/:id', interviewController.getById);
router.post('/', interviewController.create);
router.patch('/:id/status', interviewController.updateStatus);
router.post('/:id/feedback', interviewController.submitFeedback);
router.delete('/:id', interviewController.remove);

module.exports = router;