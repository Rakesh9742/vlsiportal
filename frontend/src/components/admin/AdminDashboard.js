import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaUsers, FaClipboardList, FaChartBar, FaUserPlus, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQueries: 0,
    unassignedQueries: 0,
    totalExpertReviewers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/queries');
      return;
    }
    
    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersRes = await axios.get('/auth/users');
      const totalUsers = usersRes.data.users.length;
      const totalExpertReviewers = usersRes.data.users.filter(u => u.role === 'expert_reviewer').length;
      
      // Fetch queries
      const queriesRes = await axios.get('/admin/queries');
      const totalQueries = queriesRes.data.queries.length;
      const unassignedQueries = queriesRes.data.queries.filter(q => !q.expert_reviewer_id).length;
      
      setStats({
        totalUsers,
        totalQueries,
        unassignedQueries,
        totalExpertReviewers
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-user-info">
          <span>Welcome, {user?.fullName}</span>
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaClipboardList />
          </div>
          <div className="stat-content">
            <h3>{stats.totalQueries}</h3>
            <p>Total Queries</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaChartBar />
          </div>
          <div className="stat-content">
            <h3>{stats.unassignedQueries}</h3>
            <p>Unassigned Queries</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaUserPlus />
          </div>
          <div className="stat-content">
            <h3>{stats.totalExpertReviewers}</h3>
            <p>Expert Reviewers</p>
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <div className="action-section">
          <h2>User Management</h2>
          <div className="action-buttons">
            <button 
              onClick={() => navigate('/admin/users')}
              className="action-btn"
            >
              <FaUsers /> Manage Users
            </button>
            <button 
              onClick={() => navigate('/admin/expert-reviewers')}
              className="action-btn"
            >
              <FaUserPlus /> Manage Expert Reviewers
            </button>
          </div>
        </div>

        <div className="action-section">
          <h2>Query Management</h2>
          <div className="action-buttons">
            <button 
              onClick={() => navigate('/admin/queries')}
              className="action-btn"
            >
              <FaClipboardList /> Manage Queries
            </button>
            <button 
              onClick={() => navigate('/admin/assignments')}
              className="action-btn"
            >
              <FaCog /> Query Assignments
            </button>
          </div>
        </div>

        <div className="action-section">
          <h2>Analytics</h2>
          <div className="action-buttons">
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="action-btn"
            >
              <FaChartBar /> View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
