import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useApi';
import { useEnrollments } from '../hooks/useApi';
import { useContent } from '../hooks/useApi';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Play, 
  CheckCircle, 
  Calendar,
  Target,
  BarChart3,
  Star,
  ArrowRight,
  Clock3,
  Users,
  FileText,
  Video,
  Headphones
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const DashboardPage = () => {
  const { user } = useAuth();
  const { getUserEnrollments, checkAssessmentStatus } = useEnrollments();
  const { getAllCourses } = useCourses();
  const { getAllContent } = useContent();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalCourses: 0,
      completedCourses: 0,
      totalHours: 0,
      certificates: 0,
      currentStreak: 0,
      totalPoints: 0
    },
    recentCourses: [],
    upcomingDeadlines: [],
    achievements: []
  });
  const [assessmentStatuses, setAssessmentStatuses] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const checkAssessmentStatuses = async (enrollments, courses) => {
    const statuses = {};
    
    for (const enrollment of enrollments) {
      if (enrollment.course && enrollment.course.assessments && enrollment.course.assessments.length > 0) {
        try {
          const assessment = enrollment.course.assessments[0]; // Assuming single assessment per course
          const status = await checkAssessmentStatus(enrollment._id, assessment._id);
          statuses[enrollment.course._id || enrollment.course] = status;
        } catch (error) {
          console.error('Failed to check assessment status for course:', enrollment.course._id, error);
        }
      }
    }
    
    setAssessmentStatuses(statuses);
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Fetch user enrollments
      let enrollments = [];
      try {
        enrollments = await getUserEnrollments(user._id || user.id);
      } catch (enrollmentError) {
        console.error('Failed to fetch enrollments:', enrollmentError);
        enrollments = []; // Set empty array as fallback
      }
      
      // Fetch all courses
      let courses = [];
      try {
        const coursesResponse = await getAllCourses();
        
        // Handle different response formats
        if (Array.isArray(coursesResponse)) {
          courses = coursesResponse;
        } else if (coursesResponse && Array.isArray(coursesResponse.courses)) {
          courses = coursesResponse.courses;
        } else if (coursesResponse && coursesResponse.data && Array.isArray(coursesResponse.data)) {
          courses = coursesResponse.data;
        } else {
          console.warn('Unexpected courses response format:', coursesResponse);
          courses = [];
        }
      } catch (coursesError) {
        console.error('Failed to fetch courses:', coursesError);
        courses = []; // Set empty array as fallback
      }
      
      // Calculate stats and prepare recent courses
      try {
        const stats = calculateStats(enrollments, courses);
        const recentCourses = prepareRecentCourses(enrollments, courses);
                 const upcomingDeadlines = prepareUpcomingDeadlines(enrollments, courses);
        const achievements = prepareAchievements(enrollments, stats);
        
        setDashboardData({
          stats,
          recentCourses,
          upcomingDeadlines,
          achievements
        });
        
        // Check assessment statuses after data is prepared
        await checkAssessmentStatuses(enrollments, courses);
      } catch (calculationError) {
        console.error('Error calculating dashboard data:', calculationError);
        // Set default data on calculation error
        setDashboardData({
          stats: {
            totalCourses: enrollments.length || 0,
            completedCourses: 0,
            totalHours: 0,
            certificates: 0,
            currentStreak: 0,
            totalPoints: 0
          },
          recentCourses: [],
          upcomingDeadlines: [],
          achievements: []
        });
      }
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to load dashboard data. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to view your dashboard.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      // Set default data on error
      setDashboardData({
        stats: {
          totalCourses: 0,
          completedCourses: 0,
          totalHours: 0,
          certificates: 0,
          currentStreak: 0,
          totalPoints: 0
        },
        recentCourses: [],
        upcomingDeadlines: [],
        achievements: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (enrollments, courses) => {
    // Safety check for enrollments array
    if (!Array.isArray(enrollments)) {
      console.warn('calculateStats: enrollments is not an array:', enrollments);
      enrollments = [];
    }
    
    const totalCourses = enrollments.length;
    
    // Calculate content completion vs overall progress
    let contentCompletedCourses = 0;
    let overallCompletedCourses = 0;
    let totalContentProgress = 0;
    let totalOverallProgress = 0;
    
         enrollments.forEach(enrollment => {
       if (enrollment && enrollment.progress) {
         // Count courses with 100% overall progress (content + assessments)
         if (enrollment.progress.overallProgress >= 100) {
           overallCompletedCourses++;
         }
         
         // Find the course to get actual content count
         const course = courses.find(c => c && c._id && (c._id === enrollment.course || c._id === enrollment.course._id));
         if (course && course.content && Array.isArray(course.content)) {
           const totalContentItems = course.content.length;
           const completedContentItems = enrollment.progress.completedContent ? enrollment.progress.completedContent.length : 0;
           
           // Calculate content-only progress based on actual content count
           const contentProgress = totalContentItems > 0 ? 
             Math.min(100, (completedContentItems / totalContentItems) * 100) : 0;
           
           if (contentProgress >= 80) {
             contentCompletedCourses++;
           }
           
           totalContentProgress += contentProgress;
         } else {
           // Fallback: use completed content count if course data not available
           const contentProgress = enrollment.progress.completedContent ? 
             Math.min(100, (enrollment.progress.completedContent.length / 10) * 100) : 0;
           totalContentProgress += contentProgress;
         }
         
         totalOverallProgress += enrollment.progress.overallProgress || 0;
       }
     });
    
    // Calculate total hours from completed content
    let totalHours = 0;
    enrollments.forEach(enrollment => {
      if (enrollment && enrollment.progress && enrollment.progress.completedContent) {
        totalHours += enrollment.progress.completedContent.length * 0.5; // Assume 30 min per content item
      }
    });
    
    // Calculate certificates (completed courses with assessment)
    const certificates = enrollments.filter(e => 
      e && e.progress && e.progress.overallProgress >= 100 && 
      e.progress.completedAssessments && e.progress.completedAssessments.length > 0
    ).length;
    
    // Calculate current streak (simplified - could be enhanced with actual login tracking)
    const currentStreak = Math.min(7, Math.floor(totalHours / 2)); // Simplified calculation
    
    return {
      totalCourses,
      contentCompletedCourses,
      overallCompletedCourses,
      totalContentProgress: Math.round(totalContentProgress),
      totalOverallProgress: Math.round(totalOverallProgress),
      totalHours: Math.round(totalHours),
      certificates,
      currentStreak
    };
  };

  const prepareRecentCourses = (enrollments, courses) => {
    // Safety check for courses array
    if (!Array.isArray(courses)) {
      console.warn('prepareRecentCourses: courses is not an array:', courses);
      return [];
    }
    
                   return enrollments
        .filter(e => {
          if (!e.progress?.completedContent) return false;
          
          // Find the course to get actual content count
          const course = courses.find(c => c && c._id && (c._id === e.course || c._id === e.course._id));
          let contentProgress = 0;
          
          if (course && course.content && Array.isArray(course.content)) {
            const totalContentItems = course.content.length;
            const completedContentItems = e.progress.completedContent.length;
            contentProgress = totalContentItems > 0 ? 
              Math.min(100, (completedContentItems / totalContentItems) * 100) : 0;
          } else {
            // Fallback: use completed content count if course data not available
            contentProgress = Math.min(100, (e.progress.completedContent.length / 10) * 100);
          }
          
          // Show courses that have started but not completed (progress > 0)
          return contentProgress > 0;
        })
       .slice(0, 3)
      .map(enrollment => {
        const course = courses.find(c => c && c._id && (c._id === enrollment.course || c._id === enrollment.course._id));
        if (!course) {
          console.warn('Course not found for enrollment:', enrollment);
          return null;
        }
        
                 const progress = enrollment.progress?.overallProgress || 0;
         const lastAccessed = enrollment.progress?.lastActivity || enrollment.enrolledAt;
         
         // Calculate content progress based on actual course content count
         let contentProgress = 0;
         if (course.content && Array.isArray(course.content)) {
           const totalContentItems = course.content.length;
           const completedContentItems = enrollment.progress?.completedContent ? enrollment.progress.completedContent.length : 0;
           contentProgress = totalContentItems > 0 ? 
             Math.min(100, Math.round((completedContentItems / totalContentItems) * 100)) : 0;
         } else {
           // Fallback: use completed content count if course data not available
           contentProgress = enrollment.progress?.completedContent ? 
             Math.min(100, Math.round((enrollment.progress.completedContent.length / 10) * 100)) : 0;
         }
         
         // Determine next lesson based on content progress
         let nextLesson = 'Getting Started';
         if (contentProgress > 25) nextLesson = 'Core Concepts';
         if (contentProgress > 50) nextLesson = 'Advanced Topics';
         if (contentProgress > 75) nextLesson = 'Final Assessment';
         
         return {
           id: course._id,
           title: course.title || 'Untitled Course',
           instructor: course.instructor?.firstName ? 
             `${course.instructor.firstName} ${course.instructor.lastName}` : 
             'Instructor',
           progress: Math.round(progress),
           contentProgress: contentProgress,
           thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
           lastAccessed: formatTimeAgo(lastAccessed),
           nextLesson
         };
      })
      .filter(Boolean);
  };

     const prepareUpcomingDeadlines = (enrollments, courses) => {
    // Safety check for enrollments array
    if (!Array.isArray(enrollments)) {
      console.warn('prepareUpcomingDeadlines: enrollments is not an array:', enrollments);
      return [];
    }
    
    const deadlines = [];
    
                   enrollments.forEach(enrollment => {
        if (enrollment && enrollment.progress && enrollment.progress.completedContent) {
          // Find the course to get actual content count
          const course = courses.find(c => c && c._id && (c._id === enrollment.course || c._id === enrollment.course._id));
          let contentProgress = 0;
          
          if (course && course.content && Array.isArray(course.content)) {
            const totalContentItems = course.content.length;
            const completedContentItems = enrollment.progress.completedContent.length;
            contentProgress = totalContentItems > 0 ? 
              Math.min(100, (completedContentItems / totalContentItems) * 100) : 0;
          } else {
            // Fallback: use completed content count if course data not available
            contentProgress = Math.min(100, (enrollment.progress.completedContent.length / 10) * 100);
          }
          
          if (contentProgress >= 80) {
            // Add assessment deadline for courses ready for assessment
            deadlines.push({
              id: `assessment-${enrollment._id}`,
              title: 'Course Assessment Available',
              course: enrollment.course?.title || 'Course',
              dueDate: new Date(Date.now() + 7 * 60 * 60 * 1000), // 7 days from now
              type: 'assessment'
            });
          }
        }
      });
    
    return deadlines.slice(0, 3);
  };

  const prepareAchievements = (enrollments, stats) => {
    // Safety check for enrollments array
    if (!Array.isArray(enrollments)) {
      console.warn('prepareAchievements: enrollments is not an array:', enrollments);
      return [];
    }
    
    const achievements = [];
    
    // First course completed
    if (stats && stats.completedCourses >= 1) {
      achievements.push({
        id: 'first-course',
        title: 'First Course Completed',
        description: 'Completed your first course on LearnHub',
        icon: '🎉',
        earnedDate: new Date().toISOString().split('T')[0]
      });
    }
    
    // Learning streak
    if (stats && stats.currentStreak >= 7) {
      achievements.push({
        id: 'streak-7',
        title: '7-Day Streak',
        description: 'Maintained a 7-day learning streak',
        icon: '🔥',
        earnedDate: new Date().toISOString().split('T')[0]
      });
    }
    
    // Perfect score
    const hasPerfectScore = enrollments.some(e => 
      e && e.progress && e.progress.completedAssessments && 
      e.progress.completedAssessments.some(a => a && a.score === 100)
    );
    if (hasPerfectScore) {
      achievements.push({
        id: 'perfect-score',
        title: 'Perfect Score',
        description: 'Achieved 100% on a course assessment',
        icon: '⭐',
        earnedDate: new Date().toISOString().split('T')[0]
      });
    }
    
    return achievements;
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Recently';
    
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    return 'A while ago';
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Headphones className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const getDeadlineTypeIcon = (type) => {
    switch (type) {
      case 'quiz':
        return <BarChart3 className="w-4 h-4" />;
      case 'assignment':
        return <FileText className="w-4 h-4" />;
      case 'assessment':
        return <Award className="w-4 h-4" />;
      default:
        return <Clock3 className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Welcome back, {user?.firstName || 'Learner'}!
                </h1>
                <div className="text-4xl animate-bounce">👋</div>
              </div>
              <p className="text-lg text-gray-600 mb-4">
                Continue your learning journey and track your progress
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-sm text-blue-800 font-medium">
                  <strong>Note:</strong> Content completion shows when you finish all course materials. 
                  Overall progress includes assessments (70% content + 30% assessments).
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Button 
                variant="primary" 
                as={Link} 
                to="/courses"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Browse Courses
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
                 {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                <BookOpen className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalCourses}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Content Completed</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.contentCompletedCourses}</p>
                <p className="text-xs text-gray-500">of {dashboardData.stats.totalCourses} courses</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Hours Learned</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalHours}h</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                <TrendingUp className="w-7 h-7 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.stats.totalCourses > 0 ? 
                    Math.round(dashboardData.stats.totalOverallProgress / dashboardData.stats.totalCourses) : 0
                  }%
                </p>
                <p className="text-xs text-gray-500">Content + Assessments</p>
              </div>
            </div>
          </Card>
           
          <Card className="p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-4 shadow-sm">
                <Award className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Certificates</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.certificates}</p>
                <p className="text-xs text-gray-500">Earned</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Courses */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <Card.Header className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Play className="w-4 h-4 text-blue-600" />
                    </div>
                    <Card.Title className="text-lg font-semibold text-gray-900">Continue Learning</Card.Title>
                  </div>
                  <Button variant="ghost" size="sm" as={Link} to="/courses" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-100">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                          <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2"></div>
                        </div>
                        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : dashboardData.recentCourses.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentCourses.map((course) => (
                      <div key={course.id} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-100 hover:border-primary-200 transition-colors duration-200">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {course.title}
                          </h3>
                          <p className="text-xs text-gray-500">by {course.instructor}</p>
                                                     <div className="mt-2">
                             <div className="space-y-2">
                               {/* Overall Progress */}
                               <div>
                                 <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                   <span>Overall Progress</span>
                                   <span>{course.progress}%</span>
                                 </div>
                                 <div className="w-full bg-gray-200 rounded-full h-2">
                                   <div
                                     className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                     style={{ width: `${course.progress}%` }}
                                   ></div>
                                 </div>
                               </div>
                               
                               {/* Content Progress */}
                               <div>
                                 <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                   <span>Content</span>
                                   <span>{course.contentProgress}%</span>
                                 </div>
                                 <div className="w-full bg-gray-200 rounded-full h-2">
                                   <div
                                     className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                     style={{ width: `${course.contentProgress}%` }}
                                   ></div>
                                 </div>
                               </div>
                             </div>
                           </div>
                           <p className="text-xs text-gray-500 mt-1">
                             Next: {course.nextLesson}
                           </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{course.lastAccessed}</p>
                          <div className="space-y-2">
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="w-full"
                              as={Link}
                              to={`/learn/${course.id}`}
                            >
                              Continue
                              <Play className="w-4 h-4 ml-1" />
                            </Button>
                                                         {course.contentProgress >= 80 && (
                               <div>
                                 {assessmentStatuses[course.id] && !assessmentStatuses[course.id].canTake ? (
                                   <Button 
                                     variant="outline" 
                                     size="sm" 
                                     className="w-full cursor-not-allowed"
                                     disabled
                                   >
                                     Max Attempts Reached
                                     <Award className="w-4 h-4 ml-1" />
                                   </Button>
                                 ) : (
                                   <Button 
                                     variant="success" 
                                     size="sm" 
                                     className="w-full"
                                     as={Link}
                                     to={`/assessments/${course.id}`}
                                   >
                                     Start Assessment
                                     <Award className="w-4 h-4 ml-1" />
                                   </Button>
                                 )}
                                 {assessmentStatuses[course.id] && (
                                   <p className="text-xs text-gray-500 mt-1 text-center">
                                     Attempts: {assessmentStatuses[course.id].currentAttempts || 0} / {assessmentStatuses[course.id].maxAttempts || 3}
                                   </p>
                                 )}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-600 mb-4">Start your learning journey by enrolling in a course</p>
                    <Button variant="primary" as={Link} to="/courses">
                      Browse Courses
                    </Button>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <Card>
              <Card.Header>
                <Card.Title>Upcoming Deadlines</Card.Title>
                <Calendar className="w-5 h-5 text-gray-400" />
              </Card.Header>
              <Card.Content>
                {dashboardData.upcomingDeadlines.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} className="flex items-start space-x-3 p-3 rounded-lg bg-red-50 border border-red-100">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {getDeadlineTypeIcon(deadline.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-red-900 truncate">
                            {deadline.title}
                          </h4>
                          <p className="text-xs text-red-600">{deadline.course}</p>
                          <p className="text-xs text-red-500 mt-1">
                            Due: {new Date(deadline.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No upcoming deadlines</p>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Achievements */}
            <Card>
              <Card.Header>
                <Card.Title>Recent Achievements</Card.Title>
                <Star className="w-5 h-5 text-yellow-400" />
              </Card.Header>
              <Card.Content>
                {dashboardData.achievements.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-yellow-900">
                            {achievement.title}
                          </h4>
                          <p className="text-xs text-yellow-700">{achievement.description}</p>
                          <p className="text-xs text-yellow-600 mt-1">
                            {new Date(achievement.earnedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No achievements yet</p>
                    <p className="text-xs text-gray-400 mt-1">Complete courses to earn achievements</p>
                  </div>
                )}
              </Card.Content>
            </Card>

            {/* Learning Streak */}
            <Card variant="primary">
              <Card.Content className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  Learning Streak
                </h3>
                <p className="text-3xl font-bold text-primary-700 mb-2">
                  {dashboardData.stats.currentStreak} days
                </p>
                <p className="text-sm text-primary-600">
                  Keep up the great work!
                </p>
              </Card.Content>
            </Card>
          </div>
        </div>

        {/* Learning Insights */}
        <div className="mt-8">
          <Card>
            <Card.Header>
              <Card.Title>Learning Insights</Card.Title>
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Community Rank</h4>
                                     <p className="text-2xl font-bold text-primary-600">
                     {dashboardData.stats.totalCourses > 0 ? 
                       `Top ${Math.min(100, Math.max(1, Math.round((dashboardData.stats.contentCompletedCourses / dashboardData.stats.totalCourses) * 100)))}%` : 
                       'N/A'
                     }
                   </p>
                   <p className="text-sm text-gray-600">Content completion</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-success-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Average Progress</h4>
                                     <p className="text-2xl font-bold text-success-600">
                     {dashboardData.stats.totalCourses > 0 ? 
                       `${Math.round(dashboardData.stats.totalOverallProgress / dashboardData.stats.totalCourses)}%` : 
                       '0%'
                     }
                   </p>
                   <p className="text-sm text-gray-600">Overall progress</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-warning-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Study Time</h4>
                  <p className="text-2xl font-bold text-warning-600">
                    {dashboardData.stats.totalHours > 0 ? 
                      `${(dashboardData.stats.totalHours / 7).toFixed(1)}h/day` : 
                      '0h/day'
                    }
                  </p>
                  <p className="text-sm text-gray-600">This week average</p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
