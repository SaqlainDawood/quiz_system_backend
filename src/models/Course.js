const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Course name can only contain lowercase letters, numbers, and hyphens']
  },
  fullName: {
    type: String,
    required: [true, 'Full course name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true
  },
  color: {
    type: String,
    default: 'from-blue-600 to-indigo-700'
  },
  textColor: {
    type: String,
    default: 'text-blue-600'
  },
  bgLight: {
    type: String,
    default: 'bg-blue-50'
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
courseSchema.index({ name: 1 });
courseSchema.index({ isActive: 1 });

// Virtual for subject count
courseSchema.virtual('subjectCount', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'courseId',
  count: true
});

courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;