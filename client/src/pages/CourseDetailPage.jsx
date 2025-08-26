import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useApi';
import { useEnrollments } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  DollarSign, 
  Play, 
  CheckCircle,
  XCircle,
  Target,
  Bookmark,
  Share2,
  ArrowRight,
  GraduationCap,
  Video,
  FileText
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '../components/ui';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { getCourseById } = useCourses();
  const { getUserEnrollments, createEnrollment } = useEnrollments();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse();
      if (user) {
        checkEnrollmentStatus();
      }
    }
  }, [id, user]);

  const fetchCourse = async () => {
    try {
      console.log('Fetching course with ID:', id);
      const courseData = await getCourseById(id);
      console.log('Course data received:', courseData);
      setCourse(courseData);
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!user) {
      console.log('No user, skipping enrollment check');
      return;
    }
    
    try {
      const userId = user.id || user._id;
      console.log('Checking enrollment for user:', userId, 'course:', id);
      
      const enrollments = await getUserEnrollments(userId);
      console.log('User enrollments received:', enrollments);
      
      // Check if user is enrolled in this specific course
      // Handle both string and ObjectId comparisons
      const enrollment = enrollments.find(e => {
        const courseId = e.course;
        const enrollmentCourseId = typeof courseId === 'object' ? courseId._id || courseId.toString() : courseId;
        const currentCourseId = id;
        
        console.log('Comparing enrollment:', {
          enrollmentCourseId,
          currentCourseId,
          isMatch: enrollmentCourseId === currentCourseId
        });
        
        return enrollmentCourseId === currentCourseId;
      });
      
      console.log('Found enrollment for this course:', enrollment);
      setIsEnrolled(!!enrollment);
      
    } catch (error) {
      console.error('Failed to check enrollment status:', error);
      // If we can't check enrollment, assume not enrolled
      setIsEnrolled(false);
    }
  };

  // Also check enrollment status when course data changes
  useEffect(() => {
    if (course && user) {
      checkEnrollmentStatus();
    }
  }, [course, user]);

  // Debug enrollment status
  useEffect(() => {
    console.log('Enrollment status changed:', {
      isEnrolled,
      userId: user?.id || user?._id,
      courseId: id,
      hasUser: !!user
    });
  }, [isEnrolled, user, id]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (isEnrolled) {
      navigate(`/learn/${id}`);
      return;
    }

    if (course.price > 0) {
      setShowPaymentModal(true);
    } else {
      await enrollInCourse();
    }
  };

  const enrollInCourse = async () => {
    setEnrolling(true);
    try {
      const enrollmentData = { course: id };
      await createEnrollment(enrollmentData);
      setIsEnrolled(true);
      // Refresh enrollment status to ensure UI is updated
      await checkEnrollmentStatus();
      toast.success('Successfully enrolled in course!');
      navigate(`/learn/${id}`);
    } catch (error) {
      console.error('Failed to enroll:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await enrollInCourse();
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">
            The course you're looking for doesn't exist or may not be published yet.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/courses')}
            className="mr-3"
          >
            Browse Courses
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column - Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  {course.category || 'Uncategorized'}
                </Badge>
                {course.level && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    {course.level}
                  </Badge>
                )}
                {course.isFree && (
                  <Badge variant="success" className="bg-green-100 text-green-800 border-green-200">
                    Free
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {course.title}
              </h1>
              
              <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mb-6">
                {course.description}
              </p>

              {/* Course Stats Row */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{course.duration || 'N/A'} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>{course.currentStudents || 0} students enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{course.rating?.average?.toFixed(1) || 'N/A'} rating</span>
                </div>
              </div>
            </div>
            
            {/* Right Column - Course Thumbnail & Actions */}
            <div className="lg:col-span-1">
              {/* Course Thumbnail */}
              <div className="mb-6">
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-xl shadow-lg border border-gray-200"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                  }}
                />
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {enrolling ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Enrolling...
                    </>
                  ) : isEnrolled ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Continue Learning
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Enroll Now
                    </>
                  )}
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleBookmark}
                    className="flex-1 px-3 hover:bg-gray-50"
                  >
                    <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  <Button variant="outline" size="sm" className="px-3 hover:bg-gray-50">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Price Display */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {course.price > 0 ? `$${course.price}` : 'Free'}
                  </div>
                  <p className="text-gray-600 text-sm">Lifetime Access</p>
                  {course.price > 0 && (
                    <p className="text-xs text-gray-500 mt-1">30-Day Money-Back Guarantee</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Stats - Enhanced Visual Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Overview</h2>
            <p className="text-gray-600">Everything you need to know about this course</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <Clock className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Duration</p>
              <p className="text-xl font-bold text-gray-900">{course.duration || 'N/A'} min</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Students</p>
              <p className="text-xl font-bold text-gray-900">{course.currentStudents || 0}</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <Star className="w-7 h-7 text-yellow-500 fill-current" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Rating</p>
              <p className="text-xl font-bold text-gray-900">{course.rating?.average?.toFixed(1) || 'N/A'}</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="w-7 h-7 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Price</p>
              <p className="text-xl font-bold text-gray-900">
                {course.price > 0 ? `$${course.price}` : 'Free'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* What You'll Learn */}
            {course.content && course.content.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 text-primary-600 mr-2" />
                    What You'll Learn
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.content.slice(0, 6).map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{item.title || `Learning Objective ${index + 1}`}</span>
                      </div>
                    ))}
                  </div>
                  {course.content.length > 6 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button variant="outline" size="sm">
                        View All {course.content.length} Objectives
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Course Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
                    Requirements
                  </h2>
                  <div className="space-y-2">
                    {course.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Learning Outcomes */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <GraduationCap className="w-5 h-5 text-green-600 mr-2" />
                    Learning Outcomes
                  </h2>
                  <div className="space-y-2">
                    {course.learningOutcomes.map((outcome, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Instructor Info */}
            {course.instructor && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Video className="w-5 h-5 text-purple-600 mr-2" />
                    About the Instructor
                  </h2>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold">
                        {course.instructor.firstName?.[0]}{course.instructor.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {course.instructor.firstName} {course.instructor.lastName}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {course.instructor.bio || 'Experienced instructor with expertise in this field.'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Course Actions */}
            <Card>
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {course.price > 0 ? `$${course.price}` : 'Free'}
                  </div>
                  <p className="text-gray-600 text-sm">Lifetime Access</p>
                </div>
                
                <div className="space-y-3 mb-4">
                  {isEnrolled ? (
                    <Button 
                      variant="primary" 
                      onClick={() => navigate(`/learn/${id}`)}
                      className="w-full bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full"
                    >
                      {enrolling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Enroll Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 text-sm">This course includes:</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                      Full lifetime access
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                      Certificate of completion
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                      Downloadable resources
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Course Stats */}
            <Card>
              <div className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">Course Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{course.duration || 'N/A'} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Level</span>
                    <Badge variant="outline" size="sm" className="capitalize">
                      {course.level || 'Beginner'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Students</span>
                    <span className="font-medium">{course.currentStudents || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                      <span className="font-medium">{course.rating?.average?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Payment"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Complete Your Purchase
            </h3>
            <p className="text-gray-600">
              Course: <span className="font-semibold">{course.title}</span>
            </p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ${course.price}
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              variant="primary" 
              onClick={handlePaymentSuccess}
              className="w-full"
            >
              Simulate Payment Success
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentModal(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetailPage;
