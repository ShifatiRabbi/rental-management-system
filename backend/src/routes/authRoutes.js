const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerRules, validate } = require('../middleware/validate');

// Public routes
router.post('/register', registerRules, validate, AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;