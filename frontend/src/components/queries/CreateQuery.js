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
    design_stage_id: '',
    issue_category_id: '',
    debug_steps: '',
    resolution: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [designStages, setDesignStages] = useState([]);
  const [issueCategories, setIssueCategories] = useState([]);
  const [tools, setTools] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  useEffect(() => {
    // Fetch design stages, issue categories, and tools
    const fetchData = async () => {
      try {
        const [stagesRes, categoriesRes, toolsRes] = await Promise.all([
          axios.get('/queries/design-stages'),
          axios.get('/queries/issue-categories'),
          axios.get('/queries/tools')
        ]);
        setDesignStages(stagesRes.data.stages);
        setIssueCategories(categoriesRes.data.categories);
        setTools(toolsRes.data.tools);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
          submitData.append(key, formData[key]);
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
        <p>Ask a question to VLSI teachers</p>
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
              <label htmlFor="design_stage_id">Design Stage</label>
              <select
                id="design_stage_id"
                name="design_stage_id"
                className="form-control"
                value={formData.design_stage_id}
                onChange={handleChange}
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
              <label htmlFor="issue_category_id">Issue Category</label>
              <select
                id="issue_category_id"
                name="issue_category_id"
                className="form-control"
                value={formData.issue_category_id}
                onChange={handleChange}
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
          <li>Upload relevant images to help teachers understand your issue better</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateQuery; 