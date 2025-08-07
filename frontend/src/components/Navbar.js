import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaMicrochip } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/queries" className="navbar-brand">
          <div className="brand-logo">
            <FaMicrochip className="brand-icon" />
            <span>VLSI</span>
          </div>
          <span className="brand-text">Portal</span>
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/queries" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {user?.role === 'teacher' ? 'Dashboard' : 'Queries'}
          </Link>
          {user?.role === 'teacher' && (
            <Link to="/analytics" className="nav-link" onClick={() => setIsMenuOpen(false)}>
              Analytics
            </Link>
          )}
          <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Profile
          </Link>
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <FaUser className="user-icon" />
            <span className="user-name">{user?.fullName}</span>
            <span className="user-role">({user?.role})</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 