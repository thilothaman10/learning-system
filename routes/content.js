const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Content = require('../models/Content');
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const { isInstructor, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/content';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = {
      'video': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      'audio': ['.mp3', '.wav', '.aac', '.ogg', '.wma'],
      'document': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'],
      'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
    };
    
    // Get file type from query params or body, fallback to document
    const fileType = req.query.type || req.body.type || 'document';
    const allowedExtensions = allowedTypes[fileType] || allowedTypes.document;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${fileType}. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  }
});

// @route   GET /api/content
// @desc    Get all content for a course OR all content for admin
// @access  Private (Enrolled students or course owner, or Admin)
router.get('/', auth, async (req, res) => {
  try {
    const { courseId, admin } = req.query;
    
    // If admin=true, return all content (admin view)
    if (admin === 'true' && req.user.role === 'admin') {
      const content = await Content.find({})
        .populate('course', 'title instructor')
        .sort({ createdAt: -1 });
      return res.json(content);
    }
    
    // Otherwise, require courseId for regular users
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    // Check if user is enrolled or is the instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               course.instructor.toString() === req.user.id;
    
    if (!isInstructorOrAdmin) {
      // Check enrollment
      const Enrollment = require('../models/Enrollment');
          const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'Must be enrolled to access content' });
    }
    }
    
    // Build the query - students see published content, instructors see all
    const query = { course: courseId };
    if (!isInstructorOrAdmin) {
      query.isPublished = true; // Students only see published content
    }
    // Instructors see all content (no isPublished filter)
    
    const content = await Content.find(query).sort('order');
    
    // Add cache control headers to prevent caching issues
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(content);
  } catch (err) {
    console.error('Content route error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/content/:id
// @desc    Get content by ID
// @access  Private (Enrolled students or course owner)
router.get('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('course', 'title instructor');
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Check access permissions
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               content.course.instructor.toString() === req.user.id;
    
    if (!isInstructorOrAdmin) {
      // Check enrollment
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: content.course._id
      });
      
      if (!enrollment) {
        return res.status(403).json({ message: 'Must be enrolled to access content' });
      }
    }
    
    res.json(content);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/content/test-upload
// @desc    Test file upload validation (for debugging)
// @access  Private (Admin only)
router.get('/test-upload', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const allowedTypes = {
      'video': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
      'audio': ['.mp3', '.wav', '.aac', '.ogg', '.wma'],
      'document': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'],
      'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp']
    };
    
    res.json({
      message: 'Upload validation test',
      requestedType: type,
      allowedExtensions: allowedTypes[type] || allowedTypes.document,
      allTypes: allowedTypes
    });
  } catch (err) {
    console.error('Test upload error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/content
// @desc    Create new content
// @access  Private (Instructor/Admin)
router.post('/', [
  auth,
  isInstructor,
  body('title', 'Title is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty(),
  body('type', 'Type is required').isIn(['video', 'audio', 'document', 'text', 'quiz', 'assignment']),
  body('course', 'Course ID is required').not().isEmpty(),
  body('order', 'Order is required').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { course } = req.body;
    
    // Check if user owns the course or is admin
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (courseDoc.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add content to this course' });
    }
    
    const content = new Content(req.body);
    await content.save();
    
    // Update course content array
    await Course.findByIdAndUpdate(course, {
      $push: { content: content._id }
    });
    
    const populatedContent = await Content.findById(content._id)
      .populate('course', 'title');
    
    res.json(populatedContent);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/content/upload
// @desc    Upload content file
// @access  Private (Instructor/Admin)
router.post('/upload', [
  auth,
  isInstructor,
  upload.single('file')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { type, courseId, title, description, order } = req.body;
    const queryType = req.query.type; // Get type from query params
    
    // Use query type if body type is missing
    const finalType = type || queryType;
    
    if (!finalType || !courseId || !title || !description || !order) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        missing: {
          type: !finalType,
          courseId: !courseId,
          title: !title,
          description: !description,
          order: !order
        }
      });
    }
    
    // Check course ownership
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Create content based on type
    const contentData = {
      title,
      description,
      type: finalType,
      course: courseId,
      order: parseInt(order),
      fileUrl: `/uploads/content/${req.file.filename}`,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).toLowerCase()
    };
    
    // Add type-specific data
    switch (finalType) {
      case 'video':
        contentData.video = {
          url: `/uploads/content/${req.file.filename}`,
          quality: 'HD'
        };
        break;
      case 'audio':
        contentData.audio = {
          url: `/uploads/content/${req.file.filename}`
        };
        break;
      case 'document':
        contentData.document = {
          url: `/uploads/content/${req.file.filename}`,
          format: path.extname(req.file.originalname).substring(1).toUpperCase(),
          downloadable: true
        };
        break;
      case 'image':
        contentData.image = {
          url: `/uploads/content/${req.file.filename}`,
          alt: title
        };
        break;
    }
    
    const content = new Content(contentData);
    await content.save();
    
    // Update course content array
    await Course.findByIdAndUpdate(courseId, {
      $push: { content: content._id }
    });
    
    res.json({
      message: 'Content uploaded successfully',
      content: {
        id: content._id,
        title: content.title,
        type: content.type,
        fileUrl: content.fileUrl
      }
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    if (err.message.includes('Invalid file type')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/content/:id
// @desc    Update content
// @access  Private (Owner/Admin)
router.put('/:id', [
  auth,
  body('title', 'Title is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Check ownership
    const course = await Course.findById(content.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('course', 'title');
    
    res.json(updatedContent);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/content/:id
// @desc    Delete content
// @access  Private (Owner/Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Check ownership
    const course = await Course.findById(content.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete file if exists
    if (content.fileUrl && content.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', content.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Remove from course content array
    await Course.findByIdAndUpdate(content.course, {
      $pull: { content: content._id }
    });
    
    await Content.findByIdAndRemove(req.params.id);
    res.json({ message: 'Content removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/content/:id/complete
// @desc    Mark content as completed for student
// @access  Private (Enrolled students)
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Check enrollment
    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: content.course
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'Must be enrolled to mark content complete' });
    }
    
    // Check if already completed
    const alreadyCompleted = enrollment.progress.completedContent.find(
      item => item.content.toString() === req.params.id
    );
    
    if (alreadyCompleted) {
      return res.status(400).json({ message: 'Content already marked as completed' });
    }
    
    // Add to completed content
    enrollment.progress.completedContent.push({
      content: req.params.id,
      completedAt: new Date(),
      timeSpent: req.body.timeSpent || 0
    });
    
    // Update last activity
    enrollment.progress.lastActivity = new Date();
    
    // Recalculate progress
    enrollment.calculateProgress();
    
    await enrollment.save();
    
    res.json({ message: 'Content marked as completed', enrollment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
