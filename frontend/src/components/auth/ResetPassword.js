import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import './Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const usernameParam = searchParams.get('username');
    const tokenParam = searchParams.get('token');
    
    if (!usernameParam || !tokenParam) {
      setError('Invalid reset link. Please try the forgot password process again.');
      return;
    }
    
    setUsername(decodeURIComponent(usernameParam));
    setToken(decodeURIComponent(tokenParam));
  }, [searchParams]);

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/auth/reset-password', {
        username,
        token,
        password: formData.password
      });
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="full-page-3d-bg">
          {/* <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="background-video"
          >
            <source src="/Video_Colorization_and_Slow_Motion.mp4" type="video/mp4" />
          </video> */}
        </div>
        
        <div className="auth-layout reset-password">
          <div className="website-section">
            <div className="website-name">
              <img src="/logo.png" alt="vlsiforum Logo" className="website-logo" />
              <h1 className="website-title">VLSI Forum</h1>
              <p className="website-subtitle">Advanced Learning Platform</p>
            </div>
          </div>
          
          <div className="form-section">
            <div className="auth-card">
              <div className="success-section">
                <FaCheckCircle className="success-icon" />
                <h2 className="auth-title">Password Reset Successful!</h2>
                <p className="auth-subtitle">Your password has been successfully updated.</p>
                
                <div className="form-actions">
                  <Link to="/login" className="btn btn-primary login-btn">
                    Continue to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      
      <div className="auth-layout reset-password">
        {/* Left Side - Website Name */}
        <div className="website-section">
          <div className="website-name">
            <img src="/logo.png" alt="vlsiforum Logo" className="website-logo" />
            <h1 className="website-title">vlsiforum</h1>
            <p className="website-subtitle">Advanced Learning Platform</p>
            <p className="website-description">
              Empowering students and professionals with cutting-edge VLSI design tools, 
              comprehensive learning resources, and expert guidance for semiconductor innovation.
            </p>
          </div>
        </div>
        
        {/* Right Side - Reset Password Form */}
        <div className="form-section">
          <div className="auth-card">
            <div className="auth-header">
              <Link to="/forgot-password" className="back-link">
                <FaArrowLeft />
                Back to Forgot Password
              </Link>
              <h2 className="auth-title">Reset Password</h2>
              <p className="auth-subtitle">Create a new password for {username}</p>
            </div>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
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

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
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
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Password'
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

export default ResetPassword;
