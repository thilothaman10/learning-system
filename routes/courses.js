const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');
const { isInstructor, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all published courses with optional filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, level, search, instructor, sortBy = 'createdAt', order = 'desc', admin } = req.query;
    
    let query = {};
    
    // If not admin, only show published courses
    if (!admin) {
      query.isPublished = true;
      console.log('Filtering for published courses only');
    } else {
      console.log('Admin access - showing all courses including unpublished');
    }
    
    // Apply filters
    if (category) query.category = category;
    if (level) query.level = level;
    if (instructor) query.instructor = instructor;
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    console.log('Course query:', query);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;
    
    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName profilePicture')
      .sort(sort)
      .limit(parseInt(req.query.limit) || 20)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await Course.countDocuments(query);
    
    console.log(`Found ${courses.length} courses out of ${total} total`);
    
    // Log the first course structure to debug category issue
    if (courses.length > 0) {
      console.log('🔍 First course structure:');
      console.log('   Title:', courses[0].title);
      console.log('   Category:', courses[0].category, '(type:', typeof courses[0].category, ')');
      console.log('   Category constructor:', courses[0].category?.constructor?.name);
      console.log('   Is ObjectId:', courses[0].category?._bsontype === 'ObjectID');
    }
    
    res.json({
      courses,
      total,
      hasMore: (parseInt(req.query.skip) || 0) + courses.length < total
    });
  } catch (err) {
    console.error('Course list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching course with ID:', req.params.id);
    
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName profilePicture bio')
      .populate('content', 'title type duration order')
      .populate('assessments', 'title type timeLimit passingScore')
      .populate({
        path: 'reviews',
        populate: {
          path: 'user',
          select: 'firstName lastName profilePicture'
        }
      });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    console.log('Course fetched successfully:', {
      id: course._id,
      title: course.title,
      isPublished: course.isPublished,
      instructor: course.instructor
    });
    
    res.json(course);
  } catch (err) {
    console.error('Course fetch error:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Instructor/Admin)
router.post('/', [
  auth,
  isInstructor,
  body('title', 'Title is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty(),
  body('category', 'Category is required').not().isEmpty(),
  body('duration', 'Duration is required').isNumeric()
], async (req, res) => {
  try {
    console.log('Course creation request:', {
      body: req.body,
      user: req.user,
      userId: req.user.id,
      userRole: req.user.role
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Clean up and convert data types
    const { thumbnail, duration, price, maxStudents, ...otherFields } = req.body;
    
    // Convert thumbnail from empty object to empty string
    const thumbnailValue = (thumbnail && typeof thumbnail === 'object' && Object.keys(thumbnail).length === 0) ? '' : (thumbnail || '');
    
    // Convert string numbers to actual numbers
    const durationValue = duration ? Number(duration) : undefined;
    const priceValue = price ? Number(price) : undefined;
    const maxStudentsValue = maxStudents ? Number(maxStudents) : undefined;
    
    const courseData = {
      ...otherFields,
      thumbnail: thumbnailValue,
      duration: durationValue,
      price: priceValue,
      maxStudents: maxStudentsValue,
      instructor: req.user.id
    };
    
    console.log('Creating course with data:', courseData);
    
    const course = new Course(courseData);
    await course.save();
    
    console.log('Course created successfully:', course);
    
    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'firstName lastName profilePicture');
    
    res.json(populatedCourse);
  } catch (err) {
    console.error('Course creation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
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
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('instructor', 'firstName lastName profilePicture');
    
    res.json(updatedCourse);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Owner/Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if there are enrollments
    const enrollmentCount = await Enrollment.countDocuments({ course: req.params.id });
    if (enrollmentCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete course with active enrollments' 
      });
    }
    
    await Course.findByIdAndRemove(req.params.id);
    res.json({ message: 'Course removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (!course.isPublished) {
      return res.status(400).json({ message: 'Course is not published' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Check course capacity
    if (course.currentStudents >= course.maxStudents) {
      return res.status(400).json({ message: 'Course is full' });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      student: req.user.id,
      course: req.params.id
    });
    
    await enrollment.save();
    
    // Update course student count
    course.currentStudents += 1;
    await course.save();
    
    // Update user enrolled courses
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { enrolledCourses: req.params.id }
    });
    
    res.json({ message: 'Successfully enrolled in course', enrollment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id/enrollment
// @desc    Get enrollment status for current user
// @access  Private
router.get('/:id/enrollment', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    }).populate('course', 'title thumbnail');
    
    if (!enrollment) {
      return res.json({ enrolled: false });
    }
    
    res.json({ enrolled: true, enrollment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/courses/:id/progress
// @desc    Get course progress for enrolled user
// @access  Private
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    }).populate('course', 'title content assessments');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    // Calculate progress
    const progress = enrollment.calculateProgress();
    
    res.json({
      enrollment,
      progress,
      totalContent: enrollment.course.content.length,
      totalAssessments: enrollment.course.assessments.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/courses/:id/review
// @desc    Add course review
// @access  Private (Enrolled students only)
router.post('/:id/review', [
  auth,
  body('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
  body('comment', 'Comment is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { rating, comment } = req.body;
    
    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    });
    
    if (!enrollment) {
      return res.status(400).json({ message: 'Must be enrolled to review course' });
    }
    
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user already reviewed
    const existingReview = course.reviews.find(
      review => review.user.toString() === req.user.id
    );
    
    if (existingReview) {
      return res.status(400).json({ message: 'Already reviewed this course' });
    }
    
    // Add review
    course.reviews.push({
      user: req.user.id,
      rating,
      comment
    });
    
    // Recalculate rating
    course.calculateRating();
    await course.save();
    
    res.json(course);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/publish
// @desc    Publish course
// @access  Private (Owner/Admin)
router.put('/:id/publish', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    course.isPublished = true;
    await course.save();
    
    res.json({ message: 'Course published successfully', course });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/courses/:id/unpublish
// @desc    Unpublish course
// @access  Private (Owner/Admin)
router.put('/:id/unpublish', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    course.isPublished = false;
    await course.save();
    
    res.json({ message: 'Course unpublished successfully', course });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
