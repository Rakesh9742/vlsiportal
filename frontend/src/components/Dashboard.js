import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaQuestionCircle, FaCheckCircle, FaClock, FaPlus, FaUsers, FaGraduationCap, FaUser, FaExclamationTriangle, FaTools } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalQueries: 0,
    openQueries: 0,
    inProgressQueries: 0,
    resolvedQueries: 0
  });
  const [recentQueries, setRecentQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [queriesResponse] = await Promise.all([
        axios.get('/queries')
      ]);

      const queries = queriesResponse.data.queries;
      
      // Calculate stats
      const totalQueries = queries.length;
      const openQueries = queries.filter(q => q.status === 'open').length;
      const inProgressQueries = queries.filter(q => q.status === 'in_progress').length;
      const resolvedQueries = queries.filter(q => q.status === 'resolved').length;

      setStats({
        totalQueries,
        openQueries,
        inProgressQueries,
        resolvedQueries
      });

      // Get recent queries (last 5)
      setRecentQueries(queries.slice(0, 5));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <FaExclamationTriangle className="status-icon open" />;
      case 'in_progress':
        return <FaTools className="status-icon progress" />;
      case 'resolved':
        return <FaCheckCircle className="status-icon resolved" />;

      default:
        return <FaQuestionCircle className="status-icon" />;
    }
  };

  const getProgressWidth = (status) => {
    switch (status) {
      case 'open':
        return 25;
      case 'in_progress':
        return 60;
      case 'resolved':
        return 100;
      default:
        return 0;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';

      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.fullName}!</h1>
        <p>Here's what's happening in your vlsiforum</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <FaQuestionCircle className="card-icon total" />
            <h3>Total</h3>
          </div>
          <div className="card-content">
            <div className="stat-number">{stats.totalQueries}</div>
            <p>All queries</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <FaExclamationTriangle className="card-icon open" />
            <h3>Open</h3>
          </div>
          <div className="card-content">
            <div className="stat-number">{stats.openQueries}</div>
            <p>Open queries</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <FaTools className="card-icon progress" />
            <h3>In Progress</h3>
          </div>
          <div className="card-content">
            <div className="stat-number">{stats.inProgressQueries}</div>
            <p>In progress queries</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <FaCheckCircle className="card-icon resolved" />
            <h3>Resolved</h3>
          </div>
          <div className="card-content">
            <div className="stat-number">{stats.resolvedQueries}</div>
            <p>Resolved queries</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Queries</h2>
          <Link to="/queries" className="btn btn-outline">View All</Link>
        </div>

        {recentQueries.length === 0 ? (
          <div className="empty-state">
            <FaQuestionCircle className="empty-icon" />
            <h3>No queries yet</h3>
            <p>Start by creating your first query</p>
            {(user?.role === 'student' || user?.role === 'professional') && (
              <Link to="/queries/new" className="btn btn-primary">
                <FaPlus /> Create Query
              </Link>
            )}
          </div>
        ) : (
          <div className="queries-list">
            {recentQueries.map((query) => (
              <div key={query.id} className="query-item">
                <div className="query-header">
                  <div className="query-info">
                    {getStatusIcon(query.status)}
                    <div>
                      <h4 className="query-title">{query.title}</h4>
                      <div className="query-id">ID: {query.custom_query_id || query.id}</div>
                      <div className="query-meta">
                        <span>By: {query.student_name}</span>
                        <span>Status: {query.status}</span>
                        <span>{new Date(query.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Link to={`/queries/${query.id}`} className="btn btn-outline">
                    View Details
                  </Link>
                </div>
                <p className="query-description">{query.description.substring(0, 100)}...</p>
                
                {/* Progress Bar */}
                <div className="query-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${query.status}`}
                      style={{ width: `${getProgressWidth(query.status)}%` }}
                    ></div>
                  </div>
                  <div className="progress-label">
                    <span>Progress</span>
                    <span className="progress-status">{getStatusText(query.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {user?.role === 'student' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/queries/new" className="action-card">
              <FaPlus className="action-icon" />
              <h3>Create New Query</h3>
              <p>Ask a question to expert reviewers</p>
            </Link>
            <Link to="/queries" className="action-card">
              <FaQuestionCircle className="action-icon" />
              <h3>View My Queries</h3>
              <p>Check your query history</p>
            </Link>
            <Link to="/profile" className="action-card">
              <FaUser className="action-icon" />
              <h3>Update Profile</h3>
              <p>Manage your account</p>
            </Link>
          </div>
        </div>
      )}

      {user?.role === 'professional' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/queries/new" className="action-card">
              <FaPlus className="action-icon" />
              <h3>Create New Query</h3>
              <p>Ask a question to expert reviewers</p>
            </Link>
            <Link to="/queries" className="action-card">
              <FaQuestionCircle className="action-icon" />
              <h3>View My Queries</h3>
              <p>Check your query history</p>
            </Link>
            <Link to="/profile" className="action-card">
              <FaUser className="action-icon" />
              <h3>Update Profile</h3>
              <p>Manage your account</p>
            </Link>
          </div>
        </div>
      )}

      {user?.role === 'expert_reviewer' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Expert Reviewer Actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/queries" className="action-card">
              <FaQuestionCircle className="action-icon" />
              <h3>View All Queries</h3>
              <p>Answer student questions</p>
            </Link>
            <Link to="/profile" className="action-card">
              <FaUser className="action-icon" />
              <h3>Update Profile</h3>
              <p>Manage your account</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;