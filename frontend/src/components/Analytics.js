import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaChartBar, FaUsers, FaCheckCircle, FaTimes, FaExclamationTriangle, FaTools, FaClock, FaGraduationCap, FaCalendar, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import './Analytics.css';

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalQueries: 0,
    respondedQueries: 0,
    openQueries: 0,
    inProgressQueries: 0,
    resolvedQueries: 0,
    responseRate: 0,
    averageResponseTime: 0,
    monthlyStats: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, month, week

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/queries');
      const queries = response.data.queries;

      // Calculate analytics
      const totalQueries = queries.length;
      const respondedQueries = queries.filter(q => q.responses && q.responses.length > 0).length;
      const openQueries = queries.filter(q => q.status === 'open').length;
      const inProgressQueries = queries.filter(q => q.status === 'in_progress').length;
      const resolvedQueries = queries.filter(q => q.status === 'resolved').length;

      const responseRate = totalQueries > 0 ? ((respondedQueries / totalQueries) * 100).toFixed(1) : 0;

      // Calculate average response time (simplified)
      const queriesWithResponses = queries.filter(q => q.responses && q.responses.length > 0);
      let totalResponseTime = 0;
      queriesWithResponses.forEach(query => {
        if (query.responses && query.responses.length > 0) {
          const firstResponse = query.responses[0];
          const queryDate = new Date(query.created_at);
          const responseDate = new Date(firstResponse.created_at);
          totalResponseTime += (responseDate - queryDate) / (1000 * 60 * 60); // hours
        }
      });
      const averageResponseTime = queriesWithResponses.length > 0 ? (totalResponseTime / queriesWithResponses.length).toFixed(1) : 0;

      // Monthly stats (last 6 months)
      const monthlyStats = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short' });
        const monthQueries = queries.filter(q => {
          const queryDate = new Date(q.created_at);
          return queryDate.getMonth() === month.getMonth() && queryDate.getFullYear() === month.getFullYear();
        });
        monthlyStats.push({
          month: monthName,
          queries: monthQueries.length,
          responded: monthQueries.filter(q => q.responses && q.responses.length > 0).length,
          resolved: monthQueries.filter(q => q.status === 'resolved').length
        });
      }

      // Recent activity (last 10 queries)
      const recentActivity = queries
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      setAnalytics({
        totalQueries,
        respondedQueries,
        openQueries,
        inProgressQueries,
        resolvedQueries,
        responseRate,
        averageResponseTime,
        monthlyStats,
        recentActivity
      });
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
        return <FaClock className="status-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive overview of query statistics and performance</p>
        </div>
        <div className="time-filter">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-content">
            <h3>Total Queries</h3>
            <div className="metric-value">{analytics.totalQueries}</div>
            <div className="metric-trend">
              <FaArrowUp className="trend-up" />
              <span>All time queries</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon responded">
            <FaCheckCircle />
          </div>
          <div className="metric-content">
            <h3>Responded</h3>
            <div className="metric-value">{analytics.respondedQueries}</div>
            <div className="metric-trend">
              <FaArrowUp className="trend-up" />
              <span>{analytics.responseRate}% response rate</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon resolved">
            <FaCheckCircle />
          </div>
          <div className="metric-content">
            <h3>Resolved</h3>
            <div className="metric-value">{analytics.resolvedQueries}</div>
            <div className="metric-trend">
              <FaArrowUp className="trend-up" />
              <span>Successfully resolved</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon time">
            <FaClock />
          </div>
          <div className="metric-content">
            <h3>Avg Response Time</h3>
            <div className="metric-value">{analytics.averageResponseTime}h</div>
            <div className="metric-trend">
              <FaArrowDown className="trend-down" />
              <span>Faster responses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="analytics-section">
        <h2>Monthly Trends</h2>
        <div className="monthly-chart">
          {analytics.monthlyStats.map((stat, index) => (
            <div key={index} className="month-bar">
              <div className="bar-container">
                <div 
                  className="bar-fill queries" 
                  style={{ height: `${(stat.queries / Math.max(...analytics.monthlyStats.map(s => s.queries))) * 100}%` }}
                ></div>
                <div 
                  className="bar-fill responded" 
                  style={{ height: `${(stat.responded / Math.max(...analytics.monthlyStats.map(s => s.responded))) * 100}%` }}
                ></div>
                <div 
                  className="bar-fill resolved" 
                  style={{ height: `${(stat.resolved / Math.max(...analytics.monthlyStats.map(s => s.resolved))) * 100}%` }}
                ></div>
              </div>
              <div className="month-label">{stat.month}</div>
              <div className="month-stats">
                <div className="stat-item">
                  <span className="stat-label">Total</span>
                  <span className="stat-value">{stat.queries}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Responded</span>
                  <span className="stat-value">{stat.responded}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Resolved</span>
                  <span className="stat-value">{stat.resolved}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 