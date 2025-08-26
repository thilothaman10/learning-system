const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String,
    default: '/images/default-course-thumbnail.svg'
  },
  content: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  requirements: [String],
  learningOutcomes: [String],
  tags: [String],
  isPublished: {
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: true
  },
  maxStudents: {
    type: Number,
    default: 1000
  },
  currentStudents: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  certificateTemplate: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for search functionality
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for total content duration
courseSchema.virtual('totalDuration').get(function() {
  return this.content.reduce((total, content) => total + (content.duration || 0), 0);
});

// Method to calculate course rating
courseSchema.methods.calculateRating = function() {
  if (this.reviews.length === 0) return 0;
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  return this.rating.average;
};

module.exports = mongoose.model('Course', courseSchema);
