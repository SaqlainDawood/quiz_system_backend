const Subject = require('../models/Subject');
const Question = require('../models/Question');
const Course = require('../models/Course');

/**
 * Get single subject with questions (paginated)
 * GET /api/subjects/:id
 */
const getSubjectById = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const subject = await Subject.findById(req.params.id)
      .populate('courseId', 'name fullName color textColor bgLight')
      .lean();

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
        ...subject,
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
 * Get subjects by course
 * GET /api/courses/:courseId/subjects
 */
const getSubjectsByCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const subjects = await Subject.find({
      courseId: course._id,
      isActive: true
    })
    .sort('order')
    .lean();

    const subjectsWithCount = await Promise.all(
      subjects.map(async (subject) => {
        const questionCount = await Question.countDocuments({
          subjectId: subject._id
        });
        return {
          ...subject,
          questionCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: subjectsWithCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjectById,
  getSubjectsByCourse
};