import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  Clock, 
  Users, 
  BookOpen,
  Headphones,
  FileText,
  Image,
  Link as LinkIcon,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { Button, Input, Badge, Card, Dropdown } from '../components/ui';
import { useCourses, useCategories } from '../hooks/useApi';
import toast from 'react-hot-toast';

const CoursesPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  
  // Filter display states
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [showAllPrices, setShowAllPrices] = useState(false);
  
  const { getAllCourses, loading: coursesLoading } = useCourses();
  const { getAllCategories, loading: categoriesLoading } = useCategories();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Mock data - in real app, this would come from API
  const mockCourses = [
    {
      id: 1,
      title: 'React Fundamentals: From Zero to Hero',
      description: 'Master React.js fundamentals with hands-on projects and real-world examples. Perfect for beginners and intermediate developers.',
      instructor: 'Sarah Johnson',
      instructorAvatar: 'SJ',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'Technology',
      level: 'Beginner',
      duration: '12 hours',
      students: 15420,
      rating: 4.8,
      reviews: 2847,
      price: 89.99,
      originalPrice: 129.99,
      isFree: false,
      isFeatured: true,
      tags: ['React', 'JavaScript', 'Frontend', 'Web Development']
    },
    {
      id: 2,
      title: 'Advanced JavaScript: ES6+ and Modern Patterns',
      description: 'Deep dive into modern JavaScript features, async programming, and advanced design patterns used by professional developers.',
      instructor: 'Mike Chen',
      instructorAvatar: 'MC',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'Technology',
      level: 'Advanced',
      duration: '18 hours',
      students: 8920,
      rating: 4.9,
      reviews: 1563,
      price: 99.99,
      originalPrice: 149.99,
      isFree: false,
      isFeatured: true,
      tags: ['JavaScript', 'ES6', 'Async', 'Design Patterns']
    },
    {
      id: 3,
      title: 'UI/UX Design Principles for Developers',
      description: 'Learn essential design principles and create beautiful, user-friendly interfaces that enhance user experience.',
      instructor: 'Emily Rodriguez',
      instructorAvatar: 'ER',
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'Design',
      level: 'Intermediate',
      duration: '10 hours',
      students: 12340,
      rating: 4.7,
      reviews: 2189,
      price: 79.99,
      originalPrice: 119.99,
      isFree: false,
      isFeatured: false,
      tags: ['UI/UX', 'Design', 'User Experience', 'Interface']
    },
    {
      id: 4,
      title: 'Python for Data Science and Machine Learning',
      description: 'Comprehensive introduction to Python programming with focus on data analysis, visualization, and machine learning basics.',
      instructor: 'David Kim',
      instructorAvatar: 'DK',
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'Technology',
      level: 'Beginner',
      duration: '15 hours',
      students: 18760,
      rating: 4.6,
      reviews: 3241,
      price: 0,
      originalPrice: 99.99,
      isFree: true,
      isFeatured: true,
      tags: ['Python', 'Data Science', 'Machine Learning', 'Programming']
    },
    {
      id: 5,
      title: 'Digital Marketing Masterclass',
      description: 'Master digital marketing strategies including SEO, social media, content marketing, and analytics to grow your business.',
      instructor: 'Lisa Thompson',
      instructorAvatar: 'LT',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'Marketing',
      level: 'Intermediate',
      duration: '14 hours',
      students: 9870,
      rating: 4.5,
      reviews: 1756,
      price: 69.99,
      originalPrice: 109.99,
      isFree: false,
      isFeatured: false,
      tags: ['Marketing', 'SEO', 'Social Media', 'Analytics']
    },
    {
      id: 6,
      title: 'Business Strategy and Leadership',
      description: 'Develop strategic thinking and leadership skills to drive business growth and manage teams effectively.',
      instructor: 'Robert Wilson',
      instructorAvatar: 'RW',
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      category: 'Business',
      level: 'Advanced',
      duration: '16 hours',
      students: 6540,
      rating: 4.8,
      reviews: 1234,
      price: 119.99,
      originalPrice: 179.99,
      isFree: false,
      isFeatured: false,
      tags: ['Business', 'Strategy', 'Leadership', 'Management']
    }
  ];

  const levels = [
    { value: 'all', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' }
  ];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
    { value: 'under50', label: 'Under $50' },
    { value: '50to100', label: '$50 - $100' },
    { value: 'over100', label: 'Over $100' }
  ];

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await getAllCourses({
          limit: 50,
          sortBy: 'createdAt',
          order: 'desc'
        });
        
        if (response && response.courses) {
          console.log('Courses data received:', response.courses);
          console.log('First course category:', response.courses[0]?.category);
          console.log('First course category type:', typeof response.courses[0]?.category);
          console.log('First course category constructor:', response.courses[0]?.category?.constructor?.name);
          console.log('First course full object:', JSON.stringify(response.courses[0], null, 2));
          setCourses(response.courses);
          setFilteredCourses(response.courses);
        } else {
          // If no courses returned, show empty state
          setCourses([]);
          setFilteredCourses([]);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast.error('Failed to load courses. Please try again.');
        // Don't fallback to mock data - show empty state instead
        setCourses([]);
        setFilteredCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [getAllCourses]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesData = await getAllCategories();
      if (categoriesData) {
        setCategories([{ _id: 'all', name: 'All Categories' }, ...categoriesData]);
      }
    };
    fetchCategories();
  }, [getAllCategories]);

  useEffect(() => {
    filterAndSortCourses();
  }, [searchQuery, selectedCategory, selectedLevel, selectedPrice, sortBy, sortOrder, courses]);

  const filterAndSortCourses = () => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.instructor?.firstName && course.instructor?.lastName && 
         `${course.instructor.firstName} ${course.instructor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    // Price filter
    if (selectedPrice !== 'all') {
      if (selectedPrice === 'free') {
        filtered = filtered.filter(course => course.price === 0 || course.isFree);
      } else if (selectedPrice === 'paid') {
        filtered = filtered.filter(course => course.price > 0 && !course.isFree);
      }
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.currentStudents || 0) - (a.currentStudents || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    setFilteredCourses(filtered);
  };

  const CourseCard = ({ course }) => (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border border-gray-200">
      <div className="relative">
        <img
          src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}
          alt={course.title}
          className="w-full h-40 object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
          }}
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {course.isFeatured && (
            <Badge variant="warning" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2 py-1">
              Featured
            </Badge>
          )}
          {course.isFree && (
            <Badge variant="success" className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
              Free
            </Badge>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {/* Provider/Instructor */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-blue-700">
              {course.instructor?.firstName?.charAt(0) || course.instructor?.lastName?.charAt(0) || 'U'}
            </span>
          </div>
          <span className="text-xs text-gray-600">
            {course.instructor?.firstName} {course.instructor?.lastName}
          </span>
        </div>
        
        {/* Course Title */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          {course.title}
        </h3>
        
        {/* Course Description */}
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">
          {course.description}
        </p>
        
        {/* Skills Section */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {course.tags?.slice(0, 2).map((tag, index) => (
              <span key={index} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
            {course.tags?.length > 2 && (
              <span className="text-xs text-gray-500">+{course.tags.length - 2} more</span>
            )}
          </div>
        </div>
        
        {/* Course Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{course.duration ? `${course.duration}h` : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{(course.students ?? course.currentStudents ?? 0).toLocaleString()}</span>
            </div>
          </div>
          
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="font-medium">{course.rating?.average?.toFixed(1) ?? '0.0'}</span>
          </div>
        </div>
        
        {/* Price and Action */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {course.isFree ? (
              <span className="text-base font-bold text-green-600">Free</span>
            ) : (
              <>
                <span className="text-base font-bold text-gray-900">${course.price}</span>
                {course.originalPrice > course.price && (
                  <span className="text-xs text-gray-500 line-through">${course.originalPrice}</span>
                )}
              </>
            )}
          </div>
          
          <Button 
            variant="primary" 
            size="sm"
            as={Link}
            to={`/courses/${course._id || course.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm"
          >
            Enroll Now
          </Button>
        </div>
      </div>
    </Card>
  );


  if (isLoading) {
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
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {searchQuery ? `Results for "${searchQuery}"` : 'All Courses'}
            </h1>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3 py-1"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3 py-1"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Sort Dropdown */}
              <Dropdown
                trigger={
                  <Button variant="outline" size="sm" className="min-w-[140px]">
                    Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label || 'Best Match'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                }
              >
                {sortOptions.map((option) => (
                  <Dropdown.Item
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    selected={sortBy === option.value}
                  >
                    {option.label}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filter by</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
              
                             {/* Subject/Category Filter */}
               <div className="mb-6">
                 <h3 className="text-sm font-medium text-gray-900 mb-3">Subject</h3>
                 <div className="space-y-2">
                   {categories && categories.length > 0 && categories.slice(0, showAllCategories ? undefined : 3).map((category) => (
                     <label key={category._id} className="flex items-center gap-3 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={selectedCategory === category._id}
                         onChange={() => setSelectedCategory(category._id)}
                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">{category.name}</span>
                       <span className="text-xs text-gray-500 ml-auto">
                         ({courses.filter(c => c.category === category.name).length})
                       </span>
                     </label>
                   ))}
                   {categories && categories.length > 3 && (
                     <button
                       onClick={() => setShowAllCategories(!showAllCategories)}
                       className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                     >
                       {showAllCategories ? 'Show Less' : `Show ${categories.length - 3} More`}
                     </button>
                   )}
                 </div>
               </div>
              
                             {/* Level Filter */}
               <div className="mb-6">
                 <h3 className="text-sm font-medium text-gray-900 mb-3">Level</h3>
                 <div className="space-y-2">
                   {levels.slice(0, showAllLevels ? undefined : 3).map((level) => (
                     <label key={level.value} className="flex items-center gap-3 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={selectedLevel === level.value}
                         onChange={() => setSelectedLevel(level.value)}
                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">{level.label}</span>
                       <span className="text-xs text-gray-500 ml-auto">
                         ({courses.filter(c => c.level === level.value).length})
                       </span>
                     </label>
                   ))}
                   {levels.length > 3 && (
                     <button
                       onClick={() => setShowAllLevels(!showAllLevels)}
                       className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                     >
                       {showAllLevels ? 'Show Less' : `Show ${levels.length - 3} More`}
                     </button>
                   )}
                 </div>
               </div>
              
                             {/* Price Filter */}
               <div className="mb-6">
                 <h3 className="text-sm font-medium text-gray-900 mb-3">Price</h3>
                 <div className="space-y-2">
                   {[
                     { value: 'all', label: 'All Prices' },
                     { value: 'free', label: 'Free' },
                     { value: 'paid', label: 'Paid' }
                   ].slice(0, showAllPrices ? undefined : 3).map((price) => (
                     <label key={price.value} className="flex items-center gap-3 cursor-pointer">
                       <input
                         type="checkbox"
                         checked={selectedPrice === price.value}
                         onChange={() => setSelectedPrice(price.value)}
                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                       />
                       <span className="text-sm text-gray-700">{price.label}</span>
                     </label>
                   ))}
                   {priceRanges.length > 3 && (
                     <button
                       onClick={() => setShowAllPrices(!showAllPrices)}
                       className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                     >
                       {showAllPrices ? 'Show Less' : `Show ${priceRanges.length - 3} More`}
                     </button>
                   )}
                 </div>
               </div>
            </div>
          </div>
          
          {/* Right Side - Course Results */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {filteredCourses.length} of {courses.length} courses
              </p>
                             {searchQuery && (
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => {
                     setSearchQuery('');
                     setSelectedCategory('all');
                     setSelectedLevel('all');
                     setSelectedPrice('all');
                     // Reset filter display states
                     setShowAllCategories(false);
                     setShowAllLevels(false);
                     setShowAllPrices(false);
                   }}
                 >
                   Clear all filters
                 </Button>
               )}
            </div>

            {/* Courses Grid */}
            {filteredCourses.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                                 <Button
                   variant="primary"
                   onClick={() => {
                     setSearchQuery('');
                     setSelectedCategory('all');
                     setSelectedLevel('all');
                     setSelectedPrice('all');
                     // Reset filter display states
                     setShowAllCategories(false);
                     setShowAllLevels(false);
                     setShowAllPrices(false);
                   }}
                 >
                   Clear filters
                 </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
