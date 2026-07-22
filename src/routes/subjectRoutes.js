const express = require('express');
const router = express.Router();

const { 
  getSubjectById, 
  getSubjectsByCourse 
} = require('../controllers/subjectController');

const { 
  validate, 
  idParamValidation, 
  courseIdParamValidation 
} = require('../middleware/validation');

// Public routes
router.get('/:id', validate(idParamValidation), getSubjectById);
router.get('/course/:courseId', validate(courseIdParamValidation), getSubjectsByCourse);

module.exports = router;