import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaSave, FaTimes, FaUser, FaTag, FaLayerGroup, FaCog, FaTools } from 'react-icons/fa';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/Select';
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
    technology: '',
    stage_id: '',
    issue_category_id: '',
    custom_issue_category: '',
    debug_steps: '',
    resolution: ''
  });

  // Options for dropdowns
  const [tools, setTools] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [stages, setStages] = useState([]);
  const [issueCategories, setIssueCategories] = useState([]);
  const [studentDomain, setStudentDomain] = useState(null);
  const [studentDomainId, setStudentDomainId] = useState(null);
  const [domains, setDomains] = useState([]);
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

  // Load tools when student domain and domains list are available
  useEffect(() => {
    if (studentDomain && domains.length > 0) {
      // Find the domain_id for the student's domain
      const domain = domains.find(d => d.name === studentDomain);
      if (domain) {
        setStudentDomainId(domain.id);
        loadToolsForDomain(domain.id);
      } else {
        // Fallback to all tools if domain not found
        loadToolsForDomain(null);
      }
    }
  }, [studentDomain, domains]);

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
        technology: queryData.technology || '',
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
        // Don't set issue_category_id to 'others' here - wait until issue categories are loaded
      }
    } catch (error) {
      setError('Failed to load query');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      // Fetch technologies
      const technologiesRes = await axios.get('/queries/technologies');
      setTechnologies(technologiesRes.data.technologies);
      
      // Fetch domains for domain_id lookup
      const domainsRes = await axios.get('/users/domains');
      setDomains(domainsRes.data.domains);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  // Load tools based on student's domain
  const loadToolsForDomain = async (domainId) => {
    try {
      if (domainId) {
        const toolsRes = await axios.get(`/queries/tools/${domainId}`);
        setTools(toolsRes.data.tools);
      } else {
        // Fallback to all tools if domain_id is not available
        const toolsRes = await axios.get('/queries/tools');
        setTools(toolsRes.data.tools);
      }
    } catch (error) {
      console.error('Failed to load tools for domain:', error);
    }
  };

  // Load stages based on student's domain
  const loadStagesForDomain = async (domain) => {
    try {
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
    
    if (name === 'issue_category_id') {
      console.log('📝 ISSUE CATEGORY CHANGED:', {
        newValue: value,
        previousValue: formData.issue_category_id,
        categoryName: issueCategories.find(cat => cat.id == value)?.name || 'Custom/Others'
      });
    } else {
      console.log('Form field changed:', name, value);
    }
    
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
    
    // If issue category is "Others", show custom input (but not for Analog Layout)
    if (name === 'issue_category_id') {
      if (value === 'others' && studentDomain !== 'Analog Layout') {
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
      console.log('🔄 LOADING ISSUE CATEGORIES - Stage:', stageId, 'Domain:', studentDomain);
      
      // Don't proceed if studentDomain is not set yet
      if (!studentDomain) {
        console.log('❌ Student domain not set yet, skipping issue categories load');
        return;
      }
      
      if (studentDomain === 'Physical Design') {
        const response = await axios.get(`/queries/pd-issue-categories/${stageId}`);
        console.log('✅ LOADED PD CATEGORIES:', response.data.categories.map(cat => ({id: cat.id, name: cat.name})));
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
        // For other domains, get categories from database using actual IDs
        const response = await axios.get(`/queries/domain-issue-categories/${stageId}`);
        console.log('✅ LOADED DOMAIN CATEGORIES:', response.data.categories.map(cat => ({id: cat.id, name: cat.name})));
        setIssueCategories(response.data.categories);
          
        // If we're editing and have an existing issue_category_id, check if it's still valid
        if (query && query.issue_category_id && !query.custom_issue_category) {
          console.log('🔍 CHECKING EXISTING ISSUE CATEGORY:', {
            originalId: query.issue_category_id,
            originalName: originalIssueCategoryName,
            availableCategories: response.data.categories.map(cat => ({id: cat.id, name: cat.name}))
          });
          
          // Try to find the category by ID first
          let categoryExists = response.data.categories.find(cat => cat.id == query.issue_category_id);
          
          // If not found by ID, try to find by name (in case the original category name still exists)
          if (!categoryExists && originalIssueCategoryName) {
            categoryExists = response.data.categories.find(cat => cat.name === originalIssueCategoryName);
            if (categoryExists) {
              console.log('🔄 FOUND CATEGORY BY NAME - Updating ID from', query.issue_category_id, 'to', categoryExists.id);
              // Update the form data to use the correct ID
              setFormData(prev => ({
                ...prev,
                issue_category_id: categoryExists.id
              }));
            }
          }
          
          // If still not found, reset it
          if (!categoryExists) {
            console.log('❌ CATEGORY NOT FOUND - Resetting issue_category_id');
            setFormData(prev => ({
              ...prev,
              issue_category_id: ''
            }));
          }
        }
      }
      
      // After loading categories, set issue_category_id to 'others' if there's a custom category
      if (query && query.custom_issue_category) {
        setFormData(prev => ({
          ...prev,
          issue_category_id: 'others'
        }));
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

      console.log('💾 SUBMITTING UPDATE DATA:', updateData);
      
      // Log specific issue category data being saved
      if (updateData.issue_category_id) {
        const categoryName = issueCategories.find(cat => cat.id == updateData.issue_category_id)?.name;
        console.log('💾 SAVING ISSUE CATEGORY:', {
          id: updateData.issue_category_id,
          name: categoryName
        });
      } else if (updateData.custom_issue_category) {
        console.log('💾 SAVING CUSTOM ISSUE CATEGORY:', updateData.custom_issue_category);
      }

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
              <Select
                value={formData.tool_id ? String(formData.tool_id) : ''}
                onValueChange={(value) => handleInputChange({ target: { name: 'tool_id', value } })}
              >
                <SelectTrigger className="form-control">
                  <SelectValue placeholder="Select Tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {tools.map(tool => (
                      <SelectItem key={tool.id} value={String(tool.id)}>
                        {tool.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group">
              <label htmlFor="technology">Technology</label>
              <input
                type="text"
                id="technology"
                name="technology"
                value={formData.technology}
                onChange={handleInputChange}
                className="form-control"
                                 placeholder="Enter technology (e.g., TSMC 28nm, GF 22nm, etc.)"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stage_id">
                <FaLayerGroup /> Design Stage
              </label>
              <Select
                value={formData.stage_id ? String(formData.stage_id) : ''}
                onValueChange={(value) => handleInputChange({ target: { name: 'stage_id', value } })}
              >
                <SelectTrigger className="form-control">
                  <SelectValue placeholder="Select Design Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={String(stage.id)}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group">
              <label htmlFor="issue_category_id">
                <FaCog /> Issue Category
              </label>
              <Select
                value={formData.issue_category_id ? String(formData.issue_category_id) : ''}
                onValueChange={(value) => handleInputChange({ target: { name: 'issue_category_id', value } })}
                disabled={!formData.stage_id}
              >
                <SelectTrigger className="form-control">
                  <SelectValue placeholder={formData.stage_id ? 'Select Issue Category' : 'Select a stage first'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {issueCategories.map(category => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {studentDomain !== 'Analog Layout' && (
                      <SelectItem value="others">Others</SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
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