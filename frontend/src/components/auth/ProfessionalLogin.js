import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaMicrochip } from 'react-icons/fa';
import './Auth.css';

const ProfessionalLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await axios.post('/auth/login', formData);
      onLogin(response.data.token, response.data.user);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Full Page 3D Background */}
      <div className="full-page-3d-bg">
        <div className="bg-cube-3d"></div>
        <div className="bg-cube-3d"></div>
        <div className="bg-cube-3d"></div>
        <div className="bg-cube-3d"></div>
        <div className="bg-cube-3d"></div>
        <div className="bg-cube-3d"></div>
        <div className="bg-sphere-3d"></div>
        <div className="bg-sphere-3d"></div>
        <div className="bg-sphere-3d"></div>
        <div className="bg-sphere-3d"></div>
        <div className="bg-sphere-3d"></div>
        <div className="bg-sphere-3d"></div>
        <div className="bg-pyramid-3d"></div>
        <div className="bg-pyramid-3d"></div>
        <div className="bg-pyramid-3d"></div>
        <div className="bg-pyramid-3d"></div>
      </div>
      
      <div className="auth-layout professional-login">
        {/* Left Side - Website Name */}
        <div className="website-section">
          <div className="website-name">
            <img src="/logo.png" alt="VLSI Portal Logo" className="website-logo" />
            <h1 className="website-title">VLSI Portal</h1>
            <p className="website-subtitle">Advanced Learning Platform</p>
            <p className="website-description">
              Empowering students and professionals with cutting-edge VLSI design tools, 
              comprehensive learning resources, and expert guidance for semiconductor innovation.
            </p>
          </div>
        </div>
        
        {/* Right Side - Login Form */}
        <div className="form-section">
          <div className="auth-card">
            <h2 className="auth-title">Professional Portal</h2>
            <p className="auth-subtitle">Advanced VLSI development platform</p>

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

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
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
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="form-actions">
              <span>Don't have an account?</span>
              <Link to="/register-professional" className="register-link">Register as Professional</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalLogin;