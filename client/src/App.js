import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import CreateCoursePage from './pages/admin/CreateCoursePage';
import CreateContentPage from './pages/admin/CreateContentPage';
import ContentListPage from './pages/admin/ContentListPage';
import CreateAssessmentPage from './pages/admin/CreateAssessmentPage';
import ManageAssessmentsPage from './pages/admin/ManageAssessmentsPage';
import QuestionBankPage from './pages/admin/QuestionBankPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import CoursesListPage from './pages/admin/CoursesListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LearnPage from './pages/LearnPage';
import AssessmentPage from './pages/AssessmentPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Public Route Component (redirects authenticated users)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect authenticated users based on their role
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'instructor') {
      return <Navigate to="/instructor/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// Main App Layout
const AppLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
    <Footer />
  </div>
);

// App Component
function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <AppLayout>
                  <HomePage />
                </AppLayout>
              } />
              
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
                                   <Route path="/courses" element={
                       <AppLayout>
                         <CoursesPage />
                       </AppLayout>
                     } />
                     
                     <Route path="/courses/:id" element={
                       <AppLayout>
                         <CourseDetailPage />
                       </AppLayout>
                     } />
                     
                     <Route path="/learn/:courseId" element={
                       <ProtectedRoute>
                         <AppLayout>
                           <LearnPage />
                         </AppLayout>
                       </ProtectedRoute>
                     } />
                     
                     <Route path="/assessments/:courseId" element={
                       <ProtectedRoute>
                         <AppLayout>
                           <AssessmentPage />
                         </AppLayout>
                       </ProtectedRoute>
                     } />
              
                                   <Route path="/profile" element={
                       <ProtectedRoute>
                         <AppLayout>
                           <ProfilePage />
                         </AppLayout>
                       </ProtectedRoute>
                     } />

                     {/* Admin Routes */}
                     <Route path="/admin/dashboard" element={
                       <AdminRoute>
                         <AppLayout>
                           <AdminDashboardPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/analytics" element={
                       <AdminRoute>
                         <AppLayout>
                           <AdminAnalyticsPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/courses/create" element={
                       <AdminRoute>
                         <AppLayout>
                           <CreateCoursePage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/courses" element={
                       <AdminRoute>
                         <AppLayout>
                           <CoursesListPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/courses/:id" element={
                       <AdminRoute>
                         <AppLayout>
                           <CourseDetailPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/content" element={
                       <AdminRoute>
                         <AppLayout>
                           <ContentListPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/content/create" element={
                       <AdminRoute>
                         <AppLayout>
                           <CreateContentPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/assessments" element={
                       <AdminRoute>
                         <AppLayout>
                           <ManageAssessmentsPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/assessments/create" element={
                       <AdminRoute>
                         <AppLayout>
                           <CreateAssessmentPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                     <Route path="/admin/assessments/questions" element={
                       <AdminRoute>
                         <AppLayout>
                           <QuestionBankPage />
                         </AppLayout>
                       </AdminRoute>
                     } />

                                           <Route path="/admin/categories" element={
                        <AdminRoute>
                          <AppLayout>
                            <CategoriesPage />
                          </AppLayout>
                        </AdminRoute>
                      } />

                      <Route path="/admin/users" element={
                        <AdminRoute>
                          <AppLayout>
                            <UserManagementPage />
                          </AppLayout>
                        </AdminRoute>
                      } />

                     {/* Instructor Routes */}
                     <Route path="/instructor/dashboard" element={
                       <ProtectedRoute>
                         <AppLayout>
                           <DashboardPage />
                         </AppLayout>
                       </ProtectedRoute>
                     } />

                     {/* Catch all route */}
                     <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
