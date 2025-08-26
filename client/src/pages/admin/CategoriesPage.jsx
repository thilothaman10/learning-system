import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal, Dropdown } from '../../components/ui';
import { useCategories } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { getAllCategories, createCategory, updateCategory, deleteCategory, loading } = useCategories();
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📚',
    color: '#3B82F6',
    parentCategory: ''
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getAllCategories();
      console.log('Fetched categories:', categoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleCreateCategory = async () => {
    try {
      console.log('Creating category with data:', formData);
      console.log('Parent category value:', formData.parentCategory);
      console.log('Available parent categories:', getAvailableParentCategories());
      
      await createCategory(formData);
      toast.success('Category created successfully!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', icon: '📚', color: '#3B82F6', parentCategory: '' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      await updateCategory(selectedCategory._id, formData);
      toast.success('Category updated successfully!');
      setShowEditModal(false);
      setSelectedCategory(null);
      setFormData({ name: '', description: '', icon: '📚', color: '#3B82F6', parentCategory: '' });
      fetchCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      await deleteCategory(selectedCategory._id);
      toast.success('Category deleted successfully!');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon || '📚',
      color: category.color || '#3B82F6',
      parentCategory: category.parentCategory?._id || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '📚', color: '#3B82F6', parentCategory: '' });
    setSelectedCategory(null);
  };

  // Get available parent categories (exclude current category when editing)
  const getAvailableParentCategories = () => {
    console.log('All categories:', categories);
    console.log('Selected category:', selectedCategory);
    
    if (selectedCategory) {
      return categories.filter(cat => cat._id !== selectedCategory._id);
    }
    return categories;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
                <p className="text-gray-600 mt-1">Organize and manage course categories</p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category._id} className="hover:shadow-lg transition-shadow duration-300">
              <Card.Content className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{category.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {category.description}
                    </p>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="secondary" size="sm">
                        {category.courseCount || 0} courses
                      </Badge>
                      {category.parentCategory && (
                        <Badge variant="outline" size="sm">
                          Subcategory
                        </Badge>
                      )}
                      {category.subCategories && category.subCategories.length > 0 && (
                        <Badge variant="outline" size="sm">
                          {category.subCategories.length} subcategories
                        </Badge>
                      )}
                    </div>
                    {category.parentCategory && (
                      <p className="text-xs text-gray-500">
                        Parent: {category.parentCategory.name}
                      </p>
                    )}
                  </div>
                  <Dropdown
                    trigger={
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <Dropdown.Item onClick={() => openEditModal(category)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={() => openDeleteModal(category)}
                      className="text-error-600 hover:text-error-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Dropdown.Item>
                  </Dropdown>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first category'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Category"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category Name *"
              placeholder="Enter category name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              label="Icon"
              placeholder="📚"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            />
          </div>
          
          <Input
            label="Description *"
            as="textarea"
            placeholder="Enter category description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
            <Input
              label="Parent Category"
              as="select"
              value={formData.parentCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, parentCategory: e.target.value }))}
            >
              <option value="">No parent category</option>
              {getAvailableParentCategories().map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </Input>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCategory}
              disabled={!formData.name.trim() || !formData.description.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Category"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category Name *"
              placeholder="Enter category name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              label="Icon"
              placeholder="📚"
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            />
          </div>
          
          <Input
            label="Description *"
            as="textarea"
            placeholder="Enter category description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
            <Input
              label="Parent Category"
              as="select"
              value={formData.parentCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, parentCategory: e.target.value }))}
            >
              <option value="">No parent category</option>
              {getAvailableParentCategories().map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </Input>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateCategory}
              disabled={!formData.name.trim() || !formData.description.trim() || loading}
            >
              {loading ? 'Updating...' : 'Update Category'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Category Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete the category "{selectedCategory?.name}"? 
            This action cannot be undone.
          </p>
          {selectedCategory?.courseCount > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ This category has {selectedCategory.courseCount} course(s). 
                You cannot delete it until all courses are reassigned or removed.
              </p>
            </div>
          )}
          {selectedCategory?.subCategories && selectedCategory.subCategories.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ This category has {selectedCategory.subCategories.length} subcategory(ies). 
                You cannot delete it until all subcategories are removed.
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDeleteCategory}
              disabled={loading || (selectedCategory?.courseCount > 0) || (selectedCategory?.subCategories && selectedCategory.subCategories.length > 0)}
            >
              {loading ? 'Deleting...' : 'Delete Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
