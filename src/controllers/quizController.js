const QuizResult = require('../models/QuizResult');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const Question = require('../models/Question');
const { generateSessionId, calculateQuizStats } = require('../utils/helpers');

/**
 * Submit quiz results
 * POST /api/quiz/submit
 */
const submitQuiz = async (req, res, next) => {
  try {
    const { 
      sessionId, 
      courseId, 
      subjectId, 
      answers, 
      correct, 
      total, 
      wrong, 
      percentage, 
      timeSpent 
    } = req.body;

    // Validate subject and course exist
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Create quiz result
    const quizResult = await QuizResult.create({
      sessionId: sessionId || generateSessionId(),
      courseId,
      subjectId,
      courseName: course.fullName || course.name,
      subjectName: subject.name,
      answers: answers || [],
      correct,
      total,
      wrong: wrong || (total - correct),
      percentage,
      timeSpent: timeSpent || 0,
      completedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: quizResult,
      message: 'Quiz result saved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz results by session
 * GET /api/quiz/results/:sessionId
 */
const getResultsBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const results = await QuizResult.find({ sessionId })
      .populate('courseId', 'name fullName')
      .populate('subjectId', 'name')
      .sort({ completedAt: -1 })
      .lean();

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for this session'
      });
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all quiz results (Admin only)
 * GET /api/quiz/results/history
 */
const getQuizHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [results, total] = await Promise.all([
      QuizResult.find()
        .populate('courseId', 'name fullName')
        .populate('subjectId', 'name')
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      QuizResult.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz results statistics for a subject
 * GET /api/quiz/stats/subject/:subjectId
 */
const getSubjectStats = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const stats = await QuizResult.aggregate([
      { $match: { subjectId: new mongoose.Types.ObjectId(subjectId) } },
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

module.exports = {
  submitQuiz,
  getResultsBySession,
  getQuizHistory,
  getSubjectStats
};