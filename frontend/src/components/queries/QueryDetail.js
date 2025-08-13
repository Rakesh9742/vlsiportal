import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaReply, FaCheck, FaTimes, FaExclamationTriangle, FaTools, FaLayerGroup, FaTag, FaUser, FaCalendar, FaGraduationCap, FaCog, FaComments, FaImage, FaDownload, FaTrash } from 'react-icons/fa';
import './Queries.css';

const QueryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchQuery();
  }, [id]);

  const fetchQuery = async () => {
    try {
      const response = await axios.get(`/queries/${id}`);
      setQuery(response.data.query);
    } catch (error) {
      setError('Failed to load query');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`/queries/${id}/responses`, { answer });
      setAnswer('');
      setShowResponseForm(false);
      fetchQuery(); // Refresh the query to show new response
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.put(`/queries/${id}/status`, { status: newStatus });
      fetchQuery(); // Refresh the query
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await axios.delete(`/queries/${id}/images/${imageId}`);
      fetchQuery(); // Refresh the query
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete image');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'open': { class: 'status-open', icon: <FaExclamationTriangle />, text: 'Open' },
      'in_progress': { class: 'status-progress', icon: <FaTools />, text: 'In Progress' },
      'resolved': { class: 'status-resolved', icon: <FaCheck />, text: 'Resolved' },

    };
    
    const config = statusConfig[status] || statusConfig['open'];
    return (
      <span className={`status-badge ${config.class}`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'low': { class: 'priority-low', text: 'Low' },
      'medium': { class: 'priority-medium', text: 'Medium' },
      'high': { class: 'priority-high', text: 'High' },
      'urgent': { class: 'priority-urgent', text: 'Urgent' }
    };
    
    const config = priorityConfig[priority] || priorityConfig['medium'];
    return (
      <span className={`priority-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="query-detail-page">
        <div className="loading">Loading query details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="query-detail-page">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/queries')} className="btn btn-primary">
          Back to Queries
        </button>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="query-detail-page">
        <div className="error">Query not found</div>
        <button onClick={() => navigate('/queries')} className="btn btn-primary">
          Back to Queries
        </button>
      </div>
    );
  }

  return (
    <div className="query-detail-page">
      <div className="page-header">
        <button 
          onClick={() => navigate('/queries')} 
          className="back-btn"
        >
          <FaArrowLeft /> Back to Queries
        </button>
        <h1>Query Details</h1>
      </div>

      <div className="query-detail-content">
        {/* Query Header Section */}
        <div className="query-header">
          <div className="query-title-section">
            <h2>{query.title}</h2>
            <div className="query-meta">
              {getStatusBadge(query.status)}
              {getPriorityBadge(query.priority)}
            </div>
          </div>
        </div>

        {/* Query Information Grid */}
        <div className="query-info-grid">
          <div className="info-card">
            <div className="info-icon">
              <FaUser />
            </div>
            <div className="info-content">
              <h4>Student</h4>
              <p>{query.student_name}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <FaCalendar />
            </div>
            <div className="info-content">
              <h4>Created</h4>
              <p>{new Date(query.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {query.design_stage_name && (
            <div className="info-card">
              <div className="info-icon">
                <FaLayerGroup />
              </div>
              <div className="info-content">
                <h4>Design Stage</h4>
                <p>{query.design_stage_name}</p>
              </div>
            </div>
          )}

          {query.issue_category_name && (
            <div className="info-card">
              <div className="info-icon">
                <FaCog />
              </div>
              <div className="info-content">
                <h4>Issue Category</h4>
                <p>{query.issue_category_name}</p>
              </div>
            </div>
          )}

          {query.tool_name && (
            <div className="info-card">
              <div className="info-icon">
                <FaTools />
              </div>
              <div className="info-content">
                <h4>Tool</h4>
                <p>{query.tool_name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Query Description */}
        <div className="query-description">
          <h3>Description</h3>
          <div className="description-content">
            <p>{query.description}</p>
          </div>
        </div>

        {/* Query Images */}
        {query.images && query.images.length > 0 && (
          <div className="query-images">
            <h3>Uploaded Images</h3>
            <div className="images-grid">
              {query.images.map((image) => (
                <div key={image.id} className="query-image-item">
                  <img 
                    src={`http://192.168.92.34:5000/uploads/${image.filename}`} 
                    alt={image.original_name}
                    onClick={() => setSelectedImage(image)}
                  />
                  <div className="image-info">
                    <div className="image-name">{image.original_name}</div>
                    <div className="image-size">{formatFileSize(image.file_size)}</div>
                  </div>
                  <div className="image-actions">
                    <a
                      href={`http://192.168.92.34:5000/uploads/${image.filename}`}
                      download={image.original_name}
                      className="image-action-btn"
                      title="Download"
                    >
                      <FaDownload />
                    </a>
                    {(user?.role === 'expert_reviewer' || (user?.role === 'student' && query.student_id === user?.userId)) && (
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="image-action-btn"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Steps */}
        {query.debug_steps && (
          <div className="query-debug-steps">
            <h3>Debug Steps</h3>
            <div className="debug-content">
              <p>{query.debug_steps}</p>
            </div>
          </div>
        )}

        {/* Resolution */}
        {query.resolution && (
          <div className="query-resolution">
            <h3>Resolution</h3>
            <div className="resolution-content">
              <p>{query.resolution}</p>
            </div>
          </div>
        )}

        {/* Teacher Responses Section */}
        <div className="query-responses">
          <div className="responses-header">
                    <h3>Expert Reviewer Responses</h3>
        {(user?.role === 'expert_reviewer' || user?.role === 'admin') && query.status !== 'resolved' && (
              <button
                onClick={() => setShowResponseForm(!showResponseForm)}
                className="btn btn-primary"
              >
                <FaReply />
                {showResponseForm ? 'Cancel Response' : 'Add Response'}
              </button>
            )}
          </div>

          {showResponseForm && (
            <div className="response-form-section">
              <form onSubmit={handleSubmitAnswer} className="response-form">
                <div className="form-group">
                  <label htmlFor="answer">Your Response</label>
                  <textarea
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Enter your detailed response to help the student..."
                    rows="8"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaReply />
                        Submit Response
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {query.responses && query.responses.length > 0 ? (
            <div className="responses-list">
              {query.responses.map((response, index) => (
                <div key={response.id} className="response-item">
                  <div className="response-header">
                    <div className="response-author">
                      <FaGraduationCap className="author-icon" />
                      <span>{response.teacher_name}</span>
                    </div>
                    <span className="response-date">
                      {new Date(response.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="response-content">
                    {response.answer}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-responses">
              <div className="empty-icon">
                <FaComments />
              </div>
              <h4>No Responses Yet</h4>
              <p>
                {(user?.role === 'expert_reviewer' || user?.role === 'admin')
                  ? 'Be the first to provide guidance to this student.'
                  : 'No expert reviewer responses yet. Check back later for guidance.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Expert Reviewer and Admin Actions */}
        {(user?.role === 'expert_reviewer' || user?.role === 'admin') && query.status !== 'resolved' && (
          <div className="teacher-actions">
                          <div className="teacher-actions-header">
                <h3>{user?.role === 'admin' ? 'Admin Actions' : 'Expert Reviewer Actions'}</h3>
                <p>Provide guidance and update query status</p>
              </div>

            <div className="teacher-actions-content">
              {/* Status Update Section */}
              <div className="status-section">
                <div className="section-header">
                  <h4>Update Query Status</h4>
                  <div className="current-status">
                    <span className="status-label">Current Status:</span>
                    <span className={`current-status-badge ${query.status}`}>
                      {query.status === 'open' && 'Open'}
                      {query.status === 'in_progress' && 'In Progress'}
                      {query.status === 'resolved' && 'Resolved'}

                    </span>
                  </div>
                </div>
                <div className="status-buttons">
                  {query.status !== 'open' && (
                    <button
                      onClick={() => handleStatusUpdate('open')}
                      className="btn btn-outline status-btn open-btn"
                    >
                      <FaExclamationTriangle />
                      Mark as Open
                    </button>
                  )}
                  {query.status !== 'in_progress' && (
                    <button
                      onClick={() => handleStatusUpdate('in_progress')}
                      className="btn btn-outline status-btn progress-btn"
                    >
                      <FaTools />
                      Mark as In Progress
                    </button>
                  )}
                  {query.status !== 'resolved' && (
                    <button
                      onClick={() => handleStatusUpdate('resolved')}
                      className="btn btn-outline status-btn resolved-btn"
                    >
                      <FaCheck />
                      Mark as Resolved
                    </button>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close"
              onClick={() => setSelectedImage(null)}
            >
              <FaTimes />
            </button>
            <img 
              src={`http://192.168.92.34:5000/uploads/${selectedImage.filename}`} 
              alt={selectedImage.original_name}
            />
            <div className="image-modal-info">
              <h4>{selectedImage.original_name}</h4>
              <p>Size: {formatFileSize(selectedImage.file_size)}</p>
              <p>Uploaded: {new Date(selectedImage.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryDetail; 