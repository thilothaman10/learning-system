const express = require('express');
const { body, validationResult } = require('express-validator');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');
const { isInstructor, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/assessments
// @desc    Get all assessments for a course OR all assessments for admin
// @access  Private (Enrolled students or course owner, or Admin)
router.get('/', auth, async (req, res) => {
  try {
    const { courseId, admin } = req.query;
    
    // If admin=true, return all assessments (admin view)
    if (admin === 'true' && req.user.role === 'admin') {
      const assessments = await Assessment.find({})
        .populate('course', 'title instructor')
        .populate('questions', 'text type points difficulty')
        .sort({ createdAt: -1 });
      return res.json(assessments);
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
      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: courseId
      });
      
      if (!enrollment) {
        return res.status(403).json({ message: 'Must be enrolled to access assessments' });
      }
    }
    
    // Query for assessments with the specific courseId
    const assessments = await Assessment.find({ 
      course: courseId,
      isPublished: true // Only return published assessments
    }).populate('questions', 'text type points difficulty');
    
    res.json(assessments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assessments/:id
// @desc    Get assessment by ID
// @access  Private (Enrolled students or course owner)
router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('course', 'title instructor')
      .populate('questions', 'text type points difficulty options correctAnswer correctAnswers rubric matchingPairs correctOrder');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check access permissions
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               assessment.course.instructor.toString() === req.user.id;
    
    if (!isInstructorOrAdmin) {
      // Check enrollment
      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        course: assessment.course._id
      });
      
      if (!enrollment) {
        return res.status(403).json({ message: 'Must be enrolled to access assessment' });
      }
      
      // Check if assessment is available
      if (!assessment.isAvailable()) {
        return res.status(400).json({ message: 'Assessment is not available' });
      }
      
      // Remove correct answers for students
      assessment.questions.forEach(question => {
        if (question.type === 'multiple-choice') {
          question.options.forEach(option => {
            delete option.isCorrect;
          });
        } else if (question.type === 'true-false') {
          delete question.correctAnswer;
        } else if (question.type === 'fill-in-blank') {
          delete question.correctAnswers;
        } else if (question.type === 'matching') {
          delete question.matchingPairs;
        } else if (question.type === 'ordering') {
          delete question.correctOrder;
        }
      });
    }
    
    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/assessments
// @desc    Create new assessment
// @access  Private (Instructor/Admin)
router.post('/', [
  auth,
  isInstructor,
  body('title', 'Title is required').not().isEmpty(),
  body('description', 'Description is required').not().isEmpty(),
  body('course', 'Course ID is required').not().isEmpty(),
  body('passingScore').optional().isInt({ min: 0, max: 100 })
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
      return res.status(403).json({ message: 'Not authorized to add assessment to this course' });
    }
    
    const assessment = new Assessment(req.body);
    await assessment.save();
    
    // Update course assessments array
    await Course.findByIdAndUpdate(course, {
      $push: { assessments: assessment._id }
    });
    
    const populatedAssessment = await Assessment.findById(assessment._id)
      .populate('course', 'title');
    
    res.json(populatedAssessment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/assessments/:id
// @desc    Update assessment
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
    
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check ownership
    const course = await Course.findById(assessment.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedAssessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('course', 'title');
    
    res.json(updatedAssessment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/assessments/:id
// @desc    Delete assessment
// @access  Private (Owner/Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check ownership
    const course = await Course.findById(assessment.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Remove from course assessments array
    await Course.findByIdAndUpdate(assessment.course, {
      $pull: { assessments: assessment._id }
    });
    
    await Assessment.findByIdAndRemove(req.params.id);
    res.json({ message: 'Assessment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/assessments/:id/questions
// @desc    Add question to assessment
// @access  Private (Owner/Admin)
router.post('/:id/questions', [
  auth,
  body('text', 'Question text is required').not().isEmpty(),
  body('type', 'Question type is required').isIn(['multiple-choice', 'true-false', 'fill-in-blank', 'essay', 'matching', 'ordering']),
  body('points', 'Points must be a positive number').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check ownership
    const course = await Course.findById(assessment.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Validate question data based on type
    const { type, options, correctAnswer, correctAnswers, matchingPairs, correctOrder } = req.body;
    
    let questionData = {
      text: req.body.text,
      type,
      points: req.body.points,
      difficulty: req.body.difficulty || 'medium',
      category: req.body.category || 'general'
    };
    
    // Add type-specific data
    switch (type) {
      case 'multiple-choice':
        if (!options || options.length < 2) {
          return res.status(400).json({ message: 'Multiple choice questions must have at least 2 options' });
        }
        questionData.options = options;
        break;
      case 'true-false':
        if (correctAnswer === undefined) {
          return res.status(400).json({ message: 'True-false questions must have a correct answer' });
        }
        questionData.correctAnswer = correctAnswer;
        break;
      case 'fill-in-blank':
        if (!correctAnswers || correctAnswers.length === 0) {
          return res.status(400).json({ message: 'Fill-in-blank questions must have correct answers' });
        }
        questionData.correctAnswers = correctAnswers;
        break;
      case 'matching':
        if (!matchingPairs || matchingPairs.length === 0) {
          return res.status(400).json({ message: 'Matching questions must have matching pairs' });
        }
        questionData.matchingPairs = matchingPairs;
        break;
      case 'ordering':
        if (!correctOrder || correctOrder.length === 0) {
          return res.status(400).json({ message: 'Ordering questions must have correct order' });
        }
        questionData.correctOrder = correctOrder;
        break;
    }
    
    const question = new Question(questionData);
    await question.save();
    
    // Add question to assessment
    assessment.questions.push(question._id);
    await assessment.save();
    
    const populatedQuestion = await Question.findById(question._id);
    res.json(populatedQuestion);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/assessments/:id/submit
// @desc    Submit assessment answers
// @access  Private (Enrolled students)
router.post('/:id/submit', [
  auth,
  body('answers', 'Answers are required').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { answers, timeSpent } = req.body;
    
    const assessment = await Assessment.findById(req.params.id)
      .populate('questions', 'text type points options correctAnswer correctAnswers matchingPairs correctOrder');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: assessment.course
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'Must be enrolled to submit assessment' });
    }
    
    // Check if assessment is available
    if (!assessment.isAvailable()) {
      return res.status(400).json({ message: 'Assessment is not available' });
    }
    
    // Check attempt limit
    const existingAttempt = enrollment.progress.completedAssessments.find(
      item => item.assessment.toString() === req.params.id
    );
    
    if (existingAttempt && existingAttempt.attempts.length >= assessment.maxAttempts) {
      return res.status(400).json({ message: 'Maximum attempts reached for this assessment' });
    }
    
    // Grade the assessment
    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers = [];
    
    for (let i = 0; i < assessment.questions.length; i++) {
      const question = assessment.questions[i];
      const answer = answers.find(a => a.questionId === question._id.toString());
      
      maxScore += question.points;
      
      if (answer) {
        let isCorrect = false;
        let earnedPoints = 0;
        
        // Grade based on question type
        switch (question.type) {
          case 'multiple-choice':
            const selectedOption = question.options.find(opt => opt.text === answer.answer);
            isCorrect = selectedOption && selectedOption.isCorrect;
            break;
          case 'true-false':
            isCorrect = answer.answer === question.correctAnswer;
            break;
          case 'fill-in-blank':
            isCorrect = question.correctAnswers.some(correct => 
              correct.toLowerCase() === answer.answer.toLowerCase()
            );
            break;
          case 'matching':
            // For matching, check if all pairs are correct
            isCorrect = answer.answer.every((pair, index) => 
              pair.left === question.matchingPairs[index].left &&
              pair.right === question.matchingPairs[index].right
            );
            break;
          case 'ordering':
            isCorrect = JSON.stringify(answer.answer) === JSON.stringify(question.correctOrder);
            break;
          case 'essay':
            // Essay questions need manual grading
            isCorrect = false;
            earnedPoints = 0;
            break;
        }
        
        if (isCorrect) {
          earnedPoints = question.points;
          totalScore += earnedPoints;
        }
        
        gradedAnswers.push({
          question: question._id,
          answer: answer.answer,
          isCorrect,
          points: earnedPoints
        });
      }
    }
    
    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= assessment.passingScore;
    
    // Create attempt record
    const attempt = {
      attemptNumber: existingAttempt ? existingAttempt.attempts.length + 1 : 1,
      score: totalScore,
      answers: gradedAnswers,
      startedAt: new Date(),
      completedAt: new Date(),
      timeSpent: timeSpent || 0
    };
    
    // Update enrollment progress
    if (existingAttempt) {
      existingAttempt.attempts.push(attempt);
      existingAttempt.bestScore = Math.max(existingAttempt.bestScore, totalScore);
      existingAttempt.score = totalScore;
      existingAttempt.passed = passed;
      existingAttempt.completedAt = new Date();
    } else {
      enrollment.progress.completedAssessments.push({
        assessment: req.params.id,
        score: totalScore,
        maxScore,
        attempts: [attempt],
        bestScore: totalScore,
        passed,
        completedAt: new Date()
      });
    }
    
    // Update last activity and recalculate progress
    enrollment.progress.lastActivity = new Date();
    enrollment.calculateProgress();
    
    await enrollment.save();
    
    res.json({
      message: 'Assessment submitted successfully',
      score: totalScore,
      maxScore,
      percentage,
      passed,
      attempt: attempt.attemptNumber
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
