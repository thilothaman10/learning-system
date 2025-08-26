import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Clock,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Settings,
  BookOpen
} from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { useCourses, useAssessments } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const CreateAssessmentPage = () => {
  const navigate = useNavigate();
  const { getAllCourses, loading: coursesLoading } = useCourses();
  const { createAssessment, loading: assessmentLoading } = useAssessments();
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const formRef = useRef(null);
  
  const [assessmentData, setAssessmentData] = useState({
    title: '',
    description: '',
    courseId: '',
    sectionId: '',
    type: 'quiz',
    difficulty: 'beginner',
    timeLimit: '',
    maxAttempts: '',
    passingScore: '',
    isPublished: false,
    allowReview: true,
    shuffleQuestions: true,
    showResults: true,
    showCorrectAnswers: true,
    language: 'english',
    category: 'general',
    questions: [] // Initialize questions array
  });

  // Dynamic dropdown options
  const assessmentTypes = [
    { value: 'quiz', label: 'Quiz' },
    { value: 'exam', label: 'Exam' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'project', label: 'Project' },
    { value: 'presentation', label: 'Presentation' }
  ];

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
    { value: 'japanese', label: 'Japanese' }
  ];

  const assessmentCategories = [
    { value: 'general', label: 'General' },
    { value: 'technical', label: 'Technical' },
    { value: 'business', label: 'Business' },
    { value: 'creative', label: 'Creative' },
    { value: 'language', label: 'Language' },
    { value: 'science', label: 'Science' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'history', label: 'History' }
  ];

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Pass admin=true to get all courses including unpublished ones
        const coursesData = await getAllCourses({ admin: true });
        console.log('Fetched courses in CreateAssessmentPage:', coursesData);
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
        setCourses([]);
      }
    };

    fetchCourses();
  }, [getAllCourses]);

  // Generate sections based on selected course (for now, using mock data)
  useEffect(() => {
    if (assessmentData.courseId) {
      // In a real app, this would fetch sections from the API
      const mockSections = [
        { id: '1', title: 'Introduction' },
        { id: '2', title: 'Getting Started' },
        { id: '3', title: 'Advanced Concepts' },
        { id: '4', title: 'Practice Exercises' },
        { id: '5', title: 'Final Project' }
      ];
      setSections(mockSections);
    } else {
      setSections([]);
    }
  }, [assessmentData.courseId]);

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice', icon: CheckCircle, color: 'primary' },
    { value: 'true-false', label: 'True/False', icon: CheckCircle, color: 'success' },
    { value: 'fill-blank', label: 'Fill in the Blank', icon: FileText, color: 'warning' },
    { value: 'essay', label: 'Essay', icon: FileText, color: 'info' },
    { value: 'matching', label: 'Matching', icon: Settings, color: 'secondary' },
    { value: 'ordering', label: 'Ordering', icon: Settings, color: 'elevated' }
  ];

  const handleInputChange = (field, value) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddQuestion = (type) => {
    const newQuestion = {
      id: Date.now(),
      type: type,
      text: '',
      points: 1,
      options: type === 'multiple-choice' ? ['', '', '', ''] : [],
      correctAnswer: '',
      explanation: '',
      isRequired: true
    };

    if (type === 'true-false') {
      newQuestion.options = ['True', 'False'];
      newQuestion.correctAnswer = 'True';
    } else if (type === 'fill-blank') {
      newQuestion.correctAnswer = '';
    } else if (type === 'essay') {
      newQuestion.points = 5;
    } else if (type === 'matching') {
      newQuestion.options = [{ left: '', right: '' }];
    } else if (type === 'ordering') {
      newQuestion.options = ['', '', '', ''];
    }

    setAssessmentData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const handleRemoveQuestion = (questionId) => {
    setAssessmentData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleQuestionChange = (questionId, field, value) => {
    setAssessmentData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleOptionChange = (questionId, optionIndex, value) => {
    setAssessmentData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  const handleAddOption = (questionId) => {
    setAssessmentData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.type === 'multiple-choice') {
          return { ...q, options: [...q.options, ''] };
        }
        return q;
      })
    }));
  };

  const handleRemoveOption = (questionId, optionIndex) => {
    setAssessmentData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const newOptions = q.options.filter((_, index) => index !== optionIndex);
          return { ...q, options: newOptions };
        }
        return q;
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!assessmentData.title || !assessmentData.courseId || !assessmentData.type) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate questions
      if (assessmentData.questions.length === 0) {
        toast.error('Please add at least one question to the assessment');
        return;
      }

      // Validate each question has required fields
      for (let i = 0; i < assessmentData.questions.length; i++) {
        const question = assessmentData.questions[i];
        if (!question.text) {
          toast.error(`Question ${i + 1} is missing text`);
          return;
        }
        
        if (question.type === 'multiple-choice' && question.options.length < 2) {
          toast.error(`Question ${i + 1} needs at least 2 options`);
          return;
        }
        
        if (question.type === 'multiple-choice' && !question.correctAnswer) {
          toast.error(`Question ${i + 1} needs a correct answer`);
          return;
        }
        
        if (question.type === 'true-false' && !question.correctAnswer) {
          toast.error(`Question ${i + 1} needs a correct answer`);
          return;
        }
        
        if (question.type === 'fill-blank' && !question.correctAnswer) {
          toast.error(`Question ${i + 1} needs a correct answer`);
          return;
        }
      }

      // Prepare assessment data for API
      const assessmentPayload = {
        title: assessmentData.title,
        description: assessmentData.description,
        course: assessmentData.courseId,
        section: assessmentData.sectionId || undefined,
        type: assessmentData.type,
        difficulty: assessmentData.difficulty,
        timeLimit: assessmentData.timeLimit ? parseInt(assessmentData.timeLimit) : undefined,
        maxAttempts: assessmentData.maxAttempts ? parseInt(assessmentData.maxAttempts) : undefined,
        passingScore: assessmentData.passingScore ? parseInt(assessmentData.passingScore) : undefined,
        isPublished: assessmentData.isPublished,
        allowReview: assessmentData.allowReview,
        shuffleQuestions: assessmentData.shuffleQuestions,
        showResults: assessmentData.showResults,
        showCorrectAnswers: assessmentData.showCorrectAnswers,
        language: assessmentData.language,
        category: assessmentData.category,
        questions: assessmentData.questions.map(q => ({
          type: q.type,
          text: q.text,
          points: q.points,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          isRequired: q.isRequired
        }))
      };

      console.log('Creating assessment with payload:', assessmentPayload);

      // Create the assessment
      const createdAssessment = await createAssessment(assessmentPayload);
      console.log('Assessment created:', createdAssessment);
      
      toast.success('Assessment created successfully!');
      navigate('/admin/assessments');
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment. Please try again.');
    }
  };

  const renderQuestionForm = (question) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            <Input
              label="Question Text *"
              placeholder="Enter your question"
              value={question.text}
              onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
              required
            />
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Options *</label>
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    value={option}
                    checked={question.correctAnswer === option}
                    onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(question.id, index, e.target.value)}
                    className="flex-1"
                    required
                  />
                  {question.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveOption(question.id, index)}
                      className="text-error-600 hover:text-error-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {question.options.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddOption(question.id)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-4">
            <Input
              label="Question Text *"
              placeholder="Enter your question"
              value={question.text}
              onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
              required
            />
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Correct Answer *</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    value="True"
                    checked={question.correctAnswer === 'True'}
                    onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">True</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    value="False"
                    checked={question.correctAnswer === 'False'}
                    onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">False</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'fill-blank':
        return (
          <div className="space-y-4">
            <Input
              label="Question Text *"
              placeholder="Enter your question (use ___ for blank spaces)"
              value={question.text}
              onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
              required
            />
            <Input
              label="Correct Answer *"
              placeholder="Enter the correct answer"
              value={question.correctAnswer}
              onChange={(e) => handleQuestionChange(question.id, 'correctAnswer', e.target.value)}
              required
            />
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-4">
            <Input
              label="Question Text *"
              placeholder="Enter your essay question"
              value={question.text}
              onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
              required
            />
            <Input
              label="Expected Answer Length"
              placeholder="e.g., 200-300 words"
              value={question.expectedLength}
              onChange={(e) => handleQuestionChange(question.id, 'expectedLength', e.target.value)}
            />
          </div>
        );

      default:
        return (
          <Input
            label="Question Text *"
            placeholder="Enter your question"
            value={question.text}
            onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
            required
          />
        );
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
                <h1 className="text-3xl font-bold text-gray-900">Create New Assessment</h1>
                <p className="text-gray-600 mt-1">Design quizzes and tests for your students</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/admin/assessments/questions">
                <Button variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Question Bank
                </Button>
              </Link>
              <Button
                type="button"
                variant="primary"
                loading={assessmentLoading}
                onClick={() => formRef.current?.requestSubmit()}
              >
                <Save className="h-4 w-4 mr-2" />
                {assessmentLoading ? 'Creating...' : 'Create Assessment'}
              </Button>
            </div>
          </div>
        </div>
      </div>

             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <Card.Header>
              <Card.Title>Assessment Details</Card.Title>
              <Card.Subtitle>Basic information about your assessment</Card.Subtitle>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Input
                  label="Assessment Title *"
                  placeholder="Enter assessment title"
                  value={assessmentData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
                <Input
                  label="Course *"
                  as="select"
                  value={assessmentData.courseId}
                  onChange={(e) => handleInputChange('courseId', e.target.value)}
                  required
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
                  value={assessmentData.sectionId}
                  onChange={(e) => handleInputChange('sectionId', e.target.value)}
                >
                  <option value="">{assessmentData.courseId ? 'Select section' : 'Select a course first'}</option>
                  {sections && sections.length > 0 && sections.map(section => (
                    <option key={section.id} value={section.id}>{section.title}</option>
                  ))}
                </Input>
                <Input
                  label="Time Limit (minutes)"
                  type="number"
                  placeholder="e.g., 60"
                  value={assessmentData.timeLimit}
                  onChange={(e) => handleInputChange('timeLimit', e.target.value)}
                  min="1"
                />
              </div>

              <Input
                label="Description"
                as="textarea"
                placeholder="Detailed description of the assessment"
                value={assessmentData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Input
                  label="Assessment Type *"
                  as="select"
                  value={assessmentData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  required
                >
                  {assessmentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Input>

                <Input
                  label="Difficulty Level *"
                  as="select"
                  value={assessmentData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  required
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
                  value={assessmentData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </Input>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Input
                  label="Category"
                  as="select"
                  value={assessmentData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {assessmentCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Input>

                <Input
                  label="Maximum Attempts"
                  type="number"
                  placeholder="e.g., 3"
                  value={assessmentData.maxAttempts}
                  onChange={(e) => handleInputChange('maxAttempts', e.target.value)}
                  min="1"
                />

                <Input
                  label="Passing Score (%)"
                  type="number"
                  placeholder="e.g., 70"
                  value={assessmentData.passingScore}
                  onChange={(e) => handleInputChange('passingScore', e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
            </Card.Content>
          </Card>

          {/* Assessment Settings */}
          <Card>
            <Card.Header>
              <Card.Title>Assessment Settings</Card.Title>
              <Card.Subtitle>Configure how the assessment will behave</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Publish Immediately</h4>
                    <p className="text-sm text-gray-600">Make assessment available to students right away</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessmentData.isPublished}
                      onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Review</h4>
                    <p className="text-sm text-gray-600">Let students review their answers after submission</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessmentData.allowReview}
                      onChange={(e) => handleInputChange('allowReview', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Shuffle Questions</h4>
                    <p className="text-sm text-gray-600">Randomize question order for each student</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessmentData.shuffleQuestions}
                      onChange={(e) => handleInputChange('shuffleQuestions', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Show Correct Answers</h4>
                    <p className="text-sm text-gray-600">Display correct answers after submission</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessmentData.showCorrectAnswers}
                      onChange={(e) => handleInputChange('showCorrectAnswers', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Questions */}
          <Card>
            <Card.Header>
              <Card.Title>Questions</Card.Title>
              <Card.Subtitle>Add questions to your assessment</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                {/* Question Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {questionTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        onClick={() => handleAddQuestion(type.value)}
                        className="h-20 flex flex-col items-center justify-center"
                      >
                        <Icon className={`h-6 w-6 text-${type.color}-600 mb-2`} />
                        <span className="text-sm">{type.label}</span>
                      </Button>
                    );
                  })}
                </div>

                {/* Questions List */}
                {assessmentData.questions.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-medium text-gray-900">
                      Questions ({assessmentData.questions.length})
                    </h4>
                    {assessmentData.questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Badge variant="primary">{index + 1}</Badge>
                            <Badge variant="secondary" className="capitalize">
                              {question.type.replace('-', ' ')}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {question.points} point{question.points !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              placeholder="Points"
                              value={question.points}
                              onChange={(e) => handleQuestionChange(question.id, 'points', parseInt(e.target.value) || 1)}
                              className="w-20"
                              min="1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveQuestion(question.id)}
                              className="text-error-600 hover:text-error-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {renderQuestionForm(question)}
                      </div>
                    ))}
                  </div>
                )}

                {assessmentData.questions.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                    <p className="text-gray-600">Click on a question type above to add your first question</p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default CreateAssessmentPage;
