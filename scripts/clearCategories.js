const mongoose = require('mongoose');
require('dotenv').config();

async function clearCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Drop the categories collection completely
    const db = mongoose.connection.db;
    await db.dropCollection('categories');
    console.log('Categories collection dropped successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearCategories();
