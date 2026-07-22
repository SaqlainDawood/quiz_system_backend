const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Subject description is required'],
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
subjectSchema.index({ courseId: 1 });
subjectSchema.index({ courseId: 1, name: 1 });
subjectSchema.index({ isActive: 1 });

// Virtual for question count
subjectSchema.virtual('questionCount', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'subjectId',
  count: true
});

subjectSchema.set('toJSON', { virtuals: true });
subjectSchema.set('toObject', { virtuals: true });

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;