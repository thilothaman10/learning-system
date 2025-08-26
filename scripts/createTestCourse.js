const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
require('dotenv').config();

async function createTestCourse() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find an admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Creating one...');
      const newAdmin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin'
      });
      await newAdmin.save();
      console.log('Admin user created:', newAdmin.email);
    } else {
      console.log('Admin user found:', adminUser.email);
    }

    // Create a test course
    const testCourse = new Course({
      title: 'Test Course for Enrollment',
      description: 'This is a test course to verify enrollment functionality',
      shortDescription: 'Test course for enrollment testing',
      instructor: adminUser._id,
      category: 'test',
      level: 'beginner',
      duration: 60,
      price: 0,
      isPublished: true,
      isFree: true,
      requirements: ['Basic computer skills'],
      learningOutcomes: ['Understand enrollment process'],
      tags: ['test', 'enrollment', 'demo']
    });

    await testCourse.save();
    console.log('Test course created successfully:', {
      id: testCourse._id,
      title: testCourse.title,
      isPublished: testCourse.isPublished,
      instructor: testCourse.instructor
    });

    console.log('Test setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test course:', error);
    process.exit(1);
  }
}

createTestCourse();
