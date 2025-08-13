import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaUserPlus, FaEdit, FaTrash, FaEye, FaUser, FaUserTie, FaUserShield } from 'react-icons/fa';
import './UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterRole, setFilterRole] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'student',
    domain_id: ''
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/queries');
      return;
    }
    
    fetchUsers();
    fetchDomains();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/auth/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      let endpoint = '/auth/register';
      if (formData.role === 'expert_reviewer') {
        endpoint = '/auth/expert-reviewer';
      } else if (formData.role === 'admin') {
        endpoint = '/auth/create-admin';
      }

      await axios.post(endpoint, formData);
      setSuccess('User created successfully!');
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'student',
        domain_id: ''
      });
      setShowCreateForm(false);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await axios.delete(`/auth/users/${userId}`);
      setSuccess('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="role-icon admin" />;
      case 'expert_reviewer':
        return <FaUserTie className="role-icon expert" />;
      case 'student':
        return <FaUser className="role-icon student" />;
      default:
        return <FaUser className="role-icon" />;
    }
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      'admin': 'role-badge admin',
      'expert_reviewer': 'role-badge expert',
      'student': 'role-badge student'
    };
    
    return (
      <span className={roleClasses[role] || 'role-badge'}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    if (filterRole === 'all') return true;
    return user.role === filterRole;
  });

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <button 
          onClick={() => navigate('/admin')} 
          className="back-btn"
        >
          <FaArrowLeft /> Back to Admin Dashboard
        </button>
        <h1>User Management</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="management-actions">
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="action-btn primary"
        >
          <FaUserPlus /> {showCreateForm ? 'Cancel' : 'Create New User'}
        </button>
        
        <div className="filter-controls">
          <label htmlFor="role-filter">Filter by Role:</label>
          <select
            id="role-filter"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="expert_reviewer">Expert Reviewers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New User</h3>
          <form onSubmit={handleCreateUser}>
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
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="student">Student</option>
                  <option value="expert_reviewer">Expert Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {formData.role !== 'admin' && (
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
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <FaUserPlus /> Create User
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="users-list">
        <h3>Users ({filteredUsers.length})</h3>
        <div className="users-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-info">
                  {getRoleIcon(user.role)}
                  <h4>{user.full_name}</h4>
                </div>
                <div className="user-actions">
                  {getRoleBadge(user.role)}
                  {user.role !== 'admin' && (
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="action-btn delete"
                      title="Delete User"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
              <div className="user-details">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Domain:</strong> {user.domain_name || 'Not assigned'}</p>
                <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>No users found with the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
