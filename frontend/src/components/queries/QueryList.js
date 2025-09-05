import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaSearch, FaEdit, FaEye, FaCalendar, FaUser, FaDownload, FaQuestionCircle, FaCheckCircle } from 'react-icons/fa';
import './Queries.css';

const QueryList = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [resolvedQueries, setResolvedQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [domains, setDomains] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('my-queries');
  const [resolvedLoading, setResolvedLoading] = useState(false);

  useEffect(() => {
    fetchQueries();
    if (user?.role === 'expert_reviewer') {
      fetchDomains();
    }
  }, [user?.role]);

  useEffect(() => {
    if (activeTab === 'resolved-queries' && user?.role === 'student') {
      fetchResolvedQueries();
    }
  }, [activeTab, user?.role]);

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

  const fetchResolvedQueries = async () => {
    try {
      setResolvedLoading(true);
      const response = await axios.get('/queries/resolved-domain');
      setResolvedQueries(response.data.queries || []);
    } catch (error) {
      setError('Failed to fetch resolved queries');
    } finally {
      setResolvedLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/auth/domains');
      setDomains(response.data.domains);
    } catch (error) {
    }
  };

  const getCurrentQueries = () => {
    return activeTab === 'resolved-queries' ? resolvedQueries : queries;
  };

  const filteredQueries = getCurrentQueries().filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (query.category && query.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (query.technology && query.technology.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (query.custom_query_id && query.custom_query_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         query.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    
    const matchesDomain = domainFilter === 'all' || query.student_domain === domainFilter;
    
    return matchesSearch && matchesStatus && matchesDomain;
  });

  const getStatusCount = (status) => {
    const currentQueries = getCurrentQueries();
    return currentQueries.filter(q => q.status === status).length;
  };

  const currentQueries = getCurrentQueries();
  const totalQueries = currentQueries.length;
  const openQueries = currentQueries.filter(q => q.status === 'open').length;
  const inProgressQueries = currentQueries.filter(q => q.status === 'in_progress').length;
  const resolvedQueriesCount = currentQueries.filter(q => q.status === 'resolved').length;

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const endpoint = activeTab === 'resolved-queries' ? '/queries/export-resolved-domain' : '/queries/export';
      const response = await axios.get(endpoint, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = activeTab === 'resolved-queries' ? 
        `resolved_queries_${new Date().toISOString().split('T')[0]}.zip` :
        `queries_${new Date().toISOString().split('T')[0]}.zip`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export queries');
    } finally {
      setExporting(false);
    }
  };

  const exportSingleQuery = async (queryId, queryTitle) => {
    try {
      const response = await axios.get(`/queries/${queryId}/export`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `query_${queryId}_${queryTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export query');
    }
  };

  if (loading || (activeTab === 'resolved-queries' && resolvedLoading)) {
    return (
      <div className="queries-page">
        <div className="loading">
          Loading {activeTab === 'resolved-queries' ? 'resolved queries' : 'queries'}...
        </div>
      </div>
    );
  }

  return (
    <div className="queries-page">
      <div className="page-header">
        <div className="header-content">
                <h1>{user?.role === 'expert_reviewer' ? 'Dashboard' : user?.role === 'admin' ? 'Query Management' : 'Queries'}</h1>
      <p>{user?.role === 'expert_reviewer' ? 'Review and respond to student queries' : user?.role === 'admin' ? 'Manage and respond to all student queries' : 'Manage and track your VLSI design queries'}</p>
        </div>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <button 
              onClick={exportToCSV} 
              className="btn btn-secondary"
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <div className="spinner"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <FaDownload />
                  Export Resolved
                </>
              )}
            </button>
          )}
          {(user?.role === 'student' || user?.role === 'professional') && activeTab === 'my-queries' && (
            <Link to="/queries/new" className="btn btn-primary">
              <FaPlus /> Create New Query
            </Link>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {user?.role === 'student' && (
        <div className="query-tabs">
          <button 
            className={`tab-button ${activeTab === 'my-queries' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-queries')}
          >
            <FaQuestionCircle /> My Queries
          </button>
          <button 
            className={`tab-button ${activeTab === 'resolved-queries' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolved-queries')}
          >
            <FaCheckCircle /> Resolved Queries
          </button>
        </div>
      )}

      {activeTab !== 'resolved-queries' && (
        <div className="queries-stats">
          <div className="stat-card">
            <h3>Total</h3>
            <span className="stat-number">{totalQueries}</span>
          </div>
          <div className="stat-card">
            <h3>Open</h3>
            <span className="stat-number">{openQueries}</span>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <span className="stat-number">{inProgressQueries}</span>
          </div>
          <div className="stat-card">
            <h3>Resolved</h3>
            <span className="stat-number">{resolvedQueriesCount}</span>
          </div>
          {(user?.role === 'expert_reviewer' || user?.role === 'admin') && domainFilter !== 'all' && (
            <div className="stat-card domain-filtered">
              <h3>Domain Filtered</h3>
              <span className="stat-number">{filteredQueries.length}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'resolved-queries' && (
          <div className="resolved-queries-header">
            <h3>Resolved Queries from Your Domain</h3>
            <p>Learn from resolved queries submitted by other students in your domain.</p>
          </div>
        )}

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
            {activeTab !== 'resolved-queries' && (
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            )}
          </div>
          
          {(user?.role === 'expert_reviewer' || user?.role === 'admin') && (
            <div className="filter-group">
              <label htmlFor="domainFilter">Domain:</label>
              <select
                id="domainFilter"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Domains</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.name}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {(statusFilter !== 'all' || domainFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setDomainFilter('all');
                setSearchTerm('');
              }}
              className="btn btn-outline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="queries-list">
        {filteredQueries.length === 0 ? (
          <div className="empty-state">
            <p>No queries found matching your criteria.</p>
            {(user?.role === 'student' || user?.role === 'professional') && (
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
                  {activeTab !== 'resolved-queries' && (
                    <div className="query-id">ID: {query.custom_query_id || query.id}</div>
                  )}
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
                  {query.technology && (
                    <div className="info-item">
                      <span className="info-value">{query.technology}</span>
                    </div>
                  )}
                </div>

                <div className="query-status">
                  <span className={`status-indicator ${query.status}`}>
                    {query.status === 'open' && 'Open'}
                    {query.status === 'in_progress' && 'In Progress'}
                    {query.status === 'resolved' && 'Resolved'}

                  </span>
                </div>

                <div className="query-actions">
                  {(user?.role === 'expert_reviewer' || user?.role === 'admin') && (
                    <>
                      <Link to={`/queries/${query.id}/edit`} className="edit-query-btn">
                        <FaEdit />
                        Edit
                      </Link>
                      {user?.role === 'admin' && query.status === 'resolved' && (
                        <button 
                          onClick={() => exportSingleQuery(query.id, query.title)}
                          className="btn btn-secondary export-btn"
                          title="Export this resolved query to CSV"
                        >
                          <FaDownload />
                          Export
                        </button>
                      )}
                    </>
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