import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaUsers, FaClipboardList, FaChartBar, FaUserTie, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQueries: 0,
    totalExpertReviewers: 0,
    openQueries: 0,
    inProgressQueries: 0,
    resolvedQueries: 0,
    unassignedQueries: 0
  });
  const [domainStats, setDomainStats] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/queries');
      return;
    }
    
    fetchAnalytics();
  }, [user, navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch basic stats
      const usersRes = await axios.get('/auth/users');
      const queriesRes = await axios.get('/admin/queries');
      const unassignedRes = await axios.get('/admin/queries/unassigned');
      const workloadRes = await axios.get('/admin/expert-reviewers/workload');
      const domainStatsRes = await axios.get('/admin/statistics/domains');
      
      const totalUsers = usersRes.data.users.length;
      const totalExpertReviewers = usersRes.data.users.filter(u => u.role === 'expert_reviewer').length;
      const totalQueries = queriesRes.data.queries.length;
      const openQueries = queriesRes.data.queries.filter(q => q.status === 'open').length;
      const inProgressQueries = queriesRes.data.queries.filter(q => q.status === 'in_progress').length;
      const resolvedQueries = queriesRes.data.queries.filter(q => q.status === 'resolved').length;
      const unassignedQueries = unassignedRes.data.queries.length;
      
      setStats({
        totalUsers,
        totalQueries,
        totalExpertReviewers,
        openQueries,
        inProgressQueries,
        resolvedQueries,
        unassignedQueries
      });
      
      setWorkload(workloadRes.data.workload);
      setDomainStats(domainStatsRes.data.statistics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <FaCheckCircle className="status-icon resolved" />;
      case 'in_progress':
        return <FaClock className="status-icon in-progress" />;
      case 'open':
        return <FaExclamationTriangle className="status-icon open" />;
      default:
        return <FaClipboardList className="status-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="admin-analytics">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <div className="page-header">
        <button 
          onClick={() => navigate('/admin')} 
          className="back-btn"
        >
          <FaArrowLeft /> Back to Admin Dashboard
        </button>
        <h1>Analytics Dashboard</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-overview">
        <div className="stat-card primary">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">
            <FaClipboardList />
          </div>
          <div className="stat-content">
            <h3>{stats.totalQueries}</h3>
            <p>Total Queries</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <FaUserTie />
          </div>
          <div className="stat-content">
            <h3>{stats.totalExpertReviewers}</h3>
            <p>Expert Reviewers</p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <h3>{stats.unassignedQueries}</h3>
            <p>Unassigned Queries</p>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-section">
          <h3>Query Status Distribution</h3>
          <div className="status-cards">
            <div className="status-card open">
              {getStatusIcon('open')}
              <div className="status-info">
                <h4>{stats.openQueries}</h4>
                <p>Open</p>
              </div>
            </div>
            <div className="status-card in-progress">
              {getStatusIcon('in_progress')}
              <div className="status-info">
                <h4>{stats.inProgressQueries}</h4>
                <p>In Progress</p>
              </div>
            </div>
            <div className="status-card resolved">
              {getStatusIcon('resolved')}
              <div className="status-info">
                <h4>{stats.resolvedQueries}</h4>
                <p>Resolved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-section">
          <h3>Domain Statistics</h3>
          <div className="domain-stats">
            {domainStats.map(domain => (
              <div key={domain.id} className="domain-card">
                <h4>{domain.domain_name}</h4>
                <div className="domain-metrics">
                  <div className="metric">
                    <span className="label">Students:</span>
                    <span className="value">{domain.total_students}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Experts:</span>
                    <span className="value">{domain.total_experts}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Queries:</span>
                    <span className="value">{domain.total_queries}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Open:</span>
                    <span className="value open">{domain.open_queries}</span>
                  </div>
                  <div className="metric">
                    <span className="label">In Progress:</span>
                    <span className="value in-progress">{domain.in_progress_queries}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Resolved:</span>
                    <span className="value resolved">{domain.resolved_queries}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-section">
          <h3>Expert Reviewer Workload</h3>
          <div className="workload-stats">
            {workload.map(reviewer => (
              <div key={reviewer.id} className="workload-card">
                <div className="reviewer-header">
                  <h4>{reviewer.full_name}</h4>
                  <span className="domain">{reviewer.domain_name}</span>
                </div>
                <div className="workload-metrics">
                  <div className="metric">
                    <span className="label">Total:</span>
                    <span className="value">{reviewer.total_assignments}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Pending:</span>
                    <span className="value pending">{reviewer.pending_assignments}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Accepted:</span>
                    <span className="value accepted">{reviewer.accepted_assignments}</span>
                  </div>
                  <div className="metric">
                    <span className="label">Completed:</span>
                    <span className="value completed">{reviewer.completed_assignments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
