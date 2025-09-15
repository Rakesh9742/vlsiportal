import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaEnvelope, 
  FaCalendar, 
  FaGraduationCap,
  FaBuilding,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/users/profile');
      setUser(response.data.user);
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };



  const getRoleIcon = (role) => {
    switch (role) {
      case 'student':
        return <FaGraduationCap />;
      case 'teacher':
        return <FaUser />;
      case 'admin':
        return <FaUser />;
      case 'domain_admin':
        return <FaBuilding />;
      default:
        return <FaUser />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'student':
        return '#10b981';
      case 'teacher':
        return '#3b82f6';
      case 'admin':
        return '#ef4444';
      case 'domain_admin':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <FaExclamationTriangle className="error-icon" />
          <h3>Unable to load profile</h3>
          <p>{error}</p>
          <button onClick={fetchProfile} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header Section */}
      <div className="profile-header-section">
        <div className="profile-hero">
          <div className="profile-avatar-container">
            <div className="profile-avatar">
              {getRoleIcon(user.role)}
            </div>
            <div className="avatar-status"></div>
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-name">{user.full_name}</h1>
            <p className="profile-username">@{user.username}</p>
            <div className="profile-role-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
              {getRoleIcon(user.role)}
              <span>{user.role.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success">
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Content */}
      <div className="profile-content">
        <div className="tab-content">
          <div className="profile-grid">
            {/* Personal Information Card */}
            <div className="info-card">
              <div className="card-header">
                <h3>
                  <FaUser />
                  Personal Information
                </h3>
              </div>
              <div className="card-content">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{user.full_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Username</span>
                  <span className="info-value">@{user.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Domain</span>
                  <span className="info-value">{user.domain || 'Not assigned'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;