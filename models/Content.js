const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'audio', 'document', 'text', 'quiz', 'assignment'],
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  fileUrl: {
    type: String,
    default: ''
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  fileType: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  },
  // For video content
  video: {
    url: String,
    duration: Number,
    quality: String,
    subtitles: [{
      language: String,
      url: String
    }]
  },
  // For audio content
  audio: {
    url: String,
    duration: Number,
    quality: String,
    transcript: String
  },
  // For document content
  document: {
    url: String,
    pages: Number,
    format: String, // pdf, doc, ppt, etc.
    downloadable: {
      type: Boolean,
      default: true
    }
  },
  // For text content
  text: {
    content: String,
    format: String // markdown, html, plain text
  },
  // For quiz content
  quiz: {
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }],
    timeLimit: Number, // in minutes
    passingScore: Number
  },
  // For assignment content
  assignment: {
    description: String,
    dueDate: Date,
    maxScore: Number,
    submissionType: String // file, text, link
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  tags: [String],
  metadata: {
    author: String,
    source: String,
    license: String,
    lastUpdated: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
contentSchema.index({ course: 1, order: 1 });
contentSchema.index({ type: 1 });

// Virtual for content status
contentSchema.virtual('status').get(function() {
  if (this.isPublished) return 'published';
  return 'draft';
});

// Method to get content duration in readable format
contentSchema.methods.getDurationString = function() {
  if (!this.duration) return 'N/A';
  
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

module.exports = mongoose.model('Content', contentSchema);
