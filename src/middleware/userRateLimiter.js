const rateLimit = require('express-rate-limit');

// Per user rate limiter (using user ID if available)
const createUserRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?._id || req.ip;
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }
  });
};

module.exports = { createUserRateLimiter };