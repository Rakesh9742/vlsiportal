import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import QueryList from './components/queries/QueryList';
import QueryDetail from './components/queries/QueryDetail';
import CreateQuery from './components/queries/CreateQuery';
import Profile from './components/Profile';

// Context
import { AuthProvider } from './context/AuthContext';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading VLSI Portal...</div>
      </div>
    );
  }

  return (
    <AuthProvider value={{ isAuthenticated, user, login, logout }}>
      <Router>
        <div className="App">
          {isAuthenticated && <Navbar />}
          <div className="container">
            <Routes>
              <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/queries" /> : <Login onLogin={login} />} 
              />
              <Route 
                path="/register" 
                element={isAuthenticated ? <Navigate to="/queries" /> : <Register />} 
              />
              <Route 
                path="/dashboard" 
                element={<Navigate to="/queries" />} 
              />
              <Route 
                path="/queries" 
                element={isAuthenticated ? <QueryList /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/queries/new" 
                element={isAuthenticated ? <CreateQuery /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/queries/:id" 
                element={isAuthenticated ? <QueryDetail /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/analytics" 
                element={isAuthenticated ? <Analytics /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/profile" 
                element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/" 
                element={isAuthenticated ? <Navigate to="/queries" /> : <Navigate to="/login" />} 
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 