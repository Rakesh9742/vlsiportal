import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaCalendar, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    domain_id: ''
  });
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchDomains();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/users/profile');
      setUser(response.data.user);
      setEditData({
        full_name: response.data.user.full_name,
        domain_id: response.data.user.domain_id || ''
      });
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/users/domains');
      setDomains(response.data.domains);
    } catch (error) {
      console.error('Failed to load domains:', error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditData({
      full_name: user.full_name,
      domain: user.domain
    });
  };

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await axios.put('/users/profile', editData);
      await fetchProfile(); // Refresh profile data
      setEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account information</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <FaUser />
            </div>
            <div className="profile-info">
              <h2>{user.full_name}</h2>
              <p className="username">@{user.username}</p>
              <span className={`role-badge role-${user.role}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="edit-form">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  className="form-control"
                  value={editData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="domain_id">Domain</label>
                <select
                  id="domain_id"
                  name="domain_id"
                  className="form-control"
                  value={editData.domain_id || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  <FaTimes />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-item">
                <span className="detail-label">
                  <FaUser />
                  Full Name
                </span>
                <span className="detail-value">{user.full_name}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <FaEnvelope />
                  Username
                </span>
                <span className="detail-value">{user.username}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <FaCalendar />
                  Domain
                </span>
                <span className="detail-value">
                  {user.domain || 'Not assigned'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">
                  <FaCalendar />
                  Member Since
                </span>
                <span className="detail-value">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="profile-actions">
                <button
                  onClick={handleEdit}
                  className="btn btn-primary"
                >
                  <FaEdit />
                  Edit Profile
                </button>
              </div>

              <div className="profile-note">
                <p>
                  <strong>Note:</strong> Password changes are handled through your system administrator.
                  Contact support if you need to reset your password.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;