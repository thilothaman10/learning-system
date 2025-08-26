const mongoose = require('mongoose');
const Course = require('../models/Course');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const fixSpecificCourse = async () => {
  try {
    console.log('🔍 Fixing specific course with ObjectId category...');
    
    // Find the course with ObjectId category
    const course = await Course.findById('68ad5538ab0c5deec4cead90');
    
    if (!course) {
      console.log('❌ Course not found');
      return;
    }
    
    console.log(`📚 Found course: ${course.title}`);
    console.log(`   Current category: ${course.category} (type: ${typeof course.category})`);
    
    // Check if it's an ObjectId string (24 character hex string)
    if (course.category && /^[0-9a-fA-F]{24}$/.test(course.category)) {
      console.log(`   ❌ Category is ObjectId string: ${course.category}`);
      
      // Convert to a meaningful string (you can customize this)
      const newCategory = 'Technology'; // or whatever category makes sense
      
      // Update the course
      await Course.findByIdAndUpdate(course._id, {
        category: newCategory
      });
      
      console.log(`   ✅ Fixed: Category now "${newCategory}"`);
    } else {
      console.log(`   ✅ Category is already correct: ${course.category}`);
    }
    
    // Verify the fix
    const updatedCourse = await Course.findById(course._id);
    console.log(`\n🔍 Verification:`);
    console.log(`   Updated category: ${updatedCourse.category} (type: ${typeof updatedCourse.category})`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
fixSpecificCourse();
