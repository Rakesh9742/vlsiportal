import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserTie, FaGlobe, FaMicrochip } from 'react-icons/fa';
import './Auth.css';

const ProfessionalRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
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
        console.error('Failed to fetch domains:', error);
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
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
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
      await axios.post('/auth/register-professional', registerData);
      setSuccess('Registration successful! You can now login.');
      setTimeout(() => {
        navigate('/login-professional');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
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
                  <div className="circuit-path curve"></div>
                </div>
                {/* Resistors */}
                <div className="resistor"></div>
                <div className="resistor"></div>
                <div className="resistor"></div>
                <div className="resistor"></div>
                {/* Capacitors */}
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
            <p className="logo-subtitle">Professional Registration</p>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="form-section">
          <div className="auth-card">
            <h2 className="auth-title">Join as Professional</h2>
            <p className="auth-subtitle">Create your professional account</p>

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
                <label htmlFor="email">Email Address</label>
                <div className="input-group">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
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
                  'Create Professional Account'
                )}
              </button>
            </form>

            <div className="form-actions">
              <span>Already have an account?</span>
              <Link to="/login-professional" className="register-link">Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalRegister;