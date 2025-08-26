import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  FileText,
  CheckCircle,
  AlertCircle,
  Settings,
  BookOpen,
  Tag
} from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';

const QuestionBankPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const mockQuestions = [
      {
        _id: '1',
        text: 'What is the capital of France?',
        type: 'multiple-choice',
        difficulty: 'easy',
        category: 'geography',
        points: 1,
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 'Paris',
        explanation: 'Paris is the capital and largest city of France.',
        tags: ['geography', 'europe', 'capitals'],
        usageCount: 5,
        createdAt: new Date('2024-01-15')
      },
      {
        _id: '2',
        text: 'JavaScript is a programming language.',
        type: 'true-false',
        difficulty: 'easy',
        category: 'programming',
        points: 1,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'JavaScript is a high-level, interpreted programming language.',
        tags: ['programming', 'javascript', 'web'],
        usageCount: 12,
        createdAt: new Date('2024-01-10')
      },
      {
        _id: '3',
        text: 'Explain the concept of object-oriented programming.',
        type: 'essay',
        difficulty: 'intermediate',
        category: 'programming',
        points: 5,
        expectedLength: '200-300 words',
        explanation: 'OOP is a programming paradigm based on objects containing data and code.',
        tags: ['programming', 'oop', 'concepts'],
        usageCount: 3,
        createdAt: new Date('2024-01-08')
      },
      {
        _id: '4',
        text: 'Fill in the blank: The _____ is the largest planet in our solar system.',
        type: 'fill-blank',
        difficulty: 'easy',
        category: 'science',
        points: 1,
        correctAnswer: 'Jupiter',
        explanation: 'Jupiter is the largest planet in our solar system.',
        tags: ['science', 'astronomy', 'planets'],
        usageCount: 7,
        createdAt: new Date('2024-01-05')
      }
    ];

    setTimeout(() => {
      setQuestions(mockQuestions);
      setLoading(false);
    }, 1000);
  }, []);

  const questionTypes = [
    { value: 'multiple-choice', label: 'Multiple Choice', icon: CheckCircle, color: 'primary' },
    { value: 'true-false', label: 'True/False', icon: CheckCircle, color: 'success' },
    { value: 'fill-blank', label: 'Fill in the Blank', icon: FileText, color: 'warning' },
    { value: 'essay', label: 'Essay', icon: FileText, color: 'info' },
    { value: 'matching', label: 'Matching', icon: Settings, color: 'secondary' },
    { value: 'ordering', label: 'Ordering', icon: Settings, color: 'elevated' }
  ];

  const difficultyLevels = [
    { value: 'easy', label: 'Easy', color: 'success' },
    { value: 'intermediate', label: 'Intermediate', color: 'warning' },
    { value: 'advanced', label: 'Advanced', color: 'error' }
  ];

  const categories = [
    { value: 'programming', label: 'Programming' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'geography', label: 'Geography' },
    { value: 'history', label: 'History' },
    { value: 'language', label: 'Language' },
    { value: 'business', label: 'Business' },
    { value: 'general', label: 'General' }
  ];

  const getTypeIcon = (type) => {
    const questionType = questionTypes.find(t => t.value === type);
    if (questionType) {
      const Icon = questionType.icon;
      return <Icon className={`h-4 w-4 text-${questionType.color}-600`} />;
    }
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  const getTypeLabel = (type) => {
    const questionType = questionTypes.find(t => t.value === type);
    return questionType ? questionType.label : type;
  };

  const getDifficultyColor = (difficulty) => {
    const level = difficultyLevels.find(d => d.value === difficulty);
    if (level) {
      switch (level.value) {
        case 'easy': return 'success';
        case 'intermediate': return 'warning';
        case 'advanced': return 'error';
        default: return 'secondary';
      }
    }
    return 'secondary';
  };

  const getDifficultyLabel = (difficulty) => {
    const level = difficultyLevels.find(d => d.value === difficulty);
    return level ? level.label : difficulty;
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const handleDelete = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        // TODO: Implement actual delete API call
        setQuestions(prev => prev.filter(q => q._id !== questionId));
        toast.success('Question deleted successfully');
      } catch (error) {
        toast.error('Failed to delete question');
      }
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || question.type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || question.difficulty === filterDifficulty;
    const matchesCategory = filterCategory === 'all' || question.category === filterCategory;
    
    return matchesSearch && matchesType && matchesDifficulty && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question bank...</p>
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
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
                <p className="text-gray-600 mt-1">Manage and reuse questions across assessments</p>
              </div>
            </div>
            <Link to="/admin/assessments/create">
              <Button variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Question
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search questions by text or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Input
                as="select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                {questionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Input>
              <Input
                as="select"
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                <option value="all">All Difficulties</option>
                {difficultyLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </Input>
            </div>
            <div className="mt-4">
              <Input
                as="select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full md:w-auto"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </Input>
            </div>
          </Card.Content>
        </Card>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <Card>
              <Card.Content className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterType !== 'all' || filterDifficulty !== 'all' || filterCategory !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first question'}
                </p>
                {!searchTerm && filterType === 'all' && filterDifficulty === 'all' && filterCategory === 'all' && (
                  <Link to="/admin/assessments/create">
                    <Button variant="primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Question
                    </Button>
                  </Link>
                )}
              </Card.Content>
            </Card>
          ) : (
            filteredQuestions.map((question) => (
              <Card key={question._id} className="hover:shadow-md transition-shadow">
                <Card.Content>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Question Header */}
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(question.type)}
                        <Badge variant="secondary" className="capitalize">
                          {getTypeLabel(question.type)}
                        </Badge>
                        <Badge variant={getDifficultyColor(question.difficulty)}>
                          {getDifficultyLabel(question.difficulty)}
                        </Badge>
                        <Badge variant="outline">
                          {getCategoryLabel(question.category)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {question.points} point{question.points !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Question Text */}
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">{question.text}</h3>
                        
                        {/* Options for multiple choice */}
                        {question.type === 'multiple-choice' && question.options && (
                          <div className="space-y-1">
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className={`w-4 h-4 rounded-full border-2 ${
                                  option === question.correctAnswer 
                                    ? 'border-green-500 bg-green-500' 
                                    : 'border-gray-300'
                                }`}></span>
                                <span className={`text-sm ${
                                  option === question.correctAnswer 
                                    ? 'text-green-700 font-medium' 
                                    : 'text-gray-600'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* True/False options */}
                        {question.type === 'true-false' && question.options && (
                          <div className="space-y-1">
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className={`w-4 h-4 rounded-full border-2 ${
                                  option === question.correctAnswer 
                                    ? 'border-green-500 bg-green-500' 
                                    : 'border-gray-300'
                                }`}></span>
                                <span className={`text-sm ${
                                  option === question.correctAnswer 
                                    ? 'text-green-700 font-medium' 
                                    : 'text-gray-600'
                                }`}>
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Fill in the blank answer */}
                        {question.type === 'fill-blank' && question.correctAnswer && (
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <span className="text-sm font-medium text-green-800">Answer: </span>
                            <span className="text-sm text-green-700">{question.correctAnswer}</span>
                          </div>
                        )}

                        {/* Essay expected length */}
                        {question.type === 'essay' && question.expectedLength && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <span className="text-sm font-medium text-blue-800">Expected Length: </span>
                            <span className="text-sm text-blue-700">{question.expectedLength}</span>
                          </div>
                        )}
                      </div>

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                          <span className="text-sm font-medium text-gray-800">Explanation: </span>
                          <span className="text-sm text-gray-700">{question.explanation}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {question.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Usage and Creation Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Used in {question.usageCount} assessment{question.usageCount !== 1 ? 's' : ''}</span>
                        <span>Created: {question.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: Implement view details */}}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: Implement edit */}}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(question._id)}
                        className="text-error-600 hover:text-error-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {filteredQuestions.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredQuestions.length} of {questions.length} questions
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankPage;
