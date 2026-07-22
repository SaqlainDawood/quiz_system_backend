const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    required: true
  },
  answers: {
    type: [Number],
    default: []
  },
  correct: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 1
  },
  wrong: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
quizResultSchema.index({ sessionId: 1, completedAt: -1 });
quizResultSchema.index({ courseId: 1, subjectId: 1 });
quizResultSchema.index({ completedAt: -1 });

// Virtual for grade
quizResultSchema.virtual('grade').get(function() {
  const percentage = this.percentage;
  if (percentage >= 90) return { grade: 'A+', label: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', label: 'Excellent' };
  if (percentage >= 70) return { grade: 'B', label: 'Good' };
  if (percentage >= 60) return { grade: 'C', label: 'Average' };
  return { grade: 'Fail', label: 'Needs Improvement' };
});

quizResultSchema.set('toJSON', { virtuals: true });
quizResultSchema.set('toObject', { virtuals: true });

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

module.exports = QuizResult;