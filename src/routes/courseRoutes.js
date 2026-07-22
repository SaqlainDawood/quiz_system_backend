const express = require('express');
const router = express.Router();

const { 
  getAllCourses, 
  getCourseById, 
  getCourseSubjects 
} = require('../controllers/courseController');

const { validate, idParamValidation } = require('../middleware/validation');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', validate(idParamValidation), getCourseById);
router.get('/:id/subjects', validate(idParamValidation), getCourseSubjects);

module.exports = router;