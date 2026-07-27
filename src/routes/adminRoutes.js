// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  createCourseValidationPermissive,
  updateCourseValidation,
  createSubjectValidationPermissive, // USE THIS
  createQuestionValidation,
  idParamValidation,
  courseIdParamValidation
} = require('../middleware/validation');

const {
  createCourse,
  updateCourse,
  deleteCourse,
  createSubject,
  updateSubject,
  deleteSubject,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  getStatsOverview,
  getResultStats,
  getPopularSubjects,
  getRecentActivity
} = require('../controllers/adminController');

// All admin routes are protected
router.use(protect);

// Course management
router.post('/courses', validate(createCourseValidationPermissive), createCourse);
router.put('/courses/:id', validate(updateCourseValidation), updateCourse);
router.delete('/courses/:id', validate(idParamValidation), deleteCourse);

// Subject management - USE PERMISSIVE VALIDATION
router.post('/subjects', validate(createSubjectValidationPermissive), createSubject);
router.put('/subjects/:id', validate(idParamValidation), updateSubject);
router.delete('/subjects/:id', validate(idParamValidation), deleteSubject);

// Question management
router.post('/questions', validate(createQuestionValidation), createQuestion);
router.put('/questions/:id', validate(idParamValidation), updateQuestion);
router.delete('/questions/:id', validate(idParamValidation), deleteQuestion);
router.post('/questions/bulk', bulkImportQuestions);

// Analytics
router.get('/stats/recent-activity', getRecentActivity);
router.get('/stats/overview', getStatsOverview);
router.get('/stats/results', getResultStats);
router.get('/stats/popular', getPopularSubjects);

module.exports = router;