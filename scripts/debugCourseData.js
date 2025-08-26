const mongoose = require('mongoose');
const Course = require('../models/Course');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const debugCourseData = async () => {
  try {
    console.log('🔍 Debugging course data structure...');
    
    // Get all courses with detailed logging
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses`);
    
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      console.log(`\n📚 Course ${i + 1}: ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Category: ${course.category}`);
      console.log(`   Category type: ${typeof course.category}`);
      console.log(`   Category constructor: ${course.category?.constructor?.name}`);
      console.log(`   Category _bsontype: ${course.category?._bsontype}`);
      console.log(`   Category toString: ${course.category?.toString ? 'Available' : 'Not available'}`);
      
      // Check if it's a Mongoose ObjectId
      if (course.category && course.category._bsontype === 'ObjectID') {
        console.log(`   ❌ ISSUE: Category is a MongoDB ObjectId`);
        console.log(`   ObjectId value: ${course.category.toString()}`);
      } else if (course.category && typeof course.category === 'string') {
        console.log(`   ✅ OK: Category is a string`);
      } else {
        console.log(`   ⚠️  WARNING: Category is ${course.category} (${typeof course.category})`);
      }
      
      // Log the raw document
      console.log(`   Raw document category field:`, JSON.stringify(course.toObject().category));
    }
    
    // Test the API response simulation
    console.log('\n🔍 Testing API response simulation...');
    const apiResponse = courses.map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      price: course.price,
      thumbnail: course.thumbnail,
      instructor: course.instructor,
      isPublished: course.isPublished,
      isFree: course.isFree,
      currentStudents: course.currentStudents,
      rating: course.rating,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));
    
    console.log('\n📊 API Response Structure:');
    if (apiResponse.length > 0) {
      const firstCourse = apiResponse[0];
      console.log('   First course in API response:');
      console.log('     Category:', firstCourse.category);
      console.log('     Category type:', typeof firstCourse.category);
      console.log('     Category constructor:', firstCourse.category?.constructor?.name);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
debugCourseData();
