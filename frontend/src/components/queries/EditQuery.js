import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaSave, FaTimes, FaUser, FaTag, FaLayerGroup, FaCog, FaTools } from 'react-icons/fa';
import './Queries.css';

const EditQuery = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    tool_id: '',
    design_stage_id: '',
    issue_category_id: '',
    debug_steps: '',
    resolution: ''
  });

  // Options for dropdowns
  const [tools, setTools] = useState([]);
  const [designStages, setDesignStages] = useState([]);
  const [issueCategories, setIssueCategories] = useState([]);

  useEffect(() => {
    if (user?.role !== 'teacher') {
      navigate('/queries');
      return;
    }
    
    fetchQuery();
    fetchOptions();
  }, [id, user]);

  const fetchQuery = async () => {
    try {
      const response = await axios.get(`/queries/${id}`);
      const queryData = response.data.query;
      setQuery(queryData);
      
      // Populate form data
      setFormData({
        title: queryData.title || '',
        description: queryData.description || '',
        category: queryData.category || '',
        priority: queryData.priority || 'medium',
        tool_id: queryData.tool_id || '',
        design_stage_id: queryData.design_stage_id || '',
        issue_category_id: queryData.issue_category_id || '',
        debug_steps: queryData.debug_steps || '',
        resolution: queryData.resolution || ''
      });
    } catch (error) {
      setError('Failed to load query');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [toolsRes, stagesRes, categoriesRes] = await Promise.all([
        axios.get('/queries/tools'),
        axios.get('/queries/design-stages'),
        axios.get('/queries/issue-categories')
      ]);

      setTools(toolsRes.data.tools);
      setDesignStages(stagesRes.data.stages);
      setIssueCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Filter out empty values
      const updateData = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '' && formData[key] !== null) {
          updateData[key] = formData[key];
        }
      });

      await axios.put(`/queries/${id}`, updateData);
      setSuccess('Query updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/queries/${id}`);
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update query');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-query-page">
        <div className="loading">Loading query details...</div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="create-query-page">
        <div className="error">Query not found</div>
        <button onClick={() => navigate('/queries')} className="btn btn-primary">
          Back to Queries
        </button>
      </div>
    );
  }

  return (
    <div className="create-query-page">
      <div className="page-header">
        <button 
          onClick={() => navigate(`/queries/${id}`)} 
          className="back-btn"
        >
          <FaArrowLeft /> Back to Query
        </button>
        <h1>Edit Query</h1>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="create-query-form">
        <div className="query-info-header">
          <h3>Student Query Information</h3>
          <div className="student-info-display">
            <FaUser />
            <span><strong>Student:</strong> {query.student_name}</span>
            <span><strong>Created:</strong> {new Date(query.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Query Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-control"
                required
                placeholder="Enter query title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-control"
              rows="6"
              required
              placeholder="Describe the VLSI design issue or question..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">
                <FaTag /> Category
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-control"
                placeholder="e.g., Layout, Simulation, Synthesis"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tool_id">
                <FaTools /> Tool
              </label>
              <select
                id="tool_id"
                name="tool_id"
                value={formData.tool_id}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">Select Tool</option>
                {tools.map(tool => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="design_stage_id">
                <FaLayerGroup /> Design Stage
              </label>
              <select
                id="design_stage_id"
                name="design_stage_id"
                value={formData.design_stage_id}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">Select Design Stage</option>
                {designStages.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="issue_category_id">
                <FaCog /> Issue Category
              </label>
              <select
                id="issue_category_id"
                name="issue_category_id"
                value={formData.issue_category_id}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">Select Issue Category</option>
                {issueCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="debug_steps">Debug Steps</label>
            <textarea
              id="debug_steps"
              name="debug_steps"
              value={formData.debug_steps}
              onChange={handleInputChange}
              className="form-control"
              rows="4"
              placeholder="Describe any debugging steps already attempted..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="resolution">Resolution</label>
            <textarea
              id="resolution"
              name="resolution"
              value={formData.resolution}
              onChange={handleInputChange}
              className="form-control"
              rows="4"
              placeholder="Describe how this issue was resolved..."
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/queries/${id}`)}
              className="btn btn-outline"
              disabled={saving}
            >
              <FaTimes />
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="query-tips">
        <h3>Teacher Guidelines</h3>
        <ul>
          <li>You can modify the query title, description, and technical details to help clarify the student's issue</li>
          <li>Update the priority level based on the severity and urgency of the problem</li>
          <li>Add or modify debug steps to show what troubleshooting has been attempted</li>
          <li>Ensure the category and design stage accurately reflect the student's current work</li>
          <li>Changes will be visible to the student and help provide better context for responses</li>
        </ul>
      </div>
    </div>
  );
};

export default EditQuery; 