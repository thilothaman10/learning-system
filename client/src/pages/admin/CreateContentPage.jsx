import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Plus, 
  Trash2,
  FileText,
  Video,
  Headphones,
  Image,
  File,
  Link
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { useCourses, useContent } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const CreateContentPage = () => {
  const navigate = useNavigate();
  const { getAllCourses, loading: coursesLoading } = useCourses();
  const { createContent, loading: contentLoading } = useContent();
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  
  const [contentData, setContentData] = useState({
    title: '',
    description: '',
    type: 'video',
    courseId: '',
    sectionId: '',
    tags: [],
    isPublished: false,
    allowDownload: false,
    duration: '',
    file: null,
    url: '',
    thumbnail: null,
    content: '', // Add missing content field for text type
    difficulty: 'beginner',
    language: 'english',
    format: 'mp4'
  });

  const [newTag, setNewTag] = useState('');

  // Dynamic dropdown options
  const difficultyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

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

  const videoFormats = [
    { value: 'mp4', label: 'MP4' },
    { value: 'avi', label: 'AVI' },
    { value: 'mov', label: 'MOV' },
    { value: 'wmv', label: 'WMV' },
    { value: 'flv', label: 'FLV' }
  ];

  const audioFormats = [
    { value: 'mp3', label: 'MP3' },
    { value: 'wav', label: 'WAV' },
    { value: 'aac', label: 'AAC' },
    { value: 'ogg', label: 'OGG' },
    { value: 'flac', label: 'FLAC' }
  ];

  const documentFormats = [
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'DOC' },
    { value: 'docx', label: 'DOCX' },
    { value: 'ppt', label: 'PPT' },
    { value: 'pptx', label: 'PPTX' },
    { value: 'xls', label: 'XLS' },
    { value: 'xlsx', label: 'XLSX' },
    { value: 'txt', label: 'TXT' }
  ];

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Pass admin=true to get all courses including unpublished ones
        const coursesData = await getAllCourses({ admin: true });
        console.log('Fetched courses in CreateContentPage:', coursesData);
        // Handle the response structure: { courses: [...], total: ..., hasMore: ... }
        if (coursesData && coursesData.courses) {
          setCourses(coursesData.courses);
        } else if (Array.isArray(coursesData)) {
          setCourses(coursesData);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast.error('Failed to load courses');
      }
    };

    fetchCourses();
  }, [getAllCourses]);

  // Generate sections based on selected course (for now, using mock data)
  useEffect(() => {
    if (contentData.courseId) {
      // In a real app, this would fetch sections from the API
      // For now, using mock sections - this should be replaced with actual API call
      const mockSections = [
        { _id: '1', title: 'Introduction' },
        { _id: '2', title: 'Getting Started' },
        { _id: '3', title: 'Advanced Concepts' },
        { _id: '4', title: 'Practice Exercises' },
        { _id: '5', title: 'Final Project' }
      ];
      setSections(mockSections);
    } else {
      setSections([]);
    }
  }, [contentData.courseId]);

  const contentTypes = [
    { value: 'video', label: 'Video', icon: Video, color: 'primary' },
    { value: 'audio', label: 'Audio', icon: Headphones, color: 'success' },
    { value: 'document', label: 'Document', icon: File, color: 'warning' },
    { value: 'text', label: 'Text', icon: FileText, color: 'info' },
    { value: 'image', label: 'Image', icon: Image, color: 'secondary' },
    { value: 'link', label: 'External Link', icon: Link, color: 'elevated' }
  ];

  const handleInputChange = (field, value) => {
    setContentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !contentData.tags.includes(newTag.trim())) {
      setContentData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setContentData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileChange = (e) => {
    console.log('File input changed:', e.target.files);
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file.name, file.size, file.type);
      setContentData(prev => ({
        ...prev,
        file: file
      }));
      toast.success(`File "${file.name}" selected successfully!`);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setContentData(prev => ({
        ...prev,
        thumbnail: file
      }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary-500', 'bg-primary-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      console.log('Dropped file:', file.name, file.size, file.type);
      setContentData(prev => ({
        ...prev,
        file: file
      }));
      toast.success(`File "${file.name}" dropped successfully!`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!contentData.title || !contentData.courseId) {
        toast.error('Please fill in all required fields');
        return;
      }

      // If file is required but not provided, show error
      if (contentData.type !== 'text' && contentData.type !== 'link' && !contentData.file) {
        toast.error('Please select a file for this content type');
        return;
      }

      // Prepare content data for API
      const contentPayload = {
        title: contentData.title,
        description: contentData.description,
        type: contentData.type,
        course: contentData.courseId,
        order: 1, // Default order, can be made dynamic later
        duration: contentData.duration ? parseInt(contentData.duration) : 0,
        tags: contentData.tags,
        isPublished: contentData.isPublished,
        isRequired: true
      };

      // Add type-specific data
      if (contentData.type === 'text') {
        contentPayload.text = {
          content: contentData.content,
          format: 'plain text'
        };
      } else if (contentData.type === 'link') {
        contentPayload.type = 'text'; // Map link to text type
        contentPayload.text = {
          content: contentData.url,
          format: 'link'
        };
      }

      // If there's a file, upload it first
      if (contentData.file) {
        console.log('Uploading file:', {
          name: contentData.file.name,
          size: contentData.file.size,
          type: contentData.file.type,
          extension: contentData.file.name.split('.').pop()
        });
        
        const formData = new FormData();
        formData.append('file', contentData.file);
        formData.append('type', contentData.type);
        formData.append('courseId', contentData.courseId);
        formData.append('title', contentData.title);
        formData.append('description', contentData.description);
        formData.append('order', '1');
        
        console.log('FormData prepared:', {
          type: contentData.type,
          courseId: contentData.courseId,
          title: contentData.title,
          description: contentData.description,
          order: '1'
        });
        
        try {
          // Use the upload endpoint with content type in query params for file validation
          const uploadUrl = `/api/content/upload?type=${contentData.type}`;
          console.log('Uploading to:', uploadUrl);
          
          const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          
          console.log('Upload response status:', response.status);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Upload error response:', errorData);
            throw new Error(errorData.message || 'File upload failed');
          }
          
          const uploadedContent = await response.json();
          console.log('Content uploaded successfully:', uploadedContent);
          
          toast.success('Content created and uploaded successfully!');
          navigate('/admin/content');
          return;
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Upload failed: ${uploadError.message}`);
          return;
        }
      }

      // Create content without file
      const createdContent = await createContent(contentPayload);
      console.log('Content created:', createdContent);
      
      toast.success('Content created successfully!');
      navigate('/admin/content');
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Failed to create content. Please try again.');
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
                <h1 className="text-3xl font-bold text-gray-900">Create New Content</h1>
                <p className="text-gray-600 mt-1">Add training content to your courses</p>
              </div>
            </div>
                         <Button
               type="submit"
               variant="primary"
               size="lg"
               disabled={contentLoading}
             >
               {contentLoading ? 'Creating Content...' : 'Create Content'}
             </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <form onSubmit={handleSubmit} className="space-y-8">
          {/* Content Type Selection */}
          <Card>
            <Card.Header>
              <Card.Title>Content Type</Card.Title>
              <Card.Subtitle>Choose the type of content you want to create</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label key={type.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="contentType"
                        value={type.value}
                        checked={contentData.type === type.value}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                        contentData.type === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-${type.color}-100`}>
                            <Icon className={`h-6 w-6 text-${type.color}-600`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{type.label}</h4>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </Card.Content>
          </Card>

          {/* Basic Information */}
          <Card>
            <Card.Header>
              <Card.Title>Basic Information</Card.Title>
              <Card.Subtitle>Essential content details</Card.Subtitle>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Input
                  label="Content Title *"
                  placeholder="Enter content title"
                  value={contentData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
                                 <Input
                   label="Course *"
                   as="select"
                   value={contentData.courseId}
                   onChange={(e) => handleInputChange('courseId', e.target.value)}
                   required
                   disabled={coursesLoading}
                 >
                   <option value="">{coursesLoading ? 'Loading courses...' : 'Select course'}</option>
                  {courses && courses.length > 0 && courses.map(course => (
                    <option key={course._id || course.id} value={course._id || course.id}>{course.title}</option>
                  ))}
                </Input>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Input
                  label="Section"
                  as="select"
                  value={contentData.sectionId}
                  onChange={(e) => handleInputChange('sectionId', e.target.value)}
                  disabled={!contentData.courseId}
                >
                  <option value="">{contentData.courseId ? 'Select section' : 'Select a course first'}</option>
                  {sections && sections.length > 0 && sections.map(section => (
                    <option key={section._id || section.id} value={section._id || section.id}>{section.title}</option>
                  ))}
                </Input>
                <Input
                  label="Duration (minutes)"
                  type="number"
                  placeholder="e.g., 45"
                  value={contentData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  min="1"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Input
                  label="Difficulty Level"
                  as="select"
                  value={contentData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                >
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </Input>

                <Input
                  label="Language"
                  as="select"
                  value={contentData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </Input>

                <Input
                  label="Format"
                  as="select"
                  value={contentData.format}
                  onChange={(e) => handleInputChange('format', e.target.value)}
                >
                  {contentData.type === 'video' && videoFormats.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                  {contentData.type === 'audio' && audioFormats.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                  {contentData.type === 'document' && documentFormats.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </Input>
              </div>

                             <Input
                 label="Description"
                 as="textarea"
                 placeholder="Detailed description of the content"
                 value={contentData.description}
                 onChange={(e) => handleInputChange('description', e.target.value)}
                 rows={4}
               />

               {/* Thumbnail Upload */}
               <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
                 <div className="flex items-center space-x-4">
                   {contentData.thumbnail ? (
                     <div className="flex items-center space-x-2">
                       <img 
                         src={URL.createObjectURL(contentData.thumbnail)} 
                         alt="Thumbnail preview" 
                         className="w-16 h-16 object-cover rounded border"
                       />
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => setContentData(prev => ({ ...prev, thumbnail: null }))}
                       >
                         <Trash2 className="h-4 w-4 mr-2" />
                         Remove
                       </Button>
                     </div>
                   ) : (
                     <label htmlFor="thumbnail-upload" className="cursor-pointer">
                       <Button variant="outline" type="button">
                         <Image className="h-4 w-4 mr-2" />
                         Choose Thumbnail
                       </Button>
                       <input
                         id="thumbnail-upload"
                         type="file"
                         accept="image/*,.jpg,.jpeg,.png,.gif,.bmp"
                         onChange={handleThumbnailChange}
                         className="hidden"
                       />
                     </label>
                   )}
                 </div>
                 <p className="text-xs text-gray-500">Recommended size: 400x300 pixels</p>
               </div>

              {contentData.type === 'link' && (
                <Input
                  label="External URL *"
                  type="url"
                  placeholder="https://example.com"
                  value={contentData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  required
                />
              )}

              {contentData.type === 'text' && (
                <Input
                  label="Content"
                  as="textarea"
                  placeholder="Enter your text content here..."
                  value={contentData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={8}
                  required
                />
              )}
            </Card.Content>
          </Card>

          {/* File Upload */}
          {contentData.type !== 'text' && contentData.type !== 'link' && (
            <Card>
              <Card.Header>
                <Card.Title>File Upload</Card.Title>
                <Card.Subtitle>Upload your content file</Card.Subtitle>
              </Card.Header>
              <Card.Content>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
                  onClick={() => !contentData.file && document.getElementById('file-upload').click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                                     {contentData.file ? (
                     <div className="space-y-3">
                       <div className="flex items-center justify-center space-x-2">
                         <File className="h-8 w-8 text-primary-600" />
                         <div className="text-left">
                           <p className="font-medium text-gray-900">{contentData.file.name}</p>
                           <p className="text-sm text-gray-600">
                             {(contentData.file.size / (1024 * 1024)).toFixed(2)} MB
                           </p>
                           <p className="text-xs text-gray-500">
                             Type: {contentData.file.type || 'Unknown'}
                           </p>
                         </div>
                       </div>
                       <div className="flex justify-center space-x-2">
                         <Button
                           type="button"
                           variant="outline"
                           onClick={() => setContentData(prev => ({ ...prev, file: null }))}
                         >
                           <Trash2 className="h-4 w-4 mr-2" />
                           Remove File
                         </Button>
                         <Button
                           type="button"
                           variant="secondary"
                           onClick={() => document.getElementById('file-upload').click()}
                         >
                           <Upload className="h-4 w-4 mr-2" />
                           Change File
                         </Button>
                       </div>
                     </div>
                   ) : (
                    <div className="space-y-3">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-700 mb-2">Click to upload or drag and drop</p>
                        <label htmlFor="file-upload" className="cursor-pointer inline-block">
                          <Button variant="primary" type="button" size="lg">
                            <Upload className="h-5 w-5 mr-2" />
                            Choose File
                          </Button>
                        </label>
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            type="button" 
                            size="sm"
                            onClick={() => {
                              console.log('Test button clicked');
                              const fileInput = document.getElementById('file-upload');
                              console.log('File input element:', fileInput);
                              if (fileInput) {
                                fileInput.click();
                              } else {
                                console.error('File input not found!');
                              }
                            }}
                          >
                            Test File Input
                          </Button>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept={
                            contentData.type === 'video' ? 'video/*,.mp4,.avi,.mov,.wmv,.flv' :
                            contentData.type === 'audio' ? 'audio/*,.mp3,.wav,.aac,.ogg,.flac' :
                            contentData.type === 'document' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' :
                            contentData.type === 'image' ? 'image/*,.jpg,.jpeg,.png,.gif,.bmp' :
                            '*/*'
                          }
                        />
                      </div>
                                             <p className="text-sm text-gray-500">
                         {contentData.type === 'video' && 'Supported formats: MP4, AVI, MOV, WMV, FLV'}
                         {contentData.type === 'audio' && 'Supported formats: MP3, WAV, AAC, OGG, FLAC'}
                         {contentData.type === 'document' && 'Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT'}
                         {contentData.type === 'image' && 'Supported formats: JPG, JPEG, PNG, GIF, BMP'}
                         {!['video', 'audio', 'document', 'image'].includes(contentData.type) && 'Supported formats: MP4, MP3, PDF, DOC, JPG, PNG'}
                       </p>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Tags */}
          <Card>
            <Card.Header>
              <Card.Title>Tags</Card.Title>
              <Card.Subtitle>Add relevant tags to help students find your content</Card.Subtitle>
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
                {contentData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {contentData.tags.map(tag => (
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

          {/* Settings */}
          <Card>
            <Card.Header>
              <Card.Title>Content Settings</Card.Title>
              <Card.Subtitle>Configure how your content will be displayed</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Publish Immediately</h4>
                    <p className="text-sm text-gray-600">Make content available to students right away</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contentData.isPublished}
                      onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Download</h4>
                    <p className="text-sm text-gray-600">Let students download this content</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contentData.allowDownload}
                      onChange={(e) => handleInputChange('allowDownload', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
            >
              Cancel
            </Button>
                         <Button
               type="submit"
               variant="primary"
               disabled={contentLoading}
             >
               <Save className="h-4 w-4 mr-2" />
               {contentLoading ? 'Creating Content...' : 'Create Content'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContentPage;
