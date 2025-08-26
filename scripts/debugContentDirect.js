const mongoose = require('mongoose');
const Content = require('../models/Content');
const Course = require('../models/Course');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/lms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const debugContentDirect = async () => {
  try {
    console.log('🔍 Direct content debugging...');
    
    const courseId = '68ad5538ab0c5deec4cead90'; // MERN Stack course
    
    // Check all content in the database
    const allContent = await Content.find({});
    console.log(`\n📚 Total content in database: ${allContent.length}`);
    
    if (allContent.length > 0) {
      console.log('   Content items:');
      allContent.forEach((content, i) => {
        console.log(`   ${i + 1}. ID: ${content._id}, Title: ${content.title}, Course: ${content.course}, Type: ${content.type}`);
      });
    }
    
    // Check content specifically for the MERN Stack course
    console.log(`\n🔍 Checking content for course ${courseId}:`);
    
    // Method 1: Direct course ID query
    const contentByCourseId = await Content.find({ course: courseId });
    console.log(`   Method 1 - Content.find({ course: '${courseId}' }): ${contentByCourseId.length} items`);
    
    // Method 2: Using ObjectId
    const contentByObjectId = await Content.find({ course: new mongoose.Types.ObjectId(courseId) });
    console.log(`   Method 2 - Content.find({ course: ObjectId('${courseId}') }): ${contentByObjectId.length} items`);
    
    // Method 3: Using string comparison
    const contentByString = await Content.find({ course: courseId.toString() });
    console.log(`   Method 3 - Content.find({ course: '${courseId}'.toString() }): ${contentByString.length} items`);
    
    // Method 4: Check if course field exists
    const contentWithCourseField = await Content.find({ course: { $exists: true } });
    console.log(`   Method 4 - Content with course field: ${contentWithCourseField.length} items`);
    
    // Method 5: Check content without course field
    const contentWithoutCourseField = await Content.find({ course: { $exists: false } });
    console.log(`   Method 5 - Content without course field: ${contentWithoutCourseField.length} items`);
    
    // Check the course document
    console.log(`\n🔍 Checking course document:`);
    const course = await Course.findById(courseId);
    if (course) {
      console.log(`   Course: ${course.title}`);
      console.log(`   Course content array: ${course.content?.length || 0} items`);
      if (course.content && course.content.length > 0) {
        console.log(`   Content IDs in course: ${course.content.map(c => c.toString())}`);
      }
    }
    
    // Check if there are any content items that might be linked incorrectly
    console.log(`\n🔍 Checking for orphaned or incorrectly linked content:`);
    const orphanedContent = await Content.find({
      $or: [
        { course: { $exists: false } },
        { course: null },
        { course: '' }
      ]
    });
    console.log(`   Orphaned content: ${orphanedContent.length} items`);
    
    // Check content with the specific titles we expect
    console.log(`\n🔍 Checking for specific content titles:`);
    const expectedTitles = ['Basic React.JS', 'Advanced React', 'Node.js'];
    for (const title of expectedTitles) {
      const content = await Content.findOne({ title: title });
      if (content) {
        console.log(`   ✅ Found "${title}": Course ID = ${content.course}, Type = ${content.type}`);
      } else {
        console.log(`   ❌ Not found: "${title}"`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
debugContentDirect();
