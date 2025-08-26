import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen, 
  Users, 
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { Card, Badge, Button, Input, Dropdown } from '../../components/ui';
import { useCourses } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const CoursesListPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { getAllCourses, deleteCourse } = useCourses();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Pass admin=true to get all courses including unpublished
      const response = await getAllCourses({ admin: true, limit: 100 });
      
      if (response && response.courses) {
        setCourses(response.courses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await deleteCourse(courseId);
        toast.success('Course deleted successfully');
        fetchCourses();
      } catch (error) {
        toast.error('Failed to delete course');
      }
    }
  };

  const getStatusBadge = (course) => {
    if (!course.isPublished) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (course.isFree) {
      return <Badge variant="success">Free</Badge>;
    }
    return <Badge variant="primary">Paid</Badge>;
  };

  const getLevelBadge = (level) => {
    const variants = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'error'
    };
    return <Badge variant={variants[level] || 'secondary'}>{level}</Badge>;
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.instructor?.firstName && course.instructor?.lastName && 
                          `${course.instructor.firstName} ${course.instructor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && course.isPublished) ||
                         (filterStatus === 'draft' && !course.isPublished);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
              <p className="text-gray-600 mt-1">Create, edit, and manage all courses</p>
            </div>
            <Button variant="primary" as={Link} to="/admin/courses/create">
              <Plus className="h-5 w-5 mr-2" />
              Create Course
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search courses, instructors, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          
          <Dropdown
            trigger={
              <Button variant="outline" className="w-full sm:w-auto justify-between">
                {filterStatus === 'all' ? 'All Status' : 
                 filterStatus === 'published' ? 'Published Only' : 'Draft Only'}
                <Filter className="w-4 h-4 ml-2" />
              </Button>
            }
          >
            <Dropdown.Item onClick={() => setFilterStatus('all')} selected={filterStatus === 'all'}>
              All Status
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setFilterStatus('published')} selected={filterStatus === 'published'}>
              Published Only
            </Dropdown.Item>
            <Dropdown.Item onClick={() => setFilterStatus('draft')} selected={filterStatus === 'draft'}>
              Draft Only
            </Dropdown.Item>
          </Dropdown>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course._id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={course.thumbnail || '/images/default-course-thumbnail.svg'}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = '/images/default-course-thumbnail.svg';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex space-x-2">
                    {getStatusBadge(course)}
                    {getLevelBadge(course.level)}
                    <Badge variant="secondary" size="sm">
                      {course.category || 'Uncategorized'}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration ? `${course.duration} hours` : 'Duration not set'}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.currentStudents || 0} students
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                          {course.instructor?.firstName?.charAt(0) || course.instructor?.lastName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {course.instructor?.firstName} {course.instructor?.lastName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {course.isFree ? (
                        <span className="text-lg font-bold text-success-600">Free</span>
                      ) : (
                        <span className="text-lg font-bold text-gray-900">${course.price || 0}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" as={Link} to={`/courses/${course._id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" as={Link} to={`/admin/courses/${course._id}`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(course._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first course'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button variant="primary" as={Link} to="/admin/courses/create">
                <Plus className="w-5 h-5 mr-2" />
                Create Course
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default CoursesListPage;
