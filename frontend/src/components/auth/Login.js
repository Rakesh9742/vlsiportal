import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaMicrochip } from 'react-icons/fa';
import './Auth.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="auth-layout">
        {/* Left Side - Enhanced Realistic Circuit Board Logo */}
        <div className="logo-section">
          <div className="logo-container">
            <div className="logo-circuit">
              <div className="circuit-board">
                <div className="circuit-grid"></div>
                <div className="circuit-nodes">
                  <div className="circuit-node"></div>
                  <div className="circuit-node"></div>
                  <div className="circuit-node"></div>
                  <div className="circuit-node"></div>
                  <div className="circuit-node"></div>
                  <div className="circuit-node"></div>
                  <div className="circuit-node"></div>
                  <div className="circuit-node"></div>
                </div>
                <div className="circuit-paths">
                  <div className="circuit-path horizontal"></div>
                  <div className="circuit-path vertical"></div>
                  <div className="circuit-path diagonal"></div>
                  <div className="circuit-path diagonal2"></div>
                </div>
                {/* Electronic Components */}
                <div className="resistor"></div>
                <div className="resistor"></div>
                <div className="resistor"></div>
                <div className="resistor"></div>
                <div className="capacitor"></div>
                <div className="capacitor"></div>
                <div className="capacitor"></div>
                <div className="capacitor"></div>
                <div className="ic-chip"></div>
                <div className="ic-chip"></div>
                <div className="ic-chip"></div>
                <div className="ic-chip"></div>
                {/* Electrons */}
                <div className="electron"></div>
                <div className="electron"></div>
                <div className="electron"></div>
                <div className="electron"></div>
                <div className="electron"></div>
                <div className="electron"></div>
                <div className="logo-center">
                  <FaMicrochip className="logo-center-icon" />
                </div>
              </div>
              <div className="logo-glow"></div>
            </div>
          </div>
          <div className="logo-content">
            <h1 className="logo-title">VLSI Portal</h1>
            <p className="logo-subtitle">Advanced Learning Management System</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="form-section">
          <div className="auth-card">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your VLSI Portal account</p>

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
              <Link to="/register" className="register-link">Register as Student</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 