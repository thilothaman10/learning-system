const mongoose = require('mongoose');
require('dotenv').config();

async function checkCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if Category model exists
    try {
      const Category = require('../models/Category');
      
      // Find all categories
      const categories = await Category.find({});
      console.log(`Found ${categories.length} categories:`);
      
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. Name: ${cat.name}, Slug: ${cat.slug}, ID: ${cat._id}`);
      });
      
      // Check for categories with null slugs
      const nullSlugCategories = await Category.find({ slug: null });
      console.log(`\nCategories with null slugs: ${nullSlugCategories.length}`);
      
      if (nullSlugCategories.length > 0) {
        console.log('These categories have null slugs:');
        nullSlugCategories.forEach(cat => {
          console.log(`- ${cat.name} (ID: ${cat._id})`);
        });
      }
      
    } catch (error) {
      console.error('Error with Category model:', error.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategories();
