const express = require('express');
const router = express.Router();

const { 
  submitQuiz, 
  getResultsBySession, 
  getQuizHistory,
  getSubjectStats 
} = require('../controllers/quizController');

const { 
  validate, 
  submitQuizValidation, 
  idParamValidation 
} = require('../middleware/validation');
const { protect } = require('../middleware/auth');
const { quizLimiter } = require('../middleware/rateLimiter');

// Public routes (with rate limiting)
router.post('/submit', quizLimiter, validate(submitQuizValidation), submitQuiz);
router.get('/results/:sessionId', getResultsBySession);

// Admin only routes
router.get('/history', protect, getQuizHistory);
router.get('/stats/subject/:subjectId', protect, validate(idParamValidation), getSubjectStats);

module.exports = router;