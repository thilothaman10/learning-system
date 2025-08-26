const express = require('express');
const { body, validationResult } = require('express-validator');
const puppeteer = require('puppeteer');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { isInstructor, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/certificates
// @desc    Get certificates for current user or course (if instructor/admin)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { courseId, studentId, status } = req.query;
    
    let query = {};
    
    if (req.user.role === 'student') {
      // Students can only see their own certificates
      query.student = req.user.id;
    } else if (req.user.role === 'instructor') {
      // Instructors can see certificates for their courses
      if (courseId) {
        const course = await Course.findById(courseId);
        if (!course || course.instructor.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized to view certificates for this course' });
        }
        query.course = courseId;
      } else {
        // Get all courses by this instructor
        const instructorCourses = await Course.find({ instructor: req.user.id }).select('_id');
        query.course = { $in: instructorCourses.map(c => c._id) };
      }
    } else if (req.user.role === 'admin') {
      // Admins can see all certificates
      if (courseId) query.course = courseId;
      if (studentId) query.student = studentId;
    }
    
    if (status) query.status = status;
    
    const certificates = await Certificate.find(query)
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor')
      .populate('enrollment', 'grade score maxScore')
      .sort('-issueDate');
    
    res.json(certificates);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/certificates/user/:userId
// @desc    Get certificates for a specific user (Admin/Instructor only)
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user is admin or instructor
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Not authorized to view other users\' certificates' });
    }
    
    // If instructor, check if they have courses with this student
    if (req.user.role === 'instructor') {
      const instructorCourses = await Course.find({ instructor: req.user.id }).select('_id');
      if (instructorCourses.length === 0) {
        return res.status(403).json({ message: 'No courses found for this instructor' });
      }
    }
    
    const certificates = await Certificate.find({ student: userId })
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor')
      .populate('enrollment', 'grade score maxScore')
      .sort('-issueDate');
    
    res.json(certificates);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/certificates/course/:courseId
// @desc    Get certificates for a specific course (Admin/Instructor only)
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if user is admin or instructor
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Not authorized to view course certificates' });
    }
    
    // If instructor, check if they own this course
    if (req.user.role === 'instructor') {
      const course = await Course.findById(courseId);
      if (!course || course.instructor.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to view certificates for this course' });
      }
    }
    
    const certificates = await Certificate.find({ course: courseId })
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor')
      .populate('enrollment', 'grade score maxScore')
      .sort('-issueDate');
    
    res.json(certificates);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/certificates/:id
// @desc    Get certificate by ID
// @access  Private (Owner/Instructor/Admin)
router.get('/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor')
      .populate('enrollment', 'grade score maxScore completionDate');
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Check access permissions
    const isOwner = certificate.student._id.toString() === req.user.id;
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               certificate.course.instructor.toString() === req.user.id;
    
    if (!isOwner && !isInstructorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(certificate);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/certificates/generate
// @desc    Generate certificate for completed course
// @access  Private (Instructor/Admin)
router.post('/generate', [
  auth,
  isInstructor,
  body('enrollmentId', 'Enrollment ID is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { enrollmentId } = req.body;
    
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('student', 'firstName lastName email')
      .populate('course', 'title instructor');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Check if user owns the course or is admin
    if (enrollment.course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to generate certificate for this course' });
    }
    
    // Check if course is completed
    if (enrollment.status !== 'completed') {
      return res.status(400).json({ message: 'Course must be completed to generate certificate' });
    }
    
    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: enrollment.student._id,
      course: enrollment.course._id
    });
    
    if (existingCertificate) {
      return res.status(400).json({ message: 'Certificate already exists for this enrollment' });
    }
    
    // Generate certificate
    const certificate = new Certificate({
      student: enrollment.student._id,
      course: enrollment.course._id,
      enrollment: enrollment._id,
      certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
      metadata: {
        grade: enrollment.grade,
        score: enrollment.progress.completedAssessments.reduce((sum, assessment) => sum + assessment.bestScore, 0),
        maxScore: enrollment.progress.completedAssessments.reduce((sum, assessment) => sum + assessment.maxScore, 0),
        completionTime: Math.ceil((enrollment.completionDate - enrollment.enrollmentDate) / (1000 * 60 * 60 * 24)),
        instructor: enrollment.course.instructor
      }
    });
    
    // Generate verification hash
    certificate.generateHash();
    
    await certificate.save();
    
    // Update enrollment with certificate reference
    enrollment.certificate = certificate._id;
    await enrollment.save();
    
    // Update user certificates array
    await User.findByIdAndUpdate(enrollment.student._id, {
      $addToSet: { certificates: certificate._id }
    });
    
    const populatedCertificate = await Certificate.findById(certificate._id)
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor')
      .populate('enrollment', 'grade score maxScore completionDate');
    
    res.json({
      message: 'Certificate generated successfully',
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        issueDate: certificate.issueDate,
        verificationUrl: certificate.verification.verificationUrl,
        metadata: certificate.metadata, // Include metadata for frontend identification
        course: certificate.course,
        student: certificate.student
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/certificates/:id
// @desc    Update certificate
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  isAdmin,
  body('status', 'Status is required').isIn(['active', 'expired', 'revoked'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { status, notes } = req.body;
    
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Update certificate
    certificate.status = status;
    if (notes) certificate.notes = notes;
    
    await certificate.save();
    
    const updatedCertificate = await Certificate.findById(req.params.id)
      .populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title thumbnail instructor')
      .populate('enrollment', 'grade score maxScore completionDate');
    
    res.json(updatedCertificate);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/certificates/:id
// @desc    Delete certificate
// @access  Private (Admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Remove from enrollment
    await Enrollment.findByIdAndUpdate(certificate.enrollment, {
      $unset: { certificate: 1 }
    });
    
    // Remove from user certificates array
    await User.findByIdAndUpdate(certificate.student, {
      $pull: { certificates: certificate._id }
    });
    
    await Certificate.findByIdAndRemove(req.params.id);
    res.json({ message: 'Certificate removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/certificates/:id/download
// @desc    Download certificate
// @access  Private (Owner/Instructor/Admin)
router.get('/:id/download', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'firstName lastName email')
      .populate('course', 'title instructor')
      .populate('enrollment', 'grade score maxScore completionDate');
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Check access permissions
    const isOwner = certificate.student._id.toString() === req.user.id;
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               certificate.course.instructor.toString() === req.user.id;
    
    if (!isOwner && !isInstructorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Record download
    certificate.recordDownload(req);
    await certificate.save();
    
    // Generate a simple HTML certificate that can be downloaded
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Certificate of Completion</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .certificate { border: 3px solid #000; padding: 40px; text-align: center; }
          .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .title { font-size: 18px; margin-bottom: 30px; }
          .content { font-size: 16px; line-height: 1.6; }
          .signature { margin-top: 40px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">Certificate of Completion</div>
          <div class="title">This is to certify that</div>
          <div class="content">
            <strong>${certificate.student.firstName} ${certificate.student.lastName}</strong><br><br>
            has successfully completed the assessment for<br><br>
            <strong>${certificate.course.title}</strong><br><br>
            with a score of <strong>${certificate.metadata.score}%</strong><br>
            Grade: <strong>${certificate.metadata.grade}</strong><br><br>
            Certificate Number: <strong>${certificate.certificateNumber}</strong><br>
            Issue Date: <strong>${new Date(certificate.issueDate).toLocaleDateString()}</strong>
          </div>
          <div class="signature">
            <hr style="width: 200px; margin: 20px auto;">
            <strong>Instructor</strong><br>
            ${certificate.course.instructor.firstName} ${certificate.course.instructor.lastName}
          </div>
          <div class="footer">
            This certificate is issued by ESG Learning Platform<br>
            Verification URL: ${certificate.verification.verificationUrl}
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Set headers for HTML download
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateNumber}.html"`);
    res.send(htmlContent);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/certificates/:id/download-pdf
// @desc    Download certificate as PDF
// @access  Private (Owner/Instructor/Admin)
router.get('/:id/download-pdf', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'firstName lastName email')
      .populate('course', 'title instructor')
      .populate('enrollment', 'grade score maxScore completionDate');
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Check access permissions
    const isOwner = certificate.student._id.toString() === req.user.id;
    const isInstructorOrAdmin = req.user.role === 'admin' || 
                               certificate.course.instructor.toString() === req.user.id;
    
    if (!isOwner && !isInstructorOrAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Record download
    certificate.recordDownload(req);
    await certificate.save();
    
    // Generate HTML content for PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Certificate of Completion</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
          }
          .certificate { 
            background: white;
            border: 8px solid #2c3e50; 
            border-radius: 15px;
            padding: 60px; 
            text-align: center; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            font-size: 36px; 
            font-weight: bold; 
            margin-bottom: 30px; 
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .title { 
            font-size: 24px; 
            margin-bottom: 40px; 
            color: #34495e;
            font-style: italic;
          }
          .content { 
            font-size: 20px; 
            line-height: 1.8; 
            margin-bottom: 40px;
            color: #2c3e50;
          }
          .student-name {
            font-size: 28px;
            font-weight: bold;
            color: #e74c3c;
            margin: 20px 0;
          }
          .course-name {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
            margin: 20px 0;
          }
          .score-info {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            display: inline-block;
          }
          .signature { 
            margin-top: 50px; 
            border-top: 2px solid #bdc3c7;
            padding-top: 20px;
          }
          .signature-line {
            width: 200px; 
            margin: 20px auto; 
            border-top: 2px solid #2c3e50;
          }
          .footer { 
            margin-top: 40px; 
            font-size: 14px; 
            color: #7f8c8d;
            border-top: 1px solid #bdc3c7;
            padding-top: 20px;
          }
          .certificate-number {
            background: #f39c12;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">Certificate of Completion</div>
          <div class="title">This is to certify that</div>
          <div class="content">
            <div class="student-name">${certificate.student.firstName} ${certificate.student.lastName}</div>
            has successfully completed the assessment for<br><br>
            <div class="course-name">${certificate.course.title}</div>
            <div class="score-info">
              Score: <strong>${certificate.metadata.score}%</strong><br>
              Grade: <strong>${certificate.metadata.grade}</strong>
            </div>
            <div class="certificate-number">
              Certificate #${certificate.certificateNumber}
            </div>
            Issue Date: <strong>${new Date(certificate.issueDate).toLocaleDateString()}</strong>
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <strong>Instructor</strong><br>
            ${certificate.course.instructor.firstName} ${certificate.course.instructor.lastName}
          </div>
          <div class="footer">
            This certificate is issued by ESG Learning Platform<br>
            Verification URL: ${certificate.verification.verificationUrl}
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Launch browser and generate PDF
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Set content and wait for rendering
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF certificate:', err);
    res.status(500).json({ message: 'Failed to generate PDF certificate' });
  }
});

// @route   GET /api/certificates/verify/:certificateNumber
// @desc    Verify certificate
// @access  Public
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    
    const certificate = await Certificate.findOne({ certificateNumber })
      .populate('student', 'firstName lastName email')
      .populate('course', 'title instructor')
      .populate('enrollment', 'grade score maxScore completionDate');
    
    if (!certificate) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Certificate not found' 
      });
    }
    
    // Check if certificate is valid
    const isValid = certificate.isValid;
    
    if (!isValid) {
      return res.json({
        valid: false,
        message: 'Certificate is not valid',
        reason: certificate.status === 'revoked' ? 'Certificate has been revoked' : 'Certificate has expired'
      });
    }
    
    // Return verification data
    res.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        student: {
          name: `${certificate.student.firstName} ${certificate.student.lastName}`,
          email: certificate.student.email
        },
        course: certificate.course.title,
        instructor: `${certificate.course.instructor.firstName} ${certificate.course.instructor.lastName}`,
        issueDate: certificate.issueDate,
        grade: certificate.metadata.grade,
        score: certificate.metadata.score,
        maxScore: certificate.metadata.maxScore,
        verificationHash: certificate.verification.hash
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/certificates/generate-assessment
// @desc    Generate certificate for passed assessment
// @access  Private (Student)
router.post('/generate-assessment', [
  auth,
  body('courseId', 'Course ID is required').not().isEmpty(),
  body('assessmentId', 'Assessment ID is required').not().isEmpty(),
  body('enrollmentId', 'Enrollment ID is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, assessmentId, enrollmentId } = req.body;

    // Verify enrollment belongs to user
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment || enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this enrollment' });
    }

    // Check if assessment was passed
    const completedAssessment = enrollment.progress.completedAssessments.find(
      a => a.assessment.toString() === assessmentId
    );

    if (!completedAssessment) {
      return res.status(400).json({ message: 'Assessment not completed' });
    }

    if (!completedAssessment.passed) {
      return res.status(400).json({ message: 'Assessment not passed. Certificates are only issued for passed assessments.' });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      student: req.user.id,
      course: courseId,
      'metadata.assessmentId': assessmentId
    });

    if (existingCertificate) {
      return res.json({ 
        message: 'Certificate already exists', 
        certificate: existingCertificate 
      });
    }

    // Get course details
    const course = await Course.findById(courseId).populate('instructor', 'firstName lastName');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Generate certificate number first
    const certificateNumber = `CERT-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}-${courseId.substr(-6)}`.toUpperCase();
    
    // Generate certificate
    const certificate = new Certificate({
      student: req.user.id,
      course: courseId,
      enrollment: enrollmentId,
      certificateNumber: certificateNumber,
      metadata: {
        grade: completedAssessment.score >= 90 ? 'A' : completedAssessment.score >= 80 ? 'B' : 'C',
        score: completedAssessment.score,
        maxScore: completedAssessment.maxScore,
        assessmentId: assessmentId,
        instructor: course.instructor._id,
        institution: 'ESG Learning Platform',
        completionTime: Math.ceil((Date.now() - new Date(completedAssessment.completedAt)) / (1000 * 60 * 60 * 24))
      },
      verification: {
        isVerifiable: true,
        verificationUrl: `${req.protocol}://${req.get('host')}/verify/${certificateNumber}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${req.protocol}://${req.get('host')}/verify/${certificateNumber}`)}`
      }
    });

    // Generate verification hash
    certificate.verification.hash = certificate.generateHash();

    await certificate.save();

    res.json({
      message: 'Certificate generated successfully',
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        issueDate: certificate.issueDate,
        verificationUrl: certificate.verification.verificationUrl
      }
    });

  } catch (err) {
    console.error('Error generating assessment certificate:', err);
    res.status(500).json({ message: 'Failed to generate certificate' });
  }
});

// @route   POST /api/certificates/:id/template
// @desc    Update certificate template
// @access  Private (Instructor/Admin)
router.post('/:id/template', [
  auth,
  body('template', 'Template data is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { template } = req.body;
    
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Check access permissions
    const course = await Course.findById(certificate.course);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update template
    certificate.template = template;
    await certificate.save();
    
    res.json({ message: 'Certificate template updated', certificate });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
