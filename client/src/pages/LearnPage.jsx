import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useApi';
import { useContent } from '../hooks/useApi';
import { useEnrollments } from '../hooks/useApi';
import { enrollmentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Circle, 
  ArrowLeft, 
  ArrowRight,
  Award,
  Clock,
  FileText,
  Lock
} from 'lucide-react';
import { Button, Card, Progress } from '../components/ui';

const LearnPage = () => {

  
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCourseById } = useCourses();
  const { getContentByCourseId } = useContent();
  const { getUserEnrollments, updateProgress, checkAssessmentStatus } = useEnrollments();
  
  const [course, setCourse] = useState(null);
  const [content, setContent] = useState([]);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completedContent, setCompletedContent] = useState(new Set());
  const [assessmentStatus, setAssessmentStatus] = useState(null);
  const dataFetchedRef = useRef(false);

  const fetchCourseData = useCallback(async () => {
    try {
      // Fetch course details
      const courseData = await getCourseById(courseId);
      setCourse(courseData);

      // Check enrollment and progress FIRST
      if (user) {
        const userId = user.id || user._id;
        
        const enrollments = await getUserEnrollments(userId);
        
        const enrollment = enrollments.find(e => {
          const enrollmentCourseId = e.course;
          const currentCourseId = courseId;
          
          // Handle both string and ObjectId comparisons
          const isMatch = enrollmentCourseId === currentCourseId || 
                         (typeof enrollmentCourseId === 'object' && enrollmentCourseId._id === currentCourseId) ||
                         (typeof enrollmentCourseId === 'object' && enrollmentCourseId.toString() === currentCourseId);
          
          return isMatch;
        });
        
        if (enrollment) {
          const dbProgress = enrollment.progress?.overallProgress || 0;
          
          // Calculate content progress for display
          const contentProgress = (enrollment.progress?.completedContent?.length > 0 && content.length > 0)
            ? Math.round((enrollment.progress.completedContent.length / content.length) * 100)
            : 0;
          
          // Only update progress if it's different from current state
          if (progress !== dbProgress) {
            setProgress(dbProgress);
          }
          
          if (enrollment.progress?.completedContent) {
            setCompletedContent(new Set(enrollment.progress.completedContent.map(item => item.content)));
          }
        }
        
        // NOW fetch course content after enrollment is confirmed
        const contentData = await getContentByCourseId(courseId);
        setContent(contentData);
      } else {
        // If no user, still try to fetch content (for public courses)
        const contentData = await getContentByCourseId(courseId);
        setContent(contentData);
      }
    } catch (error) {
      console.error('Failed to fetch course data:', error);
      toast.error('Failed to load course content');
    } finally {
      setLoading(false);
      dataFetchedRef.current = true;
    }
  }, [courseId, user, getCourseById, getContentByCourseId, getUserEnrollments]);

  useEffect(() => {
    // Only fetch if we haven't fetched data yet
    if (!dataFetchedRef.current) {
      fetchCourseData();
    }
  }, [courseId, fetchCourseData]);

  useEffect(() => {
    // Check assessment availability when course data is loaded
    if (course && user) {
      checkAssessmentAvailability();
    }
  }, [course, user]);

  const handleContentComplete = async (contentId) => {
    if (!user) return;

    console.log('=== HANDLE CONTENT COMPLETE ===');
    console.log('Content ID:', contentId);
    console.log('Current completed content:', Array.from(completedContent));
    console.log('Total content length:', content.length);

    try {
      const newCompletedContent = new Set(completedContent);
      newCompletedContent.add(contentId);
      setCompletedContent(newCompletedContent);

      // Calculate new progress - match backend calculation logic
      // Content progress: 70% weight, Assessment progress: 30% weight
      const contentProgress = content.length > 0 ? Math.round((newCompletedContent.size / content.length) * 100) : 0;
      const assessmentProgress = 0; // No assessments completed yet
      const newProgress = Math.round((contentProgress * 0.7) + (assessmentProgress * 0.3));
      
      setProgress(newProgress);

      // Update enrollment progress
      const userId = user.id || user._id;
      
      const enrollments = await getUserEnrollments(userId);
      
      const enrollment = enrollments.find(e => {
        const enrollmentCourseId = e.course;
        const currentCourseId = courseId;
        
        // Handle both string and ObjectId comparisons
        const isMatch = enrollmentCourseId === currentCourseId || 
                       enrollmentCourseId === currentCourseId || 
                       (typeof enrollmentCourseId === 'object' && enrollmentCourseId._id === currentCourseId) ||
                       (typeof enrollmentCourseId === 'object' && enrollmentCourseId.toString() === currentCourseId);
        
        return isMatch;
      });
      
      if (enrollment) {
        
        const response = await updateProgress(enrollment._id, {
          progress: newProgress,
          completedContent: Array.from(newCompletedContent),
          lastAccessed: new Date()
        });
        
        // Update local state with the response from backend
        if (response.data && response.data.progress !== undefined) {
          setProgress(response.data.progress);
        }
        
        // Refresh the enrollment data to ensure UI is in sync
        const updatedEnrollments = await getUserEnrollments(userId);
        const updatedEnrollment = updatedEnrollments.find(e => {
          const enrollmentCourseId = e.course;
          const currentCourseId = courseId;
          
          // Handle both string and ObjectId comparisons
          return enrollmentCourseId === currentCourseId || 
                 (typeof enrollmentCourseId === 'object' && enrollmentCourseId._id === currentCourseId) ||
                 (typeof enrollmentCourseId === 'object' && enrollmentCourseId.toString() === currentCourseId);
        });
        
        if (updatedEnrollment) {
          if (updatedEnrollment.progress?.completedContent) {
            setCompletedContent(new Set(updatedEnrollment.progress.completedContent.map(item => item.content)));
          }
          
          // Ensure progress state is in sync with backend
          if (updatedEnrollment.progress?.overallProgress !== undefined && 
              updatedEnrollment.progress.overallProgress !== progress) {
            setProgress(updatedEnrollment.progress.overallProgress);
          }
        }
      } else {
        console.error('No enrollment found for this course');
      }

      toast.success('Progress updated!');
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
      
      // Revert local state on error
      const newCompletedContent = new Set(completedContent);
      newCompletedContent.delete(contentId);
      setCompletedContent(newCompletedContent);
      setProgress(Math.round((newCompletedContent.size / content.length) * 100));
    }
  };

  const checkAssessmentAvailability = async () => {
    if (!user || !course) return;
    
    try {
      const enrollments = await getUserEnrollments(user.id || user._id);
      const enrollment = enrollments.find(e => {
        const enrollmentCourseId = e.course;
        const currentCourseId = courseId;
        
        return enrollmentCourseId === currentCourseId || 
               (typeof enrollmentCourseId === 'object' && enrollmentCourseId._id === currentCourseId) ||
               (typeof enrollmentCourseId === 'object' && enrollmentCourseId.toString() === currentCourseId);
      });
      
      if (enrollment && course.assessments && course.assessments.length > 0) {
        // Check the first assessment (assuming single assessment per course for now)
        const assessment = course.assessments[0];
        const status = await checkAssessmentStatus(enrollment._id, assessment._id);
        setAssessmentStatus(status);
      }
    } catch (error) {
      console.error('Failed to check assessment status:', error);
    }
  };

  const handleStartAssessment = () => {
    navigate(`/assessments/${courseId}`);
  };

  const goToNextContent = () => {
    if (currentContentIndex < content.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    }
  };

  const goToPreviousContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };

  const isContentCompleted = (contentId) => {
    return completedContent.has(contentId);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <Button variant="primary" onClick={() => navigate('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const currentContent = content[currentContentIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/courses')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">Learning Progress</p>
              </div>
            </div>
            
            {/* Progress and Assessment Section */}
            <div className="flex items-center gap-6">
              {/* Progress Display */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{progress}%</p>
                  <p className="text-xs text-gray-500">Content: {Math.round((completedContent.size / content.length) * 100)}% ({completedContent.size}/{content.length})</p>
                </div>
                <Progress value={progress} max={100} size="lg" className="w-32" />
              </div>
              
              {/* Assessment Button */}
              {content && completedContent.size >= Math.ceil(content.length * 0.8) && (
                <div className="flex flex-col items-center">
                  {assessmentStatus && !assessmentStatus.canTake ? (
                    <div className="text-center">
                      <p className="text-sm text-red-600 font-medium mb-2">
                        Max attempts reached
                      </p>
                      <p className="text-xs text-red-500 mb-2">
                        ({assessmentStatus.currentAttempts}/{assessmentStatus.maxAttempts})
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled
                        className="cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 px-4 py-2"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Assessment Unavailable
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={handleStartAssessment}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Start Assessment
                      </Button>
                      {assessmentStatus && (
                        <p className="text-xs text-gray-500 mt-2">
                          Attempts: {assessmentStatus.currentAttempts || 0} / {assessmentStatus.maxAttempts || 3}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Content Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h3>
              {content.length > 0 ? (
                <div className="space-y-2">
                  {content.map((item, index) => {
                    if (!item || !item._id) return null;
                    
                    return (
                      <button
                        key={item._id}
                        onClick={() => setCurrentContentIndex(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          index === currentContentIndex
                            ? 'bg-primary-100 text-primary-700 border border-primary-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isContentCompleted(item._id) ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.title || `Content ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.type || 'Content'} • {item.duration || 'N/A'} min
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No content available yet</p>
                  <p className="text-xs text-gray-500 mt-1">Check back later for updates</p>
                </div>
              )}
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {content.length > 0 && currentContent ? (
              <Card className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {currentContent.title || `Content ${currentContentIndex + 1}`}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {currentContent.duration || 'N/A'} min
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">
                      {currentContentIndex + 1} of {content.length}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {currentContent.type || 'Content'}
                    </span>
                  </div>
                </div>

                {/* Content Display */}
                <div className="mb-6">
                  {currentContent.type === 'video' && (currentContent.video?.url || currentContent.fileUrl) ? (
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden mb-4">
                      <video
                        src={currentContent.video?.url || currentContent.fileUrl}
                        controls
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.warn('Video failed to load:', e.target.src);
                        }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : currentContent.type === 'document' && (currentContent.document?.url || currentContent.fileUrl) ? (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {currentContent.title || 'Document'}
                          </p>
                          <a
                            href={currentContent.document?.url || currentContent.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View Document
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : currentContent.type === 'text' && currentContent.text?.content ? (
                    <div className="bg-gray-50 rounded-lg p-6 mb-4">
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{currentContent.text.content}</p>
                      </div>
                    </div>
                  ) : currentContent.type === 'quiz' ? (
                    <div className="bg-blue-50 rounded-lg p-6 mb-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Quiz Available</h3>
                        <p className="text-blue-700 mb-4">
                          This lesson includes a quiz to test your understanding.
                        </p>
                        <Button variant="primary">
                          Start Quiz
                        </Button>
                      </div>
                    </div>
                  ) : currentContent.type === 'assignment' ? (
                    <div className="bg-purple-50 rounded-lg p-6 mb-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">Assignment</h3>
                        <p className="text-purple-700 mb-4">
                          {currentContent.assignment?.description || 'Complete this assignment to continue.'}
                        </p>
                        <Button variant="primary">
                          View Assignment
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 mb-4">
                      <div className="text-center">
                        <p className="text-gray-600">Content preview not available for this type.</p>
                        {currentContent.fileUrl && (
                          <div className="mt-3">
                            <a
                              href={currentContent.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Content Description */}
                  {currentContent.description && (
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{currentContent.description}</p>
                    </div>
                  )}

                  {/* Content Body - fallback for HTML content */}
                  {currentContent.body && (
                    <div className="prose max-w-none mt-4">
                      <div dangerouslySetInnerHTML={{ __html: currentContent.body }} />
                    </div>
                  )}
                </div>

                {/* Navigation and Completion */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={goToPreviousContent}
                    disabled={currentContentIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-4">
                    {!isContentCompleted(currentContent._id) && (
                      <Button
                        variant="success"
                        onClick={() => handleContentComplete(currentContent._id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      onClick={goToNextContent}
                      disabled={currentContentIndex === content.length - 1}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Assessment Section */}
                {content && (() => {
                  const contentProgress = Math.round((completedContent.size / content.length) * 100);
                  const threshold = Math.ceil(content.length * 0.8);
                  const canShowAssessment = completedContent.size >= threshold;
                  
                  return canShowAssessment;
                })() && (
                  <Card className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-green-900 mb-2">
                        Ready for Assessment! 🎯
                      </h3>
                      <p className="text-green-700 mb-4">
                        You've completed {Math.round((completedContent.size / content.length) * 100)}% of the course content. 
                        You're now eligible to take the course assessment.
                      </p>
                      <Button 
                        variant="success" 
                        size="lg"
                        onClick={handleStartAssessment}
                        className="shadow-lg hover:shadow-xl transition-shadow"
                      >
                        <Award className="w-5 h-5 mr-2" />
                        Start Course Assessment
                      </Button>
                    </div>
                  </Card>
                )}
              </Card>
            ) : content.length === 0 ? (
              <Card className="p-6">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
                  <p className="text-gray-600 mb-4">This course doesn't have any content yet.</p>
                  
                  {/* Show different messages based on user role */}
                  {user && (user.role === 'instructor' || user.role === 'admin') ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">
                        As an instructor, you can add content to make this course ready for students.
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button 
                          variant="primary" 
                          onClick={() => navigate(`/admin/courses/${courseId}/content`)}
                        >
                          Add Course Content
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate(`/admin/courses/${courseId}`)}
                        >
                          Manage Course
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">
                        This course is still being prepared by the instructor.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/courses')}
                      >
                        Browse Other Courses
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading content...</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
