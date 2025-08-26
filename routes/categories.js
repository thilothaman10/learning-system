const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Category = require('../models/Category');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('parentCategory', 'name _id')
      .populate('subCategories', 'name _id')
      .sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id)
      .populate('parentCategory', 'name')
      .populate('subCategories', 'name')
      .populate('createdBy', 'name email');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Failed to fetch category' });
  }
});

// Create new category (Admin only)
router.post('/', [auth, admin], [
  body('name', 'Category name is required').not().isEmpty().trim(),
  body('description', 'Category description is required').not().isEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, icon, color, parentCategory } = req.body;
    
    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    // Create new category
    const category = new Category({
      name,
      description,
      icon: icon || '📚',
      color: color || '#3B82F6',
      parentCategory: parentCategory || null,
      createdBy: req.user.id
    });

    await category.save();

    // If this is a subcategory, update parent category
    if (parentCategory) {
      await Category.findByIdAndUpdate(parentCategory, {
        $push: { subCategories: category._id }
      });
    }

    res.status(201).json({ 
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// Update category (Admin only)
router.put('/:id', [auth, admin], [
  body('name', 'Category name is required').not().isEmpty().trim(),
  body('description', 'Category description is required').not().isEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, icon, color, parentCategory, isActive } = req.body;
    
    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if name is being changed and if it conflicts with existing category
    if (name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(id, {
      name,
      description,
      icon: icon || category.icon,
      color: color || category.color,
      parentCategory: parentCategory || category.parentCategory,
      isActive: isActive !== undefined ? isActive : category.isActive
    }, { new: true });

    res.json({ 
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// Delete category (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has courses
    if (category.courseCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with existing courses. Please reassign or delete courses first.' 
      });
    }

    // Check if category has subcategories
    if (category.subCategories && category.subCategories.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories. Please delete subcategories first.' 
      });
    }

    // Remove from parent category if it's a subcategory
    if (category.parentCategory) {
      await Category.findByIdAndUpdate(category.parentCategory, {
        $pull: { subCategories: id }
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// Get categories with course count
router.get('/stats/overview', async (req, res) => {
  try {
    const categories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'category',
          as: 'courses'
        }
      },
      {
        $addFields: {
          courseCount: { $size: '$courses' },
          publishedCourseCount: {
            $size: {
              $filter: {
                input: '$courses',
                cond: { $eq: ['$$this.isPublished', true] }
              }
            }
          }
        }
      },
      { $project: { courses: 0 } },
      { $sort: { courseCount: -1 } }
    ]);

    res.json(categories);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ message: 'Failed to fetch category statistics' });
  }
});

module.exports = router;
