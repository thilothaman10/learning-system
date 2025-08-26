const mongoose = require('mongoose');
const Course = require('../models/Course');
const Content = require('../models/Content');
const User = require('../models/User');
require('dotenv').config();

async function createTestContent() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find the test course
    const testCourse = await Course.findOne({ title: 'Test Course for Enrollment' });
    if (!testCourse) {
      console.log('Test course not found. Please run createTestCourse.js first.');
      process.exit(1);
    }
    console.log('Found test course:', testCourse.title);

    // Create test content items
    const testContent = [
      {
        title: 'Introduction to the Course',
        description: 'Welcome to this test course. This is the first lesson that introduces you to the course content.',
        type: 'text',
        course: testCourse._id,
        order: 1,
        duration: 5,
        isPublished: true,
        text: {
          content: 'Welcome to the Test Course! This is a sample text lesson that demonstrates how content is displayed in the learning interface. You can read through this content and mark it as complete to track your progress.',
          format: 'markdown'
        }
      },
      {
        title: 'Sample Video Lesson',
        description: 'This is a sample video lesson that shows how video content is handled.',
        type: 'video',
        course: testCourse._id,
        order: 2,
        duration: 10,
        isPublished: true,
        video: {
          url: '/uploads/content/sample-video.mp4',
          duration: 600,
          quality: 'HD'
        }
      },
      {
        title: 'Document Resource',
        description: 'A sample document that students can download and review.',
        type: 'document',
        course: testCourse._id,
        order: 3,
        duration: 15,
        isPublished: true,
        document: {
          url: '/uploads/content/sample-document.pdf',
          pages: 5,
          format: 'PDF',
          downloadable: true
        }
      },
      {
        title: 'Quiz Assessment',
        description: 'A sample quiz to test your understanding of the course material.',
        type: 'quiz',
        course: testCourse._id,
        order: 4,
        duration: 20,
        isPublished: true,
        quiz: {
          timeLimit: 20,
          passingScore: 70
        }
      }
    ];

    // Save content items
    for (const contentData of testContent) {
      const content = new Content(contentData);
      await content.save();
      console.log('Created content:', content.title);
    }

    // Update course with content references
    const contentIds = testContent.map(c => c._id);
    await Course.findByIdAndUpdate(testCourse._id, {
      $push: { content: { $each: contentIds } }
    });

    console.log('Test content created successfully!');
    console.log('Course now has', testContent.length, 'content items');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test content:', error);
    process.exit(1);
  }
}

createTestContent();

