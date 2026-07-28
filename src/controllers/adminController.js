const mongoose = require('mongoose');
const fs = require('fs');           // ✅ ADD THIS
const path = require('path');       // ✅ ADD THIS
const XLSX = require('xlsx');       // ✅ ADD THIS
const multer = require('multer');   // ✅ ADD THIS
const { extractText, parseMCQs, validateQuestions } = require('../utils/mcqParser');

const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Question = require('../models/Question');
const QuizResult = require('../models/QuizResult');

/**
 * Create a new course (Admin only)
 * POST /api/admin/courses
 */
const createCourse = async (req, res, next) => {
  try {
    const { name, fullName, description, color, textColor, bgLight } = req.body;

    // Generate a slug from the name if not provided or invalid
    let courseName = name;
    if (!courseName || courseName.trim() === '') {
      // Generate from fullName
      courseName = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    } else {
      // Clean the name - remove spaces and special chars
      courseName = courseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    
    // Ensure it's not empty
    if (!courseName || courseName.length < 2) {
      courseName = `course_${Date.now()}`;
    }

    // Check if course name already exists
    const existingCourse = await Course.findOne({ name: courseName });
    if (existingCourse) {
      // If exists, append a random suffix
      courseName = `${courseName}_${Math.random().toString(36).substring(2, 6)}`;
    }

    const course = await Course.create({
      name: courseName,
      fullName,
      description,
      color: color || 'from-blue-600 to-indigo-700',
      textColor: textColor || 'text-blue-600',
      bgLight: bgLight || 'bg-blue-50',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a course (Admin only)
 * PUT /api/admin/courses/:id
 */
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const { name, fullName, description, color, textColor, bgLight, isActive } = req.body;

    // Check if new name already exists (if changing name)
    if (name && name.toLowerCase() !== course.name) {
      const existingCourse = await Course.findOne({ name: name.toLowerCase() });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course name already exists'
        });
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.toLowerCase() }),
        ...(fullName && { fullName }),
        ...(description && { description }),
        ...(color && { color }),
        ...(textColor && { textColor }),
        ...(bgLight && { bgLight }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course (Admin only)
 * DELETE /api/admin/courses/:id
 */
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete all subjects and questions for this course
    const subjects = await Subject.find({ courseId: course._id });
    const subjectIds = subjects.map(s => s._id);
    
    await Question.deleteMany({ courseId: course._id });
    await Subject.deleteMany({ courseId: course._id });
    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new subject (Admin only)
 * POST /api/admin/subjects
 */
// backend/src/controllers/adminController.js

/**
 * Create a new subject (Admin only)
 * POST /api/admin/subjects
 */
// backend/src/controllers/adminController.js
// Add this helper function at the top

const findCourseByIdentifier = async (identifier) => {
  let course = null;

  // 1. Try as MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    course = await Course.findById(identifier);
  }

  // 2. Try by name field (string ID like "bscs")
  if (!course) {
    course = await Course.findOne({ name: identifier });
  }

  // 3. Try by custom id field
  if (!course) {
    course = await Course.findOne({ id: identifier });
  }

  // 4. Try by fullName
  if (!course) {
    course = await Course.findOne({ fullName: identifier });
  }

  // 5. Try by _id as string
  if (!course && identifier.match(/^[0-9a-fA-F]{24}$/)) {
    course = await Course.findById(identifier);
  }

  return course;
};

/**
 * Create a new subject (Admin only)
 * POST /api/admin/subjects
 */
const createSubject = async (req, res, next) => {
  try {
    const { courseId, name, description, order } = req.body;

    console.log('📥 Creating subject with data:', { courseId, name, description });

    // Validate required fields
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Subject name must be at least 2 characters'
      });
    }

    // Find course using the helper function
    const course = await findCourseByIdentifier(courseId);

    if (!course) {
      console.error(`❌ Course not found for ID: ${courseId}`);
      return res.status(404).json({
        success: false,
        message: `Course not found with ID: ${courseId}. Please make sure the course exists.`
      });
    }

    console.log(`✅ Found course: ${course.name} (${course._id})`);

    // Check if subject already exists for this course
    const existingSubject = await Subject.findOne({
      courseId: course._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: `A subject named "${name}" already exists in this course. Please use a different name.`
      });
    }

    // Create the subject
    const subject = await Subject.create({
      courseId: course._id,
      name: name.trim(),
      description: description?.trim() || '',
      order: order || 0,
      createdBy: req.user._id
    });

    console.log(`✅ Subject created: ${subject.name} (${subject._id})`);

    // Populate the response
    const populatedSubject = await Subject.findById(subject._id)
      .populate('courseId', 'name fullName')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedSubject,
      message: 'Subject created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating subject:', error);
    next(error);
  }
};

/**
 * Update a subject (Admin only)
 * PUT /api/admin/subjects/:id
 */
const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const { name, description, order, isActive } = req.body;

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSubject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a subject (Admin only)
 * DELETE /api/admin/subjects/:id
 */
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Delete all questions for this subject
    await Question.deleteMany({ subjectId: subject._id });
    await Subject.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Subject and all associated questions deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new question (Admin only)
 * POST /api/admin/questions
 */
const createQuestion = async (req, res, next) => {
  try {
    const { subjectId, question, options, correct, explanation, difficulty } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const newQuestion = await Question.create({
      subjectId,
      courseId: subject.courseId,
      question,
      options,
      correct,
      explanation,
      difficulty,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: newQuestion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a question (Admin only)
 * PUT /api/admin/questions/:id
 */
const updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const { question: questionText, options, correct, explanation, difficulty } = req.body;

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      {
        ...(questionText && { question: questionText }),
        ...(options && { options }),
        ...(correct !== undefined && { correct }),
        ...(explanation !== undefined && { explanation }),
        ...(difficulty && { difficulty })
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedQuestion
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a question (Admin only)
 * DELETE /api/admin/questions/:id
 */
const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk import questions (Admin only)
 * POST /api/admin/questions/bulk
 */
const bulkImportQuestions = async (req, res, next) => {
  try {
    const { subjectId, questions } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const createdQuestions = await Question.insertMany(
      questions.map(q => ({
        ...q,
        subjectId,
        courseId: subject.courseId,
        createdBy: req.user._id
      }))
    );

    res.status(201).json({
      success: true,
      data: createdQuestions,
      message: `${createdQuestions.length} questions imported successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats/overview
 */
const getStatsOverview = async (req, res, next) => {
  try {
    const [totalCourses, totalSubjects, totalQuestions, totalAttempts] = await Promise.all([
      Course.countDocuments({ isActive: true }),
      Subject.countDocuments({ isActive: true }),
      Question.countDocuments(),
      QuizResult.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        totalSubjects,
        totalQuestions,
        totalAttempts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz attempt statistics
 * GET /api/admin/stats/results
 */
const getResultStats = async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;

    let dateFilter = {};
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { completedAt: { $gte: today } };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { completedAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { completedAt: { $gte: monthAgo } };
    }

    const stats = await QuizResult.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
          avgCorrect: { $avg: '$correct' },
          maxScore: { $max: '$percentage' },
          minScore: { $min: '$percentage' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalAttempts: 0,
        avgPercentage: 0,
        avgCorrect: 0,
        maxScore: 0,
        minScore: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get most popular subjects
 * GET /api/admin/stats/popular
 */
const getPopularSubjects = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const popular = await QuizResult.aggregate([
      {
        $group: {
          _id: {
            subjectId: '$subjectId',
            subjectName: '$subjectName',
            courseName: '$courseName'
          },
          attempts: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' }
        }
      },
      { $sort: { attempts: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      data: popular.map(item => ({
        subjectId: item._id.subjectId,
        subjectName: item._id.subjectName,
        courseName: item._id.courseName,
        attempts: item.attempts,
        avgPercentage: Math.round(item.avgPercentage)
      }))
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Get recent quiz activity (last 24 hours)
 * GET /api/admin/stats/recent-activity
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentResults = await QuizResult.find({
      completedAt: { $gte: twentyFourHoursAgo }
    })
    .sort({ completedAt: -1 })
    .limit(10)
    .populate('courseId', 'name fullName')
    .populate('subjectId', 'name');

    const activityCount = await QuizResult.countDocuments({
      completedAt: { $gte: twentyFourHoursAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        recentActivity: recentResults,
        activityCount,
        activeUsers: recentResults.length // Simplified
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===== BULK IMPORT FROM EXCEL =====
// Add at the top with other requires


// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload Excel, PDF, Word, Image, or Text file.'));
    }
  }
});

/**
 * Bulk import questions from Excel file
 * POST /api/admin/questions/bulk-upload
 */
const bulkImportFromExcel = async (req, res, next) => {
  try {
    const { subjectId } = req.body;
    
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID is required'
      });
    }

    // Validate subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File is empty or has no valid data'
      });
    }

    // Expected columns: Question, OptionA, OptionB, OptionC, OptionD, Correct, Difficulty
    const questions = [];
    const errors = [];

    data.forEach((row, index) => {
      try {
        const question = row.Question?.trim() || row.question?.trim();
        const options = [
          row.OptionA?.trim() || row.optionA?.trim(),
          row.OptionB?.trim() || row.optionB?.trim(),
          row.OptionC?.trim() || row.optionC?.trim(),
          row.OptionD?.trim() || row.optionD?.trim()
        ].filter(opt => opt);

        const correctMap = {
          'A': 0, 'B': 1, 'C': 2, 'D': 3,
          'a': 0, 'b': 1, 'c': 2, 'd': 3,
          '1': 0, '2': 1, '3': 2, '4': 3
        };
        const correct = correctMap[row.Correct?.trim() || row.correct?.trim()];

        if (!question) {
          errors.push(`Row ${index + 2}: Question text is missing`);
          return;
        }
        if (options.length !== 4) {
          errors.push(`Row ${index + 2}: Exactly 4 options required (found ${options.length})`);
          return;
        }
        if (correct === undefined) {
          errors.push(`Row ${index + 2}: Correct answer not specified (use A, B, C, or D)`);
          return;
        }

        questions.push({
          subjectId: subject._id,
          courseId: subject.courseId,
          question,
          options,
          correct,
          difficulty: row.Difficulty?.toLowerCase() || row.difficulty?.toLowerCase() || 'medium',
          createdBy: req.user._id
        });
      } catch (err) {
        errors.push(`Row ${index + 2}: ${err.message}`);
      }
    });

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found in the file',
        errors
      });
    }

    // Bulk insert
    const createdQuestions = await Question.insertMany(questions);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      data: {
        imported: createdQuestions.length,
        total: data.length,
        errors,
        questions: createdQuestions
      },
      message: `${createdQuestions.length} questions imported successfully`
    });

  } catch (error) {
    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * AI-based bulk import from any file (PDF, Word, Image, Text)
 * POST /api/admin/questions/ai-import
 */
const aiBulkImport = async (req, res, next) => {
  try {
    const { subjectId } = req.body;
    
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Subject ID is required'
      });
    }

    // Validate subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    // Extract text from file
    const text = await extractText(req.file.path, req.file.mimetype);
    
    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from the file. Please check the file content.'
      });
    }

    // Parse MCQs
    const parsedQuestions = parseMCQs(text);
    
    if (parsedQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No MCQs found in the file. Please check the format.\n\nSupported formats:\n1. Question\nA. Option 1\nB. Option 2\nC. Option 3\nD. Option 4\nAnswer: A'
      });
    }

    // Validate parsed questions
    const { valid, errors } = validateQuestions(parsedQuestions);

    if (valid.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid questions found. Please check the format.',
        errors
      });
    }

    // Save to database
    const questions = valid.map(q => ({
      subjectId: subject._id,
      courseId: subject.courseId,
      question: q.question,
      options: q.options.slice(0, 4),
      correct: q.correct,
      difficulty: 'medium',
      createdBy: req.user._id
    }));

    const savedQuestions = await Question.insertMany(questions);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      data: {
        imported: savedQuestions.length,
        total: parsedQuestions.length,
        errors: errors.length > 0 ? errors : undefined,
        questions: savedQuestions
      },
      message: `${savedQuestions.length} questions imported successfully!`
    });

  } catch (error) {
    // Clean up uploaded file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Download Excel template
 * GET /api/admin/questions/template
 */
const downloadTemplate = (req, res) => {
  try {
    const workbook = XLSX.utils.book_new();
    const data = [
      ['Question', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Correct', 'Difficulty'],
      ['What is 2+2?', '3', '4', '5', '6', 'B', 'easy'],
      ['What is the capital of Pakistan?', 'Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'C', 'medium'],
      ['Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B', 'easy'],
      ['What is the chemical symbol for water?', 'H2O', 'CO2', 'NaCl', 'HCl', 'A', 'easy'],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 12 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MCQs');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=mcq_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating template: ' + error.message
    });
  }
};

// ===== EXPORT UPLOAD MIDDLEWARE =====
const uploadMiddleware = upload.single('file');


module.exports = {
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
  getRecentActivity,
   bulkImportFromExcel,
  aiBulkImport,
  downloadTemplate,
  uploadMiddleware
};