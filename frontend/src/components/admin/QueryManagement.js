import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaSearch, FaFilter, FaEye, FaTrash, FaUser, FaClipboardList, FaUserPlus, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/Select';
import './QueryManagement.css';

const ITEMS_PER_PAGE = 10;

const QueryManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [domains, setDomains] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    expert_reviewer_id: '',
    notes: ''
  });
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [expertFilter, setExpertFilter] = useState('all');
  const [assignedExperts, setAssignedExperts] = useState([]);
  const [responderFilter, setResponderFilter] = useState('all');
  const [lastResponders, setLastResponders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!['admin', 'domain_admin'].includes(user?.role)) {
      navigate('/queries');
      return;
    }

    // Set initial filters based on URL parameters
    const filter = searchParams.get('filter');
    if (filter === 'unassigned') {
      setStatusFilter('open'); // Show open queries for unassigned filter
    }

    fetchQueries();
    fetchDomains();
    fetchAssignedExperts();
  }, [user, navigate, searchParams]);

  const fetchQueries = async () => {
    try {
      const response = await axios.get('/admin/queries');
      setQueries(response.data.queries);

      // Update assigned experts list
      const expertMap = new Map();
      response.data.queries.forEach(query => {
        if (query.assigned_expert_name && query.expert_reviewer_id) {
          if (!expertMap.has(query.expert_reviewer_id)) {
            expertMap.set(query.expert_reviewer_id, {
              id: query.expert_reviewer_id,
              name: query.assigned_expert_name
            });
          }
        }
      });
      setAssignedExperts(Array.from(expertMap.values()));

      // Update last responders list
      const responderMap = new Map();
      response.data.queries.forEach(query => {
        if (query.last_responder_name) {
          const key = query.last_responder_name;
          if (!responderMap.has(key)) {
            responderMap.set(key, {
              name: query.last_responder_name,
              role: query.last_responder_role
            });
          }
        }
      });
      setLastResponders(Array.from(responderMap.values()));
    } catch (error) {
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
    }
  };

  const fetchAssignedExperts = async () => {
    try {
      const response = await axios.get('/admin/queries');
      // Extract unique experts who have queries assigned
      const uniqueExperts = [];
      const expertMap = new Map();

      response.data.queries.forEach(query => {
        if (query.assigned_expert_name && query.expert_reviewer_id) {
          if (!expertMap.has(query.expert_reviewer_id)) {
            expertMap.set(query.expert_reviewer_id, {
              id: query.expert_reviewer_id,
              name: query.assigned_expert_name
            });
          }
        }
      });

      setAssignedExperts(Array.from(expertMap.values()));
    } catch (error) {
      console.error('Error fetching assigned experts:', error);
    }
  };

  const fetchReviewers = async (domainName = null) => {
    try {
      let url = '/auth/assignees';
      if (domainName) {
        url = `/auth/assignees/domain/${encodeURIComponent(domainName)}`;
      }
      const response = await axios.get(url);
      setReviewers(response.data.assignees);
    } catch (error) {
      // Fallback to all reviewers
      if (domainName) {
        fetchReviewers();
      }
    }
  };

  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm('Are you sure you want to delete this query? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/admin/queries/${queryId}`);
      setQueries(queries.filter(q => q.id !== queryId));
    } catch (error) {
      setError('Failed to delete query');
    }
  };

  const handleAssignQuery = async (query) => {
    setSelectedQuery(query);
    setAssignmentData({
      expert_reviewer_id: '',
      notes: ''
    });

    // Fetch reviewers for the specific domain
    await fetchReviewers(query.student_domain);
    setShowAssignModal(true);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();

    try {
      // Ensure expert_reviewer_id is sent as an integer
      const dataToSend = {
        ...assignmentData,
        expert_reviewer_id: parseInt(assignmentData.expert_reviewer_id, 10)
      };

      if (selectedQuery.expert_reviewer_id) {
        // Reassign existing assignment
        await axios.put(`/admin/queries/${selectedQuery.id}/reassign`, dataToSend);
      } else {
        // Create new assignment
        await axios.post(`/admin/queries/${selectedQuery.id}/assign`, dataToSend);
      }

      // Refresh queries
      await fetchQueries();

      setShowAssignModal(false);
      setSelectedQuery(null);
      setAssignmentData({ expert_reviewer_id: '', notes: '' });
    } catch (error) {
      setError('Failed to assign query');
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

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <FaSort className="sort-icon" />;
    }
    return sortDirection === 'asc' ?
      <FaSortUp className="sort-icon active" /> :
      <FaSortDown className="sort-icon active" />;
  };

  // Get URL filter once to avoid re-computation on every render
  const urlFilter = searchParams.get('filter');

  const filteredQueries = queries.filter(query => {
    const hasAssignedExpert = query.expert_reviewer_id !== null &&
      query.expert_reviewer_id !== undefined &&
      query.expert_reviewer_id !== '';
    const queryExpertId = hasAssignedExpert ? String(query.expert_reviewer_id) : '';

    const normalizedResponder = (query.last_responder_name || '').trim().toLowerCase();
    const selectedResponder = (responderFilter || '').trim().toLowerCase();

    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (query.custom_query_id && query.custom_query_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      query.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    const matchesDomain = domainFilter === 'all' || query.student_domain === domainFilter;

    // Expert filter
    const matchesExpert = expertFilter === 'all' ||
      (expertFilter === 'unassigned' ? !hasAssignedExpert :
        queryExpertId === String(expertFilter));

    // Responder filter
    const matchesResponder = responderFilter === 'all' ||
      (responderFilter === 'no_response' ? !normalizedResponder :
        normalizedResponder === selectedResponder);

    // Handle unassigned filter from URL parameter.
    // If a specific expert is selected, do not force URL unassigned filter.
    const isSpecificExpertSelected = expertFilter !== 'all' && expertFilter !== 'unassigned';
    const matchesAssignment = (urlFilter === 'unassigned' && !isSpecificExpertSelected) ? !hasAssignedExpert : true;

    return matchesSearch && matchesStatus && matchesDomain && matchesExpert && matchesResponder && matchesAssignment;
  }).sort((a, b) => {
    if (!sortField) return 0;

    let aValue, bValue;

    switch (sortField) {
      case 'assigned_expert':
        aValue = a.assigned_expert_name || '';
        bValue = b.assigned_expert_name || '';
        break;
      case 'created_date':
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
      case 'response_date':
        aValue = new Date(a.last_response_date || 0);
        bValue = new Date(b.last_response_date || 0);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  useEffect(() => {
    // Keep pagination consistent whenever search/filter/sort conditions change.
    setCurrentPage(1);
  }, [searchTerm, statusFilter, domainFilter, expertFilter, responderFilter, sortField, sortDirection, urlFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQueries.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQueries = filteredQueries.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (pageNumber) => {
    const next = Math.max(1, Math.min(totalPages, pageNumber));
    setCurrentPage(next);
  };

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
        <h1>
          {searchParams.get('filter') === 'unassigned' ? 'Unassigned Queries' : 'Query Management'}
        </h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="filter-group">
            <label htmlFor="domain-filter">Domain:</label>
            <Select
              value={domainFilter}
              onValueChange={(value) => setDomainFilter(value)}
            >
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map(domain => (
                    <SelectItem key={domain.id} value={domain.name}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="queries-list">
        <div className="list-header">
          <h3>Queries ({filteredQueries.length})</h3>
          <div className="list-controls">
            <div className="search-box table-search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search queries in table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="list-stats">
              <span>Open: {queries.filter(q => q.status === 'open').length}</span>
              <span>In Progress: {queries.filter(q => q.status === 'in_progress').length}</span>
              <span>Resolved: {queries.filter(q => q.status === 'resolved').length}</span>
            </div>
          </div>
        </div>

        <div className="queries-table-container">
          <table className="queries-table">
            <thead>
              <tr>
                <th className="query-id-header">ID</th>
                <th className="query-title-header">Title</th>
                <th>Student</th>
                <th>Domain</th>
                <th>Status</th>
                <th className="expert-filter-header">
                  <div className="header-with-filter">
                    <span>Assigned Expert</span>
                    <Select
                      value={expertFilter}
                      onValueChange={(value) => setExpertFilter(value)}
                    >
                      <SelectTrigger className="table-filter-select">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {assignedExperts.map(expert => (
                            <SelectItem key={expert.id} value={expert.id.toString()}>
                              {expert.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('created_date')}
                  className="sortable-header"
                  style={{ cursor: 'pointer' }}
                >
                  Created Date {getSortIcon('created_date')}
                </th>
                <th
                  onClick={() => handleSort('response_date')}
                  className="sortable-header"
                  style={{ cursor: 'pointer' }}
                >
                  Last Response Date {getSortIcon('response_date')}
                </th>
                <th className="responder-filter-header">
                  <div className="header-with-filter">
                    <span>Last Responder</span>
                    <Select
                      value={responderFilter}
                      onValueChange={(value) => setResponderFilter(value)}
                    >
                      <SelectTrigger className="table-filter-select">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="no_response">No Response</SelectItem>
                          {lastResponders.map((responder, index) => (
                            <SelectItem key={index} value={responder.name}>
                              {responder.name} ({responder.role})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </th>
                <th>Assign</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQueries.map(query => (
                <tr
                  key={query.id}
                  className="query-table-row"
                  onClick={() => navigate(`/queries/${query.id}/edit`, { state: { from: '/admin/queries' } })}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="query-id">{query.custom_query_id || query.id}</td>
                  <td className="query-title-cell">
                    <div className="title-content">{query.title}</div>
                  </td>
                  <td className="student-cell">{query.student_name}</td>
                  <td className="domain-cell">{query.student_domain || 'Not specified'}</td>
                  <td className="status-cell">
                    {getStatusBadge(query.status)}
                  </td>
                  <td className="expert-cell">
                    {query.assigned_expert_name ? (
                      <span className="assigned-expert">{query.assigned_expert_name}</span>
                    ) : (
                      <span className="unassigned-text">Unassigned</span>
                    )}
                  </td>
                  <td className="date-cell">
                    {query.created_at ? new Date(query.created_at).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td className="date-cell">
                    {query.last_response_date ? new Date(query.last_response_date).toLocaleDateString('en-GB') : 'N/A'}
                  </td>
                  <td className="responder-cell">
                    {query.last_responder_name ? (
                      <span className="responder-name" title={`Role: ${query.last_responder_role || 'Unknown'}`}>
                        {query.last_responder_name}
                      </span>
                    ) : (
                      <span className="no-response-text">No responses</span>
                    )}
                  </td>
                  <td className="action-cell assign-cell" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleAssignQuery(query)}
                      className="action-btn assign"
                      title={query.expert_reviewer_id ? "Reassign Query" : "Assign Query"}
                    >
                      <FaUserPlus />
                    </button>
                  </td>
                  <td className="action-cell delete-cell" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDeleteQuery(query.id)}
                      className="action-btn delete"
                      title="Delete Query"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQueries.length > 0 && (
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredQueries.length)} of {filteredQueries.length}
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(page => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - safeCurrentPage) <= 1;
                })
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="pagination-ellipsis">...</span>
                    )}
                    <button
                      className={`pagination-btn page-number ${safeCurrentPage === page ? 'active' : ''}`}
                      onClick={() => goToPage(page)}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}

              <button
                className="pagination-btn"
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {filteredQueries.length === 0 && (
          <div className="empty-state">
            <FaClipboardList className="empty-icon" />
            <p>No queries found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedQuery && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedQuery.expert_reviewer_id ? 'Reassign Query' : 'Assign Query'}</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="query-summary">
                <h4>{selectedQuery.title}</h4>
                <div className="summary-details">
                  <span><FaUser /> {selectedQuery.student_name}</span>
                  <span><FaClipboardList /> {selectedQuery.student_domain || 'Not specified'}</span>
                  <span>Status: {selectedQuery.status}</span>
                </div>
              </div>

              <form onSubmit={handleAssignmentSubmit}>
                <div className="form-group">
                  <label htmlFor="expert_reviewer_id">
                    Expert Reviewer *
                    {selectedQuery.student_domain && (
                      <span className="domain-filter-note">
                        (Filtered for {selectedQuery.student_domain} domain)
                        <button
                          type="button"
                          onClick={() => fetchReviewers()}
                          className="btn-link"
                        >
                          Show all
                        </button>
                      </span>
                    )}
                  </label>
                  <Select
                    value={assignmentData.expert_reviewer_id}
                    onValueChange={(value) => setAssignmentData(prev => ({
                      ...prev,
                      expert_reviewer_id: value
                    }))}
                    required
                  >
                    <SelectTrigger className="form-control">
                      <SelectValue placeholder="Select Expert Reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {reviewers.map(reviewer => (
                          <SelectItem key={reviewer.id} value={reviewer.id}>
                            {reviewer.full_name} ({reviewer.domain_name})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    value={assignmentData.notes}
                    onChange={(e) => setAssignmentData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    placeholder="Add any notes for the assignment..."
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!assignmentData.expert_reviewer_id}
                  >
                    {selectedQuery.expert_reviewer_id ? 'Reassign' : 'Assign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryManagement;
