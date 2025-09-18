import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import StudentLogin from './components/auth/StudentLogin';
import ProfessionalLogin from './components/auth/ProfessionalLogin';
import Register from './components/auth/Register';
import ProfessionalRegister from './components/auth/ProfessionalRegister';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import QueryList from './components/queries/QueryList';
import QueryDetail from './components/queries/QueryDetail';
import CreateQuery from './components/queries/CreateQuery';
import EditQuery from './components/queries/EditQuery';
import Profile from './components/Profile';
import AdminDashboard from './components/admin/AdminDashboard';
import ExpertReviewerManagement from './components/admin/ExpertReviewerManagement';
import QueryAssignmentManagement from './components/admin/QueryAssignmentManagement';
import UserManagement from './components/admin/UserManagement';
import QueryManagement from './components/admin/QueryManagement';
import AdminAnalytics from './components/admin/AdminAnalytics';
import DomainAdminManagement from './components/admin/DomainAdminManagement';
import SystemMonitoring from './components/admin/SystemMonitoring';
import NotificationBanner from './components/notifications/NotificationBanner';
import NotificationsPage from './components/notifications/NotificationsPage';

// Context
import { AuthProvider } from './context/AuthContext';

// Configure axios defaults with dynamic URL support
const getApiUrl = () => {
  // Always use the primary API URL from environment variables
  return process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

axios.defaults.baseURL = getApiUrl() + '/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setIsAuthenticated(true);
    // Role-based redirect
    if (['admin', 'domain_admin'].includes(userData.role)) {
      window.location.href = '/admin';
    } else {
      window.location.href = '/queries';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading vlsiforum...</div>
      </div>
    );
  }

  return (
    <AuthProvider value={{ isAuthenticated, user, login, logout }}>
      <Router>
        <div className="App">
          {isAuthenticated && <Navbar />}
          {isAuthenticated && <NotificationBanner />}
          <div className="container">
            <Routes>
              <Route 
                path="/login" 
                element={isAuthenticated ? (['admin', 'domain_admin'].includes(user?.role) ? <Navigate to="/admin" /> : <Navigate to="/queries" />) : <Login onLogin={login} />} 
              />
              <Route 
                path="/login-student" 
                element={isAuthenticated ? (['admin', 'domain_admin'].includes(user?.role) ? <Navigate to="/admin" /> : <Navigate to="/queries" />) : <StudentLogin onLogin={login} />} 
              />
              <Route 
                path="/login-professional" 
                element={isAuthenticated ? (['admin', 'domain_admin'].includes(user?.role) ? <Navigate to="/admin" /> : <Navigate to="/queries" />) : <ProfessionalLogin onLogin={login} />} 
              />
              <Route 
                path="/register" 
                element={isAuthenticated ? (['admin', 'domain_admin'].includes(user?.role) ? <Navigate to="/admin" /> : <Navigate to="/queries" />) : <Register />} 
              />
              <Route 
                path="/register-professional" 
                element={isAuthenticated ? (['admin', 'domain_admin'].includes(user?.role) ? <Navigate to="/admin" /> : <Navigate to="/queries" />) : <ProfessionalRegister />} 
              />
              <Route 
                path="/forgot-password" 
                element={isAuthenticated ? (['admin', 'domain_admin'].includes(user?.role) ? <Navigate to="/admin" /> : <Navigate to="/queries" />) : <ForgotPassword />} 
              />
              <Route 
                path="/reset-password" 
                element={isAuthenticated ? (['admin', 'domain_admin'].includes(user?.role) ? <Navigate to="/admin" /> : <Navigate to="/queries" />) : <ResetPassword />} 
              />
              <Route 
                path="/dashboard" 
                element={<Navigate to="/queries" />} 
              />
              <Route 
                path="/queries" 
                element={isAuthenticated ? <QueryList /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/queries/new" 
                element={isAuthenticated ? <CreateQuery /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/queries/:id" 
                element={isAuthenticated ? <QueryDetail /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/queries/:id/edit" 
                element={isAuthenticated ? <EditQuery /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/analytics" 
                element={isAuthenticated ? <Analytics /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/profile" 
                element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/notifications" 
                element={isAuthenticated ? <NotificationsPage /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/admin" 
                element={isAuthenticated && ['admin', 'domain_admin'].includes(user?.role) ? <AdminDashboard /> : <Navigate to="/queries" />} 
              />
              <Route 
                path="/admin/expert-reviewers" 
                element={isAuthenticated && ['admin', 'domain_admin'].includes(user?.role) ? <ExpertReviewerManagement /> : <Navigate to="/queries" />} 
              />
              <Route 
                path="/admin/assignments" 
                element={isAuthenticated && ['admin', 'domain_admin'].includes(user?.role) ? <QueryAssignmentManagement /> : <Navigate to="/queries" />} 
              />
              <Route 
                path="/admin/users" 
                element={isAuthenticated && ['admin', 'domain_admin'].includes(user?.role) ? <UserManagement /> : <Navigate to="/queries" />} 
              />
              <Route 
                path="/admin/queries" 
                element={isAuthenticated && ['admin', 'domain_admin'].includes(user?.role) ? <QueryManagement /> : <Navigate to="/queries" />} 
              />
              <Route 
                path="/admin/analytics" 
                element={isAuthenticated && ['admin', 'domain_admin'].includes(user?.role) ? <AdminAnalytics /> : <Navigate to="/queries" />} 
              />
              <Route 
                path="/admin/domain-admins" 
                element={isAuthenticated && user?.role === 'admin' ? <DomainAdminManagement /> : <Navigate to="/queries" />} 
              />
              <Route 
                path="/admin/system-monitoring" 
                element={isAuthenticated && user?.role === 'admin' ? <SystemMonitoring /> : <Navigate to="/queries" />} 
              />
              <Route 
                path="/" 
                element={isAuthenticated ? (['admin', 'domain_admin'].includes(user?.role) ? <Navigate to="/admin" /> : <Navigate to="/queries" />) : <Navigate to="/login" />} 
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;