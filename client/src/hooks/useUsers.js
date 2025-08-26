import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const getAllUsers = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.usersAPI.getAllUsers(params);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch users.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.usersAPI.getUserById(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch user.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.authAPI.createUser(userData);
      toast.success('User created successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create user.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id, userData) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.usersAPI.updateUser(id, userData);
      toast.success('User updated successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update user.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.usersAPI.deleteUser(id);
      toast.success('User deleted successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete user.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deactivateUser = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.usersAPI.deactivateUser(id);
      toast.success('User deactivated successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to deactivate user.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const activateUser = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const api = await import('../services/api');
      const response = await api.usersAPI.activateUser(id);
      toast.success('User activated successfully!');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to activate user.';
      setError(errorMsg);
      toast.error(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    deactivateUser,
    activateUser,
    resetError
  };
};
