import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaUser, FaClipboardList } from 'react-icons/fa';
import './QueryManagement.css';

const QueryManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/queries');
      return;
    }
    
    fetchQueries();
    fetchDomains();
  }, [user, navigate]);

  const fetchQueries = async () => {
    try {
      const response = await axios.get('/admin/queries');
      setQueries(response.data.queries);
    } catch (error) {
      console.error('Error fetching queries:', error);
      setError('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/auth/domains');
      setDomains(response.data.domains);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/queries/${queryId}`);
      setQueries(queries.filter(q => q.id !== queryId));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete query');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'open': 'status-open',
      'in_progress': 'status-in-progress',
      'resolved': 'status-resolved'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-open'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getAssignmentBadge = (assigned) => {
    return assigned ? (
      <span className="assignment-badge assigned">ASSIGNED</span>
    ) : (
      <span className="assignment-badge unassigned">UNASSIGNED</span>
    );
  };

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    const matchesDomain = domainFilter === 'all' || query.student_domain === domainFilter;
    
    return matchesSearch && matchesStatus && matchesDomain;
  });

  if (loading) {
    return (
      <div className="query-management">
        <div className="loading">Loading queries...</div>
      </div>
    );
  }

  return (
    <div className="query-management">
      <div className="page-header">
        <button 
          onClick={() => navigate('/admin')} 
          className="back-btn"
        >
          <FaArrowLeft /> Back to Admin Dashboard
        </button>
        <h1>Query Management</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search queries by title, student, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="domain-filter">Domain:</label>
            <select
              id="domain-filter"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Domains</option>
              {domains.map(domain => (
                <option key={domain.id} value={domain.name}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="queries-list">
        <div className="list-header">
          <h3>Queries ({filteredQueries.length})</h3>
          <div className="list-stats">
            <span>Open: {queries.filter(q => q.status === 'open').length}</span>
            <span>In Progress: {queries.filter(q => q.status === 'in_progress').length}</span>
            <span>Resolved: {queries.filter(q => q.status === 'resolved').length}</span>
          </div>
        </div>

        <div className="queries-grid">
          {filteredQueries.map(query => (
            <div key={query.id} className="query-card">
              <div className="query-header">
                <div className="query-title">
                  <h4>{query.title}</h4>
                  <div className="query-badges">
                    {getStatusBadge(query.status)}
                    {getAssignmentBadge(query.expert_reviewer_id)}
                  </div>
                </div>
                <div className="query-actions">
                  <button 
                    onClick={() => navigate(`/queries/${query.id}`)}
                    className="action-btn view"
                    title="View Query"
                  >
                    <FaEye />
                  </button>
                  <button 
                    onClick={() => navigate(`/queries/${query.id}/edit`)}
                    className="action-btn edit"
                    title="Edit Query"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDeleteQuery(query.id)}
                    className="action-btn delete"
                    title="Delete Query"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="query-details">
                <div className="detail-row">
                  <span className="detail-label">Student:</span>
                  <span className="detail-value">
                    <FaUser className="detail-icon" />
                    {query.student_name}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Domain:</span>
                  <span className="detail-value">{query.student_domain || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Stage:</span>
                  <span className="detail-value">{query.design_stage_name || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tool:</span>
                  <span className="detail-value">{query.tool_name || 'Not specified'}</span>
                </div>
                {query.expert_reviewer_id && (
                  <div className="detail-row">
                    <span className="detail-label">Assigned to:</span>
                    <span className="detail-value">{query.assigned_expert_name}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{new Date(query.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="query-description">
                <p>{query.description.length > 150 ? `${query.description.substring(0, 150)}...` : query.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {filteredQueries.length === 0 && (
          <div className="empty-state">
            <FaClipboardList className="empty-icon" />
            <p>No queries found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryManagement;
