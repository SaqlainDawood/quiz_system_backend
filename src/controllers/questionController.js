const Question = require('../models/Question');
const Subject = require('../models/Subject');

/**
 * Get questions by subject (paginated)
 * GET /api/subjects/:subjectId/questions
 */
const getQuestionsBySubject = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const questions = await Question.find({
      subjectId: subject._id
    })
    .skip(skip)
    .limit(limitNum)
    .select('-__v')
    .lean();

    const totalQuestions = await Question.countDocuments({
      subjectId: subject._id
    });

    res.status(200).json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalQuestions / limitNum),
          totalItems: totalQuestions,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single question
 * GET /api/questions/:id
 */
const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('subjectId', 'name')
      .populate('courseId', 'name fullName')
      .select('-__v')
      .lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuestionsBySubject,
  getQuestionById
};