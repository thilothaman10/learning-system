const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-in-blank', 'essay', 'matching', 'ordering'],
    required: true
  },
  points: {
    type: Number,
    default: 1,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  category: {
    type: String,
    default: 'general'
  },
  // For multiple choice questions
  options: [{
    text: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    explanation: String
  }],
  // For true-false questions
  correctAnswer: {
    type: Boolean
  },
  // For fill-in-blank questions
  correctAnswers: [String],
  // For essay questions
  rubric: [{
    criterion: String,
    points: Number,
    description: String
  }],
  // For matching questions
  matchingPairs: [{
    left: String,
    right: String
  }],
  // For ordering questions
  correctOrder: [String],
  // General question properties
  explanation: String,
  hints: [String],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    author: String,
    source: String,
    lastModified: Date,
    usageCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
questionSchema.index({ type: 1, difficulty: 1, category: 1 });
questionSchema.index({ isActive: 1 });

// Virtual for question complexity
questionSchema.virtual('complexity').get(function() {
  if (this.type === 'essay' || this.type === 'matching') return 'high';
  if (this.type === 'multiple-choice' && this.options.length > 4) return 'medium';
  return 'low';
});

// Method to validate question based on type
questionSchema.methods.validateQuestion = function() {
  switch (this.type) {
    case 'multiple-choice':
      return this.options.length >= 2 && this.options.some(opt => opt.isCorrect);
    case 'true-false':
      return this.correctAnswer !== undefined;
    case 'fill-in-blank':
      return this.correctAnswers && this.correctAnswers.length > 0;
    case 'essay':
      return this.rubric && this.rubric.length > 0;
    case 'matching':
      return this.matchingPairs && this.matchingPairs.length > 0;
    case 'ordering':
      return this.correctOrder && this.correctOrder.length > 0;
    default:
      return false;
  }
};

// Method to get correct answers
questionSchema.methods.getCorrectAnswers = function() {
  switch (this.type) {
    case 'multiple-choice':
      return this.options.filter(opt => opt.isCorrect).map(opt => opt.text);
    case 'true-false':
      return [this.correctAnswer];
    case 'fill-in-blank':
      return this.correctAnswers;
    case 'matching':
      return this.matchingPairs.map(pair => `${pair.left} -> ${pair.right}`);
    case 'ordering':
      return this.correctOrder;
    default:
      return [];
  }
};

// Method to calculate max points
questionSchema.methods.getMaxPoints = function() {
  if (this.type === 'essay' && this.rubric) {
    return this.rubric.reduce((total, criterion) => total + criterion.points, 0);
  }
  return this.points;
};

module.exports = mongoose.model('Question', questionSchema);
