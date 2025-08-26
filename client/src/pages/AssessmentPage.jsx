import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useApi';
import { useAssessments } from '../hooks/useApi';
import { useEnrollments } from '../hooks/useApi';
import { useContent } from '../hooks/useApi';
import { enrollmentsAPI, certificatesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Award,
  AlertCircle,
  Play,
  Timer,
  RefreshCw,
  Download,
  FileText
} from 'lucide-react';
import { Button, Card, Progress } from '../components/ui';

const AssessmentPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCourseById } = useCourses();
  const { getAssessmentsByCourse } = useAssessments();
  const { getUserEnrollments, updateProgress, checkAssessmentStatus } = useEnrollments();
  const { getAllContent } = useContent();
  
    const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [content, setContent] = useState([]);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
        const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userEnrollment, setUserEnrollment] = useState(null);
    const [assessmentAttempts, setAssessmentAttempts] = useState({});
    const [certificates, setCertificates] = useState({});
    const [generatingCertificate, setGeneratingCertificate] = useState({});
    const [generatingPDF, setGeneratingPDF] = useState({});
    const [justGeneratedCertificate, setJustGeneratedCertificate] = useState(null);

  useEffect(() => {
    fetchAssessmentData();
  }, [courseId]);

  useEffect(() => {
    // Check assessment availability for all assessments when userEnrollment is loaded
    if (userEnrollment && assessments.length > 0) {
      assessments.forEach(assessment => {
        checkAssessmentAvailability(assessment);
      });
      
      // Fetch existing certificates for passed assessments
      fetchExistingCertificates();
    }
  }, [userEnrollment, assessments]);

  useEffect(() => {
    let timer;
    if (isStarted && timeLeft > 0 && !isSubmitted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft, isSubmitted]);

  const fetchAssessmentData = async () => {
    try {
             // Fetch course details
       const courseData = await getCourseById(courseId);
       setCourse(courseData);

             // Fetch assessments for the course
       const assessmentsData = await getAssessmentsByCourse(courseId);
       setAssessments(assessmentsData || []);
       
       // Fetch content for the course
       const contentData = await getAllContent({ courseId });
       setContent(contentData || []);

               // Check if user is enrolled and has sufficient progress
         if (user) {
           const enrollments = await getUserEnrollments(user._id);
           const enrollment = enrollments.find(e => {
             const enrollmentCourseId = e.course;
             const currentCourseId = courseId;
             
             // Handle both string and ObjectId comparisons
             const isMatch = enrollmentCourseId === currentCourseId || 
                            (typeof enrollmentCourseId === 'object' && enrollmentCourseId._id === currentCourseId) ||
                            (typeof enrollmentCourseId === 'object' && enrollmentCourseId.toString() === currentCourseId);
             
             return isMatch;
           });
           
           if (!enrollment) {
             toast.error('You must be enrolled in this course to take assessments');
             navigate(`/learn/${courseId}`);
             return;
           }
 
           // Store user enrollment for later use
           setUserEnrollment(enrollment);
           
                      // Check content completion instead of overall progress
           // Use the actual content data that was just fetched to calculate progress
           const totalContentItems = contentData?.length || 0;
           const completedContentItems = enrollment.progress?.completedContent ? enrollment.progress.completedContent.length : 0;
           const contentProgress = totalContentItems > 0 ? (completedContentItems / totalContentItems) * 100 : 0;
           
           if (contentProgress < 80) {
             toast.error(`You need to complete at least 80% of the course content before taking assessments. Current progress: ${Math.round(contentProgress)}%`);
             navigate(`/learn/${courseId}`);
             return;
           }
         }
    } catch (error) {
      console.error('Failed to fetch assessment data:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const checkAssessmentAvailability = async (assessment) => {
    if (!userEnrollment) return false;
    
    try {
      const status = await checkAssessmentStatus(userEnrollment._id, assessment._id);
      setAssessmentAttempts(prev => ({
        ...prev,
        [assessment._id]: {
          currentAttempts: status.currentAttempts,
          maxAttempts: status.maxAttempts,
          canTake: status.canTake
        }
      }));
      return status.canTake;
    } catch (error) {
      console.error('Failed to check assessment status:', error);
      return false;
    }
  };

  const fetchExistingCertificates = async () => {
    if (!userEnrollment || !assessments.length || !user) return;

    try {
      // Get all completed assessments that were passed
      const passedAssessments = userEnrollment.progress?.completedAssessments?.filter(
        a => a.passed
      ) || [];

      if (passedAssessments.length === 0) return;

      // Make only one API call to get all user certificates
      const response = await certificatesAPI.getAllCertificates();
      const userCertificates = response.data || [];
      
      console.log('All user certificates:', userCertificates);
      console.log('Passed assessments:', passedAssessments);

      // Match certificates with assessments
      const certificateMap = {};
      passedAssessments.forEach(assessment => {
        console.log('Looking for certificate for assessment:', assessment.assessment);
        const certificate = userCertificates.find(
          c => c.metadata?.assessmentId === assessment.assessment
        );
        
        if (certificate) {
          console.log('Found certificate:', certificate);
          certificateMap[assessment.assessment] = certificate;
        } else {
          console.log('No certificate found for assessment:', assessment.assessment);
        }
      });

      // Update state with all found certificates
      if (Object.keys(certificateMap).length > 0) {
        console.log('Certificate map:', certificateMap);
        setCertificates(prev => ({
          ...prev,
          ...certificateMap
        }));
      }
    } catch (error) {
      console.error('Failed to fetch existing certificates:', error);
      // Don't show error to user, just log it
    }
  };

  const startAssessment = async (assessment) => {
    // Check if user can take this assessment
    const canTake = await checkAssessmentAvailability(assessment);
    
    if (!canTake) {
      toast.error(`You have reached the maximum attempts (${assessment.maxAttempts || 3}) for this assessment.`);
      return;
    }
    
    setCurrentAssessment(assessment);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(assessment.timeLimit * 60); // Convert minutes to seconds
    setIsStarted(true);
    setIsSubmitted(false);
    setScore(0);
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAssessment = async () => {
    if (!currentAssessment) return;

    try {
      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = currentAssessment.questions.length;

      currentAssessment.questions.forEach(question => {
        const userAnswer = answers[question._id];
        let isCorrect = false;
        
        if (question.type === 'multiple-choice') {
          // For multiple choice, check if user selected a correct option
          const correctOptions = question.options?.filter(opt => opt.isCorrect)?.map(opt => opt.text) || [];
          isCorrect = correctOptions.includes(userAnswer);
        } else if (question.type === 'true-false') {
          // For true-false, compare directly
          isCorrect = userAnswer === String(question.correctAnswer);
        } else {
          // For other types, use the correctAnswer field
          isCorrect = userAnswer === question.correctAnswer;
        }
        
        if (isCorrect) {
          correctAnswers++;
        }
      });

      const calculatedScore = Math.round((correctAnswers / totalQuestions) * 100);
      setScore(calculatedScore);
      setIsSubmitted(true);
      setIsStarted(false);

             // Update enrollment with assessment score and completed assessments
       if (user) {
         try {
           const enrollments = await getUserEnrollments(user._id);
           const enrollment = enrollments.find(e => {
             const enrollmentCourseId = e.course;
             const currentCourseId = courseId;
             
             // Handle both string and ObjectId comparisons
             return enrollmentCourseId === currentCourseId || 
                    (typeof enrollmentCourseId === 'object' && enrollmentCourseId._id === currentCourseId) ||
                    (typeof enrollmentCourseId === 'object' && enrollmentCourseId.toString() === currentCourseId);
           });
           
                       if (enrollment) {
              // Get current progress data
              const currentProgress = enrollment.progress || {};
              const completedAssessments = currentProgress.completedAssessments || [];
              

              
              // Check if this assessment was already completed before
              const existingAssessment = completedAssessments.find(
                a => a.assessment === currentAssessment._id
              );
              
              let newCompletedAssessment;
              
              if (existingAssessment) {
                // Update existing assessment with new attempt
                const newAttempt = {
                  attemptNumber: (existingAssessment.attempts?.length || 0) + 1,
                  score: calculatedScore,
                  answers: [], // We could store answers here if needed
                  startedAt: new Date(),
                  completedAt: new Date(),
                  timeSpent: 0 // Could calculate actual time spent
                };
                
                newCompletedAssessment = {
                  ...existingAssessment,
                  attempts: [...(existingAssessment.attempts || []), newAttempt],
                  score: calculatedScore, // Update with latest score
                  bestScore: Math.max(existingAssessment.bestScore || 0, calculatedScore),
                  passed: calculatedScore >= 70,
                  completedAt: new Date()
                };
              } else {
                // First time taking this assessment
                newCompletedAssessment = {
                  assessment: currentAssessment._id,
                  score: calculatedScore,
                  maxScore: 100,
                  attempts: [{
                    attemptNumber: 1,
                    score: calculatedScore,
                    answers: [], // We could store answers here if needed
                    startedAt: new Date(),
                    completedAt: new Date(),
                    timeSpent: 0 // Could calculate actual time spent
                  }],
                  bestScore: calculatedScore,
                  passed: calculatedScore >= 70,
                  completedAt: new Date()
                };
              }
              
             
                           // Update the enrollment with new assessment data
              let updatedCompletedAssessments;
              
              if (existingAssessment) {
                // Replace the existing assessment with the updated one
                updatedCompletedAssessments = completedAssessments.map(a => 
                  a.assessment === currentAssessment._id ? newCompletedAssessment : a
                );
              } else {
                // Add new assessment to the list
                updatedCompletedAssessments = [...completedAssessments, newCompletedAssessment];
              }
              
              const updateData = {
                completedAssessments: updatedCompletedAssessments,
                lastActivity: new Date()
              };
              

              
              const response = await updateProgress(enrollment._id, updateData);
              

              
                             // Update the local enrollment state immediately
               setUserEnrollment(prevEnrollment => {
                 if (!prevEnrollment) return prevEnrollment;
                 
                 const updatedProgress = {
                   ...prevEnrollment.progress,
                   completedAssessments: updatedCompletedAssessments,
                   lastActivity: new Date()
                 };
                 
                 return {
                   ...prevEnrollment,
                   progress: updatedProgress
                 };
               });
              
              // Also refresh the full data to ensure consistency
              await fetchAssessmentData();
     }
   } catch (updateError) {
     console.error('Failed to update assessment progress:', updateError);
     // Don't show error to user since assessment was submitted successfully
   }
 }
 
 toast.success('Assessment submitted successfully!');
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      toast.error('Failed to submit assessment');
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Certificate generation and download functions
  const generateCertificate = async (assessmentId) => {
    if (!userEnrollment || !course || !user) {
      toast.error('Unable to generate certificate. Please try again.');
      return;
    }

    try {
      setGeneratingCertificate(prev => ({ ...prev, [assessmentId]: true }));
      
      const response = await certificatesAPI.generateAssessmentCertificate({
        courseId: courseId,
        assessmentId: assessmentId,
        enrollmentId: userEnrollment._id
      });

      if (response.data.certificate) {
        console.log('Generated certificate response:', response.data.certificate);
        setCertificates(prev => ({
          ...prev,
          [assessmentId]: response.data.certificate
        }));
        setJustGeneratedCertificate(assessmentId);
        toast.success('Certificate generated successfully!');
      }
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to generate certificate');
      }
    } finally {
      setGeneratingCertificate(prev => ({ ...prev, [assessmentId]: false }));
    }
  };

  const downloadCertificate = async (certificateId) => {
    console.log('Attempting to download certificate with ID:', certificateId);
    
    if (!certificateId) {
      console.error('Certificate ID is null or undefined');
      toast.error('Certificate not available for download. Please try generating the certificate again.');
      return;
    }

    try {
      const response = await certificatesAPI.downloadCertificate(certificateId);
      
      // Create a blob from the response data (HTML content)
      const blob = new Blob([response.data], { type: 'text/html' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.html`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificate download started!');
    } catch (error) {
      console.error('Failed to download certificate:', error);
      toast.error('Failed to download certificate. Please try again.');
    }
  };

  const downloadCertificatePDF = async (certificateId) => {
    console.log('Attempting to download PDF certificate with ID:', certificateId);
    
    if (!certificateId) {
      console.error('Certificate ID is null or undefined');
      toast.error('Certificate not available for download. Please try generating the certificate again.');
      return;
    }

    try {
      setGeneratingPDF(prev => ({ ...prev, [certificateId]: true }));
      
      const response = await certificatesAPI.downloadCertificatePDF(certificateId);
      
      // Create a blob from the response data (PDF content)
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF certificate download started!');
    } catch (error) {
      console.error('Failed to download PDF certificate:', error);
      toast.error('Failed to download PDF certificate. Please try again.');
    } finally {
      setGeneratingPDF(prev => ({ ...prev, [certificateId]: false }));
    }
  };

  // Helper function to get certificate ID
  const getCertificateId = (assessmentId) => {
    console.log('Getting certificate ID for assessment:', assessmentId);
    console.log('Current certificates state:', certificates);
    
    const certificate = certificates[assessmentId];
    if (!certificate) {
      console.log('No certificate found for assessment:', assessmentId);
      return null;
    }
    
    console.log('Certificate object for assessment:', assessmentId, certificate);
    
    // Try different possible ID fields
    const id = certificate.id || certificate._id || certificate.certificateId;
    console.log('Extracted ID:', id);
    
    return id;
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple-choice':
        return <CheckCircle className="w-4 h-4" />;
      case 'true-false':
        return <AlertCircle className="w-4 h-4" />;
      case 'essay':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessments...</p>
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

  if (assessments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Assessments Available</h2>
            <p className="text-gray-600 mb-6">This course doesn't have any assessments yet.</p>

            <Button variant="primary" onClick={() => navigate(`/learn/${courseId}`)}>
              Back to Learning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isStarted && currentAssessment) {
    const currentQuestion = currentAssessment.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentAssessment.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Assessment Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{currentAssessment.title}</h1>
                <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {currentAssessment.questions.length}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Time Remaining</p>
                  <p className={`text-lg font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatTime(timeLeft)}
                  </p>
                </div>
                <Timer className="w-6 h-6 text-gray-400" />
              </div>
            </div>
            
            <Progress value={progress} max={100} className="mt-4" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-6">
            {/* Question */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {getQuestionTypeIcon(currentQuestion.type)}
                <span className="text-sm text-gray-600 uppercase">{currentQuestion.type}</span>
              </div>
              

              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {currentQuestion.text || 'Question text not available'}
              </h3>

              {/* Answer Options */}
              {currentQuestion.type === 'multiple-choice' && (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => (
                    <label key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestion._id}`}
                        value={option.text || option}
                        checked={answers[currentQuestion._id] === (option.text || option)}
                        onChange={() => handleAnswerSelect(currentQuestion._id, option.text || option)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-gray-700">{option.text || option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'true-false' && (
                <div className="space-y-3">
                  {['True', 'False'].map((option) => (
                    <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${currentQuestion._id}`}
                        value={option}
                        checked={answers[currentQuestion._id] === option}
                        onChange={() => handleAnswerSelect(currentQuestion._id, option)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'essay' && (
                <textarea
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {currentQuestionIndex + 1} of {currentAssessment.questions.length}
                </span>

                {currentQuestionIndex === currentAssessment.questions.length - 1 ? (
                  <Button
                    variant="primary"
                    onClick={handleSubmitAssessment}
                    disabled={Object.keys(answers).length < currentAssessment.questions.length}
                  >
                    Submit Assessment
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    const isPassed = score >= 70; // Assuming 70% is passing score

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            {isPassed ? (
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            ) : (
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            )}
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {isPassed ? 'Congratulations!' : 'Assessment Completed'}
            </h2>
            
            <p className="text-lg text-gray-600 mb-6">
              {isPassed 
                ? 'You have successfully passed the assessment!' 
                : 'You have completed the assessment. Keep learning to improve your score.'
              }
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Your Score</p>
                  <p className="text-3xl font-bold text-gray-900">{score}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-lg font-semibold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {isPassed ? 'PASSED' : 'NOT PASSED'}
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate success message */}
            {isPassed && justGeneratedCertificate === currentAssessment?._id && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Certificate Generated!</h3>
                  <p className="text-green-700 mb-4">
                    Your certificate has been successfully generated. You can now download it or access it from your dashboard.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                     <div className="flex gap-2">
                       <Button
                         variant="primary"
                         size="sm"
                         onClick={() => downloadCertificate(getCertificateId(currentAssessment._id))}
                         disabled={!getCertificateId(currentAssessment._id)}
                       >
                         <FileText className="w-4 h-4 mr-2" />
                         HTML
                       </Button>
                       <Button
                         variant="secondary"
                         size="sm"
                         onClick={() => downloadCertificatePDF(getCertificateId(currentAssessment._id))}
                         disabled={!getCertificateId(currentAssessment._id) || generatingPDF[currentAssessment._id]}
                       >
                         {generatingPDF[currentAssessment._id] ? (
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                         ) : (
                           <Download className="w-4 h-4 mr-2" />
                         )}
                         {generatingPDF[currentAssessment._id] ? 'PDF...' : 'PDF'}
                       </Button>
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         setJustGeneratedCertificate(null);
                         navigate('/dashboard');
                       }}
                     >
                       <FileText className="w-4 h-4 mr-2" />
                       View All Certificates
                     </Button>
                   </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => {
                  setJustGeneratedCertificate(null);
                  navigate(`/learn/${courseId}`);
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Continue Learning
              </Button>
              
              {isPassed && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Generate certificate for the current assessment
                    if (currentAssessment && userEnrollment) {
                      generateCertificate(currentAssessment._id);
                    }
                  }}
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Generate Certificate
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  setJustGeneratedCertificate(null);
                  navigate('/dashboard');
                }}
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/learn/${courseId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Course Assessments</h1>
              <p className="text-sm text-gray-600">{course.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {/* Assessment Progress Summary */}
         {userEnrollment && (
           <Card className="p-6 mb-6 bg-blue-50 border border-blue-200">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Assessment Progress</h3>
                 <div className="grid grid-cols-3 gap-6 text-sm">
                   <div>
                     <p className="text-blue-600">Total Assessments</p>
                     <p className="text-xl font-bold text-blue-900">{assessments.length}</p>
                   </div>
                   <div>
                     <p className="text-blue-600">Completed</p>
                     <p className="text-xl font-bold text-blue-900">
                       {userEnrollment.progress?.completedAssessments?.length || 0}
                     </p>
                   </div>
                   <div>
                     <p className="text-blue-600">Average Score</p>
                     <p className="text-xl font-bold text-blue-900">
                       {userEnrollment.progress?.completedAssessments?.length > 0 
                         ? Math.round(userEnrollment.progress.completedAssessments.reduce((sum, a) => sum + a.score, 0) / userEnrollment.progress.completedAssessments.length)
                         : 'N/A'
                       }%
                     </p>
                   </div>
                 </div>
                 
                 {/* Debug Information */}
                 {/* <div className="mt-3 p-2 bg-white rounded border text-xs">
                   <p className="text-gray-600">Debug: completedAssessments = {JSON.stringify(userEnrollment.progress?.completedAssessments || [])}</p>
                 </div> */}
               </div>
               <div className="text-right">
                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                   <Award className="w-8 h-8 text-blue-600" />
                 </div>
               </div>
             </div>
           </Card>
         )}
        
        <div className="space-y-6">
          {assessments.map((assessment) => {
                         // Check if user has completed this assessment
             const completedAssessment = userEnrollment?.progress?.completedAssessments?.find(
               a => a.assessment === assessment._id
             );
            
            return (
              <Card key={assessment._id} className={`p-6 ${completedAssessment ? 'bg-green-50 border-green-200' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assessment.title}
                      </h3>
                      {completedAssessment && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </span>
                      )}
                    </div>
                    
                    {assessment.description && (
                      <p className="text-gray-600 mb-4">{assessment.description}</p>
                    )}
                    
                                         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                       <div>
                         <p className="text-gray-500">Questions</p>
                         <p className="font-medium">{assessment.questions?.length || 0}</p>
                       </div>
                       <div>
                         <p className="text-gray-500">Time Limit</p>
                         <p className="font-medium">{assessment.timeLimit} min</p>
                       </div>
                       <div>
                         <p className="text-gray-500">Passing Score</p>
                         <p className="font-medium">70%</p>
                       </div>
                       <div>
                         <p className="text-gray-500">Max Attempts</p>
                         <p className="font-medium">{assessment.maxAttempts || 3}</p>
                       </div>
                       <div>
                         <p className="text-gray-500">Type</p>
                         <p className="font-medium capitalize">{assessment.type || 'Standard'}</p>
                       </div>
                     </div>
                    
                                         {/* Show assessment result if completed */}
                     {completedAssessment && (
                       <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div>
                             <p className="text-sm text-gray-600">Your Score</p>
                             <p className={`text-lg font-semibold ${completedAssessment.passed ? 'text-green-600' : 'text-red-600'}`}>
                               {completedAssessment.score}%
                             </p>
                           </div>
                           <div>
                             <p className="text-sm text-gray-600">Status</p>
                             <p className={`text-sm font-medium ${completedAssessment.passed ? 'text-green-600' : 'text-red-600'}`}>
                               {completedAssessment.passed ? 'PASSED' : 'NOT PASSED'}
                             </p>
                           </div>
                           <div>
                             <p className="text-sm text-gray-600">Completed</p>
                             <p className="text-sm font-medium text-gray-900">
                               {new Date(completedAssessment.completedAt).toLocaleDateString()}
                             </p>
                           </div>
                           <div>
                             <p className="text-sm text-gray-600">Attempts</p>
                             <p className="text-sm font-medium text-gray-900">
                               {completedAssessment.attempts?.length || 1} / {assessment.maxAttempts || 3}
                             </p>
                           </div>
                         </div>
                         
                         {/* Show retake option if attempts remaining */}
                         {(completedAssessment.attempts?.length || 1) < (assessment.maxAttempts || 3) && (
                           <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                             <p className="text-sm text-blue-700">
                               You have {(assessment.maxAttempts || 3) - (completedAssessment.attempts?.length || 1)} attempt(s) remaining
                             </p>
                           </div>
                         )}

                         {/* Certificate options for passed assessments */}
                         {completedAssessment.passed && (
                           <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                             <div className="flex items-center justify-between">
                               <div>
                                 <h4 className="text-sm font-medium text-yellow-800 mb-2">
                                   <Award className="w-4 h-4 inline mr-2" />
                                   Certificate Available
                                 </h4>
                                 <p className="text-xs text-yellow-700">
                                   Congratulations! You've passed this assessment. Generate and download your certificate.
                                 </p>
                               </div>
                               <div className="flex flex-col gap-2">
                                 {!certificates[assessment._id] ? (
                                   <Button
                                     variant="primary"
                                     size="sm"
                                     onClick={() => generateCertificate(assessment._id)}
                                     disabled={generatingCertificate[assessment._id]}
                                   >
                                     {generatingCertificate[assessment._id] ? (
                                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                     ) : (
                                       <FileText className="w-4 h-4 mr-2" />
                                     )}
                                     {generatingCertificate[assessment._id] ? 'Generating...' : 'Generate Certificate'}
                                   </Button>
                                 ) : (
                                   <div className="space-y-2">
                                     <div className="text-xs text-gray-600 text-center mb-2">
                                       Certificate #{certificates[assessment._id]?.certificateNumber || 'N/A'}
                                     </div>
                                     <div className="flex gap-2">
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => downloadCertificate(getCertificateId(assessment._id))}
                                         className="flex-1"
                                       >
                                         <FileText className="w-4 h-4 mr-2" />
                                         HTML
                                       </Button>
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => downloadCertificatePDF(getCertificateId(assessment._id))}
                                         disabled={generatingPDF[assessment._id]}
                                         className="flex-1"
                                       >
                                         {generatingPDF[assessment._id] ? (
                                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                         ) : (
                                           <Download className="w-4 h-4 mr-2" />
                                         )}
                                         {generatingPDF[assessment._id] ? 'PDF...' : 'PDF'}
                                       </Button>
                                     </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Show attempt information if not completed */}
                     {!completedAssessment && assessmentAttempts[assessment._id] && (
                       <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                         <div className="flex items-center justify-between">
                           <div>
                             <p className="text-sm text-yellow-700">
                               Attempts: {assessmentAttempts[assessment._id].currentAttempts} / {assessmentAttempts[assessment._id].maxAttempts}
                             </p>
                             {!assessmentAttempts[assessment._id].canTake && (
                               <p className="text-sm font-medium text-red-600 mt-1">
                                 Maximum attempts reached
                               </p>
                             )}
                           </div>
                         </div>
                       </div>
                     )}
                  </div>
                  
                                     <div className="ml-4">
                     {completedAssessment ? (
                       // Check if user can retake (has attempts remaining)
                       (completedAssessment.attempts?.length || 1) < (assessment.maxAttempts || 3) ? (
                         <Button
                           variant="secondary"
                           onClick={() => startAssessment(assessment)}
                         >
                           <RefreshCw className="w-4 h-4 mr-2" />
                           Retake Assessment
                         </Button>
                       ) : (
                         <Button
                           variant="outline"
                           disabled
                           className="cursor-not-allowed"
                         >
                           <CheckCircle className="w-4 h-4 mr-2" />
                           Completed
                         </Button>
                       )
                     ) : assessmentAttempts[assessment._id] && !assessmentAttempts[assessment._id].canTake ? (
                       <Button
                         variant="outline"
                         disabled
                         className="cursor-not-allowed"
                       >
                         <XCircle className="w-4 h-4 mr-2" />
                         Max Attempts Reached
                       </Button>
                     ) : (
                       <Button
                         variant="primary"
                         onClick={() => startAssessment(assessment)}
                       >
                         <Play className="w-4 h-4 mr-2" />
                         Start Assessment
                       </Button>
                     )}
                   </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPage;
