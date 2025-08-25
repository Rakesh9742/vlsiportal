import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPaperPlane, FaArrowLeft, FaExclamationTriangle, FaTools, FaLayerGroup, FaTag, FaImage, FaTimes } from 'react-icons/fa';
import './Queries.css';

const CreateQuery = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tool_id: '',
    technology: '',
    stage_id: '',
    issue_category_id: '',
    custom_issue_category: '',
    debug_steps: '',
    resolution: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stages, setStages] = useState([]);
  const [issueCategories, setIssueCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [userDomain, setUserDomain] = useState(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  useEffect(() => {
    // Fetch user data and domain-specific stages, tools
    const fetchData = async () => {
      try {
        // Get current user to determine domain
        const userRes = await axios.get('/auth/me');
        const user = userRes.data.user;
        setUserDomain(user.domain);
        
        // Fetch tools based on user's domain
        if (user.domain_id) {
          const toolsRes = await axios.get(`/queries/tools/${user.domain_id}`);
          setTools(toolsRes.data.tools);
        } else {
          // Fallback to all tools if domain_id is not available
          const toolsRes = await axios.get('/queries/tools');
          setTools(toolsRes.data.tools);
        }
        
        // Fetch technologies
        const technologiesRes = await axios.get('/queries/technologies');
        setTechnologies(technologiesRes.data.technologies);
        
        // Fetch domain-specific stages based on user's domain
        if (user.domain === 'Physical Design') {
          // For Physical Design, use the pd_stages table
          const stagesRes = await axios.get('/queries/pd-stages');
          setStages(stagesRes.data.stages);
        } else {
          // For other domains, use the domain_id from user response
          if (user.domain_id) {
            // Fetch stages from domain_stages table
            const stagesRes = await axios.get(`/queries/domain-stages/${user.domain_id}`);
            setStages(stagesRes.data.stages);
          } else {
            // Fallback to domain config if domain ID is not available
            const domainConfigRes = await axios.get(`/queries/domain-config/${user.domain}`);
            const domainStages = domainConfigRes.data.stages.map((stage, index) => ({
              id: index + 1,
              name: stage,
              description: stage
            }));
            setStages(domainStages);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // If stage is selected, load corresponding issue categories
    if (name === 'stage_id' && value) {
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
      // Don't proceed if userDomain is not set yet
      if (!userDomain) {
        console.log('User domain not set yet, skipping issue categories load');
        return;
      }
      
      if (userDomain === 'Physical Design') {
        // For Physical Design, use pd_issue_categories table
        const response = await axios.get(`/queries/pd-issue-categories/${stageId}`);
        setIssueCategories(response.data.categories);
      } else {
        // For other domains, use domain_issue_categories table
        const response = await axios.get(`/queries/domain-issue-categories/${stageId}`);
        setIssueCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error loading issue categories:', error);
      setIssueCategories([]);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (selectedImages.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('File size must be less than 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length !== files.length) {
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);
    setError('');

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, {
          file: file,
          url: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create FormData for multipart/form-data
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          // If custom category is used, send it instead of issue_category_id
          if (key === 'issue_category_id' && formData[key] === 'others' && formData.custom_issue_category) {
            submitData.append('custom_issue_category', formData.custom_issue_category);
          } else if (key !== 'custom_issue_category') {
            submitData.append(key, formData[key]);
          }
        }
      });

      // Add images
      selectedImages.forEach((file, index) => {
        submitData.append('images', file);
      });

      await axios.post('/queries', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      navigate('/queries');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-query-page">
      <div className="page-header">
        <button 
          onClick={() => navigate('/queries')} 
          className="back-btn"
        >
          <FaArrowLeft /> Back to Queries
        </button>
        <h1>Create New Query</h1>
        <p>Ask a question to VLSI expert reviewers</p>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="create-query-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Query Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a clear title for your query"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Query Description</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your question in detail. Include any relevant context, code snippets, or specific issues you're facing."
              rows="8"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stage_id">Design Stage</label>
              <select
                id="stage_id"
                name="stage_id"
                className="form-control"
                value={formData.stage_id}
                onChange={handleChange}
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
              <label htmlFor="issue_category_id">Issue Category</label>
              <select
                id="issue_category_id"
                name="issue_category_id"
                className="form-control"
                value={formData.issue_category_id}
                onChange={handleChange}
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
                  onChange={handleChange}
                  placeholder="Enter your custom issue category"
                  required
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tool_id">Tool</label>
            <select
              id="tool_id"
              name="tool_id"
              className="form-control"
              value={formData.tool_id}
              onChange={handleChange}
            >
              <option value="">Select Tool</option>
              {tools.map(tool => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="technology">Technology</label>
            <input
              type="text"
              id="technology"
              name="technology"
              className="form-control"
              value={formData.technology}
              onChange={handleChange}
              placeholder="Enter technology (e.g., TSMC 28nm, GF 22nm, etc.)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="debug_steps">Debug Steps </label>
            <textarea
              id="debug_steps"
              name="debug_steps"
              className="form-control"
              value={formData.debug_steps}
              onChange={handleChange}
              placeholder="Describe any debugging steps you've already tried..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="resolution">Resolution</label>
            <textarea
              id="resolution"
              name="resolution"
              className="form-control"
              value={formData.resolution}
              onChange={handleChange}
              placeholder="If you've already resolved this issue, describe how you solved it..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="images">Upload Images </label>
            <div className="image-upload-container">
              <input
                type="file"
                id="images"
                name="images"
                className="image-input"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                disabled={selectedImages.length >= 5}
              />
              <label htmlFor="images" className="image-upload-label">
                <FaImage className="upload-icon" />
                <span>Choose Images</span>
                <small>Maximum 5 images, 5MB each</small>
              </label>
            </div>
            
            {imagePreview.length > 0 && (
              <div className="image-preview-container">
                <h4>Selected Images ({imagePreview.length}/5):</h4>
                <div className="image-preview-grid">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview.url} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeImage(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/queries')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Submit Query
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="query-tips">
        <h3>Tips for a Good Query</h3>
        <ul>
          <li>Be specific and clear about your question</li>
          <li>Include relevant context and background information</li>
          <li>If it's a technical question, include code snippets or diagrams</li>
          <li>Mention what you've already tried or researched</li>
          <li>Use a descriptive title that summarizes your question</li>
          <li>Select appropriate design stage and issue category for better responses</li>
          <li>Specify the tool you're using if relevant</li>
          <li>Upload relevant images to help expert reviewers understand your issue better</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateQuery; 