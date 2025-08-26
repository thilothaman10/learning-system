const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'suspended'],
    default: 'active'
  },
  progress: {
    completedContent: [{
      content: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: Number // in minutes
    }],
    completedAssessments: [{
      assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment'
      },
      score: Number,
      maxScore: Number,
      attempts: [{
        attemptNumber: Number,
        score: Number,
        answers: [{
          question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
          },
          answer: mongoose.Schema.Types.Mixed,
          isCorrect: Boolean,
          points: Number
        }],
        startedAt: Date,
        completedAt: Date,
        timeSpent: Number
      }],
      bestScore: Number,
      passed: Boolean,
      completedAt: Date
    }],
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    timeSpent: {
      type: Number,
      default: 0 // total time spent in minutes
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  completionDate: Date,
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'],
    required: false
  },
  notes: String,
  metadata: {
    enrollmentSource: String, // direct, referral, promotion
    paymentMethod: String,
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  }
}, {
  timestamps: true
});

// Compound index for unique enrollment
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Index for efficient querying
enrollmentSchema.index({ status: 1, enrollmentDate: 1 });
enrollmentSchema.index({ 'progress.overallProgress': 1 });

// Virtual for enrollment duration
enrollmentSchema.virtual('duration').get(function() {
  if (this.completionDate) {
    return Math.ceil((this.completionDate - this.enrollmentDate) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((Date.now() - this.enrollmentDate) / (1000 * 60 * 60 * 24));
});

// Method to calculate progress percentage
enrollmentSchema.methods.calculateProgress = function() {
  // If course is populated, use its content/assessments
  let totalContent = 0;
  let totalAssessments = 0;
  
  if (this.course && this.course.content) {
    totalContent = this.course.content.length;
  }
  
  if (this.course && this.course.assessments) {
    totalAssessments = this.course.assessments.length;
  }
  
  // If course is not populated, we can't calculate accurate progress
  // Return current progress or 0
  if (totalContent === 0 && totalAssessments === 0) {
    return this.progress.overallProgress || 0;
  }
  
  const completedContentCount = this.progress.completedContent.length;
  const completedAssessmentsCount = this.progress.completedAssessments.filter(a => a.passed).length;
  
  const contentWeight = 0.7; // 70% weight for content
  const assessmentWeight = 0.3; // 30% weight for assessments
  
  const contentProgress = totalContent > 0 ? (completedContentCount / totalContent) * 100 : 0;
  const assessmentProgress = totalAssessments > 0 ? (completedAssessmentsCount / totalAssessments) * 100 : 0;
  
  this.progress.overallProgress = Math.round(
    (contentProgress * contentWeight) + (assessmentProgress * assessmentWeight)
  );
  
  return this.progress.overallProgress;
};

// Method to calculate simple progress based on completed content count
enrollmentSchema.methods.calculateSimpleProgress = function(estimatedTotalContent = 10) {
  const completedContentCount = this.progress.completedContent.length;
  const progress = Math.round((completedContentCount / estimatedTotalContent) * 100);
  this.progress.overallProgress = Math.min(progress, 100);
  return this.progress.overallProgress;
};

// Simple method to set progress directly
enrollmentSchema.methods.setProgress = function(progressValue) {
  this.progress.overallProgress = Math.min(Math.max(progressValue, 0), 100);
  return this.progress.overallProgress;
};

// Method to check if course is completed
enrollmentSchema.methods.isCompleted = function() {
  return this.progress.overallProgress >= 100;
};

// Method to get time spent in readable format
enrollmentSchema.methods.getTimeSpentString = function() {
  const hours = Math.floor(this.progress.timeSpent / 60);
  const minutes = this.progress.timeSpent % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
