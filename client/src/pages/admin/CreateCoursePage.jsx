import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  Plus, 
  Trash2,
  BookOpen,
  Users,
  Clock,
  DollarSign,
  Tag,
  FileText,
  Video,
  Headphones,
  Image
} from 'lucide-react';
import { Button, Input, Card, Badge, Modal } from '../../components/ui';
import { useCourses, useCategories } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CreateCoursePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);
  const { createCourse, loading, error } = useCourses();
  const { getAllCategories, loading: categoriesLoading } = useCategories();
  const [categories, setCategories] = useState([]);
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    level: 'beginner',
    duration: '',
    price: '',
    maxStudents: '',
    thumbnail: null,
    isPublished: true, // Changed to true for testing
    isFree: false,
    tags: [],
    requirements: [''],
    learningOutcomes: [''],
    certificateTemplate: 'default',
    language: 'english',
    targetAudience: 'students',
    format: 'self-paced'
  });

  const [contentSections, setContentSections] = useState([
    {
      id: 1,
      title: 'Introduction',
      description: 'Course introduction and overview',
      contents: []
    }
  ]);

  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, [getAllCategories]);

  const levels = [
    { value: 'beginner', label: 'Beginner', color: 'success' },
    { value: 'intermediate', label: 'Intermediate', color: 'warning' },
    { value: 'advanced', label: 'Advanced', color: 'error' }
  ];

  const certificateTemplates = [
    { value: 'default', label: 'Default Template' },
    { value: 'modern', label: 'Modern Template' },
    { value: 'classic', label: 'Classic Template' },
    { value: 'minimal', label: 'Minimal Template' }
  ];

  // Additional dynamic dropdown options
  const languages = [
    { value: 'english', label: 'English' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'chinese', label: 'Chinese' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'arabic', label: 'Arabic' },
    { value: 'hindi', label: 'Hindi' }
  ];

  const targetAudiences = [
    { value: 'students', label: 'Students' },
    { value: 'professionals', label: 'Professionals' },
    { value: 'beginners', label: 'Beginners' },
    { value: 'intermediate', label: 'Intermediate Learners' },
    { value: 'advanced', label: 'Advanced Learners' },
    { value: 'executives', label: 'Executives' },
    { value: 'entrepreneurs', label: 'Entrepreneurs' }
  ];

  const courseFormats = [
    { value: 'self-paced', label: 'Self-Paced' },
    { value: 'instructor-led', label: 'Instructor-Led' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'live-online', label: 'Live Online' },
    { value: 'blended', label: 'Blended Learning' }
  ];

  const handleInputChange = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !courseData.tags.includes(newTag.trim())) {
      setCourseData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setCourseData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      setCourseData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const handleRemoveRequirement = (index) => {
    setCourseData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleAddOutcome = () => {
    if (newOutcome.trim()) {
      setCourseData(prev => ({
        ...prev,
        learningOutcomes: [...prev.learningOutcomes, newOutcome.trim()]
      }));
      setNewOutcome('');
    }
  };

  const handleRemoveOutcome = (index) => {
    setCourseData(prev => ({
      ...prev,
      learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index)
    }));
  };

  const handleAddContentSection = () => {
    const newSection = {
      id: Date.now(),
      title: '',
      description: '',
      contents: []
    };
    setContentSections(prev => [...prev, newSection]);
  };

  const handleRemoveContentSection = (sectionId) => {
    setContentSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const handleSectionChange = (sectionId, field, value) => {
    setContentSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, [field]: value }
          : section
      )
    );
  };

  const handleThumbnailChange = (e) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event propagation
    
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Thumbnail size should be less than 5MB');
        return;
      }
      setCourseData(prev => ({
        ...prev,
        thumbnail: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare course data for API
      const coursePayload = {
        ...courseData,
        contentSections,
        instructor: user.id || user._id, // Handle both id and _id fields
        isPublished: courseData.isPublished,
        // Handle thumbnail - if it's a file, we'll need to handle it differently
        // For now, set to empty string if no thumbnail
        thumbnail: courseData.thumbnail ? courseData.thumbnail : ''
      };

      const createdCourse = await createCourse(coursePayload);
      toast.success('Course created successfully!');
      // Navigate to the created course detail page
      navigate(`/admin/courses/${createdCourse._id}`);
    } catch (error) {
      console.error('Failed to create course:', error);
      // Error is already handled by the useCourses hook
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Save as draft (not published)
      const coursePayload = {
        ...courseData,
        contentSections,
        instructor: user.id || user._id, // Handle both id and _id fields
        isPublished: false
      };

      await createCourse(coursePayload);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Error is already handled by the useCourses hook
    }
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
                <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
                <p className="text-gray-600 mt-1">Set up a new course for your students</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Course'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Basic Information */}
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Basic Information
              </Card.Title>
              <Card.Subtitle>Essential course details</Card.Subtitle>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Input
                  label="Course Title *"
                  placeholder="Enter course title"
                  value={courseData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
                <Input
                  label="Category *"
                  as="select"
                  value={courseData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required
                  disabled={categoriesLoading}
                >
                  <option value="">{categoriesLoading ? 'Loading categories...' : 'Select category'}</option>
                  {categories && categories.length > 0 && categories.map((category) => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </Input>
              </div>

              <Input
                label="Short Description *"
                placeholder="Brief description (max 200 characters)"
                value={courseData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                maxLength={200}
                required
              />

              <Input
                label="Full Description *"
                as="textarea"
                rows={6}
                placeholder="Detailed course description"
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Duration (hours) *"
                  type="number"
                  placeholder="e.g., 20"
                  value={courseData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  min="1"
                  required
                />
                <Input
                  label="Maximum Students"
                  type="number"
                  placeholder="e.g., 100"
                  value={courseData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                  min="1"
                />
                <Input
                  label="Price ($)"
                  type="number"
                  placeholder="e.g., 99.99"
                  value={courseData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={courseData.isFree}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Language *"
                  as="select"
                  value={courseData.language || 'english'}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  required
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </Input>

                <Input
                  label="Target Audience"
                  as="select"
                  value={courseData.targetAudience || 'students'}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                >
                  {targetAudiences.map(audience => (
                    <option key={audience.value} value={audience.value}>
                      {audience.label}
                    </option>
                  ))}
                </Input>

                <Input
                  label="Course Format"
                  as="select"
                  value={courseData.format || 'self-paced'}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                >
                  {courseFormats.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </Input>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level *
                  </label>
                  <div className="flex space-x-3">
                    {levels.map(level => (
                      <label key={level.value} className="flex items-center">
                        <input
                          type="radio"
                          name="level"
                          value={level.value}
                          checked={courseData.level === level.value}
                          onChange={(e) => handleInputChange('level', e.target.value)}
                          className="sr-only"
                        />
                        <Badge
                          variant={courseData.level === level.value ? level.color : 'secondary'}
                          className="cursor-pointer px-4 py-2"
                        >
                          {level.label}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={courseData.isFree}
                      onChange={(e) => handleInputChange('isFree', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">This course is free</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={courseData.isPublished}
                      onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Publish immediately</span>
                  </label>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Tags */}
          <Card>
            <Card.Header>
              <Card.Title>Tags</Card.Title>
              <Card.Subtitle>Add relevant tags to help students find your course</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <Input
                    placeholder="Add a tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                {courseData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {courseData.tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="primary"
                        className="flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Requirements & Outcomes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <Card.Header>
                <Card.Title>Prerequisites</Card.Title>
                <Card.Subtitle>What students should know before starting</Card.Subtitle>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {courseData.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Add a requirement"
                        value={requirement}
                        onChange={(e) => {
                          const newRequirements = [...courseData.requirements];
                          newRequirements[index] = e.target.value;
                          setCourseData(prev => ({ ...prev, requirements: newRequirements }));
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemoveRequirement(index)}
                        className="text-error-600 hover:text-error-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddRequirement}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Requirement
                  </Button>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Learning Outcomes</Card.Title>
                <Card.Subtitle>What students will learn from this course</Card.Subtitle>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {courseData.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Add a learning outcome"
                        value={outcome}
                        onChange={(e) => {
                          const newOutcomes = [...courseData.learningOutcomes];
                          newOutcomes[index] = e.target.value;
                          setCourseData(prev => ({ ...prev, learningOutcomes: newOutcomes }));
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemoveOutcome(index)}
                        className="text-error-600 hover:text-error-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOutcome}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Learning Outcome
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Content Structure */}
          <Card>
            <Card.Header>
              <Card.Title>Course Content Structure</Card.Title>
              <Card.Subtitle>Organize your course into logical sections</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                {contentSections.map((section, sectionIndex) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Section {sectionIndex + 1}
                      </h4>
                      {contentSections.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemoveContentSection(section.id)}
                          className="text-error-600 hover:text-error-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Section Title"
                        placeholder="e.g., Introduction to React"
                        value={section.title}
                        onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                      />
                      <Input
                        label="Section Description"
                        placeholder="Brief description of this section"
                        value={section.description}
                        onChange={(e) => handleSectionChange(section.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Content will be added here when you create the course
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddContentSection}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content Section
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* Thumbnail & Certificate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <Card.Header>
                <Card.Title>Course Thumbnail</Card.Title>
                <Card.Subtitle>Upload an attractive image for your course</Card.Subtitle>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {courseData.thumbnail ? (
                      <div className="space-y-3">
                        <img
                          src={URL.createObjectURL(courseData.thumbnail)}
                          alt="Course thumbnail"
                          className="w-full h-32 object-cover rounded-lg mx-auto"
                        />
                        <p className="text-sm text-gray-600">{courseData.thumbnail.name}</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCourseData(prev => ({ ...prev, thumbnail: null }))}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Image className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <Button 
                            type="button" 
                            variant="primary"
                            onClick={() => document.getElementById('thumbnail-upload').click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Thumbnail
                          </Button>
                          <input
                            id="thumbnail-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.preventDefault()}
                            className="hidden"
                          />
                        </div>
                        <p className="text-sm text-gray-500">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Certificate Template</Card.Title>
                <Card.Subtitle>Choose how completion certificates will look</Card.Subtitle>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <Input
                    label="Template Style"
                    as="select"
                    value={courseData.certificateTemplate}
                    onChange={(e) => handleInputChange('certificateTemplate', e.target.value)}
                  >
                    {certificateTemplates.map(template => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </Input>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Students will receive a certificate upon course completion
                    </p>
                  </div>
                </div>
              </Card.Content>
            </Card>
                     </div>

           {/* Bottom Action Buttons */}
           <div className="flex items-center justify-center space-x-4 pt-8 border-t border-gray-200">
             <Button
               type="button"
               variant="outline"
               onClick={handleSaveDraft}
               disabled={loading}
               size="lg"
             >
               <Save className="h-5 w-5 mr-2" />
               Save as Draft
             </Button>
             <Button
               type="submit"
               variant="primary"
               loading={loading}
               size="lg"
             >
               <Save className="h-5 w-5 mr-2" />
               {loading ? 'Creating Course...' : 'Create Course'}
             </Button>
           </div>
         </form>
       </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Course Preview"
        size="xl"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">{courseData.title || 'Course Title'}</h3>
            <p className="text-gray-600 mt-2">{courseData.shortDescription || 'Course description will appear here'}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <Clock className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-semibold">{courseData.duration || '0'} hours</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Max Students</p>
              <p className="font-semibold">{courseData.maxStudents || 'Unlimited'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Price</p>
              <p className="font-semibold">{courseData.isFree ? 'Free' : `$${courseData.price || '0'}`}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Course Content</h4>
            {contentSections.map((section, index) => (
              <div key={section.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{section.title || `Section ${index + 1}`}</p>
                <p className="text-sm text-gray-600">{section.description || 'No description'}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateCoursePage;
