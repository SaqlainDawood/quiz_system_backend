const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function(v) {
        return v && v.length === 4 && v.every(opt => opt.trim().length > 0);
      },
      message: 'Exactly 4 non-empty options are required'
    }
  },
  correct: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: 0,
    max: 3
  },
  explanation: {
    type: String,
    trim: true,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ subjectId: 1 });
questionSchema.index({ courseId: 1 });
questionSchema.index({ subjectId: 1, createdAt: -1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;