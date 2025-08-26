const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
const contentDir = path.join(uploadsDir, 'content');

console.log('Checking uploads directory...');

if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✓ Uploads directory created');
} else {
  console.log('✓ Uploads directory exists');
}

if (!fs.existsSync(contentDir)) {
  console.log('Creating content uploads directory...');
  fs.mkdirSync(contentDir, { recursive: true });
  console.log('✓ Content uploads directory created');
} else {
  console.log('✓ Content uploads directory exists');
}

console.log('Uploads directory structure:');
console.log(`  ${uploadsDir}`);
console.log(`  ${contentDir}`);

// List any existing files
if (fs.existsSync(contentDir)) {
  const files = fs.readdirSync(contentDir);
  if (files.length > 0) {
    console.log('\nExisting uploaded files:');
    files.forEach(file => {
      const filePath = path.join(contentDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    });
  } else {
    console.log('\nNo files uploaded yet.');
  }
}

console.log('\n✓ Uploads directory setup complete!');
