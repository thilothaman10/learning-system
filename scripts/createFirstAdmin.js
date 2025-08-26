const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createFirstAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create the first admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@lms.com',
      password: 'admin123', // Change this password in production
      role: 'admin'
    });

    await adminUser.save();
    console.log('First admin user created successfully!');
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createFirstAdmin();
