import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaSearch, FaFilter, FaEye, FaEdit, FaTrash, FaUser, FaClipboardList, FaUserPlus } from 'react-icons/fa';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/Select';
import './QueryManagement.css';

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
  }, [user, navigate, searchParams]);

  const fetchQueries = async () => {
    try {
      const response = await axios.get('/admin/queries');
      setQueries(response.data.queries);
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



  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (query.custom_query_id && query.custom_query_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         query.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    const matchesDomain = domainFilter === 'all' || query.student_domain === domainFilter;
    
    // Handle unassigned filter from URL parameter
    const filter = searchParams.get('filter');
    const matchesAssignment = filter === 'unassigned' ? !query.expert_reviewer_id : true;
    
    return matchesSearch && matchesStatus && matchesDomain && matchesAssignment;
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
        <h1>
          {searchParams.get('filter') === 'unassigned' ? 'Unassigned Queries' : 'Query Management'}
        </h1>
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
          <div className="list-stats">
            <span>Open: {queries.filter(q => q.status === 'open').length}</span>
            <span>In Progress: {queries.filter(q => q.status === 'in_progress').length}</span>
            <span>Resolved: {queries.filter(q => q.status === 'resolved').length}</span>
          </div>
        </div>

        <div className="queries-table-container">
          <table className="queries-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Student</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Assigned Expert</th>
                <th>Edit</th>
                <th>Assign</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueries.map(query => (
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
                  <td className="action-cell edit-cell" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => navigate(`/queries/${query.id}/edit`, { state: { from: '/admin/queries' } })}
                      className="action-btn edit"
                      title="Edit Query"
                    >
                      <FaEdit />
                    </button>
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
