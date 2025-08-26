const mongoose = require('mongoose');
const Course = require('../models/Course');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkAndFixCategories = async () => {
  try {
    console.log('🔍 Checking course category structure...');
    
    // Get all courses
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses`);
    
    let fixedCount = 0;
    let issuesFound = 0;
    
    for (const course of courses) {
      console.log(`\n📚 Course: ${course.title}`);
      console.log(`   Current category: ${course.category} (type: ${typeof course.category})`);
      
      // Check if category is an ObjectId or needs fixing
      if (course.category && typeof course.category === 'object') {
        console.log(`   ❌ ISSUE: Category is an object, needs fixing`);
        issuesFound++;
        
        // If it's an ObjectId, we need to convert it to a string
        if (course.category._bsontype === 'ObjectID' || course.category.toString) {
          // Convert ObjectId to string representation
          const categoryString = course.category.toString();
          console.log(`   Converting ObjectId ${categoryString} to string`);
          
          // Update the course
          await Course.findByIdAndUpdate(course._id, {
            category: categoryString
          });
          
          console.log(`   ✅ Fixed: Category now "${categoryString}"`);
          fixedCount++;
        }
      } else if (course.category && typeof course.category === 'string') {
        console.log(`   ✅ OK: Category is already a string`);
      } else {
        console.log(`   ⚠️  WARNING: Category is ${course.category} (${typeof course.category})`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total courses: ${courses.length}`);
    console.log(`   Issues found: ${issuesFound}`);
    console.log(`   Fixed: ${fixedCount}`);
    
    if (issuesFound === 0) {
      console.log('🎉 All courses have proper category structure!');
    } else {
      console.log(`🔧 Fixed ${fixedCount} courses with category issues`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
checkAndFixCategories();
