import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaUserPlus, FaTrash, FaUserShield } from 'react-icons/fa';
import './DomainAdminManagement.css';

const DomainAdminManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [domainAdmins, setDomainAdmins] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

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
    
    fetchDomainAdmins();
    fetchDomains();
  }, [user, navigate]);

  const fetchDomainAdmins = async () => {
    try {
      const response = await axios.get('/auth/users');
      const domainAdmins = response.data.users.filter(u => u.role === 'domain_admin');
      setDomainAdmins(domainAdmins);
    } catch (error) {
      setError('Failed to fetch domain admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/auth/domains');
      setDomains(response.data.domains);
    } catch (error) {
      setError('Failed to fetch domains');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('/auth/create-domain-admin', formData);
      setSuccess('Domain admin created successfully');
      setFormData({
        username: '',
        password: '',
        full_name: '',
        domain_id: ''
      });
      setShowCreateForm(false);
      fetchDomainAdmins();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create domain admin');
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this domain admin?')) {
      return;
    }

    try {
      await axios.delete(`/auth/users/${adminId}`);
      setSuccess('Domain admin deleted successfully');
      fetchDomainAdmins();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete domain admin');
    }
  };

  if (loading) {
    return (
      <div className="domain-admin-management">
        <div className="loading">Loading domain admins...</div>
      </div>
    );
  }

  return (
    <div className="domain-admin-management">
      <div className="header">
        <button className="back-button" onClick={() => navigate('/admin')}>
          <FaArrowLeft /> Back to Admin Dashboard
        </button>
        <h1>Domain Admin Management</h1>
        <button 
          className="create-button"
          onClick={() => setShowCreateForm(true)}
        >
          <FaUserPlus /> Create Domain Admin
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showCreateForm && (
        <div className="create-form-overlay">
          <div className="create-form">
            <h2>Create Domain Admin</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Domain:</label>
                <select
                  name="domain_id"
                  value={formData.domain_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  Create Domain Admin
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="domain-admins-list">
        <h2>Existing Domain Admins</h2>
        {domainAdmins.length === 0 ? (
          <div className="no-data">No domain admins found</div>
        ) : (
          <div className="admins-grid">
            {domainAdmins.map(admin => (
              <div key={admin.id} className="admin-card">
                <div className="admin-header">
                  <FaUserShield className="admin-icon" />
                  <div className="admin-info">
                    <h3>{admin.full_name}</h3>
                    <p>@{admin.username}</p>
                    <span className="domain-badge">{admin.domain_name}</span>
                  </div>
                </div>
                <div className="admin-actions">
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(admin.id)}
                    title="Delete Domain Admin"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainAdminManagement;
