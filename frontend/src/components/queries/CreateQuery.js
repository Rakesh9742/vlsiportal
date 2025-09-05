import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPaperPlane, FaArrowLeft, FaExclamationTriangle, FaTools, FaLayerGroup, FaTag, FaImage, FaTimes, FaArrowDown } from 'react-icons/fa';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/Select';
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

  // Function to get domain-specific examples
  const getDomainExamples = (domain) => {
    const examples = {
      'Physical Design': [
        {
          title: "Clock Domain Crossing Violations in Multi-Clock Design",
          description: "Getting setup violations between fast clock domain clk1 (500MHz) and slow clock domain clk2 (300MHz) in design. The violations appear in synthesis timing reports after optimization step. Synthesis tool is reporting timing paths that cross between clk1 and clk2 domains.",
          stage: "Synthesis",
          category: "Timing Violations",
          tool: "Synopsys Design Compiler",
          technology: "28nm",
          debugSteps: "1. Checked SDC constraints for both clock domains\n2. Verified clock definitions and periods in constraint file\n3. Ran report_timing -from clk1 -to clk2 to analyze cross-domain paths\n4. Checked if sdc is having asynchronous clock defined for these clock groups using set_clock_groups command.",
          resolution: "1. Updated SDC with below SDC command to define clk1 & clk2 as asynchronous after verifying with designer.\n   set_clock_groups -asynchronous -group clk1 -group clk2 -name asyn_clks\n2. Reran synthesis with updated SDC\n3. Verified timing reports, to check if violations are resolved.\n4. Also, verified by running below command in interactive session to check if constriants are applied correctly.\n   report_timing -from clk1 -to clk2\n   Now, tool reports as No paths.\n5. Attached the timing report snapshots before and after fix for reference."
        },
        {
          title: "High congestion in macro channels due to missing soft blockages",
          description: "Experiencing severe routing congestion (with hotspot score > 500) in channels between SRAM macros after placement. The placement tool placed many standard cells in the macro channel, leaving insufficient routing channels. This is causing lot of congestion overflow GRCs in macro channels.",
          stage: "Placement",
          category: "Congestion",
          tool: "Cadence Innovus",
          technology: "28nm",
          debugSteps: "1. Generated congestion hotspot score report using report_congestion -hotpsot command\n2. Checked if current macro channel spacing is sufficient based on pin count of macros\n3. Analyzed cell density in channel region using cell density map\n4. Reviewed the type of cells placed in the channel region using below procedure\n5. Selected all instances placed in channel region by using select_obj [get_obj_in_area -area {llx lly urx ury} -object_type inst]; where llx lly urx ury are coordinates of channel region\n6. Identified the library cell types by using get_db selected .base_cell.name\n7. Noticed that many sequential cells and other combinational cells placed in channel region\n8. So identified issue as there is no soft blockage tool has placed many other type of cells which is increasing the no. of nets in channel and leading to congestion",
          resolution: "1. Reran placement by creating soft placement blockages in macro channel regions.\n   Command used: create_place_blockage -type soft -area {llx lly urx ury} -name PB_SOFT1\n2. Verified congestion report after place_opt_design, now the hotpsot score reduced to 50.\n3. Attached snapshot of congestion reports & maps before and after fix for reference."
        }
      ],
      'Analog Layout': [
        {
          title: "Differential pair matching issues in current mirror layout",
          description: "I'm designing a current mirror with 1:5 ratio in 22nm technology. The differential pair shows significant mismatch (&gt;2%) in simulation. I've used common centroid layout and dummy devices, but the matching is still poor. The devices are sized at W/L = 10μm/0.5μm.",
          stage: "Layout Design",
          category: "Matching Issues",
          tool: "Cadence Virtuoso",
          technology: "GlobalFoundries 22nm",
          debugSteps: "1. Verified common centroid placement 2. Added dummy devices 3. Checked device orientation 4. Analyzed process variations"
        },
        {
          title: "Parasitic extraction showing unexpected coupling",
          description: "Parasitic extraction in my analog layout shows unexpected coupling between sensitive analog nets and digital switching signals. The coupling is causing noise injection into the analog circuits. I've tried shielding and spacing, but the coupling remains significant.",
          stage: "Parasitic Extraction",
          category: "Noise Issues",
          tool: "Synopsys StarRC",
          technology: "TSMC 28nm",
          debugSteps: "1. Added shielding layers 2. Increased spacing between nets 3. Analyzed coupling capacitance 4. Checked guard ring placement"
        },
        {
          title: "LVS verification failing due to device mismatch",
          description: "LVS verification is failing because the extracted netlist doesn't match the schematic. The issue is with device parameter extraction, particularly with custom device definitions. The devices are properly defined in the PDK, but the extraction is not recognizing them correctly.",
          stage: "LVS Verification",
          category: "Verification Issues",
          tool: "Calibre LVS",
          technology: "GlobalFoundries 14nm",
          debugSteps: "1. Checked device definitions 2. Verified PDK setup 3. Analyzed extraction rules 4. Reviewed device parameters"
        }
      ],
      'RTL Design': [
        {
          title: "FIFO depth calculation for variable rate data transfer",
          description: "I need to design a FIFO between two modules with different clock domains. Module A sends data at variable rates (burst mode), and Module B processes data at a constant rate. How do I calculate the optimal FIFO depth to prevent overflow while minimizing area?",
          stage: "RTL Design",
          category: "Design Methodology",
          tool: "Verilog/VHDL",
          technology: "Generic (FPGA/ASIC)",
          debugSteps: "1. Analyzed data rate patterns 2. Calculated worst-case scenarios 3. Simulated with different FIFO depths"
        },
        {
          title: "Clock domain crossing synchronization issues",
          description: "I'm implementing clock domain crossing between a 100MHz and 200MHz domain. The CDC module is showing metastability issues in simulation. I've used double-flop synchronization, but still getting occasional data corruption. The data width is 32 bits.",
          stage: "RTL Design",
          category: "Timing Issues",
          tool: "ModelSim/QuestaSim",
          technology: "Generic",
          debugSteps: "1. Implemented double-flop CDC 2. Added metastability analysis 3. Checked timing constraints 4. Verified CDC protocols"
        },
        {
          title: "State machine optimization for power efficiency",
          description: "My state machine is consuming too much power due to frequent state transitions. I need to optimize it for power efficiency while maintaining functionality. The state machine has 16 states and operates at 500MHz. How can I reduce power consumption?",
          stage: "RTL Design",
          category: "Power Optimization",
          tool: "Synopsys Design Compiler",
          technology: "TSMC 28nm",
          debugSteps: "1. Analyzed state transition patterns 2. Implemented clock gating 3. Optimized state encoding 4. Added power analysis"
        }
      ],
      'Verification': [
        {
          title: "UVM testbench failing to detect protocol violations",
          description: "My UVM testbench for an AXI4 interface is not detecting protocol violations. The monitor is configured correctly, but it's missing some handshake violations. I'm using SystemVerilog with UVM 1.2. The interface has 5 channels: AW, W, B, AR, R.",
          stage: "Verification",
          category: "Protocol Issues",
          tool: "ModelSim/QuestaSim",
          technology: "Generic",
          debugSteps: "1. Checked monitor configuration 2. Verified protocol checker setup 3. Analyzed waveform for violations 4. Reviewed UVM sequence generation"
        },
        {
          title: "Coverage closure issues in complex test scenarios",
          description: "I'm having trouble achieving coverage closure in my verification environment. The functional coverage is stuck at 85% for several critical scenarios. The design has multiple interfaces and complex state machines. How can I improve coverage?",
          stage: "Verification",
          category: "Coverage Issues",
          tool: "Synopsys VCS",
          technology: "Generic",
          debugSteps: "1. Analyzed uncovered scenarios 2. Added directed tests 3. Implemented coverage-driven verification 4. Reviewed coverage exclusions"
        },
        {
          title: "Formal verification timeout in large design",
          description: "Formal verification is timing out on my large design module. The property checking is taking too long and hitting memory limits. The module has 1000+ flip-flops and complex combinational logic. How can I improve formal verification performance?",
          stage: "Verification",
          category: "Performance Issues",
          tool: "Synopsys VC Formal",
          technology: "Generic",
          debugSteps: "1. Partitioned the design 2. Simplified properties 3. Added abstraction techniques 4. Optimized formal engine settings"
        }
      ]
    };
    
    return examples[domain] || [];
  };

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
          // For Physical Design, use the pd_stages table with domainId
          if (user.domain_id) {
            const stagesRes = await axios.get(`/queries/pd-stages?domainId=${user.domain_id}`);
            setStages(stagesRes.data.stages);
          }
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
    
    // If issue category is "Others", show custom input (but not for Analog Layout)
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
        return;
      }
      
      // Get current user to get domain_id
      const userRes = await axios.get('/auth/me');
      const user = userRes.data.user;
      
      if (userDomain === 'Physical Design') {
        // For Physical Design, use pd_issue_categories table
        const response = await axios.get(`/queries/pd-issue-categories/${stageId}`);
        setIssueCategories(response.data.categories);
      } else {
        // For other domains, use domain_issue_categories table with domain_id
        if (user.domain_id) {
          // Use the domain-specific issue categories endpoint
          const response = await axios.get(`/queries/domain-issue-categories/${stageId}`);
          setIssueCategories(response.data.categories);
        } else {
          // Fallback to domain config if domain ID is not available
          const domainConfigRes = await axios.get(`/queries/domain-config/${userDomain}`);
          const stageConfig = domainConfigRes.data.issueCategories;
          if (stageConfig && stageConfig[stages.find(s => s.id == stageId)?.name]) {
            const categories = stageConfig[stages.find(s => s.id == stageId)?.name] || [];
            setIssueCategories(categories.map((cat, index) => ({
              id: index + 1,
              name: cat,
              description: cat
            })));
          } else {
            setIssueCategories([]);
          }
        }
      }
    } catch (error) {
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
        if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          // If custom category is used, send it instead of issue_category_id
          if (key === 'issue_category_id' && formData[key] === 'others' && formData.custom_issue_category) {
            // Don't send issue_category_id when using custom category
            // The custom_issue_category will be sent separately
          } else if (key !== 'custom_issue_category') {
            submitData.append(key, formData[key]);
          }
        }
      });

      // Handle custom issue category separately
      if (formData.issue_category_id === 'others' && formData.custom_issue_category) {
        submitData.append('custom_issue_category', formData.custom_issue_category);
      }

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
        <div className="header-content">
          <h1>Create New Query</h1>
          <p>Ask a question to VLSI expert reviewers</p>
        </div>
        {userDomain && (
          <button 
            onClick={() => document.getElementById('sample-examples')?.scrollIntoView({ behavior: 'smooth' })}
            className="jump-to-examples-btn"
          >
            <FaArrowDown /> Jump to Examples
          </button>
        )}
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
              <Select
                value={formData.stage_id}
                onValueChange={(value) => handleChange({ target: { name: 'stage_id', value } })}
              >
                <SelectTrigger className="form-control">
                  <SelectValue placeholder="Select Design Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="others">Others</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group">
              <label htmlFor="issue_category_id">Issue Category</label>
              <Select
                value={formData.issue_category_id}
                onValueChange={(value) => handleChange({ target: { name: 'issue_category_id', value } })}
                disabled={!formData.stage_id}
              >
                <SelectTrigger className="form-control">
                  <SelectValue placeholder={formData.stage_id ? 'Select Issue Category' : 'Select a stage first'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {issueCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="others">Others</SelectItem>
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
                  onChange={handleChange}
                  placeholder="Enter your custom issue category"
                  required
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="tool_id">Tool</label>
            <Select
              value={formData.tool_id}
              onValueChange={(value) => handleChange({ target: { name: 'tool_id', value } })}
            >
              <SelectTrigger className="form-control">
                <SelectValue placeholder="Select Tool" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tools.map(tool => (
                    <SelectItem key={tool.id} value={tool.id}>
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

      {userDomain && (
        <div id="sample-examples" className="sample-examples">
          <h3>Sample Examples for {userDomain}</h3>
          
          {getDomainExamples(userDomain).map((example, index) => (
            <div key={index} className="example-section">
              <h4>Example {index + 1}: {userDomain} Issue</h4>
              <div className="example-content">
                <div className="example-field">
                  <strong>Title:</strong> {example.title}
                </div>
                <div className="example-field">
                  <strong>Description:</strong> {example.description}
                </div>
                <div className="example-field">
                  <strong>Design Stage:</strong> {example.stage}
                </div>
                <div className="example-field">
                  <strong>Issue Category:</strong> {example.category}
                </div>
                <div className="example-field">
                  <strong>Tool:</strong> {example.tool}
                </div>
                <div className="example-field">
                  <strong>Technology:</strong> {example.technology}
                </div>
                <div className="example-field">
                  <strong>Debug Steps:</strong>
                  <div className="debug-steps">
                    {example.debugSteps.split('\n').map((step, stepIndex) => (
                      <div key={stepIndex} className="debug-step">{step}</div>
                    ))}
                  </div>
                </div>
                {example.resolution && (
                  <div className="example-field">
                    <strong>Resolution:</strong>
                    <div className="resolution-steps">
                      {example.resolution.split('\n').map((step, stepIndex) => (
                        <div key={stepIndex} className="resolution-step">{step}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateQuery;