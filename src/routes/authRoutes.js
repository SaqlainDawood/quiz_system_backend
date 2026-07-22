const express = require('express');
const router = express.Router();

const { login, verify, logout } = require('../controllers/authController');
const { validate, loginValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/logout', logout);
router.get('/verify', verify);

module.exports = router;