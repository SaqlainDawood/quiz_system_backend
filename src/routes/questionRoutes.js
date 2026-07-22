const express = require('express');
const router = express.Router();

const { 
  getQuestionsBySubject, 
  getQuestionById 
} = require('../controllers/questionController');

const { 
  validate, 
  subjectIdParamValidation, 
  idParamValidation 
} = require('../middleware/validation');

// Public routes
router.get('/subject/:subjectId', validate(subjectIdParamValidation), getQuestionsBySubject);
router.get('/:id', validate(idParamValidation), getQuestionById);

module.exports = router;