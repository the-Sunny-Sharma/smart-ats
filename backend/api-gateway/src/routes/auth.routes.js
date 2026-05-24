const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
];

const loginRules = [
  body('email').isEmail(),
  body('password').notEmpty(),
];

// Public
router.post('/register', registerRules, authController.register);
router.post('/login', loginRules, authController.login);
router.post('/google', authController.googleLogin);

// Authenticated
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateMe);

// Admin: user management
router.get('/users', authenticate, authController.listUsers);
router.patch('/users/:userId/role', authenticate, authorize('admin'), authController.updateUserRole);
router.patch('/users/:userId/status', authenticate, authorize('admin'), authController.updateUserStatus);

module.exports = router;