const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
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
  enrollment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true
  },
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date,
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  template: {
    name: {
      type: String,
      default: 'default'
    },
    background: String,
    logo: String,
    signature: String,
    customFields: [{
      name: String,
      value: String,
      position: {
        x: Number,
        y: Number
      }
    }]
  },
  metadata: {
    grade: String,
    score: Number,
    maxScore: Number,
    assessmentId: String, // Add assessmentId field for assessment certificates
    completionTime: Number, // in days
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    institution: String,
    accreditation: String,
    cpdHours: Number, // Continuing Professional Development hours
    ceuCredits: Number // Continuing Education Units
  },
  verification: {
    isVerifiable: {
      type: Boolean,
      default: true
    },
    verificationUrl: String,
    qrCode: String,
    hash: String // for digital signature
  },
  downloadHistory: [{
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  notes: String
}, {
  timestamps: true
});

// Index for efficient querying
certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ student: 1, course: 1 });
certificateSchema.index({ status: 1, issueDate: 1 });

// Virtual for certificate validity
certificateSchema.virtual('isValid').get(function() {
  if (this.status !== 'active') return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  return true;
});

// Virtual for certificate age
certificateSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.issueDate) / (1000 * 60 * 60 * 24));
});

// Method to generate certificate number
certificateSchema.methods.generateCertificateNumber = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  const courseId = this.course.toString().substr(-6);
  return `CERT-${timestamp}-${random}-${courseId}`.toUpperCase();
};

// Method to check if certificate is expired
certificateSchema.methods.isExpired = function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Method to get certificate status
certificateSchema.methods.getStatus = function() {
  if (this.status === 'revoked') return 'revoked';
  if (this.isExpired()) return 'expired';
  return 'active';
};

// Method to add download record
certificateSchema.methods.recordDownload = function(req) {
  this.downloadHistory.push({
    downloadedAt: new Date(),
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });
};

// Method to generate verification hash
certificateSchema.methods.generateHash = function() {
  const data = `${this.certificateNumber}-${this.student}-${this.course}-${this.issueDate}`;
  this.verification.hash = crypto.createHash('sha256').update(data).digest('hex');
  return this.verification.hash;
};

module.exports = mongoose.model('Certificate', certificateSchema);
