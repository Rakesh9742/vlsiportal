import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaMicrochip, FaChevronDown, FaCog, FaBell, FaSearch } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    // Redirect to appropriate login page based on user role
    if (user?.role === 'student') {
      navigate('/login-student');
    } else if (user?.role === 'professional') {
      navigate('/login-professional');
    } else {
      navigate('/login'); // admin and expert_reviewer go to main login
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Focus search input when opening
      setTimeout(() => {
        const searchInput = document.getElementById('navbar-search');
        if (searchInput) searchInput.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or perform search
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserDropdownOpen && !event.target.closest('.user-dropdown-container')) {
        setIsUserDropdownOpen(false);
      }
      if (isSearchOpen && !event.target.closest('.search-container')) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen, isSearchOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Helper function to check if a link is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={user?.role === 'admin' ? '/admin' : '/queries'} className="navbar-brand">
          <div className="brand-logo">
            <FaMicrochip className="brand-icon" />
            <span>VLSI</span>
          </div>
          <span className="brand-text">Portal</span>
          {user?.domain && user?.role !== 'admin' && (
            <span className="domain-badge">{user.domain}</span>
          )}
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {user?.role === 'admin' ? (
            <>
              <Link 
                to="/admin" 
                className={`nav-link ${isActiveLink('/admin') ? 'active' : ''}`} 
                onClick={() => setIsMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
              <Link 
                to="/admin/expert-reviewers" 
                className={`nav-link ${isActiveLink('/admin/expert-reviewers') ? 'active' : ''}`} 
                onClick={() => setIsMenuOpen(false)}
              >
                Expert Reviewers
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/queries" 
                className={`nav-link ${isActiveLink('/queries') ? 'active' : ''}`} 
                onClick={() => setIsMenuOpen(false)}
              >
                {user?.role === 'expert_reviewer' ? 'Dashboard' : 'Queries'}
              </Link>
              {user?.role === 'expert_reviewer' && (
                <Link 
                  to="/analytics" 
                  className={`nav-link ${isActiveLink('/analytics') ? 'active' : ''}`} 
                  onClick={() => setIsMenuOpen(false)}
                >
                  Analytics
                </Link>
              )}
            </>
          )}
          <Link 
            to="/profile" 
            className={`nav-link ${isActiveLink('/profile') ? 'active' : ''}`} 
            onClick={() => setIsMenuOpen(false)}
          >
            Profile
          </Link>
          
          {/* Mobile-only user actions */}
          <div className="mobile-user-actions">
            <div className="mobile-user-info">
              <FaUser className="mobile-user-icon" />
              <div className="mobile-user-details">
                <div className="mobile-user-name">{user?.fullName}</div>
                <div className="mobile-user-role">{user?.role}</div>
              </div>
            </div>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="search-container">
            <button className="search-toggle-btn" onClick={toggleSearch}>
              <FaSearch />
            </button>
            {isSearchOpen && (
              <div className="search-dropdown">
                <form onSubmit={handleSearch} className="search-form">
                  <div className="search-input-container">
                    <FaSearch className="search-icon" />
                    <input
                      id="navbar-search"
                      type="text"
                      placeholder="Search queries, users, or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <button type="submit" className="search-submit-btn">
                    Search
                  </button>
                </form>
              </div>
            )}
          </div>
          
          <div className="user-dropdown-container">
            <div className="user-info" onClick={toggleUserDropdown}>
              <FaUser className="user-icon" />
              <span className="user-name">{user?.fullName}</span>
              <span className="user-role">{user?.role}</span>
              <FaChevronDown className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`} />
            </div>
            
            {isUserDropdownOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="user-avatar">
                    <FaUser />
                  </div>
                  <div className="user-details">
                    <div className="user-name-dropdown">{user?.fullName}</div>
                    <div className="user-email">{user?.email}</div>
                    <div className="user-role-dropdown">{user?.role}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                    <FaUser />
                    <span>Profile</span>
                  </Link>
                  <Link to="/notifications" className="dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                    <FaBell />
                    <span>Notifications</span>
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                    <FaCog />
                    <span>Settings</span>
                  </Link>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;