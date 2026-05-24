const router = require('express').Router();
const { body } = require('express-validator');
const appController = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',              appController.getAll);
router.get('/:id',           appController.getById);
router.post('/',             appController.create);
router.patch('/:id/stage',   appController.updateStage);
router.patch('/:id/shortlist', appController.toggleShortlist);
router.post('/:id/score',    appController.triggerAIScore);
router.put('/:id/review',    appController.addReview);

// ── Semantic ranking — must come BEFORE /:id to avoid route collision ──────
router.get('/rank/:jobId',   appController.rankCandidates);

module.exports = router;