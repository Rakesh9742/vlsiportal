import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaSearch, FaEdit, FaEye, FaCalendar, FaUser } from 'react-icons/fa';
import './Queries.css';

const QueryList = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const response = await axios.get('/queries');
      setQueries(response.data.queries);
    } catch (error) {
      setError('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (query.category && query.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCount = (status) => {
    return queries.filter(q => q.status === status).length;
  };

  if (loading) {
    return (
      <div className="queries-page">
        <div className="loading">Loading queries...</div>
      </div>
    );
  }

  return (
    <div className="queries-page">
      <div className="page-header">
        <div className="header-content">
          <h1>{user?.role === 'teacher' ? 'Dashboard' : 'Queries'}</h1>
          <p>{user?.role === 'teacher' ? 'Review and respond to student queries' : 'Manage and track your VLSI design queries'}</p>
        </div>
        <div className="header-actions">
          {user?.role === 'student' && (
            <Link to="/queries/new" className="btn btn-primary">
              <FaPlus />
              New Query
            </Link>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="queries-stats">
        <div className="stat-card">
          <h3>Total</h3>
          <span className="stat-number">{queries.length}</span>
        </div>
        <div className="stat-card">
          <h3>Open</h3>
          <span className="stat-number">{getStatusCount('open')}</span>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <span className="stat-number">{getStatusCount('in_progress')}</span>
        </div>
        <div className="stat-card">
          <h3>Resolved</h3>
          <span className="stat-number">{getStatusCount('resolved')}</span>
        </div>
        <div className="stat-card">
          <h3>Closed</h3>
          <span className="stat-number">{getStatusCount('closed')}</span>
        </div>
      </div>

      <div className="queries-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="queries-list">
        {filteredQueries.length === 0 ? (
          <div className="empty-state">
            <p>No queries found matching your criteria.</p>
            {user?.role === 'student' && (
              <Link to="/queries/new" className="btn btn-primary">
                <FaPlus />
                Create Your First Query
              </Link>
            )}
          </div>
        ) : (
          filteredQueries.map(query => (
            <div key={query.id} className={`query-item ${query.status}`}>
              <div className="query-row">
                <div className="query-title">
                  <Link to={`/queries/${query.id}`} className="query-link">
                    {query.title}
                  </Link>
                </div>
                
                <div className="query-info">
                  <div className="info-item">
                    <span className="info-value">{query.student_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-value">
                      {new Date(query.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="query-status">
                  <span className={`status-indicator ${query.status}`}>
                    {query.status === 'open' && 'Open'}
                    {query.status === 'in_progress' && 'In Progress'}
                    {query.status === 'resolved' && 'Resolved'}
                    {query.status === 'closed' && 'Closed'}
                  </span>
                </div>

                <div className="query-actions">
                  {user?.role === 'teacher' && (
                    <Link to={`/queries/${query.id}/edit`} className="edit-query-btn">
                      <FaEdit />
                      Edit
                    </Link>
                  )}
                  <Link to={`/queries/${query.id}`} className="btn btn-outline">
                    <FaEye />
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QueryList; 