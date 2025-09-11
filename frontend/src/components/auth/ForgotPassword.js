import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaArrowLeft } from 'react-icons/fa';
import './Auth.css';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/forgot-password', formData);
      // Directly redirect to reset password page
      window.location.href = `/reset-password?username=${encodeURIComponent(response.data.user.username)}&token=${encodeURIComponent(response.data.user.resetToken)}`;
    } catch (error) {
      setError(error.response?.data?.message || 'Username not found. Please check your username and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Video Background */}
      <div className="full-page-3d-bg">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="background-video"
        >
          <source src="/Video_Colorization_and_Slow_Motion.mp4" type="video/mp4" />
        </video>
      </div>
      
      <div className="auth-layout forgot-password">
        {/* Left Side - Website Name */}
        <div className="website-section">
          <div className="website-name">
            <img src="/logo.png" alt="vlsiforum Logo" className="website-logo" />
            <h1 className="website-title">VLSI Forum</h1>
            <p className="website-subtitle">Advanced Learning Platform</p>
            <p className="website-description">
              Empowering students and professionals with cutting-edge VLSI design tools, 
              comprehensive learning resources, and expert guidance for semiconductor innovation.
            </p>
          </div>
        </div>
        
        {/* Right Side - Forgot Password Form */}
        <div className="form-section">
          <div className="auth-card">
            <div className="auth-header">
              <Link to="/login" className="back-link">
                <FaArrowLeft />
                Back to Login
              </Link>
              <h2 className="auth-title">Forgot Password</h2>
              <p className="auth-subtitle">Enter your username to reset your password</p>
            </div>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary login-btn"
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="form-actions">
              <Link to="/login" className="register-link">Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
