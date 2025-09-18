import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  FaExclamationTriangle, 
  FaUsers, 
  FaChartLine, 
  FaEye, 
  FaTrash, 
  FaSync,
  FaClock,
  FaGlobe,
  FaUser,
  FaDesktop,
  FaMobile
} from 'react-icons/fa';
import './SystemMonitoring.css';

// StatCard Component for displaying key metrics
const StatCard = ({ title, value, icon, color }) => {
  const IconComponent = icon;
  return (
    <div className="stat-card-modern">
      <div className={`stat-icon-modern stat-icon-${color}`}>
        <IconComponent size={28} />
      </div>
      <div className="stat-content-modern">
        <p className="stat-title-modern">{title}</p>
        <p className="stat-value-modern">{value.toLocaleString()}</p>
      </div>
    </div>
  );
};

// VisitsChart Component using Recharts
const VisitsChart = ({ data }) => (
  <div className="chart-container-modern">
    <h3 className="chart-title-modern">Visits Over Time (Last 7 Days)</h3>
    <div className="chart-wrapper-modern">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} />
          <YAxis stroke="#A0AEC0" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568', borderRadius: '0.5rem' }}
            labelStyle={{ color: '#E2E8F0' }}
          />
          <Legend wrapperStyle={{fontSize: "14px"}}/>
          <Line type="monotone" dataKey="visits" stroke="#4299E1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const SystemMonitoring = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [errorLogs, setErrorLogs] = useState({
    errorLogs: [],
    exceptionLogs: [],
    rejectionLogs: [],
    totalErrors: 0
  });
  const [visitorStats, setVisitorStats] = useState({
    stats: {},
    recentVisitors: [],
    hourlyStats: [],
    dailyStats: [],
    topPages: [],
    roleStats: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedError, setSelectedError] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin');
      return;
    }
    
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [errorLogsRes, visitorStatsRes] = await Promise.all([
        axios.get('/system/error-logs'),
        axios.get('/system/visitor-stats')
      ]);
      
      setErrorLogs(errorLogsRes.data);
      setVisitorStats(visitorStatsRes.data);
    } catch (error) {
      setError('Failed to load system monitoring data');
      console.error('System monitoring error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleClearVisitorData = async () => {
    if (window.confirm('Are you sure you want to clear all visitor data? This action cannot be undone.')) {
      try {
        await axios.delete('/system/visitor-data');
        await fetchData();
      } catch (error) {
        setError('Failed to clear visitor data');
      }
    }
  };

  const handleErrorClick = (logEntry) => {
    setSelectedError(logEntry);
    setShowErrorDetails(true);
  };

  const closeErrorDetails = () => {
    setShowErrorDetails(false);
    setSelectedError(null);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Unknown time';
    
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Invalid time';
      
      const seconds = Math.floor((new Date() - date) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";
      return Math.floor(seconds) + " seconds ago";
    } catch (error) {
      return 'Invalid time';
    }
  };

  const getAllErrorLogs = () => {
    const allLogs = [];
    
    // Add application errors
    if (errorLogs.errorLogs && Array.isArray(errorLogs.errorLogs)) {
      errorLogs.errorLogs.forEach(log => {
        // Clean up the log entry
        const cleanLog = {
          timestamp: log.timestamp,
          level: log.level || 'error',
          message: log.message || 'No message available',
          type: 'application'
        };
        
        // Only add if it has a meaningful message
        if (cleanLog.message && cleanLog.message !== 'No message available') {
          allLogs.push(cleanLog);
        }
      });
    }
    
    // Add exceptions
    if (errorLogs.exceptionLogs && Array.isArray(errorLogs.exceptionLogs)) {
      errorLogs.exceptionLogs.forEach(log => {
        const cleanLog = {
          timestamp: log.timestamp,
          level: log.level || 'error',
          message: log.message || 'No message available',
          type: 'exception'
        };
        
        if (cleanLog.message && cleanLog.message !== 'No message available') {
          allLogs.push(cleanLog);
        }
      });
    }
    
    // Add rejections
    if (errorLogs.rejectionLogs && Array.isArray(errorLogs.rejectionLogs)) {
      errorLogs.rejectionLogs.forEach(log => {
        const cleanLog = {
          timestamp: log.timestamp,
          level: log.level || 'error',
          message: log.message || 'No message available',
          type: 'rejection'
        };
        
        if (cleanLog.message && cleanLog.message !== 'No message available') {
          allLogs.push(cleanLog);
        }
      });
    }
    
    // Sort by timestamp (newest first)
    return allLogs.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp) : new Date(0);
      const timeB = b.timestamp ? new Date(b.timestamp) : new Date(0);
      return timeB - timeA;
    });
  };

  const getErrorIcon = (level) => {
    switch (level) {
      case 'error':
        return <FaExclamationTriangle className="error-icon" />;
      default:
        return <FaExclamationTriangle className="warning-icon" />;
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (userAgent.includes('Mobile')) {
      return <FaMobile className="device-icon mobile" />;
    }
    return <FaDesktop className="device-icon desktop" />;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#dc3545';
      case 'domain_admin':
        return '#fd7e14';
      case 'expert_reviewer':
        return '#20c997';
      case 'student':
        return '#0d6efd';
      case 'professional':
        return '#6f42c1';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="system-monitoring-modern">
        <div className="loading-modern">Loading system monitoring...</div>
      </div>
    );
  }

  // Prepare chart data from daily stats
  const chartData = visitorStats.dailyStats?.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visits: day.visits
  })) || [];

  return (
    <div className="system-monitoring-modern">
      <header className="monitoring-header-modern">
        <div>
          <h1 className="header-title-modern">System Monitoring</h1>
          <p className="header-subtitle-modern">Real-time system health and visitor analytics</p>
        </div>
        <div className="header-actions-modern">
          <button onClick={handleRefresh} className="refresh-btn-modern">
            <FaSync /> Refresh
          </button>
        </div>
      </header>

      {error && <div className="error-message-modern">{error}</div>}

      {/* Stat Cards Grid */}
      <div className="stats-grid-modern">
        <StatCard 
          title="Total Visitors" 
          value={visitorStats.stats.totalVisits || 0} 
          icon={FaUsers} 
          color="blue" 
        />
        <StatCard 
          title="Unique Visitors" 
          value={visitorStats.stats.uniqueVisitors || 0} 
          icon={FaEye} 
          color="green" 
        />
        <StatCard 
          title="Today's Visits" 
          value={visitorStats.stats.todayVisits || 0} 
          icon={FaClock} 
          color="purple" 
        />
        <StatCard 
          title="Errors (24h)" 
          value={errorLogs.totalErrors || 0} 
          icon={FaExclamationTriangle} 
          color="red" 
        />
      </div>

      <div className="monitoring-tabs-modern">
        <button 
          className={`tab-btn-modern ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaChartLine /> Overview
        </button>
        <button 
          className={`tab-btn-modern ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          <FaExclamationTriangle /> Error Logs ({errorLogs.totalErrors})
        </button>
        <button 
          className={`tab-btn-modern ${activeTab === 'visitors' ? 'active' : ''}`}
          onClick={() => setActiveTab('visitors')}
        >
          <FaUsers /> Website Visitors
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-tab-modern">
          <div className="overview-grid-modern">
            <VisitsChart data={chartData} />
            <div className="recent-activity-modern">
              <h3 className="activity-title-modern">Recent Activity</h3>
              <div className="activity-list-modern">
                {visitorStats.recentVisitors?.slice(0, 5).map((visitor, index) => (
                  <div key={index} className="activity-item-modern">
                    <div className="activity-icon-modern">
                      {getDeviceIcon(visitor.userAgent)}
                    </div>
                    <div className="activity-details-modern">
                      <div className="activity-ip-modern">{visitor.ip}</div>
                      <div className="activity-page-modern">{visitor.url}</div>
                    </div>
                    <div className="activity-time-modern">{visitor.timestamp}</div>
                  </div>
                )) || <div className="no-activity-modern">No recent activity</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="errors-tab-modern">
          <div className="error-logs-modern">
            <h3 className="error-logs-title-modern">Recent Error Logs</h3>
            <div className="error-table-container-modern">
              <table className="error-table-modern">
                <thead className="error-table-header-modern">
                  <tr>
                    <th className="error-table-th-modern">Level</th>
                    <th className="error-table-th-modern">Message</th>
                    <th className="error-table-th-modern">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllErrorLogs().length === 0 ? (
                    <tr>
                      <td colSpan="3" className="no-errors-modern">
                        <div className="no-errors-content-modern">
                          <FaExclamationTriangle className="no-errors-icon-modern" />
                          <span>No errors found today - System is running smoothly!</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    getAllErrorLogs().map((log, index) => (
                      <tr 
                        key={index} 
                        className="error-table-row-modern clickable-row"
                        onClick={() => handleErrorClick(log)}
                      >
                        <td className="error-table-td-modern">
                          <span className={`error-level-badge-modern error-level-${log.level || 'error'}-modern`}>
                            {(log.level || 'error').toUpperCase()}
                          </span>
                        </td>
                        <td className="error-table-td-modern">
                          <div className="error-message-modern-text">{log.message || 'No message available'}</div>
                        </td>
                        <td className="error-table-td-modern">
                          <div className="error-time-modern-text">{log.timestamp ? formatTimeAgo(log.timestamp) : 'Unknown time'}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'visitors' && (
        <div className="visitors-tab-modern">
          <div className="visitor-summary-modern">
            <div className="summary-card-modern">
              <FaUsers className="summary-icon-modern" />
              <div className="summary-content-modern">
                <h3>{visitorStats.stats.totalVisits || 0}</h3>
                <p>Total Visits</p>
              </div>
            </div>
            <div className="summary-card-modern">
              <FaEye className="summary-icon-modern" />
              <div className="summary-content-modern">
                <h3>{visitorStats.stats.uniqueVisitors || 0}</h3>
                <p>Unique Visitors</p>
              </div>
            </div>
            <div className="summary-card-modern">
              <FaClock className="summary-icon-modern" />
              <div className="summary-content-modern">
                <h3>{visitorStats.stats.todayVisits || 0}</h3>
                <p>Today's Visits</p>
              </div>
            </div>
            <div className="summary-card-modern">
              <FaChartLine className="summary-icon-modern" />
              <div className="summary-content-modern">
                <h3>{visitorStats.stats.last24Hours || 0}</h3>
                <p>Last 24 Hours</p>
              </div>
            </div>
          </div>

          <div className="visitor-controls-modern">
            <div className="visitor-legend">
              <div className="legend-item">
                <div className="legend-color inner-legend"></div>
                <span>Recent (0-5 min)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color middle-legend"></div>
                <span>Active (5-30 min)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color outer-legend"></div>
                <span>Older (30+ min)</span>
              </div>
            </div>
            <button onClick={handleClearVisitorData} className="clear-btn-modern">
              <FaTrash /> Clear Visitor Data
            </button>
          </div>

          {/* Multi-Circle Visitor Visualization - Centered */}
          <div className="visitor-visualization-centered">
            <div className="visitor-circle-container">
              <div className="visitor-circles-wrapper">
                {/* Central VLSI Forum Logo */}
                <div className="center-logo">
                  <div className="logo-circle">
                    <span className="logo-text">VLSI</span>
                    <span className="logo-subtext">Forum</span>
                  </div>
                </div>

                {/* Inner Circle - Recent Visitors (0-5 minutes) */}
                <div className="visitor-circle inner-circle"></div>
                {(() => {
                  const recentVisitors = visitorStats.recentVisitors?.filter(visitor => {
                    const visitTime = new Date(visitor.timestamp);
                    const now = new Date();
                    const diffMinutes = (now - visitTime) / (1000 * 60);
                    return diffMinutes <= 5;
                  }) || [];
                  
                  // Get unique visitors by IP address
                  const uniqueVisitors = recentVisitors.filter((visitor, index, self) => 
                    index === self.findIndex(v => v.ip === visitor.ip)
                  );
                  
                  // Add demo visitors if no real visitors
                  const demoVisitors = uniqueVisitors.length === 0 ? [
                    { userRole: 'admin', timestamp: new Date().toISOString(), ip: '192.168.1.1' },
                    { userRole: 'student', timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), ip: '192.168.1.2' },
                    { userRole: 'professional', timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), ip: '192.168.1.3' }
                  ] : uniqueVisitors;
                  
                  return demoVisitors.slice(0, 8).map((visitor, index) => {
                    // Random angle with some variation
                    const baseAngle = (index * 360) / 8;
                    const randomVariation = (Math.random() - 0.5) * 60; // ±30 degrees variation
                    const angle = baseAngle + randomVariation;
                    
                    // Random radius with some variation
                    const baseRadius = 100;
                    const radiusVariation = (Math.random() - 0.5) * 40; // ±20px variation
                    const radius = baseRadius + radiusVariation;
                    
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    
                    return (
                      <div
                        key={`inner-${index}`}
                        className="visitor-icon-circle inner-visitor"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          '--delay': `${index * 0.1}s`
                        }}
                        title={`${visitor.userRole || 'anonymous'} - ${visitor.timestamp}`}
                      >
                        <div className="visitor-tooltip">
                          <div className="tooltip-content">
                            <div className="tooltip-header">
                              <strong>{visitor.userRole || 'Anonymous User'}</strong>
                            </div>
                            <div className="tooltip-details">
                              <div><strong>IP:</strong> {visitor.ip || 'Unknown'}</div>
                              <div><strong>Page:</strong> {visitor.url || 'Unknown'}</div>
                              <div><strong>Time:</strong> {formatTimeAgo(visitor.timestamp)}</div>
                              <div><strong>Device:</strong> {visitor.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="visitor-avatar">
                          <FaUser />
                        </div>
                        <div className="visitor-time-badge">
                          {formatTimeAgo(visitor.timestamp)}
                        </div>
                        <div className="visitor-role-indicator" style={{ backgroundColor: getRoleColor(visitor.userRole) }}></div>
                      </div>
                    );
                  });
                })()}

                {/* Middle Circle - Active Visitors (5-30 minutes) */}
                <div className="visitor-circle middle-circle"></div>
                {(() => {
                  const activeVisitors = visitorStats.recentVisitors?.filter(visitor => {
                    const visitTime = new Date(visitor.timestamp);
                    const now = new Date();
                    const diffMinutes = (now - visitTime) / (1000 * 60);
                    return diffMinutes > 5 && diffMinutes <= 30;
                  }) || [];
                  
                  // Get unique visitors by IP address
                  const uniqueActiveVisitors = activeVisitors.filter((visitor, index, self) => 
                    index === self.findIndex(v => v.ip === visitor.ip)
                  );
                  
                  return uniqueActiveVisitors.slice(0, 12).map((visitor, index) => {
                    // Random angle with some variation
                    const baseAngle = (index * 360) / 12;
                    const randomVariation = (Math.random() - 0.5) * 50; // ±25 degrees variation
                    const angle = baseAngle + randomVariation;
                    
                    // Random radius with some variation
                    const baseRadius = 180;
                    const radiusVariation = (Math.random() - 0.5) * 60; // ±30px variation
                    const radius = baseRadius + radiusVariation;
                    
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    
                    return (
                      <div
                        key={`middle-${index}`}
                        className="visitor-icon-circle middle-visitor"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          '--delay': `${index * 0.1}s`
                        }}
                        title={`${visitor.userRole || 'anonymous'} - ${visitor.timestamp}`}
                      >
                        <div className="visitor-tooltip">
                          <div className="tooltip-content">
                            <div className="tooltip-header">
                              <strong>{visitor.userRole || 'Anonymous User'}</strong>
                            </div>
                            <div className="tooltip-details">
                              <div><strong>IP:</strong> {visitor.ip || 'Unknown'}</div>
                              <div><strong>Page:</strong> {visitor.url || 'Unknown'}</div>
                              <div><strong>Time:</strong> {formatTimeAgo(visitor.timestamp)}</div>
                              <div><strong>Device:</strong> {visitor.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="visitor-avatar">
                          <FaUser />
                        </div>
                        <div className="visitor-time-badge">
                          {formatTimeAgo(visitor.timestamp)}
                        </div>
                        <div className="visitor-role-indicator" style={{ backgroundColor: getRoleColor(visitor.userRole) }}></div>
                      </div>
                    );
                  });
                })()}

                {/* Outer Circle - All Visitors (30+ minutes) */}
                <div className="visitor-circle outer-circle"></div>
                {(() => {
                  const olderVisitors = visitorStats.recentVisitors?.filter(visitor => {
                    const visitTime = new Date(visitor.timestamp);
                    const now = new Date();
                    const diffMinutes = (now - visitTime) / (1000 * 60);
                    return diffMinutes > 30;
                  }) || [];
                  
                  // Get unique visitors by IP address
                  const uniqueOlderVisitors = olderVisitors.filter((visitor, index, self) => 
                    index === self.findIndex(v => v.ip === visitor.ip)
                  );
                  
                  return uniqueOlderVisitors.slice(0, 16).map((visitor, index) => {
                    // Random angle with some variation
                    const baseAngle = (index * 360) / 16;
                    const randomVariation = (Math.random() - 0.5) * 40; // ±20 degrees variation
                    const angle = baseAngle + randomVariation;
                    
                    // Random radius with some variation
                    const baseRadius = 250;
                    const radiusVariation = (Math.random() - 0.5) * 80; // ±40px variation
                    const radius = baseRadius + radiusVariation;
                    
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    
                    return (
                      <div
                        key={`outer-${index}`}
                        className="visitor-icon-circle outer-visitor"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          '--delay': `${index * 0.1}s`
                        }}
                        title={`${visitor.userRole || 'anonymous'} - ${visitor.timestamp}`}
                      >
                        <div className="visitor-tooltip">
                          <div className="tooltip-content">
                            <div className="tooltip-header">
                              <strong>{visitor.userRole || 'Anonymous User'}</strong>
                            </div>
                            <div className="tooltip-details">
                              <div><strong>IP:</strong> {visitor.ip || 'Unknown'}</div>
                              <div><strong>Page:</strong> {visitor.url || 'Unknown'}</div>
                              <div><strong>Time:</strong> {formatTimeAgo(visitor.timestamp)}</div>
                              <div><strong>Device:</strong> {visitor.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="visitor-avatar">
                          <FaUser />
                        </div>
                        <div className="visitor-time-badge">
                          {formatTimeAgo(visitor.timestamp)}
                        </div>
                        <div className="visitor-role-indicator" style={{ backgroundColor: getRoleColor(visitor.userRole) }}></div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Details Modal */}
      {showErrorDetails && selectedError && (
        <div className="error-modal-overlay" onClick={closeErrorDetails}>
          <div className="error-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="error-modal-header">
              <h3 className="error-modal-title">Error Details</h3>
              <button className="error-modal-close" onClick={closeErrorDetails}>
                ×
              </button>
            </div>
            
            <div className="error-modal-body">
              <div className="error-detail-section">
                <h4 className="error-detail-label">Timestamp</h4>
                <p className="error-detail-value">{selectedError.timestamp}</p>
              </div>
              
              <div className="error-detail-section">
                <h4 className="error-detail-label">Level</h4>
                <span className={`error-level-badge-modern error-level-${selectedError.level || 'error'}-modern`}>
                  {(selectedError.level || 'error').toUpperCase()}
                </span>
              </div>
              
              <div className="error-detail-section">
                <h4 className="error-detail-label">Message</h4>
                <div className="error-detail-message">{selectedError.message}</div>
              </div>
              
              {selectedError.stack && (
                <div className="error-detail-section">
                  <h4 className="error-detail-label">Stack Trace</h4>
                  <pre className="error-detail-stack">{selectedError.stack}</pre>
                </div>
              )}
              
              {selectedError.meta && (
                <div className="error-detail-section">
                  <h4 className="error-detail-label">Metadata</h4>
                  <pre className="error-detail-meta">{JSON.stringify(selectedError.meta, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemMonitoring;
