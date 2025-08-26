const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Content = require('../models/Content');
const Assessment = require('../models/Assessment');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get admin dashboard statistics
router.get('/dashboard/stats', auth, isAdmin, async (req, res) => {
  try {
    // Get current date and calculate time periods
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalContent = await Content.countDocuments();
    const totalAssessments = await Assessment.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalCertificates = await Certificate.countDocuments();

    // Growth calculations
    const usersLastMonth = await User.countDocuments({ createdAt: { $gte: lastMonth } });
    const coursesThisWeek = await Course.countDocuments({ createdAt: { $gte: lastWeek } });
    const contentThisMonth = await Content.countDocuments({ createdAt: { $gte: thisMonth } });
    const enrollmentsLastWeek = await Enrollment.countDocuments({ createdAt: { $gte: lastWeek } });
    const certificatesThisMonth = await Certificate.countDocuments({ createdAt: { $gte: thisMonth } });

    // Pending assessments (draft status)
    const pendingAssessments = await Assessment.countDocuments({ status: 'draft' });

    // Calculate percentages
    const userGrowthPercent = totalUsers > 0 ? Math.round((usersLastMonth / totalUsers) * 100) : 0;
    const enrollmentGrowthPercent = totalEnrollments > 0 ? Math.round((enrollmentsLastWeek / totalEnrollments) * 100) : 0;

    const stats = {
      totalUsers: {
        count: totalUsers,
        growth: `+${userGrowthPercent}% from last month`,
        trend: 'up'
      },
      totalCourses: {
        count: totalCourses,
        growth: `+${coursesThisWeek} new this week`,
        trend: 'up'
      },
      totalContent: {
        count: totalContent,
        growth: `+${contentThisMonth} this month`,
        trend: 'up'
      },
      totalAssessments: {
        count: totalAssessments,
        growth: `${pendingAssessments} pending review`,
        trend: 'neutral'
      },
      totalEnrollments: {
        count: totalEnrollments,
        growth: `+${enrollmentGrowthPercent}% from last week`,
        trend: 'up'
      },
      totalCertificates: {
        count: totalCertificates,
        growth: `+${certificatesThisMonth} this month`,
        trend: 'up'
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activities for admin dashboard
router.get('/dashboard/activities', auth, isAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent activities from different collections
    const recentActivities = [];
    


    // Recent course creations
    try {
      const recentCourses = await Course.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('instructor', 'firstName lastName');

      recentCourses.forEach(course => {
        const instructorName = course.instructor ? 
          `${course.instructor.firstName} ${course.instructor.lastName}` : 
          'Unknown Instructor';
        
        recentActivities.push({
          id: course._id,
          type: 'course_created',
          title: course.title,
          user: instructorName,
          time: course.createdAt,
          status: course.isPublished ? 'published' : 'draft',
          link: `/admin/courses/${course._id}`
        });
      });
    } catch (error) {
      console.error('Error fetching recent courses:', error);
    }

    // Recent user registrations
    try {
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('firstName lastName email role createdAt');

      recentUsers.forEach(user => {
        recentActivities.push({
          id: user._id,
          type: 'user_registered',
          title: `New ${user.role} registration`,
          user: `${user.firstName} ${user.lastName}`,
          time: user.createdAt,
          status: 'active',
          link: `/admin/users/${user._id}`
        });
      });
    } catch (error) {
      console.error('Error fetching recent users:', error);
    }

    // Recent content uploads
    try {
      const recentContent = await Content.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate({
          path: 'course',
          select: 'title instructor',
          populate: {
            path: 'instructor',
            select: 'firstName lastName'
          }
        });

      recentContent.forEach(content => {
        const instructorName = content.course && content.course.instructor ? 
          `${content.course.instructor.firstName} ${content.course.instructor.lastName}` : 
          'Unknown Instructor';
        
        const courseTitle = content.course ? content.course.title : 'Unknown Course';
        
        recentActivities.push({
          id: content._id,
          type: 'content_uploaded',
          title: `${content.title} - ${courseTitle}`,
          user: instructorName,
          time: content.createdAt,
          status: content.isPublished ? 'published' : 'draft',
          link: `/admin/content/${content._id}`
        });
      });
    } catch (error) {
      console.error('Error fetching recent content:', error);
    }

    // Recent assessments
    try {
      const recentAssessments = await Assessment.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate({
          path: 'course',
          select: 'title instructor',
          populate: {
            path: 'instructor',
            select: 'firstName lastName'
          }
        });

      recentAssessments.forEach(assessment => {
        const instructorName = assessment.course && assessment.course.instructor ? 
          `${assessment.course.instructor.firstName} ${assessment.course.instructor.lastName}` : 
          'Unknown Instructor';
        
        const courseTitle = assessment.course ? assessment.course.title : 'Unknown Course';
        
        recentActivities.push({
          id: assessment._id,
          type: 'assessment_created',
          title: `${assessment.title} - ${courseTitle}`,
          user: instructorName,
          time: assessment.createdAt,
          status: assessment.status || 'draft',
          link: `/admin/assessments/${assessment._id}`
        });
      });
    } catch (error) {
      console.error('Error fetching recent assessments:', error);
    }

    // Recent certificates
    try {
      const recentCertificates = await Certificate.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('course', 'title')
        .populate('student', 'firstName lastName');

      recentCertificates.forEach(certificate => {
        const studentName = certificate.student ? 
          `${certificate.student.firstName} ${certificate.student.lastName}` : 
          'Unknown Student';
        
        const courseTitle = certificate.course ? certificate.course.title : 'Unknown Course';
        
        recentActivities.push({
          id: certificate._id,
          type: 'certificate_issued',
          title: `${courseTitle} Certificate`,
          user: studentName,
          time: certificate.createdAt,
          status: 'issued',
          link: `/admin/certificates/${certificate._id}`
        });
      });
    } catch (error) {
      console.error('Error fetching recent certificates:', error);
    }

    // Sort all activities by time and limit
    const sortedActivities = recentActivities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit)
      .map(activity => ({
        ...activity,
        time: getTimeAgo(activity.time)
      }));

    res.json(sortedActivities);
  } catch (error) {
    console.error('Error fetching admin dashboard activities:', error);
    res.status(500).json({ message: 'Failed to fetch recent activities' });
  }
});

// Get analytics data for admin dashboard
router.get('/analytics', auth, isAdmin, async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '30d';
    
    // Calculate date ranges
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // User growth data
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Course performance data
    const coursePerformance = await Course.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $addFields: {
          enrollmentCount: { $size: '$enrollments' },
          completionCount: {
            $size: {
              $filter: {
                input: '$enrollments',
                cond: { $eq: ['$$this.status', 'completed'] }
              }
            }
          }
        }
      },
      {
        $project: {
          title: 1,
          isPublished: 1,
          enrollmentCount: 1,
          completionCount: 1,
          completionRate: {
            $cond: {
              if: { $eq: ['$enrollmentCount', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$completionCount', '$enrollmentCount'] },
                  100
                ]
              }
            }
          }
        }
      }
    ]);

    // Enrollment trends
    const enrollmentTrends = await Enrollment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Content engagement data
    const contentEngagement = await Content.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'course',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $addFields: {
          totalEnrollments: { $size: '$enrollments' },
          completedEnrollments: {
            $size: {
              $filter: {
                input: '$enrollments',
                cond: {
                  $in: ['$_id', '$$this.progress.completedContent.content']
                }
              }
            }
          }
        }
      },
      {
        $project: {
          title: 1,
          course: 1,
          completionRate: {
            $cond: {
              if: { $eq: ['$totalEnrollments', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$completedEnrollments', '$totalEnrollments'] },
                  100
                ]
              }
            }
          },
          avgTimeSpent: { $avg: '$enrollments.progress.timeSpent' }
        }
      },
      {
        $sort: { completionRate: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Assessment results
    const assessmentResults = await Assessment.aggregate([
      {
        $lookup: {
          from: 'enrollments',
          localField: 'course',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $addFields: {
          totalAttempts: {
            $sum: {
              $map: {
                input: '$enrollments',
                as: 'enrollment',
                in: { $size: '$$enrollment.progress.completedAssessments' }
              }
            }
          },
          completedAssessments: {
            $sum: {
              $map: {
                input: '$enrollments',
                as: 'enrollment',
                in: {
                  $size: {
                    $filter: {
                      input: '$$enrollment.progress.completedAssessments',
                      cond: { $eq: ['$$this.assessment', '$_id'] }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAssessments: { $sum: 1 },
          totalAttempts: { $sum: '$totalAttempts' },
          completedAssessments: { $sum: '$completedAssessments' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: {
              if: { $eq: ['$totalAttempts', 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: ['$completedAssessments', '$totalAttempts'] },
                  100
                ]
              }
            }
          }
        }
      }
    ]);

    // Category distribution
    const categoryDistribution = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Monthly stats
    const monthlyStats = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Course.countDocuments({ createdAt: { $gte: startDate } }),
      Content.countDocuments({ createdAt: { $gte: startDate } }),
      Enrollment.countDocuments({ createdAt: { $gte: startDate } })
    ]);

    const analytics = {
      userGrowth: userGrowth.map(item => ({
        date: item._id,
        total: item.count
      })),
      coursePerformance,
      enrollmentTrends: enrollmentTrends.map(item => ({
        date: item._id,
        total: item.count
      })),
      contentEngagement,
      assessmentResults: assessmentResults[0] || {
        completionRate: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0
      },
      categoryDistribution,
      monthlyStats: {
        newUsers: monthlyStats[0],
        newCourses: monthlyStats[1],
        newContent: monthlyStats[2],
        newEnrollments: monthlyStats[3]
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
});

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

module.exports = router;
