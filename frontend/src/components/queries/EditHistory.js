import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaHistory, FaClock, FaUser, FaEdit, FaTimes } from 'react-icons/fa';
import { getApiUrl } from '../../config/api';
import './EditHistory.css';

const EditHistory = ({ queryId, isOpen, onClose }) => {
  const [editHistory, setEditHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && queryId) {
      fetchEditHistory();
    }
  }, [isOpen, queryId]);

  const fetchEditHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${getApiUrl()}/api/queries/${queryId}/edit-history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEditHistory(response.data.edit_history);
    } catch (error) {
      console.error('Error fetching edit history:', error);
      setError('Failed to load edit history');
    } finally {
      setLoading(false);
    }
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (value) => {
    if (!value) return 'Empty';
    if (value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return value;
  };

  const getEditTypeColor = (editType) => {
    switch (editType) {
      case 'create': return '#28a745';
      case 'update': return '#ffc107';
      case 'delete': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-history-overlay">
      <div className="edit-history-modal">
        <div className="edit-history-header">
          <div className="header-title">
            <FaHistory className="history-icon" />
            <h3>Edit History</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="edit-history-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading edit history...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && editHistory.length === 0 && (
            <div className="empty-state">
              <FaEdit className="empty-icon" />
              <p>No edit history found for this query.</p>
            </div>
          )}

          {!loading && !error && editHistory.length > 0 && (
            <div className="edit-history-list">
              {editHistory.map((edit, index) => (
                <div key={edit.id} className="edit-item">
                  <div className="edit-timeline">
                    <div 
                      className="edit-dot" 
                      style={{ backgroundColor: getEditTypeColor(edit.edit_type) }}
                    ></div>
                    {index < editHistory.length - 1 && <div className="edit-line"></div>}
                  </div>
                  
                  <div className="edit-details">
                    <div className="edit-header">
                      <div className="edit-meta">
                        <FaUser className="user-icon" />
                        <span className="editor-name">{edit.editor_name}</span>
                        <span className="editor-role">({edit.editor_role})</span>
                      </div>
                      <div className="edit-time">
                        <FaClock className="time-icon" />
                        <span>{new Date(edit.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="edit-change">
                      <div className="field-name">
                        <strong>{formatFieldName(edit.field_name)}</strong>
                      </div>
                      
                      <div className="value-changes">
                        {edit.old_value && (
                          <div className="old-value">
                            <span className="value-label">From:</span>
                            <div className="value-content">{formatValue(edit.old_value)}</div>
                          </div>
                        )}
                        
                        <div className="new-value">
                          <span className="value-label">To:</span>
                          <div className="value-content">{formatValue(edit.new_value)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditHistory;