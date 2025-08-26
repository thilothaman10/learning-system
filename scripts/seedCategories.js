const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const initialCategories = [
  {
    name: 'Programming & Development',
    description: 'Software development, coding, and programming languages',
    icon: '💻',
    color: '#3B82F6'
  },
  {
    name: 'Design & Creative',
    description: 'Graphic design, UI/UX, and creative arts',
    icon: '🎨',
    color: '#10B981'
  },
  {
    name: 'Business & Marketing',
    description: 'Business strategy, marketing, and entrepreneurship',
    icon: '📊',
    color: '#F59E0B'
  },
  {
    name: 'Data Science & Analytics',
    description: 'Data analysis, machine learning, and statistics',
    icon: '📈',
    color: '#8B5CF6'
  },
  {
    name: 'Language Learning',
    description: 'Foreign languages and communication skills',
    icon: '🌍',
    color: '#EF4444'
  },
  {
    name: 'Personal Development',
    description: 'Self-improvement and life skills',
    icon: '🚀',
    color: '#06B6D4'
  },
  {
    name: 'Health & Fitness',
    description: 'Physical health, nutrition, and wellness',
    icon: '💪',
    color: '#84CC16'
  },
  {
    name: 'Music & Arts',
    description: 'Musical instruments, visual arts, and creative expression',
    icon: '🎵',
    color: '#EC4899'
  },
  {
    name: 'Technology & IT',
    description: 'Information technology and digital skills',
    icon: '🔧',
    color: '#6366F1'
  },
  {
    name: 'Finance & Accounting',
    description: 'Financial management and accounting principles',
    icon: '💰',
    color: '#059669'
  },
  {
    name: 'Education & Teaching',
    description: 'Teaching methods and educational content',
    icon: '📚',
    color: '#DC2626'
  },
  {
    name: 'Science & Engineering',
    description: 'Scientific research and engineering principles',
    icon: '🔬',
    color: '#7C3AED'
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Create a default admin user ID (you'll need to replace this with a real user ID)
    const defaultUserId = '000000000000000000000001'; // This should be replaced with actual admin user ID

    // Insert initial categories
    const categories = initialCategories.map(cat => ({
      ...cat,
      createdBy: defaultUserId
    }));

    // Use individual saves to trigger pre-save hooks
    const createdCategories = [];
    for (const catData of categories) {
      const category = new Category(catData);
      await category.save();
      createdCategories.push(category);
    }

    console.log(`Created ${createdCategories.length} categories`);

    // Display created categories
    createdCategories.forEach(cat => {
      console.log(`- ${cat.name}: ${cat.description}`);
    });

    console.log('Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
