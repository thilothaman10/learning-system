import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Award, 
  TrendingUp, 
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Settings,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: { count: 0, growth: '', trend: 'neutral' },
    totalCourses: { count: 0, growth: '', trend: 'neutral' },
    totalContent: { count: 0, growth: '', trend: 'neutral' },
    totalAssessments: { count: 0, growth: '', trend: 'neutral' },
    totalEnrollments: { count: 0, growth: '', trend: 'neutral' },
    totalCertificates: { count: 0, growth: '', trend: 'neutral' }
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch stats and activities in parallel
      const [statsResponse, activitiesResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getRecentActivities(10)
      ]);

      setStats(statsResponse.data);
      setRecentActivities(activitiesResponse.data);
      
      if (isRefresh) {
        toast.success('Dashboard data refreshed successfully!');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'course_created':
        return <BookOpen className="h-5 w-5 text-primary-600" />;
      case 'user_registered':
        return <Users className="h-5 w-5 text-success-600" />;
      case 'assessment_created':
        return <FileText className="h-5 w-5 text-warning-600" />;
      case 'content_uploaded':
        return <FileText className="h-5 w-5 text-info-600" />;
      case 'certificate_issued':
        return <Award className="h-5 w-5 text-success-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityStatus = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="success" size="sm">Published</Badge>;
      case 'draft':
        return <Badge variant="warning" size="sm">Draft</Badge>;
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'issued':
        return <Badge variant="primary" size="sm">Issued</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your learning platform</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="lg" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <BarChart3 className="h-5 w-5 mr-2" />
                )}
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button variant="outline" size="lg">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Button>
                             <Link to="/admin/analytics">
                 <Button variant="primary" size="lg">
                   <BarChart3 className="h-5 w-5 mr-2" />
                   Analytics
                 </Button>
               </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card variant="primary" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-primary-600">Total Users</p>
                <p className="text-2xl font-bold text-black">Count: {stats.totalUsers.count}</p>
                <p className="text-xs text-primary-600 mt-1 flex items-center">
                  {stats.totalUsers.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : stats.totalUsers.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <Minus className="h-3 w-3 mr-1" />
                  )}
                  {stats.totalUsers.growth}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="secondary" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <BookOpen className="h-8 w-8 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Total Courses</p>
                <p className="text-2xl font-bold text-black">Count: {stats.totalCourses.count}</p>
                <p className="text-xs text-secondary-600 mt-1 flex items-center">
                  {stats.totalCourses.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : stats.totalCourses.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <Minus className="h-3 w-3 mr-1" />
                  )}
                  {stats.totalCourses.growth}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="success" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg">
                <FileText className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-success-600">Total Content</p>
                <p className="text-2xl font-bold text-black">Count: {stats.totalContent.count}</p>
                <p className="text-xs text-success-600 mt-1 flex items-center">
                  {stats.totalContent.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : stats.totalContent.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <Minus className="h-3 w-3 mr-1" />
                  )}
                  {stats.totalContent.growth}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="warning" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-lg">
                <FileText className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-warning-600">Total Assessments</p>
                <p className="text-2xl font-bold text-black">Count: {stats.totalAssessments.count}</p>
                <p className="text-xs text-warning-600 mt-1 flex items-center">
                  {stats.totalAssessments.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : stats.totalAssessments.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <Minus className="h-3 w-3 mr-1" />
                  )}
                  {stats.totalAssessments.growth}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="info" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-info-100 rounded-lg">
                <Users className="h-8 w-8 text-info-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-info-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-black">Count: {stats.totalEnrollments.count}</p>
                <p className="text-xs text-info-600 mt-1 flex items-center">
                  {stats.totalEnrollments.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : stats.totalEnrollments.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <Minus className="h-3 w-3 mr-1" />
                  )}
                  {stats.totalEnrollments.growth}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-primary-600">Total Certificates</p>
                <p className="text-2xl font-bold text-black">Count: {stats.totalCertificates.count}</p>
                <p className="text-xs text-primary-600 mt-1 flex items-center">
                  {stats.totalCertificates.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : stats.totalCertificates.trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  ) : (
                    <Minus className="h-3 w-3 mr-1" />
                  )}
                  {stats.totalCertificates.growth}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <Card.Title>Quick Actions</Card.Title>
              <Card.Subtitle>Common administrative tasks</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/admin/courses/create">
                  <Button variant="primary" className="w-full h-20 flex flex-col items-center justify-center">
                    <Plus className="h-6 w-6 mb-2" />
                    Create Course
                  </Button>
                </Link>
                <Link to="/admin/content/create">
                  <Button variant="secondary" className="w-full h-20 flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 mb-2" />
                    Add Content
                  </Button>
                </Link>
                <Link to="/admin/assessments/create">
                  <Button variant="warning" className="w-full h-20 flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 mb-2" />
                    Create Assessment
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button variant="info" className="w-full h-20 flex flex-col items-center justify-center">
                    <Users className="h-6 w-6 mb-2" />
                    Manage Users
                  </Button>
                </Link>
              </div>
            </Card.Content>
          </Card>

          {/* Recent Activities */}
          <Card>
            <Card.Header>
              <Card.Title>Recent Activities</Card.Title>
              <Card.Subtitle>Latest platform activities</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <Link 
                      key={activity.id} 
                      to={activity.link || '#'} 
                      className="block"
                    >
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            by {activity.user} • {activity.time}
                          </p>
                        </div>
                        {getActivityStatus(activity.status)}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No recent activities</p>
                    <p className="text-gray-400 text-xs">Activities will appear here as they happen</p>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link to="/admin/activities" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all activities →
                </Link>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Management */}
          <Card>
            <Card.Header>
              <Card.Title>Course Management</Card.Title>
              <Card.Subtitle>Manage your courses</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <Link to="/admin/courses" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">View All Courses</span>
                  <Eye className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/admin/courses/create" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">Create New Course</span>
                  <Plus className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/admin/categories" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">Manage Categories</span>
                  <Edit className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </Card.Content>
          </Card>

          {/* Content Management */}
          <Card>
            <Card.Header>
              <Card.Title>Content Management</Card.Title>
              <Card.Subtitle>Manage training content</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <Link to="/admin/content" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">View All Content</span>
                  <Eye className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/admin/content/create" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">Upload Content</span>
                  <Plus className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/admin/content/types" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">Content Types</span>
                  <Edit className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </Card.Content>
          </Card>

          {/* Assessment Management */}
          <Card>
            <Card.Header>
              <Card.Title>Assessment Management</Card.Title>
              <Card.Subtitle>Manage quizzes and tests</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <Link to="/admin/assessments" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">View All Assessments</span>
                  <Eye className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/admin/assessments/create" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">Create Assessment</span>
                  <Plus className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/admin/assessments/questions" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <span className="text-sm font-medium text-gray-700">Question Bank</span>
                  <Edit className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
