const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/overview', analyticsController.getOverview);
router.get('/pipeline', analyticsController.getPipelineStats);
router.get('/applications-over-time', analyticsController.getApplicationsOverTime);
router.get('/top-jobs', analyticsController.getTopJobs);
router.get('/ai-scores', analyticsController.getAIScoreDistribution);
router.get('/source-breakdown', analyticsController.getSourceBreakdown);

module.exports = router;