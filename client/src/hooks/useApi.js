import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

// Updated useApi hooks - v4 (Final fix for API imports)

// Courses hook
export const useCourses = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const getAllCourses = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.coursesAPI.getAllCourses(params);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load courses.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCourseById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.coursesAPI.getCourseById(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load course.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCourse = useCallback(async (courseData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.coursesAPI.createCourse(courseData);
      toast.success('Course created successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create course.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCourse = useCallback(async (id, courseData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.coursesAPI.updateCourse(id, courseData);
      toast.success('Course updated successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update course.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCourse = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.coursesAPI.deleteCourse(id);
      toast.success('Course deleted successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete course.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    resetError,
  };
};

// Content hook
export const useContent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const getAllContent = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.contentAPI.getAllContent(filters);
      // Content API returns the array directly, not wrapped in data
      return response.data || response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch content.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getContentByCourseId = useCallback(async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.contentAPI.getContentByCourseId(courseId);
      // Content API returns the array directly, not wrapped in data
      return response.data || response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch course content.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createContent = useCallback(async (contentData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.contentAPI.createContent(contentData);
      toast.success('Content created successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create content.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContent = useCallback(async (id, contentData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.contentAPI.updateContent(id, contentData);
      toast.success('Content updated successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update content.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContent = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.contentAPI.deleteContent(id);
      toast.success('Content deleted successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete content.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getAllContent,
    getContentByCourseId,
    createContent,
    updateContent,
    deleteContent,
    resetError,
  };
};

// Assessments hook
export const useAssessments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const getAllAssessments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.assessmentsAPI.getAllAssessments(params);
      // Assessments API returns the array directly, not wrapped in data
      return response.data || response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch assessments.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAssessmentsByCourse = useCallback(async (courseId) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.assessmentsAPI.getAllAssessments({ courseId });
      // Assessments API returns the array directly, not wrapped in data
      return response.data || response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch course assessments.';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAssessmentById = useCallback(async (assessmentId) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.assessmentsAPI.getAssessmentById(assessmentId);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch assessment.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAssessment = useCallback(async (assessmentData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.assessmentsAPI.createAssessment(assessmentData);
      toast.success('Assessment created successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create assessment.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAssessment = useCallback(async (id, assessmentData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.assessmentsAPI.updateAssessment(id, assessmentData);
      toast.success('Assessment updated successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update assessment.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAssessment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.assessmentsAPI.deleteAssessment(id);
      toast.success('Assessment deleted successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete assessment.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getAllAssessments,
    getAssessmentsByCourse,
    getAssessmentById,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    resetError,
  };
};

// Enrollments hook
export const useEnrollments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const createEnrollment = useCallback(async (enrollmentData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.enrollmentsAPI.createEnrollment(enrollmentData);
      toast.success('Enrolled successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to enroll in course.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserEnrollments = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.enrollmentsAPI.getUserEnrollments(userId);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load enrollments.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgress = useCallback(async (id, progressData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.enrollmentsAPI.updateProgress(id, progressData);
      toast.success('Progress updated!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update progress.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAssessmentStatus = useCallback(async (enrollmentId, assessmentId) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.enrollmentsAPI.checkAssessmentStatus(enrollmentId, assessmentId);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to check assessment status.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createEnrollment,
    getUserEnrollments,
    updateProgress,
    checkAssessmentStatus,
    resetError,
  };
};

// Categories hook
export const useCategories = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const getAllCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.categoriesAPI.getAllCategories();
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load categories.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoryById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.categoriesAPI.getCategoryById(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load category.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.categoriesAPI.createCategory(data);
      toast.success('Category created successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create category.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.categoriesAPI.updateCategory(id, data);
      toast.success('Category updated successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update category.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.categoriesAPI.deleteCategory(id);
      toast.success('Category deleted successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete category.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    loading,
    error,
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    resetError,
  };
};
