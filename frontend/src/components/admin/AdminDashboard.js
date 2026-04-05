import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
  FaUsers, FaClipboardList, FaChartBar, FaUserPlus,
  FaDownload, FaUserShield, FaExclamationTriangle,
  FaArrowRight, FaShieldAlt, FaSpinner
} from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQueries: 0,
    unassignedQueries: 0,
    totalExpertReviewers: 0,
    openQueries: 0,
    inProgressQueries: 0,
    resolvedQueries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!['admin', 'domain_admin'].includes(user?.role)) {
      navigate('/queries');
      return;
    }
    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [usersRes, queriesRes] = await Promise.all([
        axios.get('/auth/users'),
        axios.get('/admin/queries'),
      ]);
      const users = usersRes.data.users;
      const queries = queriesRes.data.queries;
      setStats({
        totalUsers: users.length,
        totalQueries: queries.length,
        unassignedQueries: queries.filter(q => !q.expert_reviewer_id).length,
        totalExpertReviewers: users.filter(u => u.role === 'expert_reviewer').length,
        openQueries: queries.filter(q => q.status === 'open').length,
        inProgressQueries: queries.filter(q => q.status === 'in_progress').length,
        resolvedQueries: queries.filter(q => q.status === 'resolved').length,
      });
    } catch {
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportQueries = async () => {
    try {
      setError('');
      const response = await axios.get('/queries/export-new', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resolved_queries_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export queries: ' + (err.response?.data?.message || err.message));
    }
  };

  const kpiCards = [
    { label: 'Total Users',       value: stats.totalUsers,           icon: FaUsers,              color: 'indigo',  path: '/admin/users' },
    { label: 'Total Queries',     value: stats.totalQueries,         icon: FaClipboardList,      color: 'violet',  path: '/admin/queries' },
    { label: 'Unassigned',        value: stats.unassignedQueries,    icon: FaExclamationTriangle,color: 'amber',   path: '/admin/queries?filter=unassigned' },
    { label: 'Expert Reviewers',  value: stats.totalExpertReviewers, icon: FaShieldAlt,          color: 'emerald', path: '/admin/expert-reviewers' },
  ];

  const baseNavItems = [
    { icon: FaClipboardList, label: 'Manage Queries',    desc: 'View, filter and manage all queries',        path: '/admin/queries',           color: 'indigo'  },
    { icon: FaUserPlus,      label: 'Assignments',       desc: 'Assign queries to expert reviewers',         path: '/admin/assignments',       color: 'violet'  },
    { icon: FaUsers,         label: 'Manage Users',      desc: 'View and manage user accounts',              path: '/admin/users',             color: 'cyan'    },
    { icon: FaUserPlus,      label: 'Expert Reviewers',  desc: 'Manage the expert reviewer pool',            path: '/admin/expert-reviewers',  color: 'emerald' },
    { icon: FaChartBar,      label: 'Analytics',         desc: 'Detailed reports and insights',              path: '/admin/analytics',         color: 'amber'   },
    { icon: FaDownload,      label: 'Export Data',       desc: 'Download resolved queries as ZIP',           action: handleExportQueries,      color: 'rose'    },
  ];

  const adminOnlyItems = [
    { icon: FaUserShield,          label: 'Domain Admins',   desc: 'Configure domain administrators',    path: '/admin/domain-admins',       color: 'purple' },
    { icon: FaExclamationTriangle, label: 'System Monitor',  desc: 'Check system health and logs',       path: '/admin/system-monitoring',   color: 'red'    },
  ];

  const navItems = user?.role === 'admin' ? [...baseNavItems, ...adminOnlyItems] : baseNavItems;

  const totalForBar = (stats.openQueries + stats.inProgressQueries + stats.resolvedQueries) || 1;

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dash-loading">
          <FaSpinner className="spin-icon" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      {/* Hero Header */}
      <div className="dash-hero">
        <div className="dash-hero-content">
          <div className="dash-hero-badge">
            {user?.role === 'admin' ? 'Super Admin' : 'Domain Admin'}
          </div>
          <h1>Welcome back, <span>{user?.fullName || user?.username}</span></h1>
          <p>Here's an overview of your portal activity.</p>
        </div>
        {user?.role === 'domain_admin' && user?.domain && (
          <div className="dash-domain-pill">
            <FaShieldAlt /> {user.domain}
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiCards.map(({ label, value, icon: Icon, color, path }) => (
          <div key={label} className={`kpi-card kpi-${color}`} onClick={() => navigate(path)}>
            <div className="kpi-icon-wrap">
              <Icon />
            </div>
            <div className="kpi-body">
              <div className="kpi-value">{value}</div>
              <div className="kpi-label">{label}</div>
            </div>
            <FaArrowRight className="kpi-arrow" />
          </div>
        ))}
      </div>

      {/* Query Status Overview */}
      <div className="status-overview">
        <div className="status-ov-header">
          <h2>Query Status Overview</h2>
          <button className="status-ov-link" onClick={() => navigate('/admin/queries')}>
            View All <FaArrowRight />
          </button>
        </div>
        <div className="status-track-row">
          <div className="status-track-item">
            <div className="status-track-top">
              <span className="status-dot s-open"></span>
              <span className="status-track-label">Open</span>
              <span className="status-track-count">{stats.openQueries}</span>
            </div>
            <div className="status-progress-bar">
              <div className="status-fill s-open" style={{ width: `${(stats.openQueries / totalForBar) * 100}%` }}></div>
            </div>
          </div>
          <div className="status-track-item">
            <div className="status-track-top">
              <span className="status-dot s-inprog"></span>
              <span className="status-track-label">In Progress</span>
              <span className="status-track-count">{stats.inProgressQueries}</span>
            </div>
            <div className="status-progress-bar">
              <div className="status-fill s-inprog" style={{ width: `${(stats.inProgressQueries / totalForBar) * 100}%` }}></div>
            </div>
          </div>
          <div className="status-track-item">
            <div className="status-track-top">
              <span className="status-dot s-resolved"></span>
              <span className="status-track-label">Resolved</span>
              <span className="status-track-count">{stats.resolvedQueries}</span>
            </div>
            <div className="status-progress-bar">
              <div className="status-fill s-resolved" style={{ width: `${(stats.resolvedQueries / totalForBar) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="nav-section">
        <h2 className="nav-section-title">Quick Actions</h2>
        <div className="nav-cards-grid">
          {navItems.map(({ icon: Icon, label, desc, path, action, color }) => (
            <div
              key={label}
              className={`nav-card nav-card-${color}`}
              onClick={action ? action : () => navigate(path)}
            >
              <div className="nav-card-icon">
                <Icon />
              </div>
              <div className="nav-card-body">
                <div className="nav-card-title">{label}</div>
                <div className="nav-card-desc">{desc}</div>
              </div>
              <FaArrowRight className="nav-card-arrow" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
