import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaUserTie, FaGlobe, FaMicrochip } from 'react-icons/fa';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    domain_id: ''
  });
  const [domains, setDomains] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch domains on component mount
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await axios.get('/auth/domains');
        setDomains(response.data.domains);
      } catch (error) {
      }
    };
    fetchDomains();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await axios.post('/auth/register', registerData);
      setSuccess('Registration successful! You can now login.');
      setTimeout(() => {
        navigate('/login-student');
      }, 2000);
    } catch (error) {
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        setError(`Validation errors: ${errorMessages}`);
      } else {
        setError(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
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
      
      <div className="auth-layout student-login">
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
        
        {/* Right Side - Register Form */}
        <div className="form-section">
          <div className="auth-card">
            <h2 className="auth-title">Join VLSI Portal</h2>
            <p className="auth-subtitle">Create your student account</p>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <div className="input-group">
                  <FaUserTie className="input-icon" />
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    className="form-control"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="domain_id">Domain</label>
                <div className="input-group">
                  <FaGlobe className="input-icon" />
                  <select
                    id="domain_id"
                    name="domain_id"
                    className="form-control"
                    value={formData.domain_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your domain</option>
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Linux Username</label>
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-control"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a unique username"
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
                    placeholder="Create a password"
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
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
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
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="form-actions">
              <span>Already have an account?</span>
              <Link to="/login" className="register-link">Sign In</Link>
            </div>
            
            <div className="form-actions">
              <span>Are you a professional?</span>
              <Link to="/register-professional" className="register-link">Register as Professional</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;