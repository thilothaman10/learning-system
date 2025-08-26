import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  console.log('🔐 AuthProvider component rendered');
  
  const [user, setUser] = useState(() => {
    // Initialize user state from localStorage
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure token storage
  useEffect(() => {
    console.log('💾 Token storage effect triggered:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      currentLocalStorageToken: !!localStorage.getItem('token'),
      tokenValue: token ? token.substring(0, 20) + '...' : null
    });
    
    if (token) {
      console.log('💾 Storing token in localStorage...');
      localStorage.setItem('token', token);
      console.log('✅ Token stored successfully in localStorage');
    } else {
      console.log('💾 Removing token from localStorage...');
      localStorage.removeItem('token');
      console.log('✅ Token removed from localStorage');
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 AuthContext - Starting initial authentication check...');
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔍 AuthContext - Initial check:', {
        storedToken: !!storedToken,
        storedUser: !!storedUser,
        currentUser: !!user,
        currentToken: !!token,
        storedTokenLength: storedToken ? storedToken.length : 0
      });
      
      if (storedToken && storedUser) {
        try {
          console.log('🔍 Found stored authentication data, attempting to restore...');
          
          // If we have stored data but no user state, restore it
          if (!user) {
            const userData = JSON.parse(storedUser);
            console.log('🔍 Restoring user from localStorage:', userData);
            setUser(userData);
          }
          
          // Verify token is still valid
          console.log('🔍 Verifying token with backend...');
          const response = await authAPI.getProfile();
          console.log('🔍 Token verification successful:', response.data);
          setUser(response.data);
        } catch (error) {
          console.error('❌ Auth check failed:', error);
          console.error('Error response:', error.response);
          // Clear invalid data
          console.log('🧹 Clearing invalid authentication data...');
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('🔍 No stored authentication data found');
      }
      
      console.log('🔍 Authentication check completed, setting loading to false');
      setLoading(false);
    };

    checkAuth();
  }, []); // Only run on mount

  // Track authentication state changes
  useEffect(() => {
    console.log('🔄 AuthContext - State changed:', {
      user: user ? { id: user.id, _id: user._id, role: user.role } : null,
      token: !!token,
      tokenLength: token ? token.length : 0,
      isAuthenticated: !!user && !!token,
      localStorage: {
        token: !!localStorage.getItem('token'),
        user: !!localStorage.getItem('user')
      }
    });
  }, [user, token]);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('🚀 Login function called for:', email);
      setLoading(true);
      
      const response = await authAPI.login({ email, password });
      console.log('📡 Login API response received:', response);
      
      const { token: newToken, user: userData } = response.data;
      console.log('🔑 Extracted data from response:', {
        hasToken: !!newToken,
        tokenLength: newToken ? newToken.length : 0,
        hasUser: !!userData,
        userRole: userData?.role,
        userId: userData?.id || userData?._id,
        userKeys: userData ? Object.keys(userData) : null
      });
      
      console.log('💾 Setting token and user state...');
      setToken(newToken);
      setUser(userData);
      
      // Store user data in localStorage for role-based redirects
      console.log('💾 Storing user data in localStorage...');
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('✅ Login state updated successfully:', {
        tokenSet: !!newToken,
        userSet: !!userData,
        localStorageUser: !!localStorage.getItem('user'),
        localStorageToken: !!localStorage.getItem('token'),
        currentState: {
          user: !!userData,
          token: !!newToken,
          isAuthenticated: !!userData && !!newToken
        }
      });
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response;
      
      setToken(newToken);
      setUser(newUser);
      
      // Store user data in localStorage for role-based redirects
      localStorage.setItem('user', JSON.stringify(newUser));
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword({
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
      
      return { success: true };
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false };
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  // Check if user is admin
  const isAdmin = () => hasRole('admin');

  // Check if user is instructor
  const isInstructor = () => hasRole('instructor') || hasRole('admin');

  // Check if user is student
  const isStudent = () => hasRole('student');

  const value = {
    user,
    loading,
    token,
    isAuthenticated: !!user && !!token, // Simplified calculation
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    hasRole,
    hasAnyRole,
    isAdmin,
    isInstructor,
    isStudent
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
