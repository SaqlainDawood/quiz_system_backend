const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Question = require('../models/Question');

/**
 * Get all active courses
 * GET /api/courses
 */
const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ isActive: true })
      .populate('createdBy', 'email')
      .lean();

    // ✅ FIX: Populate subjects for each course
    const coursesWithSubjects = await Promise.all(
      courses.map(async (course) => {
        // Get subjects for this course
        const subjects = await Subject.find({ 
          courseId: course._id,
          isActive: true 
        }).sort('order').lean();

        // Get questions for each subject
        const subjectsWithQuestions = await Promise.all(
          subjects.map(async (subject) => {
            const questions = await Question.find({
              subjectId: subject._id
            }).select('-__v').lean();
            
            return {
              ...subject,
              questions: questions || []
            };
          })
        );

        return {
          ...course,
          subjects: subjectsWithQuestions || []
        };
      })
    );

    res.status(200).json({
      success: true,
      data: coursesWithSubjects
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Get single course with subjects
 * GET /api/courses/:id
 */
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'email')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get subjects with questions
    const subjects = await Subject.find({ 
      courseId: course._id,
      isActive: true 
    }).sort('order').lean();

    const subjectsWithQuestions = await Promise.all(
      subjects.map(async (subject) => {
        const questions = await Question.find({
          subjectId: subject._id
        }).select('-__v').lean();
        
        return {
          ...subject,
          questions: questions || []
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        ...course,
        subjects: subjectsWithQuestions || []
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subjects of a course
 * GET /api/courses/:id/subjects
 */
const getCourseSubjects = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const subjects = await Subject.find({
      courseId: course._id,
      isActive: true
    }).sort('order').lean();

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
  getAllCourses,
  getCourseById,
  getCourseSubjects
}; 