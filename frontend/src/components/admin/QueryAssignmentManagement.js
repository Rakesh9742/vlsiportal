import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FaArrowLeft, 
  FaUserPlus, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaTimes, 
  FaUsers, 
  FaClipboardList,
  FaCalendarAlt,
  FaUser,
  FaTag,
  FaLayerGroup,
  FaExclamationTriangle,
  FaTools,
  FaCheckCircle
} from 'react-icons/fa';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/Select';
import './QueryAssignmentManagement.css';

const QueryAssignmentManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [unassignedQueries, setUnassignedQueries] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState('assigned');

  // Assignment form state
  const [assignmentData, setAssignmentData] = useState({
    expert_reviewer_id: '',
    notes: ''
  });

  useEffect(() => {
    if (!['admin', 'domain_admin'].includes(user?.role)) {
      navigate('/queries');
      return;
    }
    
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all queries with assignment status
      const queriesRes = await axios.get('/admin/queries');
      setQueries(queriesRes.data.queries);
      
      // Fetch unassigned queries
      const unassignedRes = await axios.get('/admin/queries/unassigned');
      setUnassignedQueries(unassignedRes.data.queries);
      
      // Fetch assignees (expert reviewers and admins)
      const assigneesRes = await axios.get('/auth/assignees');
      setReviewers(assigneesRes.data.assignees);
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignQuery = async (query) => {
    setSelectedQuery(query);
    setAssignmentData({
      expert_reviewer_id: '',
      notes: ''
    });
    
    // Fetch assignees for the specific domain
    try {
      if (query.student_domain) {
        const domainAssigneesRes = await axios.get(`/auth/assignees/domain/${encodeURIComponent(query.student_domain)}`);
        setReviewers(domainAssigneesRes.data.assignees);
      } else {
        // If no domain, fetch all assignees
        const assigneesRes = await axios.get('/auth/assignees');
        setReviewers(assigneesRes.data.assignees);
      }
    } catch (error) {
      // Fallback to all assignees
      const assigneesRes = await axios.get('/auth/assignees');
      setReviewers(assigneesRes.data.assignees);
    }
    
    setShowAssignmentModal(true);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Ensure expert_reviewer_id is sent as an integer
      const dataToSend = {
        ...assignmentData,
        expert_reviewer_id: parseInt(assignmentData.expert_reviewer_id, 10)
      };
      await axios.post(`/admin/queries/${selectedQuery.id}/assign`, dataToSend);
      setSuccess('Query assigned successfully!');
      setShowAssignmentModal(false);
      setSelectedQuery(null);
      fetchData(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign query');
    }
  };

  const handleReassignQuery = async (queryId, reviewerId, notes) => {
    try {
      await axios.put(`/admin/queries/${queryId}/reassign`, {
        expert_reviewer_id: parseInt(reviewerId, 10),
        notes: notes
      });
      setSuccess('Query reassigned successfully!');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reassign query');
    }
  };

  const handleRemoveAssignment = async (queryId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      await axios.delete(`/admin/queries/${queryId}/assign`);
      setSuccess('Assignment removed successfully!');
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to remove assignment');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'open': { class: 'status-open', icon: FaExclamationTriangle, label: 'Open' },
      'in_progress': { class: 'status-in-progress', icon: FaTools, label: 'In Progress' },
      'resolved': { class: 'status-resolved', icon: FaCheckCircle, label: 'Resolved' }
    };
    
    const config = statusConfig[status] || statusConfig['open'];
    const IconComponent = config.icon;
    
    return (
      <span className={`status-badge ${config.class}`}>
        <IconComponent className="status-icon" />
        {config.label}
      </span>
    );
  };

  const getAssignmentStatusBadge = (status) => {
    const statusConfig = {
      'assigned': { class: 'assignment-assigned', label: 'Assigned' },
      'accepted': { class: 'assignment-accepted', label: 'Accepted' },
      'rejected': { class: 'assignment-rejected', label: 'Rejected' },
      'completed': { class: 'assignment-completed', label: 'Completed' }
    };
    
    const config = statusConfig[status] || statusConfig['assigned'];
    
    return (
      <span className={`assignment-badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const assignedQueries = queries.filter(q => q.expert_reviewer_id);
  const unassignedCount = unassignedQueries.length;
  const assignedCount = assignedQueries.length;

  if (loading) {
    return (
      <div className="query-assignment-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading query assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="query-assignment-management">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <button 
            onClick={() => navigate('/admin')} 
            className="back-btn"
          >
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
          <div className="header-content">
            <h1>Query Assignment Management</h1>
            <p>Manage and assign queries to expert reviewers</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <FaClipboardList className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{unassignedCount}</span>
              <span className="stat-label">Unassigned</span>
            </div>
          </div>
          <div className="stat-item">
            <FaUsers className="stat-icon" />
            <div className="stat-content">
              <span className="stat-number">{assignedCount}</span>
              <span className="stat-label">Assigned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error-message">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="message success-message">
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'assigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('assigned')}
        >
          <FaUsers />
          <span>Assigned Queries ({assignedCount})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'unassigned' ? 'active' : ''}`}
          onClick={() => setActiveTab('unassigned')}
        >
          <FaClipboardList />
          <span>Unassigned Queries ({unassignedCount})</span>
        </button>
      </div>

      {/* Content Sections */}
      <div className="content-section">
        {activeTab === 'assigned' && (
          <div className="assigned-section">
            {assignedQueries.length > 0 ? (
              <div className="queries-grid">
                {assignedQueries.map(query => (
                  <div key={query.id} className="query-card assigned">
                    <div className="card-header">
                      <div className="query-title">
                        <h4>{query.title}</h4>
                        <div className="query-id">ID: {query.custom_query_id || query.id}</div>
                        <div className="query-meta">
                          <span className="meta-item">
                            <FaUser />
                            {query.student_name}
                          </span>
                          <span className="meta-item">
                            <FaTag />
                            {query.student_domain}
                          </span>
                        </div>
                      </div>
                      <div className="status-badges">
                        {getStatusBadge(query.status)}
                        {getAssignmentStatusBadge(query.assignment_status)}
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="query-info">
                        <div className="info-row">
                          <FaLayerGroup />
                          <span>{query.design_stage_name || 'Not specified'}</span>
                        </div>
                        <div className="info-row">
                          <FaUsers />
                          <span>Assigned to: {query.assigned_expert_name}</span>
                        </div>
                        <div className="info-row">
                          <FaCalendarAlt />
                          <span>Assigned: {new Date(query.assigned_at).toLocaleDateString()}</span>
                        </div>
                        {query.assignment_notes && (
                          <div className="info-row notes">
                            <FaClipboardList />
                            <span>{query.assignment_notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button 
                        onClick={() => handleAssignQuery(query)}
                        className="action-btn reassign"
                      >
                        <FaEdit />
                        Reassign
                      </button>
                      <button 
                        onClick={() => handleRemoveAssignment(query.id)}
                        className="action-btn remove"
                      >
                        <FaTrash />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FaClipboardList className="empty-icon" />
                <h3>No Assigned Queries</h3>
                <p>No queries have been assigned to expert reviewers yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'unassigned' && (
          <div className="unassigned-section">
            {unassignedQueries.length > 0 ? (
              <div className="queries-grid">
                {unassignedQueries.map(query => (
                  <div key={query.id} className="query-card unassigned">
                    <div className="card-header">
                      <div className="query-title">
                        <h4>{query.title}</h4>
                        <div className="query-id">ID: {query.custom_query_id || query.id}</div>
                        <div className="query-meta">
                          <span className="meta-item">
                            <FaUser />
                            {query.student_name}
                          </span>
                          <span className="meta-item">
                            <FaTag />
                            {query.student_domain}
                          </span>
                        </div>
                      </div>
                      <div className="status-badges">
                        {getStatusBadge(query.status)}
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="query-info">
                        <div className="info-row">
                          <FaLayerGroup />
                          <span>{query.design_stage_name || 'Not specified'}</span>
                        </div>
                        <div className="info-row">
                          <FaCalendarAlt />
                          <span>Created: {new Date(query.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="query-description">
                          <p>{query.description.length > 120 ? `${query.description.substring(0, 120)}...` : query.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button 
                        onClick={() => handleAssignQuery(query)}
                        className="action-btn assign"
                      >
                        <FaUserPlus />
                        Assign Query
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FaCheckCircle className="empty-icon" />
                <h3>All Queries Assigned</h3>
                <p>Great job! All queries have been assigned to expert reviewers.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && selectedQuery && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Query to Expert Reviewer</h3>
              <button 
                onClick={() => setShowAssignmentModal(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="query-summary">
                <h4>{selectedQuery.title}</h4>
                <div className="summary-details">
                  <div className="summary-item">
                    <FaUser />
                    <span>{selectedQuery.student_name}</span>
                  </div>
                  <div className="summary-item">
                    <FaTag />
                    <span>{selectedQuery.student_domain}</span>
                  </div>
                  <div className="summary-item">
                    <FaExclamationTriangle />
                    <span>{selectedQuery.status}</span>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleAssignmentSubmit}>
                <div className="form-group">
                  <label htmlFor="expert_reviewer_id">
                    <FaUsers />
                    Expert Reviewer * {selectedQuery.student_domain && (
                      <span className="domain-filter-note">
                        (Filtered for {selectedQuery.student_domain} domain)
                        <button 
                          type="button"
                          onClick={async () => {
                            try {
                              const allAssigneesRes = await axios.get('/auth/assignees');
                            setReviewers(allAssigneesRes.data.assignees);
                            } catch (error) {
                            }
                          }}
                          className="btn-link"
                          style={{ marginLeft: '8px', color: '#3b82f6', textDecoration: 'underline', fontSize: '11px' }}
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
                        {reviewers.length > 0 ? (
                           reviewers.map(reviewer => (
                             <SelectItem key={reviewer.id} value={reviewer.id}>
                               {reviewer.full_name}
                             </SelectItem>
                           ))
                         ) : (
                           <SelectItem value="" disabled>
                             No reviewers available for this domain
                           </SelectItem>
                         )}
                       </SelectGroup>
                     </SelectContent>
                   </Select>
                  {selectedQuery.student_domain && reviewers.length === 0 && (
                    <div className="form-help">
                      No expert reviewers found for the {selectedQuery.student_domain} domain. 
                      <button 
                        type="button"
                        onClick={async () => {
                          try {
                            const allAssigneesRes = await axios.get('/auth/assignees');
                            setReviewers(allAssigneesRes.data.assignees);
                          } catch (error) {
                          }
                        }}
                        className="btn-link"
                        style={{ marginLeft: '8px', color: '#3b82f6', textDecoration: 'underline' }}
                      >
                        Show all reviewers
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">
                    <FaClipboardList />
                    Assignment Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={assignmentData.notes}
                    onChange={(e) => setAssignmentData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    rows="3"
                    placeholder="Optional notes for the assignment..."
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button"
                    onClick={() => setShowAssignmentModal(false)}
                    className="btn btn-secondary"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <FaUserPlus />
                    Assign Query
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

export default QueryAssignmentManagement;
