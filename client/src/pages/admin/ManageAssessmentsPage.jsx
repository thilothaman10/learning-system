import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, FileText, Clock, Users, Search, Filter, BookOpen } from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/ui';
import { useAssessments } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const ManageAssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { getAllAssessments, deleteAssessment } = useAssessments();

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      // Pass admin=true to get all assessments
      const assessmentsData = await getAllAssessments({ admin: true });
      console.log('Fetched assessments:', assessmentsData);
      
      if (assessmentsData && Array.isArray(assessmentsData)) {
        setAssessments(assessmentsData);
      } else {
        setAssessments([]);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assessmentId) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      try {
        await deleteAssessment(assessmentId);
        toast.success('Assessment deleted successfully');
        fetchAssessments(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete assessment');
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'quiz':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'exam':
        return <Clock className="h-5 w-5 text-red-600" />;
      case 'assignment':
        return <Users className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const filteredAssessments = assessments.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessments...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Assessment Management</h1>
              <p className="text-gray-600 mt-1">Manage all training assessments</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/admin/assessments/questions">
                <Button variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Question Bank
                </Button>
              </Link>
              <Link to="/admin/assessments/create">
                <Button variant="primary" size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Assessment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <Card.Content>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="project">Project</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Assessments List */}
        {filteredAssessments.length === 0 ? (
          <Card>
            <Card.Content className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first assessment'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Link to="/admin/assessments/create">
                  <Button variant="primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assessment
                  </Button>
                </Link>
              )}
            </Card.Content>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredAssessments.map((assessment) => (
              <Card key={assessment._id}>
                <Card.Content>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getTypeIcon(assessment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {assessment.title}
                          </h3>
                          <Badge variant={assessment.isPublished ? 'success' : 'warning'}>
                            {assessment.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          <Badge variant="secondary">
                            {getTypeLabel(assessment.type)}
                          </Badge>
                          <Badge variant={getDifficultyColor(assessment.difficulty)}>
                            {assessment.difficulty}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{assessment.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Course: {assessment.course?.title}</span>
                                                     <span>Questions: {Array.isArray(assessment.questions) ? assessment.questions.length : 0}</span>
                          {assessment.timeLimit && <span>Time: {assessment.timeLimit} min</span>}
                          <span>Passing Score: {assessment.passingScore}%</span>
                                                     <span>Created: {new Date(assessment.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Link to={`/admin/assessments/edit/${assessment._id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(assessment._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAssessmentsPage;
