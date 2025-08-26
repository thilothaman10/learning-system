const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  icon: {
    type: String,
    default: '📚'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  courseCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create slug from name before saving
categorySchema.pre('save', function(next) {
  // Always ensure slug is set
  if (!this.slug || this.isModified('name')) {
    // Generate a unique slug from the name
    let baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // If slug is empty or just dashes, use a fallback
    if (!baseSlug || baseSlug === '-') {
      baseSlug = 'category-' + Date.now();
    }
    
    this.slug = baseSlug;
  }
  next();
});

// Update course count when courses are added/removed
categorySchema.methods.updateCourseCount = async function() {
  const Course = require('./Course');
  const count = await Course.countDocuments({ category: this._id, isPublished: true });
  this.courseCount = count;
  return this.save();
};

module.exports = mongoose.model('Category', categorySchema);
