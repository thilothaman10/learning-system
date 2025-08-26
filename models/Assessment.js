const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  type: {
    type: String,
    enum: ['quiz', 'exam', 'assignment', 'project', 'presentation'],
    default: 'quiz'
  },
  questions: [{
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'fill-blank', 'essay', 'matching', 'ordering'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      default: 1,
      min: 1
    },
    options: [String],
    correctAnswer: String,
    explanation: String,
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  timeLimit: {
    type: Number, // in minutes, 0 means no time limit
    default: 0
  },
  passingScore: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
    default: 70
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  language: {
    type: String,
    default: 'english'
  },
  category: {
    type: String,
    default: 'general'
  },
  shuffleQuestions: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: false
  },
  allowReview: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  instructions: String,
  tags: [String]
}, {
  timestamps: true
});

// Index for efficient querying
assessmentSchema.index({ course: 1, type: 1 });
assessmentSchema.index({ isPublished: 1 });

// Virtual for total questions count
assessmentSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Virtual for assessment status
assessmentSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isPublished) return 'draft';
  if (this.startDate && now < this.startDate) return 'scheduled';
  if (this.endDate && now > this.endDate) return 'expired';
  return 'active';
});

// Method to check if assessment is available
assessmentSchema.methods.isAvailable = function() {
  const now = new Date();
  if (!this.isPublished) return false;
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
};

// Method to calculate total possible score
assessmentSchema.methods.getTotalScore = function() {
  return this.questions.reduce((total, question) => total + (question.points || 1), 0);
};

module.exports = mongoose.model('Assessment', assessmentSchema);
