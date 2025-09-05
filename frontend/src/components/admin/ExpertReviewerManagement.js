import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaUserPlus, FaEdit, FaTrash, FaArrowLeft, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import './ExpertReviewerManagement.css';

const ExpertReviewerManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviewers, setReviewers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showWorkload, setShowWorkload] = useState(false);
  const [workload, setWorkload] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    domain_id: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/queries');
      return;
    }
    
    fetchReviewers();
    fetchDomains();
  }, [user, navigate]);

  const fetchReviewers = async () => {
    try {
      const response = await axios.get('/auth/expert-reviewers');
      setReviewers(response.data.reviewers);
    } catch (error) {
      setError('Failed to load expert reviewers');
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

  const fetchWorkload = async () => {
    try {
      const response = await axios.get('/admin/expert-reviewers/workload');
      setWorkload(response.data.workload);
      setShowWorkload(true);
    } catch (error) {
      setError('Failed to load workload data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateReviewer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('/auth/expert-reviewer', formData);
      setSuccess('Expert reviewer created successfully!');
      setFormData({
        username: '',
        password: '',
        full_name: '',
        domain_id: ''
      });
      setShowCreateForm(false);
      fetchReviewers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create expert reviewer');
    }
  };

  const handleDeleteReviewer = async (reviewerId) => {
    if (!window.confirm('Are you sure you want to delete this expert reviewer?')) {
      return;
    }

    try {
      await axios.delete(`/auth/users/${reviewerId}`);
      setSuccess('Expert reviewer deleted successfully!');
      fetchReviewers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete expert reviewer');
    }
  };

  if (loading) {
    return (
      <div className="expert-reviewer-management">
        <div className="loading">Loading expert reviewers...</div>
      </div>
    );
  }

  return (
    <div className="expert-reviewer-management">
      <div className="page-header">
        <button 
          onClick={() => navigate('/admin')} 
          className="back-btn"
        >
          <FaArrowLeft /> Back to Admin Dashboard
        </button>
        <h1>Expert Reviewer Management</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="management-actions">
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="action-btn primary"
        >
          <FaUserPlus /> {showCreateForm ? 'Cancel' : 'Create Expert Reviewer'}
        </button>
        <button 
          onClick={fetchWorkload}
          className="action-btn secondary"
        >
          <FaEye /> View Workload
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New Expert Reviewer</h3>
          <form onSubmit={handleCreateReviewer}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  minLength="3"
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="full_name">Full Name *</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="domain_id">Domain *</label>
                <select
                  id="domain_id"
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <FaUserPlus /> Create Expert Reviewer
              </button>
            </div>
          </form>
        </div>
      )}

      {showWorkload && (
        <div className="workload-section">
          <h3>Expert Reviewer Workload</h3>
          <div className="workload-grid">
            {workload.map(reviewer => (
              <div key={reviewer.id} className="workload-card">
                <div className="reviewer-info">
                  <h4>{reviewer.full_name}</h4>
                  <p className="domain">{reviewer.domain_name}</p>
                </div>
                <div className="workload-stats">
                  <div className="stat">
                    <span className="label">Total:</span>
                    <span className="value">{reviewer.total_assignments}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Pending:</span>
                    <span className="value pending">{reviewer.pending_assignments}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Accepted:</span>
                    <span className="value accepted">{reviewer.accepted_assignments}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Completed:</span>
                    <span className="value completed">{reviewer.completed_assignments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="reviewers-list">
        <h3>Expert Reviewers ({reviewers.length})</h3>
        <div className="reviewers-table-container">
          <table className="reviewers-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Domain</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviewers.map(reviewer => (
                <tr key={reviewer.id}>
                  <td className="name-cell">{reviewer.full_name}</td>
                  <td className="username-cell">{reviewer.username}</td>
                  <td className="domain-cell">{reviewer.domain_name || 'Not assigned'}</td>
                  <td className="date-cell">{new Date(reviewer.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button 
                      onClick={() => handleDeleteReviewer(reviewer.id)}
                      className="action-btn delete"
                      title="Delete Reviewer"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {reviewers.length === 0 && (
          <div className="empty-state">
            <p>No expert reviewers found. Create your first expert reviewer above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertReviewerManagement;
