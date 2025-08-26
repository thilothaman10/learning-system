const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', [auth, isAdmin], async (req, res) => {
  try {
    const { role, isActive, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    let query = {};
    
    // Apply filters
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;
    
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(parseInt(req.query.limit) || 20)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      total,
      hasMore: (parseInt(req.query.skip) || 0) + users.length < total
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Owner/Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('enrolledCourses', 'title thumbnail')
      .populate('completedCourses', 'title thumbnail')
      .populate('certificates', 'certificateNumber issueDate');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check access permissions
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Owner/Admin)
router.put('/:id', [
  auth,
  body('firstName', 'First name is required').not().isEmpty(),
  body('lastName', 'Last name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { firstName, lastName, email, bio, profilePicture } = req.body;
    
    // Check access permissions
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already taken' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { firstName, lastName, email, bio, profilePicture } },
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put('/:id/role', [
  auth,
  isAdmin,
  body('role', 'Role is required').isIn(['student', 'instructor', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { role } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from changing their own role
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }
    
    user.role = role;
    await user.save();
    
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', [
  auth,
  isAdmin,
  body('isActive', 'Status is required').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }
    
    user.isActive = isActive;
    await user.save();
    
    const updatedUser = await User.findById(req.params.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Check if user has active enrollments
    const activeEnrollments = await Enrollment.countDocuments({
      student: req.params.id,
      status: { $in: ['active', 'completed'] }
    });
    
    if (activeEnrollments > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with active enrollments' 
      });
    }
    
    // Check if user is an instructor with courses
    if (user.role === 'instructor') {
      const instructorCourses = await Course.countDocuments({ instructor: req.params.id });
      if (instructorCourses > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete instructor with active courses' 
        });
      }
    }
    
    await User.findByIdAndRemove(req.params.id);
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/courses
// @desc    Get user's courses (enrolled, teaching, or completed)
// @access  Private (Owner/Admin)
router.get('/:id/courses', auth, async (req, res) => {
  try {
    const { type = 'enrolled' } = req.query;
    
    // Check access permissions
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    let courses = [];
    
    switch (type) {
      case 'enrolled':
        courses = await Course.find({ _id: { $in: user.enrolledCourses } })
          .populate('instructor', 'firstName lastName profilePicture')
          .select('title thumbnail description level duration rating');
        break;
      case 'completed':
        courses = await Course.find({ _id: { $in: user.completedCourses } })
          .populate('instructor', 'firstName lastName profilePicture')
          .select('title thumbnail description level duration rating');
        break;
      case 'teaching':
        if (user.role !== 'instructor' && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'User is not an instructor' });
        }
        courses = await Course.find({ instructor: req.params.id })
          .select('title thumbnail description level duration rating currentStudents maxStudents');
        break;
      default:
        return res.status(400).json({ message: 'Invalid type parameter' });
    }
    
    res.json(courses);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/enrollments
// @desc    Get user's enrollments
// @access  Private (Owner/Admin)
router.get('/:id/enrollments', auth, async (req, res) => {
  try {
    const { status } = req.query;
    
    // Check access permissions
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    let query = { student: req.params.id };
    if (status) query.status = status;
    
    const enrollments = await Enrollment.find(query)
      .populate('course', 'title thumbnail instructor')
      .populate('certificate', 'certificateNumber issueDate')
      .sort('-enrollmentDate');
    
    res.json(enrollments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/certificates
// @desc    Get user's certificates
// @access  Private (Owner/Admin)
router.get('/:id/certificates', auth, async (req, res) => {
  try {
    // Check access permissions
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const Certificate = require('../models/Certificate');
    const certificates = await Certificate.find({ student: req.params.id })
      .populate('course', 'title thumbnail instructor')
      .populate('enrollment', 'grade score maxScore')
      .sort('-issueDate');
    
    res.json(certificates);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/dashboard
// @desc    Get user dashboard data
// @access  Private (Owner/Admin)
router.get('/:id/dashboard', auth, async (req, res) => {
  try {
    // Check access permissions
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const user = await User.findById(req.params.id)
      .populate('enrolledCourses', 'title thumbnail')
      .populate('completedCourses', 'title thumbnail')
      .populate('certificates', 'certificateNumber issueDate');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get enrollment statistics
    const enrollments = await Enrollment.find({ student: req.params.id });
    const activeEnrollments = enrollments.filter(e => e.status === 'active');
    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    
    // Calculate total time spent
    const totalTimeSpent = enrollments.reduce((total, enrollment) => 
      total + (enrollment.progress.timeSpent || 0), 0
    );
    
    // Get recent activity
    const recentActivity = await Enrollment.find({ student: req.params.id })
      .populate('course', 'title thumbnail')
      .sort('-progress.lastActivity')
      .limit(5);
    
    const dashboardData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      },
      statistics: {
        totalEnrollments: enrollments.length,
        activeEnrollments: activeEnrollments.length,
        completedEnrollments: completedEnrollments.length,
        totalCertificates: user.certificates.length,
        totalTimeSpent: Math.round(totalTimeSpent / 60) // Convert to hours
      },
      recentActivity: recentActivity.map(enrollment => ({
        course: enrollment.course,
        lastActivity: enrollment.progress.lastActivity,
        progress: enrollment.progress.overallProgress
      })),
      enrolledCourses: user.enrolledCourses,
      completedCourses: user.completedCourses,
      certificates: user.certificates
    };
    
    res.json(dashboardData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
