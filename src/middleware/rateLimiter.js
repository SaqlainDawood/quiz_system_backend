const rateLimit = require('express-rate-limit');

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  }
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

// Quiz submission limiter (stricter)
const quizLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 quiz submissions per 15 minutes
  message: {
    success: false,
    message: 'Too many quiz submissions. Please try again later.'
  }
});

module.exports = { authLimiter, apiLimiter, quizLimiter };