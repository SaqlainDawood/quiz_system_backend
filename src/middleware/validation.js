// backend/src/middleware/validation.js

const { body, param, query, validationResult } = require('express-validator');

// Validation rules
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors
    });
  };
};

// Auth validations
const loginValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Course validations - UPDATED to be less strict
const createCourseValidation = [
  body('name')
    .notEmpty().withMessage('Course name is required')
    .isLength({ min: 2, max: 20 }).withMessage('Course name must be between 2-20 characters')
    // REMOVE or MODIFY the regex pattern - make it more permissive
    .matches(/^[a-z0-9-]+$/).withMessage('Course name can only contain lowercase letters, numbers, and hyphens'),
  body('fullName')
    .notEmpty().withMessage('Full course name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full course name must be between 2-100 characters'),
  body('description')
    .notEmpty().withMessage('Course description is required')
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// OR create a more permissive version:
const createCourseValidationPermissive = [
  body('name')
    .notEmpty().withMessage('Course name is required')
    .isLength({ min: 2, max: 30 }).withMessage('Course name must be between 2-30 characters'),
  body('fullName')
    .notEmpty().withMessage('Full course name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full course name must be between 2-100 characters'),
  body('description')
    .notEmpty().withMessage('Course description is required')
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

const updateCourseValidation = [
  param('id')
    .isMongoId().withMessage('Invalid course ID'),
  body('name')
    .optional()
    .matches(/^[a-z0-9-]+$/).withMessage('Course name can only contain lowercase letters, numbers, and hyphens'),
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 }).withMessage('Full course name must be between 2-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// Subject validations
const createSubjectValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('name')
    .notEmpty().withMessage('Subject name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Subject name must be between 2-100 characters'),
  body('description')
    .notEmpty().withMessage('Subject description is required')
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];
// backend/src/middleware/validation.js

// Add this new validation for subjects
const createSubjectValidationPermissive = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required'),
    // Remove the MongoDB ObjectId check temporarily
  body('name')
    .notEmpty().withMessage('Subject name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Subject name must be between 2-100 characters'),
  body('description')
    .notEmpty().withMessage('Subject description is required')
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];
// Question validations
const createQuestionValidation = [
  body('subjectId')
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID'),
  body('question')
    .notEmpty().withMessage('Question text is required')
    .isLength({ min: 5, max: 500 }).withMessage('Question must be between 5-500 characters'),
  body('options')
    .isArray({ min: 4, max: 4 }).withMessage('Exactly 4 options are required')
    .custom((value) => value.every(opt => opt.trim().length > 0))
    .withMessage('All options must be non-empty'),
  body('correct')
    .notEmpty().withMessage('Correct answer is required')
    .isInt({ min: 0, max: 3 }).withMessage('Correct answer must be between 0-3'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level')
];

// Quiz submission validation
const submitQuizValidation = [
  body('sessionId')
    .notEmpty().withMessage('Session ID is required'),
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isMongoId().withMessage('Invalid course ID'),
  body('subjectId')
    .notEmpty().withMessage('Subject ID is required')
    .isMongoId().withMessage('Invalid subject ID'),
  body('answers')
    .isArray().withMessage('Answers must be an array'),
  body('correct')
    .isInt({ min: 0 }).withMessage('Correct count must be a positive integer'),
  body('total')
    .isInt({ min: 1 }).withMessage('Total must be at least 1'),
  body('percentage')
    .isInt({ min: 0, max: 100 }).withMessage('Percentage must be between 0-100')
];

// ID param validation
const idParamValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

const courseIdParamValidation = [
  param('courseId')
    .isMongoId().withMessage('Invalid course ID')
];

const subjectIdParamValidation = [
  param('subjectId')
    .isMongoId().withMessage('Invalid subject ID')
];

module.exports = {
  validate,
  loginValidation,
  createCourseValidation,
  createCourseValidationPermissive,
  updateCourseValidation,
  createSubjectValidation,
  createSubjectValidationPermissive, // ADD THIS
  createQuestionValidation,
  submitQuizValidation,
  idParamValidation,
  courseIdParamValidation,
  subjectIdParamValidation
};