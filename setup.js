#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up LMS Project...\n');

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
const contentDir = path.join(uploadsDir, 'content');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
  console.log('✅ Created content uploads directory');
}

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lms

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=100000000
UPLOAD_PATH=uploads
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file');
  console.log('⚠️  Please update the JWT_SECRET in .env file before production use');
}

console.log('\n📋 Next steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Start MongoDB service');
console.log('3. Update .env file with your configuration');
console.log('4. Start backend: npm run dev');
console.log('5. In another terminal, navigate to client/ and run: npm install && npm start');
console.log('\n🎉 Setup complete!');
