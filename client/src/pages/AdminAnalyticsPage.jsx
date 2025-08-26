import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Award, 
  TrendingUp, 
  Clock,
  BarChart3,
  Calendar,
  Target,
  Activity,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import { LineChart, BarChart, PieChart } from '../components/charts';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const AdminAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState({
    userGrowth: [],
    coursePerformance: [],
    enrollmentTrends: [],
    contentEngagement: [],
    assessmentResults: [],
    categoryDistribution: [],
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data from API
      const response = await adminAPI.getAnalytics(timeRange);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'users': return <Users className="h-5 w-5" />;
      case 'courses': return <BookOpen className="h-5 w-5" />;
      case 'enrollments': return <Users className="h-5 w-5" />;
      case 'completions': return <Award className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getTrendIndicator = (value, previousValue) => {
    if (!previousValue || previousValue === 0) return <Minus className="h-4 w-4 text-gray-400" />;
    
    const change = ((value - previousValue) / previousValue) * 100;
    if (change > 0) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendValue = (value, previousValue) => {
    if (!previousValue || previousValue === 0) return '0%';
    
    const change = ((value - previousValue) / previousValue) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights into your learning platform</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Time Range:</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="1y">1 Year</option>
                </select>
              </div>
              <Button variant="outline" onClick={fetchAnalyticsData}>
                <Activity className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Info */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing data for: <span className="font-medium">{getTimeRangeLabel(timeRange)}</span>
          </p>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.userGrowth?.[analyticsData.userGrowth.length - 1]?.total || 0}
                </p>
                <div className="flex items-center mt-2">
                  {getTrendIndicator(
                    analyticsData.userGrowth?.[analyticsData.userGrowth.length - 1]?.total || 0,
                    analyticsData.userGrowth?.[analyticsData.userGrowth.length - 2]?.total || 0
                  )}
                  <span className="text-sm text-gray-600 ml-1">
                    {getTrendValue(
                      analyticsData.userGrowth?.[analyticsData.userGrowth.length - 1]?.total || 0,
                      analyticsData.userGrowth?.[analyticsData.userGrowth.length - 2]?.total || 0
                    )}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.coursePerformance?.filter(c => c.isPublished).length || 0}
                </p>
                <div className="flex items-center mt-2">
                  {getTrendIndicator(
                    analyticsData.coursePerformance?.filter(c => c.isPublished).length || 0,
                    analyticsData.coursePerformance?.filter(c => c.isPublished).length || 0
                  )}
                  <span className="text-sm text-gray-600 ml-1">0%</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.enrollmentTrends?.[analyticsData.enrollmentTrends.length - 1]?.total || 0}
                </p>
                <div className="flex items-center mt-2">
                  {getTrendIndicator(
                    analyticsData.enrollmentTrends?.[analyticsData.enrollmentTrends.length - 1]?.total || 0,
                    analyticsData.enrollmentTrends?.[analyticsData.enrollmentTrends.length - 2]?.total || 0
                  )}
                  <span className="text-sm text-gray-600 ml-1">
                    {getTrendValue(
                      analyticsData.enrollmentTrends?.[analyticsData.enrollmentTrends.length - 1]?.total || 0,
                      analyticsData.enrollmentTrends?.[analyticsData.enrollmentTrends.length - 2]?.total || 0
                    )}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsData.assessmentResults?.completionRate || 0}%
                </p>
                <div className="flex items-center mt-2">
                  {getTrendIndicator(
                    analyticsData.assessmentResults?.completionRate || 0,
                    analyticsData.assessmentResults?.previousCompletionRate || 0
                  )}
                  <span className="text-sm text-gray-600 ml-1">
                    {getTrendValue(
                      analyticsData.assessmentResults?.completionRate || 0,
                      analyticsData.assessmentResults?.previousCompletionRate || 0
                    )}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Target className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* User Growth Chart */}
          <Card>
            <Card.Header>
              <Card.Title>User Growth Trend</Card.Title>
              <Card.Subtitle>New user registrations over time</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              {analyticsData.userGrowth && analyticsData.userGrowth.length > 0 ? (
                <LineChart 
                  data={analyticsData.userGrowth} 
                  title="User Growth"
                  height="300px"
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No user growth data available</p>
                    <p className="text-gray-400 text-xs">Data will appear here as users register</p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Enrollment Trends Chart */}
          <Card>
            <Card.Header>
              <Card.Title>Enrollment Trends</Card.Title>
              <Card.Subtitle>Course enrollments over time</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              {analyticsData.enrollmentTrends && analyticsData.enrollmentTrends.length > 0 ? (
                <LineChart 
                  data={analyticsData.enrollmentTrends} 
                  title="Enrollment Trends"
                  height="300px"
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No enrollment data available</p>
                    <p className="text-gray-400 text-xs">Data will appear here as enrollments occur</p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Course Performance Chart */}
          <Card>
            <Card.Header>
              <Card.Title>Course Performance</Card.Title>
              <Card.Subtitle>Enrollment and completion rates by course</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              {analyticsData.coursePerformance && analyticsData.coursePerformance.length > 0 ? (
                <BarChart 
                  data={analyticsData.coursePerformance.slice(0, 8)} 
                  title="Course Performance"
                  height="300px"
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No course performance data available</p>
                    <p className="text-gray-400 text-xs">Data will appear here as courses are created</p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Distribution */}
          <Card>
            <Card.Header>
              <Card.Title>Category Distribution</Card.Title>
              <Card.Subtitle>Courses by category</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              {analyticsData.categoryDistribution && analyticsData.categoryDistribution.length > 0 ? (
                <PieChart 
                  data={analyticsData.categoryDistribution} 
                  title="Category Distribution"
                  height="300px"
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No category data available</p>
                    <p className="text-gray-400 text-xs">Data will appear here as courses are categorized</p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Content Engagement */}
          <Card>
            <Card.Header>
              <Card.Title>Content Engagement</Card.Title>
              <Card.Subtitle>Most viewed and completed content</Card.Subtitle>
            </Card.Header>
            <Card.Content>
              {analyticsData.contentEngagement && analyticsData.contentEngagement.length > 0 ? (
                <BarChart 
                  data={analyticsData.contentEngagement.slice(0, 6)} 
                  title="Content Engagement"
                  height="300px"
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No content engagement data available</p>
                    <p className="text-gray-400 text-xs">Data will appear here as content is consumed</p>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Assessment Analytics */}
        <Card className="mb-8">
          <Card.Header>
            <Card.Title>Assessment Performance</Card.Title>
            <Card.Subtitle>Quiz and test results analysis</Card.Subtitle>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.assessmentResults?.averageScore || 0}%
                </div>
                <div className="text-sm text-green-600">Average Score</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.assessmentResults?.passRate || 0}%
                </div>
                <div className="text-sm text-blue-600">Pass Rate</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.assessmentResults?.totalAttempts || 0}
                </div>
                <div className="text-sm text-purple-600">Total Attempts</div>
              </div>
            </div>
            {analyticsData.assessmentResults && analyticsData.assessmentResults.totalAttempts > 0 ? (
              <BarChart 
                data={[
                  { label: 'Completion Rate', value: analyticsData.assessmentResults.completionRate || 0 },
                  { label: 'Pass Rate', value: analyticsData.assessmentResults.passRate || 0 },
                  { label: 'Total Attempts', value: analyticsData.assessmentResults.totalAttempts || 0 }
                ]} 
                title="Assessment Performance"
                height="300px"
              />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No assessment data available</p>
                  <p className="text-gray-400 text-xs">Data will appear here as assessments are taken</p>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Top Performing Content */}
        <Card>
          <Card.Header>
            <Card.Title>Top Performing Content</Card.Title>
            <Card.Subtitle>Most engaging and completed content</Card.Subtitle>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              {analyticsData.contentEngagement?.slice(0, 5).map((content, index) => (
                <div key={content.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{content.title}</h4>
                      <p className="text-sm text-gray-600">{content.course}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{content.completionRate}%</div>
                      <div className="text-xs text-gray-500">Completion Rate</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{content.avgTimeSpent}min</div>
                      <div className="text-xs text-gray-500">Avg Time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
