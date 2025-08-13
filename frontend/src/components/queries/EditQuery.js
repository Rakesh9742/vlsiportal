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
    tool_id: '',
    stage_id: '',
    issue_category_id: '',
    custom_issue_category: '',
    debug_steps: '',
    resolution: ''
  });

  // Options for dropdowns
  const [tools, setTools] = useState([]);
  const [stages, setStages] = useState([]);
  const [issueCategories, setIssueCategories] = useState([]);
  const [studentDomain, setStudentDomain] = useState(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [originalIssueCategoryName, setOriginalIssueCategoryName] = useState(null);

  useEffect(() => {
    if (user?.role !== 'expert_reviewer' && user?.role !== 'admin') {
      navigate('/queries');
      return;
    }
    
    fetchQuery();
    fetchOptions();
  }, [id, user]);

  // Load stages when student domain is available
  useEffect(() => {
    if (studentDomain) {
      loadStagesForDomain(studentDomain);
    }
  }, [studentDomain]);

  // Load issue categories when both query and studentDomain are available
  useEffect(() => {
    if (query && studentDomain && query.stage_id) {
      loadIssueCategories(query.stage_id);
    }
  }, [query, studentDomain, originalIssueCategoryName]);

  const fetchQuery = async () => {
    try {
      const response = await axios.get(`/queries/${id}`);
      const queryData = response.data.query;
      setQuery(queryData);
      
      // Populate form data
      setFormData({
        title: queryData.title || '',
        description: queryData.description || '',
        tool_id: queryData.tool_id || '',
        stage_id: queryData.stage_id || '',
        issue_category_id: queryData.issue_category_id || '',
        custom_issue_category: queryData.custom_issue_category || '',
        debug_steps: queryData.debug_steps || '',
        resolution: queryData.resolution || ''
      });
      
      // Store the student's domain and original issue category name for validation
      setStudentDomain(queryData.student_domain);
      setOriginalIssueCategoryName(queryData.issue_category_name);
      
      // Check if custom category should be shown
      if (queryData.custom_issue_category) {
        setShowCustomCategory(true);
        // Set issue_category_id to 'others' for custom categories
        setFormData(prev => ({
          ...prev,
          issue_category_id: 'others'
        }));
      }
    } catch (error) {
      setError('Failed to load query');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      // Fetch tools
      const toolsRes = await axios.get('/queries/tools');
      setTools(toolsRes.data.tools);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  // Load stages based on student's domain
  const loadStagesForDomain = async (domain) => {
    try {
      console.log('Loading stages for student domain:', domain);
      if (domain === 'Physical Design') {
        const stagesRes = await axios.get('/queries/pd-stages');
        setStages(stagesRes.data.stages);
      } else {
        // For other domains, use the domain config
        const domainConfigRes = await axios.get(`/queries/domain-config/${domain}`);
        const domainStages = domainConfigRes.data.stages.map((stage, index) => ({
          id: index + 1,
          name: stage,
          description: stage
        }));
        setStages(domainStages);
      }
    } catch (error) {
      console.error('Failed to load stages for domain:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Form field changed:', name, value);
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If stage is selected, load corresponding issue categories
    if (name === 'stage_id' && value) {
      console.log('Stage selected, loading categories for stage:', value);
      loadIssueCategories(value);
      // Reset issue category when stage changes
      setFormData(prev => ({
        ...prev,
        issue_category_id: '',
        custom_issue_category: ''
      }));
      setShowCustomCategory(false);
    }
    
    // If issue category is "Others", show custom input
    if (name === 'issue_category_id') {
      if (value === 'others') {
        setShowCustomCategory(true);
        setFormData(prev => ({
          ...prev,
          custom_issue_category: ''
        }));
      } else {
        setShowCustomCategory(false);
        setFormData(prev => ({
          ...prev,
          custom_issue_category: ''
        }));
      }
    }
  };

  const loadIssueCategories = async (stageId) => {
    try {
      console.log('Loading issue categories for stage:', stageId, 'Student Domain:', studentDomain);
      
      // Don't proceed if studentDomain is not set yet
      if (!studentDomain) {
        console.log('Student domain not set yet, skipping issue categories load');
        return;
      }
      
      if (studentDomain === 'Physical Design') {
        const response = await axios.get(`/queries/pd-issue-categories/${stageId}`);
        console.log('Loaded PD categories:', response.data.categories);
        setIssueCategories(response.data.categories);
        
        // If we're editing and have an existing issue_category_id, check if it's still valid
        if (query && query.issue_category_id && !query.custom_issue_category) {
          const categoryExists = response.data.categories.find(cat => cat.id == query.issue_category_id);
          if (!categoryExists) {
            // If the category doesn't exist anymore, reset it
            setFormData(prev => ({
              ...prev,
              issue_category_id: ''
            }));
          }
        }
      } else {
        // For other domains, get categories from domain config
        const domainConfigRes = await axios.get(`/queries/domain-config/${studentDomain}`);
        const selectedStage = stages.find(stage => stage.id == stageId);
        if (selectedStage && domainConfigRes.data.issueCategories[selectedStage.name]) {
          const categories = domainConfigRes.data.issueCategories[selectedStage.name].map((category, index) => ({
            id: index + 1,
            name: category,
            description: category
          }));
          setIssueCategories(categories);
          
          // If we're editing and have an existing issue_category_id, check if it's still valid
          if (query && query.issue_category_id && !query.custom_issue_category) {
            console.log('Checking existing issue category:', {
              originalId: query.issue_category_id,
              originalName: originalIssueCategoryName,
              availableCategories: categories
            });
            
            // Try to find the category by ID first
            let categoryExists = categories.find(cat => cat.id == query.issue_category_id);
            
            // If not found by ID, try to find by name (in case the original category name still exists)
            if (!categoryExists && originalIssueCategoryName) {
              categoryExists = categories.find(cat => cat.name === originalIssueCategoryName);
              if (categoryExists) {
                console.log('Found category by name, updating ID from', query.issue_category_id, 'to', categoryExists.id);
                // Update the form data to use the correct ID
                setFormData(prev => ({
                  ...prev,
                  issue_category_id: categoryExists.id
                }));
              }
            }
            
            // If still not found, reset it
            if (!categoryExists) {
              console.log('Category not found, resetting issue_category_id');
              setFormData(prev => ({
                ...prev,
                issue_category_id: ''
              }));
            }
          }
        } else {
          setIssueCategories([]);
        }
      }
    } catch (error) {
      console.error('Error loading issue categories:', error);
      setIssueCategories([]);
    }
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
          // If custom category is used, send it instead of issue_category_id
          if (key === 'issue_category_id' && formData[key] === 'others' && formData.custom_issue_category) {
            updateData.custom_issue_category = formData.custom_issue_category;
            // Set issue_category_id to null when using custom category
            updateData.issue_category_id = null;
          } else if (key !== 'custom_issue_category') {
            updateData[key] = formData[key];
          }
        }
      });

      console.log('Submitting update data:', updateData);

      await axios.put(`/queries/${id}`, updateData);
      setSuccess('Query updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate(`/queries/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Update error:', error.response?.data);
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
            <span><strong>Domain:</strong> {query.student_domain}</span>
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
              <label htmlFor="stage_id">
                <FaLayerGroup /> Design Stage
              </label>
              <select
                id="stage_id"
                name="stage_id"
                value={formData.stage_id}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="">Select Design Stage</option>
                {stages.map(stage => (
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
                disabled={!formData.stage_id}
              >
                <option value="">{formData.stage_id ? 'Select Issue Category' : 'Select a stage first'}</option>
                {issueCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="others">Others</option>
              </select>
            </div>
            
            {showCustomCategory && (
              <div className="form-group">
                <label htmlFor="custom_issue_category">Custom Issue Category</label>
                <input
                  type="text"
                  id="custom_issue_category"
                  name="custom_issue_category"
                  className="form-control"
                  value={formData.custom_issue_category}
                  onChange={handleInputChange}
                  placeholder="Enter your custom issue category"
                  required
                />
              </div>
            )}
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
        <h3>{user?.role === 'admin' ? 'Admin Guidelines' : 'Expert Reviewer Guidelines'}</h3>
        <ul>
          <li>You can modify the query title, description, and technical details to help clarify the student's issue</li>
          <li>Add or modify debug steps to show what troubleshooting has been attempted</li>
          <li>Ensure the design stage and issue category accurately reflect the student's current work</li>
          <li>Changes will be visible to the student and help provide better context for responses</li>
        </ul>
      </div>
    </div>
  );
};

export default EditQuery; 