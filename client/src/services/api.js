import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Register new user
  register: (userData) => api.post('/auth/register', userData),
  
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Get current user profile
  getProfile: () => api.get('/auth/me'), 
  
  // Update user profile
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  
  // Change password
  changePassword: (passwordData) => api.put('/auth/password', passwordData),
  
  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (resetData) => api.post('/auth/reset-password', resetData),
  
  // Create user with specific role (Admin only)
  createUser: (userData) => api.post('/auth/create-user', userData),
};

// Users API
export const usersAPI = {
  // Get all users (Admin only)
  getAllUsers: (params) => api.get('/users', { params }),
  
  // Get user by ID
  getUserById: (id) => api.get(`/users/${id}`),
  
  // Update user
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Delete user (Admin only)
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // Deactivate user (Admin only)
  deactivateUser: (id) => api.put(`/users/${id}/deactivate`),
  
  // Activate user (Admin only)
  activateUser: (id) => api.put(`/users/${id}/activate`),
  
  // Get user enrollments
  getUserEnrollments: (id) => api.get(`/users/${id}/enrollments`),
  
  // Get user certificates
  getUserCertificates: (id) => api.get(`/users/${id}/certificates`),
};

// Courses API
export const coursesAPI = {
  // Get all published courses
  getAllCourses: (params) => api.get('/courses', { params }),
  
  // Get course by ID
  getCourseById: (id) => api.get(`/courses/${id}`),
  
  // Create new course (Instructor/Admin only)
  createCourse: (courseData) => api.post('/courses', courseData),
  
  // Update course (Instructor/Admin only)
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  
  // Delete course (Instructor/Admin only)
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  
  // Publish course (Instructor/Admin only)
  publishCourse: (id) => api.put(`/courses/${id}/publish`),
  
  // Unpublish course (Instructor/Admin only)
  unpublishCourse: (id) => api.put(`/courses/${id}/unpublish`),
  
  // Get course content
  getCourseContent: (id) => api.get(`/courses/${id}/content`),
  
  // Get course assessments
  getCourseAssessments: (id) => api.get(`/courses/${id}/assessments`),
  
  // Get course reviews
  getCourseReviews: (id) => api.get(`/courses/${id}/reviews`),
  
  // Add course review
  addCourseReview: (id, reviewData) => api.post(`/courses/${id}/reviews`, reviewData),
  
  // Get instructor courses
  getInstructorCourses: (instructorId) => api.get(`/courses/instructor/${instructorId}`),
  
  // Search courses
  searchCourses: (searchTerm, filters) => api.get('/courses/search', { 
    params: { q: searchTerm, ...filters } 
  }),
};

// Content API
export const contentAPI = {
  // Get all content
  getAllContent: (params) => api.get('/content', { params }),
  
  // Get content by ID
  getContentById: (id) => api.get(`/content/${id}`),
  
  // Create new content (Instructor/Admin only)
  createContent: (contentData) => api.post('/content', contentData),
  
  // Update content (Instructor/Admin only)
  updateContent: (id, contentData) => api.put(`/content/${id}`, contentData),
  
  // Delete content (Instructor/Admin only)
  deleteContent: (id) => api.delete(`/content/${id}`),
  
  // Get content by course
  getContentByCourseId: (courseId) => api.get(`/content?courseId=${courseId}`),
  
  // Get content by type
  getContentByType: (type) => api.get(`/content/type/${type}`),
  
  // Upload content file
  uploadContentFile: (contentId, fileData) => {
    const formData = new FormData();
    formData.append('file', fileData);
    return api.post(`/content/${contentId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Get content analytics
  getContentAnalytics: (id) => api.get(`/content/${id}/analytics`),
};

// Assessments API
export const assessmentsAPI = {
  // Get all assessments
  getAllAssessments: (params) => api.get('/assessments', { params }),
  
  // Get assessment by ID
  getAssessmentById: (id) => api.get(`/assessments/${id}`),
  
  // Create new assessment (Instructor/Admin only)
  createAssessment: (assessmentData) => api.post('/assessments', assessmentData),
  
  // Update assessment (Instructor/Admin only)
  updateAssessment: (id, assessmentData) => api.put(`/assessments/${id}`, assessmentData),
  
  // Delete assessment (Instructor/Admin only)
  deleteAssessment: (id) => api.delete(`/assessments/${id}`),
  
  // Get assessment by course
  getAssessmentByCourse: (courseId) => api.get(`/assessments/course/${courseId}`),
  
  // Submit assessment attempt
  submitAssessment: (id, answers) => api.post(`/assessments/${id}/submit`, answers),
  
  // Get assessment results
  getAssessmentResults: (id) => api.get(`/assessments/${id}/results`),
  
  // Get user assessment attempts
  getUserAssessmentAttempts: (assessmentId) => api.get(`/assessments/${assessmentId}/attempts`),
  
  // Grade assessment (Instructor/Admin only)
  gradeAssessment: (id, attemptId, grades) => api.put(`/assessments/${id}/grade/${attemptId}`, grades),
};

// Questions API
export const questionsAPI = {
  // Get questions by assessment
  getQuestionsByAssessment: (assessmentId) => api.get(`/assessments/${assessmentId}/questions`),
  
  // Add question to assessment (Instructor/Admin only)
  addQuestion: (assessmentId, questionData) => api.post(`/assessments/${assessmentId}/questions`, questionData),
  
  // Update question (Instructor/Admin only)
  updateQuestion: (assessmentId, questionId, questionData) => 
    api.put(`/assessments/${assessmentId}/questions/${questionId}`, questionData),
  
  // Delete question (Instructor/Admin only)
  deleteQuestion: (assessmentId, questionId) => 
    api.delete(`/assessments/${assessmentId}/questions/${questionId}`),
  
  // Reorder questions (Instructor/Admin only)
  reorderQuestions: (assessmentId, questionOrder) => 
    api.put(`/assessments/${assessmentId}/questions/reorder`, { questionOrder }),
};

// Enrollments API
export const enrollmentsAPI = {
  // Get all enrollments (Admin only)
  getAllEnrollments: (params) => api.get('/enrollments', { params }),
  
  // Get enrollment by ID
  getEnrollmentById: (id) => api.get(`/enrollments/${id}`),
  
  // Create enrollment
  createEnrollment: (enrollmentData) => api.post('/enrollments', enrollmentData),
  
  // Update enrollment
  updateEnrollment: (id, enrollmentData) => api.put(`/enrollments/${id}`, enrollmentData),
  
  // Delete enrollment
  deleteEnrollment: (id) => api.delete(`/enrollments/${id}`),
  
  // Get user enrollments
  getUserEnrollments: (userId) => api.get(`/enrollments/user/${userId}`),
  
  // Get course enrollments
  getCourseEnrollments: (courseId) => api.get(`/enrollments/course/${courseId}`),
  
  // Update enrollment progress
  updateProgress: (id, progressData) => api.put(`/enrollments/${id}/progress`, progressData),
  
  // Check assessment status (max attempts)
  checkAssessmentStatus: (enrollmentId, assessmentId) => api.get(`/enrollments/${enrollmentId}/assessment-status/${assessmentId}`),
  
  // Mark content as completed
  markContentCompleted: (id, contentId) => api.put(`/enrollments/${id}/complete-content`, { contentId }),
  
  // Get enrollment analytics
  getEnrollmentAnalytics: (id) => api.get(`/enrollments/${id}/analytics`),
  
  // Check if user is enrolled
  checkEnrollment: (courseId) => api.get(`/enrollments/check/${courseId}`),
};

// Certificates API
export const certificatesAPI = {
  // Get all certificates (Admin only)
  getAllCertificates: (params) => api.get('/certificates', { params }),
  
  // Get certificate by ID
  getCertificateById: (id) => api.get(`/certificates/${id}`),
  
  // Create certificate
  createCertificate: (certificateData) => api.post('/certificates', certificateData),
  
  // Update certificate
  updateCertificate: (id, certificateData) => api.put(`/certificates/${id}`, certificateData),
  
  // Delete certificate (Admin only)
  deleteCertificate: (id) => api.delete(`/certificates/${id}`),
  
  // Get user certificates
  getUserCertificates: (userId) => api.get(`/certificates/user/${userId}`),
  
  // Get course certificates
  getCourseCertificates: (courseId) => api.get(`/certificates/course/${courseId}`),
  
  // Download certificate
  downloadCertificate: (id) => api.get(`/certificates/${id}/download`),
  
  // Download certificate as PDF
  downloadCertificatePDF: (id) => api.get(`/certificates/${id}/download-pdf`, { responseType: 'blob' }),
  
  // Verify certificate
  verifyCertificate: (certificateNumber) => api.get(`/certificates/verify/${certificateNumber}`),
  
  // Generate certificate
generateCertificate: (enrollmentId) => api.post(`/certificates/generate/${enrollmentId}`),

// Generate certificate for passed assessment
generateAssessmentCertificate: (data) => api.post('/certificates/generate-assessment', data),

// Get certificate template
getCertificateTemplate: (templateId) => api.get(`/certificates/template/${templateId}`),
};

// Analytics API
export const analyticsAPI = {
  // Get dashboard analytics
  getDashboardAnalytics: () => api.get('/analytics/dashboard'),
  
  // Get course analytics
  getCourseAnalytics: (courseId) => api.get(`/analytics/courses/${courseId}`),
  
  // Get user analytics
  getUserAnalytics: (userId) => api.get(`/analytics/users/${userId}`),
  
  // Get enrollment analytics
  getEnrollmentAnalytics: () => api.get('/analytics/enrollments'),
  
  // Get revenue analytics
  getRevenueAnalytics: (params) => api.get('/analytics/revenue', { params }),
  
  // Get content analytics
  getContentAnalytics: () => api.get('/analytics/content'),
};

// File Upload API
export const uploadAPI = {
  // Upload course thumbnail
  uploadCourseThumbnail: (courseId, file) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return api.post(`/courses/${courseId}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Upload user profile picture
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Upload content file
  uploadContentFile: (contentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/content/${contentId}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Categories API
export const categoriesAPI = {
  // Get all categories
  getAllCategories: () => api.get('/categories'),
  
  // Get category by ID
  getCategoryById: (id) => api.get(`/categories/${id}`),
  
  // Create new category (Admin only)
  createCategory: (categoryData) => api.post('/categories', categoryData),
  
  // Update category (Admin only)
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  
  // Delete category (Admin only)
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Admin API
export const adminAPI = {
  // Get dashboard statistics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Get recent activities
  getRecentActivities: (limit = 10) => api.get('/admin/dashboard/activities', { params: { limit } }),
  
  // Get analytics data
  getAnalytics: (timeRange = '30d') => api.get('/admin/analytics', { params: { timeRange } }),
};

// Export the main API object
export default {
  auth: authAPI,
  users: usersAPI,
  courses: coursesAPI,
  content: contentAPI,
  assessments: assessmentsAPI,
  questions: questionsAPI,
  enrollments: enrollmentsAPI,
  certificates: certificatesAPI,
  analytics: analyticsAPI,
  upload: uploadAPI,
  categories: categoriesAPI,
  admin: adminAPI,
};
