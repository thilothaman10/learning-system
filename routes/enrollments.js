const express = require('express');
const { body, validationResult } = require('express-validator');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isInstructor, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/enrollments
// @desc    Get enrollments for current user or course (if instructor/admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { courseId, studentId, status } = req.query;
    
    let query = {};
    
    if (req.user.role === 'student') {
      // Students can only see their own enrollments
      query.student = req.user.id;
    } else if (req.user.role === 'instructor') {
      // Instructors can see enrollments for their courses
      if (courseId) {
        const course = await Course.findById(courseId);
        if (!course || course.instructor.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized to view enrollments for this course' });
        }
        query.course = courseId;
      } else {
        // Get all courses by this instructor
        const instructorCourses = await Course.find({ instructor: req.user.id }).select('_id');
        query.course = { $in: instructorCourses.map(c => c._id) };
      }
    } else if (req.user.role === 'admin') {
      // Admins can see all enrollments
      if (courseId) query.course = courseId;
      if (studentId) query.student = studentId;
    }
    
    if (status) query.status = status;
    
    const enrollments = await Enrollment.find(query)
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor')
      .populate('certificate', 'certificateNumber issueDate')
      .sort('-enrollmentDate');
    
    res.json(enrollments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/user/:userId
// @desc    Get enrollments for a specific user
// @access  Private (Owner/Admin/Instructor of user's courses)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check access permissions
    const isOwner = req.user.id === userId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      // Check if user is instructor of any courses the student is enrolled in
      const userEnrollments = await Enrollment.find({ student: userId }).populate('course', 'instructor');
      const isInstructor = userEnrollments.some(enrollment => 
        enrollment.course.instructor.toString() === req.user.id
      );
      
      if (!isInstructor) {
        return res.status(403).json({ message: 'Not authorized to view this user\'s enrollments' });
      }
    }
    
    const enrollments = await Enrollment.find({ student: userId })
      .populate('course', 'title thumbnail instructor')
      .populate('certificate', 'certificateNumber issueDate')
      .sort('-enrollmentDate');
    
    res.json(enrollments);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/check/:courseId
// @desc    Check if current user is enrolled in a specific course
// @access  Private
router.get('/check/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });
    
    if (enrollment) {
      res.json({
        isEnrolled: true,
        enrollment: {
          id: enrollment._id,
          status: enrollment.status,
          enrollmentDate: enrollment.enrollmentDate,
          progress: enrollment.progress
        }
      });
    } else {
      res.json({
        isEnrolled: false,
        enrollment: null
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/debug/:id
// @desc    Debug enrollment data (temporary route for testing)
// @access  Private (Owner only)
router.get('/debug/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check ownership
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({
      enrollment: {
        id: enrollment._id,
        student: enrollment.student,
        course: enrollment.course,
        progress: enrollment.progress,
        status: enrollment.status
      }
    });
  } catch (err) {
    console.error('Debug route error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/:id
// @desc    Get enrollment by ID
// @access  Private (Owner/Instructor/Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor content assessments')
      .populate('certificate', 'certificateNumber issueDate');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check access permissions
    const isOwner = enrollment.student._id.toString() === req.user.id;
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               enrollment.course.instructor.toString() === req.user.id;
    
    if (!isOwner && !isInstructorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(enrollment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/enrollments
// @desc    Create new enrollment
// @access  Private
router.post('/', [
  auth,
  body('course', 'Course ID is required').not().isEmpty()
], async (req, res) => {
  try {
    console.log('=== ENROLLMENT CREATION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('User from auth middleware:', req.user);
    console.log('User ID:', req.user?.id);
    console.log('User role:', req.user?.role);
    console.log('Authorization header:', req.headers.authorization);
    
    // Check if user exists in request
    if (!req.user) {
      console.error('No user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    if (!req.user.id) {
      console.error('No user ID found in request user object');
      return res.status(401).json({ message: 'Invalid user data' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { course: courseId } = req.body;
    console.log('Course ID from request:', courseId);
    
    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('Course not found:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }
    
    console.log('Course found:', {
      id: course._id,
      title: course.title,
      isPublished: course.isPublished,
      instructor: course.instructor
    });
    
    if (!course.isPublished) {
      console.log('Course is not published');
      return res.status(400).json({ message: 'Course is not published' });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });
    
    if (existingEnrollment) {
      console.log('User already enrolled in this course');
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      student: req.user.id,
      course: courseId,
      enrollmentDate: new Date(),
      status: 'active'
    });
    
    console.log('Creating enrollment:', enrollment);
    
    await enrollment.save();
    
    console.log('Enrollment created successfully:', enrollment);
    
    // Update course student count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { currentStudents: 1 }
    });
    
    // Add course to user's enrolled courses
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { enrolledCourses: courseId }
    });
    
    console.log('Course student count updated and user enrolled courses updated');
    
    // Populate course details for response
    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate('course', 'title description thumbnail')
      .populate('student', 'firstName lastName email');
    
    res.status(201).json({
      message: 'Successfully enrolled in course',
      data: {
        enrollment: populatedEnrollment
      }
    });
    
  } catch (err) {
    console.error('Enrollment creation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/:id
// @desc    Update enrollment status
// @access  Private (Owner/Instructor/Admin)
router.put('/:id', [
  auth,
  body('status', 'Status is required').isIn(['active', 'completed', 'dropped', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { status } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check access permissions
    const isOwner = enrollment.student.toString() === req.user.id;
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               (await Course.findById(enrollment.course)).instructor.toString() === req.user.id;
    
    if (!isOwner && !isInstructorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update enrollment
    enrollment.status = status;
    
    if (status === 'completed') {
      enrollment.completionDate = new Date();
      // Calculate grade based on performance
      const totalAssessments = enrollment.progress.completedAssessments.length;
      if (totalAssessments > 0) {
        const totalScore = enrollment.progress.completedAssessments.reduce((sum, assessment) => sum + assessment.bestScore, 0);
        const maxScore = enrollment.progress.completedAssessments.reduce((sum, assessment) => sum + assessment.maxScore, 0);
        const averagePercentage = (totalScore / maxScore) * 100;
        
        // Assign grade based on percentage
        if (averagePercentage >= 97) enrollment.grade = 'A+';
        else if (averagePercentage >= 93) enrollment.grade = 'A';
        else if (averagePercentage >= 90) enrollment.grade = 'A-';
        else if (averagePercentage >= 87) enrollment.grade = 'B+';
        else if (averagePercentage >= 83) enrollment.grade = 'B';
        else if (averagePercentage >= 80) enrollment.grade = 'B-';
        else if (averagePercentage >= 77) enrollment.grade = 'C+';
        else if (averagePercentage >= 73) enrollment.grade = 'C';
        else if (averagePercentage >= 70) enrollment.grade = 'C-';
        else if (averagePercentage >= 67) enrollment.grade = 'D+';
        else if (averagePercentage >= 63) enrollment.grade = 'D';
        else enrollment.grade = 'F';
      }
    }
    
    await enrollment.save();
    
    const updatedEnrollment = await Enrollment.findById(req.params.id)
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor');
    
    res.json(updatedEnrollment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/enrollments/:id
// @desc    Drop enrollment
// @access  Private (Owner/Instructor/Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check access permissions
    const isOwner = enrollment.student.toString() === req.user.id;
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               (await Course.findById(enrollment.course)).instructor.toString() === req.user.id;
    
    if (!isOwner && !isInstructorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update course student count
    await Course.findByIdAndUpdate(enrollment.course, {
      $inc: { currentStudents: -1 }
    });
    
    // Remove from user's enrolled courses
    await User.findByIdAndUpdate(enrollment.student, {
      $pull: { enrolledCourses: enrollment.course }
    });
    
    // Delete enrollment
    await Enrollment.findByIdAndRemove(req.params.id);
    
    res.json({ message: 'Enrollment dropped successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/enrollments/:id/progress
// @desc    Get detailed progress for enrollment
// @access  Private (Owner/Instructor/Admin)
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'title content assessments')
      .populate('progress.completedContent.content', 'title type duration')
      .populate('progress.completedAssessments.assessment', 'title type passingScore');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check access permissions
    const isOwner = enrollment.student.toString() === req.user.id;
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               enrollment.course.instructor.toString() === req.user.id;
    
    if (!isOwner && !isInstructorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Calculate detailed progress
    const totalContent = enrollment.course.content.length;
    const totalAssessments = enrollment.course.assessments.length;
    const completedContent = enrollment.progress.completedContent.length;
    const completedAssessments = enrollment.progress.completedAssessments.filter(a => a.passed).length;
    
    const contentProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
    const assessmentProgress = totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0;
    
    // Calculate overall progress
    const overallProgress = Math.round(
      (contentProgress * 0.7) + (assessmentProgress * 0.3)
    );
    
    res.json({
      enrollment,
      progress: {
        overall: overallProgress,
        content: Math.round(contentProgress),
        assessments: Math.round(assessmentProgress),
        totalContent,
        totalAssessments,
        completedContent,
        completedAssessments,
        timeSpent: enrollment.progress.timeSpent,
        lastActivity: enrollment.progress.lastActivity
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/enrollments/:id/complete-content
// @desc    Mark content as completed
// @access  Private (Owner only)
router.post('/:id/complete-content', [
  auth,
  body('contentId', 'Content ID is required').not().isEmpty(),
  body('timeSpent', 'Time spent is required').isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { contentId, timeSpent } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'content assessments');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check ownership
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Check if already completed
    const alreadyCompleted = enrollment.progress.completedContent.find(
      item => item.content.toString() === contentId
    );
    
    if (alreadyCompleted) {
      return res.status(400).json({ message: 'Content already marked as completed' });
    }
    
    // Add to completed content
    enrollment.progress.completedContent.push({
      content: contentId,
      completedAt: new Date(),
      timeSpent
    });
    
    // Update time spent and last activity
    enrollment.progress.timeSpent += timeSpent;
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

// @route   GET /api/enrollments/:id/assessment-status/:assessmentId
// @desc    Check if user can take an assessment (check max attempts)
// @access  Private (Owner only)
router.get('/:id/assessment-status/:assessmentId', auth, async (req, res) => {
  try {
    const { id, assessmentId } = req.params;
    
    const enrollment = await Enrollment.findById(id)
      .populate('course', 'assessments')
      .populate('course.assessments', 'maxAttempts');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check ownership
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Find the assessment
    const assessment = enrollment.course.assessments?.find(a => a._id.toString() === assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check current attempts for this assessment
    const currentAssessment = enrollment.progress.completedAssessments?.find(
      a => a.assessment.toString() === assessmentId
    );
    
    const currentAttempts = currentAssessment ? currentAssessment.attempts.length : 0;
    const maxAttempts = assessment.maxAttempts || 3; // Default to 3 if not set
    const canTake = currentAttempts < maxAttempts;
    
    res.json({
      canTake,
      currentAttempts,
      maxAttempts,
      assessment: {
        id: assessment._id,
        title: assessment.title,
        maxAttempts: assessment.maxAttempts
      }
    });
  } catch (err) {
    console.error('Assessment status check error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/enrollments/:id/progress
// @desc    Update enrollment progress
// @access  Private (Owner only)
router.put('/:id/progress', auth, async (req, res) => {
  try {
    console.log('Progress update request body:', req.body);
    console.log('Enrollment ID:', req.params.id);
    console.log('Request body keys:', Object.keys(req.body));
    
    const { 
      progress, 
      completedContent, 
      lastAccessed, 
      completedAssessments, 
      lastActivity
    } = req.body;
    
    console.log('Extracted completedAssessments:', completedAssessments);
    console.log('Type of completedAssessments:', typeof completedAssessments);
    console.log('Is Array?', Array.isArray(completedAssessments));
    
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course', 'content assessments');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    console.log('Current enrollment progress:', enrollment.progress);
    
    // Check ownership
    if (enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update progress fields
    if (completedContent !== undefined) {
      // Clear existing completed content and replace with new list
      enrollment.progress.completedContent = [];
      
      // Add all completed content items
      completedContent.forEach(contentId => {
        enrollment.progress.completedContent.push({
          content: contentId,
          completedAt: new Date(),
          timeSpent: 5 // Default time spent
        });
      });
    }
    
    if (lastAccessed !== undefined) {
      enrollment.progress.lastActivity = new Date(lastAccessed);
    }
    
    if (lastActivity !== undefined) {
      enrollment.progress.lastActivity = new Date(lastActivity);
    }
    
    // Handle assessment data
    if (completedAssessments !== undefined) {
      console.log('Setting completedAssessments to:', completedAssessments);
      
      // Ensure the completedAssessments array exists
      if (!enrollment.progress.completedAssessments) {
        enrollment.progress.completedAssessments = [];
      }
      
      // Validate the data structure
      if (Array.isArray(completedAssessments)) {
        console.log('completedAssessments is a valid array, length:', completedAssessments.length);
        
        // Clear existing and set new
        enrollment.progress.completedAssessments = [];
        completedAssessments.forEach(assessment => {
          enrollment.progress.completedAssessments.push(assessment);
        });
        
        console.log('After setting - enrollment.progress.completedAssessments:', enrollment.progress.completedAssessments);
      } else {
        console.log('completedAssessments is not an array, converting to array');
        enrollment.progress.completedAssessments = [completedAssessments];
      }
      
      console.log('Updated enrollment.progress.completedAssessments:', enrollment.progress.completedAssessments);
    }
    
    // Always use the frontend progress value if provided, as it's more accurate
    if (progress !== undefined) {
      enrollment.progress.overallProgress = progress;
    } else {
      // Fallback to calculation if no progress provided
      let calculatedProgress;
      
      // Try to get course details if not populated
      if (!enrollment.course.content || enrollment.course.content.length === 0) {
        const courseDetails = await Course.findById(enrollment.course).select('content assessments');
        if (courseDetails && courseDetails.content) {
          enrollment.course = courseDetails;
        }
      }
      
      if (enrollment.course && enrollment.course.content && enrollment.course.content.length > 0) {
        calculatedProgress = enrollment.calculateProgress();
      } else {
        // Use simple progress calculation if course details aren't available
        const estimatedTotalContent = completedContent ? completedContent.length : 10;
        calculatedProgress = enrollment.calculateSimpleProgress(estimatedTotalContent);
      }
      
      enrollment.progress.overallProgress = calculatedProgress;
    }
    
    console.log('Before save - enrollment.progress.completedAssessments:', enrollment.progress.completedAssessments);
    
    await enrollment.save();
    
    console.log('After save - enrollment.progress.completedAssessments:', enrollment.progress.completedAssessments);
    
    // Fetch the updated enrollment to ensure we have the latest data
    const updatedEnrollment = await Enrollment.findById(req.params.id);
    
    console.log('After fetch - updatedEnrollment.progress.completedAssessments:', updatedEnrollment.progress.completedAssessments);
    
    res.json({ 
      message: 'Progress updated successfully', 
      enrollment: updatedEnrollment,
      data: {
        progress: updatedEnrollment.progress.overallProgress,
        completedContentCount: updatedEnrollment.progress.completedContent.length,
        completedAssessmentsCount: updatedEnrollment.progress.completedAssessments ? updatedEnrollment.progress.completedAssessments.length : 0
      }
    });
  } catch (err) {
    console.error('Progress update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
