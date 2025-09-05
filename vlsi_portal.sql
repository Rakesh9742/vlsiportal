-- ==============================================
-- VLSI Portal - Fresh Optimized Database Schema
-- Created from scratch with best practices
-- ==============================================

-- Use existing database
USE vlsi_portal;

-- ==============================================
-- 1. DOMAINS TABLE
-- ==============================================
CREATE TABLE domains (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_domains_name (name),
    INDEX idx_domains_active (is_active)
) ENGINE=InnoDB;

-- ==============================================
-- 2. TECHNOLOGIES TABLE (REMOVED - Now using text input)
-- ==============================================
-- Technologies are now stored as text in queries table
-- No separate technologies table needed

-- ==============================================
-- 2. TOOLS TABLE
-- ==============================================
CREATE TABLE tools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    vendor VARCHAR(50), -- e.g., "Synopsys", "Cadence", "Mentor"
    category ENUM('synthesis', 'place_route', 'verification', 'simulation', 'analysis', 'other') DEFAULT 'other',
    domain_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL,
    INDEX idx_tools_name (name),
    INDEX idx_tools_vendor (vendor),
    INDEX idx_tools_category (category),
    INDEX idx_tools_domain (domain_id),
    INDEX idx_tools_active (is_active),
    UNIQUE KEY unique_tool_domain (name, domain_id)
) ENGINE=InnoDB;

-- ==============================================
-- 3. STAGES TABLE (Unified for all domains)
-- ==============================================
CREATE TABLE stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    domain_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_sequence INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
    INDEX idx_stages_domain (domain_id),
    INDEX idx_stages_name (name),
    INDEX idx_stages_order (order_sequence),
    INDEX idx_stages_active (is_active),
    UNIQUE KEY unique_stage_domain (name, domain_id)
) ENGINE=InnoDB;

-- ==============================================
-- 4. ISSUE_CATEGORIES TABLE (Unified)
-- ==============================================
CREATE TABLE issue_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stage_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    INDEX idx_issue_categories_stage (stage_id),
    INDEX idx_issue_categories_name (name),
    INDEX idx_issue_categories_severity (severity),
    INDEX idx_issue_categories_active (is_active),
    UNIQUE KEY unique_category_stage (name, stage_id)
) ENGINE=InnoDB;

-- ==============================================
-- 5. USERS TABLE
-- ==============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'expert_reviewer', 'admin', 'professional') NOT NULL,
    domain_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL,
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_domain (domain_id),
    INDEX idx_users_active (is_active),
    INDEX idx_users_last_login (last_login)
) ENGINE=InnoDB;

-- ==============================================
-- 6. QUERIES TABLE (Main queries table)
-- ==============================================
CREATE TABLE queries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    custom_query_id VARCHAR(50) UNIQUE,
    student_id INT NOT NULL,
    expert_reviewer_id INT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tool_id INT,
    technology VARCHAR(100), -- Changed from technology_id to text field
    stage_id INT,
    issue_category_id INT,
    custom_issue_category VARCHAR(200),
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    resolution_attempts INT DEFAULT 0,
    resolution TEXT,
    debug_steps TEXT,
    tags JSON, -- For flexible tagging
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (expert_reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE SET NULL,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE SET NULL,
    FOREIGN KEY (issue_category_id) REFERENCES issue_categories(id) ON DELETE SET NULL,
    
    INDEX idx_queries_student (student_id),
    INDEX idx_queries_expert (expert_reviewer_id),
    INDEX idx_queries_status (status),
    INDEX idx_queries_priority (priority),
    INDEX idx_queries_stage (stage_id),
    INDEX idx_queries_tool (tool_id),
    INDEX idx_queries_technology (technology),
    INDEX idx_queries_created (created_at),
    INDEX idx_queries_updated (updated_at),
    INDEX idx_queries_custom_id (custom_query_id),
    INDEX idx_queries_resolved (resolved_at)
) ENGINE=InnoDB;

-- ==============================================
-- 7. RESPONSES TABLE
-- ==============================================
CREATE TABLE responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query_id INT NOT NULL,
    responder_id INT NOT NULL,
    response_type ENUM('answer', 'clarification', 'follow_up', 'resolution') DEFAULT 'answer',
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_responses_query (query_id),
    INDEX idx_responses_responder (responder_id),
    INDEX idx_responses_type (response_type),
    INDEX idx_responses_solution (is_solution),
    INDEX idx_responses_created (created_at)
) ENGINE=InnoDB;

-- ==============================================
-- 8. QUERY_IMAGES TABLE
-- ==============================================
CREATE TABLE query_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    alt_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
    INDEX idx_query_images_query (query_id),
    INDEX idx_query_images_filename (filename),
    INDEX idx_query_images_mime (mime_type)
) ENGINE=InnoDB;

-- ==============================================
-- 9. QUERY_ASSIGNMENTS TABLE
-- ==============================================
CREATE TABLE query_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query_id INT NOT NULL,
    expert_reviewer_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('assigned', 'accepted', 'rejected', 'completed') DEFAULT 'assigned',
    notes TEXT,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
    FOREIGN KEY (expert_reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assignments_query (query_id),
    INDEX idx_assignments_expert (expert_reviewer_id),
    INDEX idx_assignments_assigner (assigned_by),
    INDEX idx_assignments_status (status),
    INDEX idx_assignments_assigned (assigned_at),
    UNIQUE KEY unique_query_assignment (query_id)
) ENGINE=InnoDB;

-- ==============================================
-- 10. QUERY_COMMENTS TABLE (For discussions)
-- ==============================================
CREATE TABLE query_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_comment_id INT NULL, -- For nested comments
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs public comments
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES query_comments(id) ON DELETE CASCADE,
    INDEX idx_comments_query (query_id),
    INDEX idx_comments_user (user_id),
    INDEX idx_comments_parent (parent_comment_id),
    INDEX idx_comments_internal (is_internal),
    INDEX idx_comments_created (created_at)
) ENGINE=InnoDB;

-- ==============================================
-- 11. USER_PREFERENCES TABLE
-- ==============================================
CREATE TABLE user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_preferences_user (user_id),
    INDEX idx_preferences_key (preference_key),
    UNIQUE KEY unique_user_preference (user_id, preference_key)
) ENGINE=InnoDB;

-- ==============================================
-- 12. ACTIVITY_LOGS TABLE (For audit trail)
-- ==============================================
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'query', 'user', 'assignment', etc.
    entity_id INT,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_action (action),
    INDEX idx_activity_entity (entity_type, entity_id),
    INDEX idx_activity_created (created_at)
) ENGINE=InnoDB;

-- ==============================================
-- INSERT SAMPLE DATA
-- ==============================================

-- Insert Domains
INSERT INTO domains (name, description) VALUES
('Physical Design', 'Digital IC physical design and layout'),
('Analog Layout', 'Analog circuit layout design'),
('Design Verification', 'Design verification and testing'),
('DFT', 'Design for Testability'),
('Analog Design', 'Analog circuit design and simulation'),
('Architecture', 'System architecture and high-level design'),
('Specification', 'System specification and requirements analysis');

-- Technologies are now user input text fields - no predefined data needed

-- Insert Tools
INSERT INTO tools (name, description, vendor, category, domain_id) VALUES
-- Physical Design Tools
('Design Compiler', 'Synopsys Design Compiler for synthesis', 'Synopsys', 'synthesis', 1),
('Genus', 'Cadence Genus Synthesis Solution', 'Cadence', 'synthesis', 1),
('Fusion Compiler', 'Synopsys Fusion Compiler for design implementation', 'Synopsys', 'synthesis', 1),
('Innovus', 'Cadence Innovus Implementation System', 'Cadence', 'place_route', 1),
('ICC2', 'Synopsys IC Compiler II for place and route', 'Synopsys', 'place_route', 1),
('PrimeTime', 'Synopsys PrimeTime for timing analysis', 'Synopsys', 'analysis', 1),
('Tempus', 'Cadence Tempus Timing Signoff Solution', 'Cadence', 'analysis', 1),
('StarRC', 'Synopsys StarRC for parasitic extraction', 'Synopsys', 'analysis', 1),
('Quantus', 'Cadence Quantus Extraction Solution', 'Cadence', 'analysis', 1),
('Redhawk', 'Ansys Redhawk for power analysis', 'Ansys', 'analysis', 1),
('Voltus', 'Cadence Voltus IC Power Integrity Solution', 'Cadence', 'analysis', 1),
('Pegasus', 'Synopsys Pegasus Verification System', 'Synopsys', 'verification', 1),
('Calibre', 'Mentor Graphics Calibre for DRC/LVS', 'Mentor', 'verification', 1),
('IC Validator', 'Synopsys IC Validator for physical verification', 'Synopsys', 'verification', 1),

-- Analog Layout Tools
('Virtuoso', 'Cadence Virtuoso for analog design', 'Cadence', 'place_route', 2),
('Custom Compiler', 'Synopsys Custom Compiler for analog layout design', 'Synopsys', 'place_route', 2),
('Calibre', 'Mentor Graphics Calibre for DRC/LVS verification in analog layout', 'Mentor', 'verification', 2),
('IC Validator', 'Synopsys IC Validator for physical verification in analog layout', 'Synopsys', 'verification', 2),
('Pegasus', 'Synopsys Pegasus Verification System for analog layout verification', 'Synopsys', 'verification', 2),
('Redhawk', 'Synopsys Redhawk for power analysis and IR drop analysis in analog layout', 'Synopsys', 'analysis', 2),
('StarRC', 'Synopsys StarRC for parasitic extraction in analog layout', 'Synopsys', 'analysis', 2),
('Quantus', 'Cadence Quantus for parasitic extraction and analysis in analog layout', 'Cadence', 'analysis', 2),

-- Verification Tools
('ModelSim', 'Mentor Graphics ModelSim for simulation', 'Mentor', 'simulation', 3),
('VCS', 'Synopsys VCS for simulation', 'Synopsys', 'simulation', 3),
('Questa', 'Mentor Graphics Questa for simulation', 'Mentor', 'simulation', 3),
('Verdi', 'Synopsys Verdi for debugging', 'Synopsys', 'analysis', 3);

-- Insert Stages for Physical Design
INSERT INTO stages (domain_id, name, description, order_sequence) VALUES
(1, 'Synthesis', 'Logic synthesis and optimization', 1),
(1, 'Design Initialization', 'Design initialization and setup', 2),
(1, 'Floorplan', 'Floorplanning and macro placement', 3),
(1, 'Placement', 'Cell placement and optimization', 4),
(1, 'CTS', 'Clock tree synthesis', 5),
(1, 'Post CTS Optimization', 'Post clock tree synthesis optimization', 6),
(1, 'Routing', 'Signal routing', 7),
(1, 'Post Route Optimization', 'Post routing optimization', 8),
(1, 'Filler Insertion', 'Filler cell insertion', 9),
(1, 'PD Outputs', 'Physical design outputs', 10),
(1, 'RC Extraction', 'RC parasitic extraction', 11),
(1, 'ECO', 'Engineering change order', 12),
(1, 'STA', 'Static timing analysis', 13),
(1, 'EMIR', 'Electromigration and IR drop analysis', 14),
(1, 'Physical Verification', 'Physical design verification', 15),
(1, 'CLP', 'Clock level power analysis', 16),
(1, 'LEC', 'Logic equivalence checking', 17);

-- Insert Stages for Analog Layout
INSERT INTO stages (domain_id, name, description, order_sequence) VALUES
(2, 'Schematic Design Inputs', 'Schematic design input requirements and specifications', 1),
(2, 'Floorplan', 'Floorplanning and device placement for analog layout', 2),
(2, 'Routing', 'Analog signal routing and interconnect', 3),
(2, 'AL Outputs', 'Analog layout output files and deliverables', 4),
(2, 'RC Extraction', 'RC parasitic extraction for analog circuits', 5),
(2, 'ECO', 'Engineering change orders for analog layout', 6),
(2, 'EMIR', 'Electromigration and IR drop analysis for analog', 7),
(2, 'Physical Verification', 'Physical verification for analog layout', 8),
(2, 'ESD', 'ESD protection and design', 9),
(2, 'Pads', 'Bond pads and probe pads design', 10),
(2, 'Package', 'Package design and integration', 11),
(2, 'Technology & PDKs', 'Technology files and PDK management', 12),
(2, 'DB Version Control', 'Database version control and management', 13),
(2, 'Project Release & QA', 'Project release and quality assurance', 14);

-- Insert Issue Categories for Physical Design Stages
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
-- Synthesis Stage
(1, 'SDC', 'Synopsys Design Constraints', 'high'),
(1, 'RTL', 'RTL design issues', 'medium'),
(1, '.lib', 'Library file issues', 'high'),
(1, 'Optimization', 'Synthesis optimization issues', 'medium'),
(1, 'Timing', 'Timing related issues', 'high'),
(1, 'Area', 'Area optimization issues', 'medium'),
(1, 'Power', 'Power optimization issues', 'medium'),
(1, 'Clock Gating', 'Clock gating implementation', 'medium'),
(1, 'Multibit Flops', 'Multibit flip-flop issues', 'low'),
(1, 'Tool', 'Tool-related issues during synthesis', 'medium'),

-- Design Initialization Stage
(2, 'Tech LEF', 'Technology LEF file issues', 'high'),
(2, 'LEF', 'LEF file issues', 'high'),
(2, 'NDM', 'NDM file issues', 'high'),
(2, 'ITF', 'ITF file issues', 'medium'),
(2, 'TLUPLUS', 'TLUPLUS file issues', 'medium'),
(2, 'QRC Tech', 'QRC technology file issues', 'medium'),
(2, 'Netlist', 'Netlist file issues', 'high'),
(2, 'SDC', 'SDC file issues', 'high'),
(2, 'MMMC', 'MMMC file issues', 'medium'),
(2, 'Tool', 'Tool-related issues during design initialization', 'medium'),

-- Floorplan Stage
(3, 'Macro Placement', 'Macro cell placement issues', 'high'),
(3, 'Power Planning', 'Power planning issues', 'high'),
(3, 'Endcap', 'Endcap cell issues', 'medium'),
(3, 'Tap Cells', 'Tap cell issues', 'medium'),
(3, 'Placement Blockages', 'Placement blockage issues', 'medium'),
(3, 'Macro Halo (Keepout)', 'Macro halo keepout issues', 'medium'),
(3, 'Tool', 'Tool-related issues during floorplan', 'medium'),

-- Placement Stage
(4, 'SDC', 'SDC constraints during placement', 'high'),
(4, 'Bounds', 'Placement bounds issues', 'medium'),
(4, 'Port Buffers', 'Port buffer issues', 'medium'),
(4, 'Setup Timing', 'Setup timing violations', 'high'),
(4, 'DRVs', 'Design rule violations', 'high'),
(4, 'Cell Density', 'Cell density issues', 'medium'),
(4, 'Pin Density', 'Pin density issues', 'medium'),
(4, 'Congestion', 'Congestion issues', 'high'),
(4, 'Optimization', 'Placement optimization issues', 'medium'),
(4, 'Scan Reordering', 'Scan chain reordering', 'low'),
(4, 'Tool', 'Tool-related issues during placement', 'medium'),

-- CTS Stage
(5, 'Clock Skew', 'Clock skew issues', 'high'),
(5, 'Clock Latency', 'Clock latency issues', 'high'),
(5, 'Clock Tree Exceptions', 'Clock tree exception issues', 'medium'),
(5, 'Clock Cells', 'Clock cell issues', 'medium'),
(5, 'Clock NDR', 'Clock non-default routing', 'medium'),
(5, 'Clock Routing', 'Clock routing issues', 'medium'),
(5, 'Congestion', 'Congestion during CTS', 'high'),
(5, 'Cell Density', 'Cell density during CTS', 'medium'),
(5, 'CCD', 'Clock common path pessimism', 'low'),
(5, 'CCOPT', 'Clock optimization issues', 'medium'),
(5, 'Setup Timing', 'Setup timing during CTS', 'high'),
(5, 'Clock Path DRVs', 'Clock path design rule violations', 'high'),
(5, 'Clock Gating Setup', 'Clock gating setup issues', 'medium'),
(5, 'Tool', 'Tool-related issues during CTS', 'medium');


-- Add Issue Categories for Analog Layout Domain Stages
-- Using real data provided by user
-- Analog Layout stages start from stage_id 18 (after Physical Design stages 1-17)

-- Schematic Design Inputs (stage_id 18)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(18, 'Matching (devices, nets - resistances, capacitance)', 'Device and net matching issues', 'high'),
(18, 'High speed', 'High speed design issues', 'high'),
(18, 'High Voltage', 'High voltage design issues', 'high'),
(18, 'Different voltage domains', 'Multi-voltage domain issues', 'high'),
(18, 'Clk & Data paths', 'Clock and data path issues', 'medium'),
(18, 'Power (current & voltage) ratings', 'Power rating issues', 'high'),
(18, 'Branch currents', 'Branch current analysis issues', 'medium'),
(18, 'Node Voltages in cross voltage domains', 'Cross-domain voltage issues', 'high');
-- Floorplan (stage_id 19)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(19, 'Devices Placement', 'Device placement issues', 'high'),
(19, 'Macro placement', 'Macro placement issues', 'high'),
(19, 'Power planning', 'Power planning issues', 'high'),
(19, 'Different types of MOS devices', 'MOS device type issues', 'medium'),
(19, 'Different types of devices', 'Device type issues', 'medium'),
(19, 'Blocks integration', 'Block integration issues', 'medium'),
(19, 'Analog & Digital blocks integration', 'Mixed-signal integration issues', 'high'),
(19, 'Area', 'Area optimization issues', 'medium'),
(19, 'ESD & Clamps integration', 'ESD and clamp integration issues', 'high'),
(19, 'Latchup', 'Latchup prevention issues', 'high');
-- Routing (stage_id 20)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(20, 'Opens', 'Open circuit issues', 'high'),
(20, 'Shorts', 'Short circuit issues', 'high'),
(20, 'DRCs', 'Design rule checking violations', 'high'),
(20, 'High Speed signal routing', 'High speed signal routing issues', 'high'),
(20, 'High Current', 'High current routing issues', 'high'),
(20, 'Power mesh', 'Power mesh routing issues', 'high'),
(20, 'Crosstalk', 'Crosstalk issues', 'medium');
-- AL Outputs (stage_id 21)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(21, 'GDS', 'GDS file generation issues', 'high'),
(21, 'LEF', 'LEF file generation issues', 'medium'),
(21, 'DEF', 'DEF file generation issues', 'medium'),
(21, 'Netlist', 'Netlist generation issues', 'high'),
(21, 'PV reports', 'Physical verification report issues', 'medium'),
(21, 'PERC & ESD reports', 'PERC and ESD report issues', 'medium');

-- RC Extraction (stage_id 22)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(22, 'Design updates', 'Design update issues', 'medium'),
(22, 'Post layout sims', 'Post layout simulation issues', 'high'),
(22, 'LVS fail', 'LVS failure issues', 'high');

-- ECO (stage_id 23)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(23, 'Design updates', 'Design update issues', 'high'),
(23, 'Post layout sims updates', 'Post layout simulation update issues', 'high'),
(23, 'Clk & Data Timing', 'Clock and data timing issues', 'high');

-- EMIR (stage_id 24)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(24, 'Static IR drop analysis', 'Static IR drop analysis issues', 'high'),
(24, 'Dynamic IR drop analysis', 'Dynamic IR drop analysis issues', 'high'),
(24, 'Power EM Iavg', 'Power electromigration average current issues', 'high'),
(24, 'Power EM Irms', 'Power electromigration RMS current issues', 'high'),
(24, 'Signal EM Iavg', 'Signal electromigration average current issues', 'medium'),
(24, 'Signal EM Irms', 'Signal electromigration RMS current issues', 'medium'),
(24, 'EMIR calculations', 'EMIR calculation issues', 'medium');
-- Physical Verification (stage_id 25)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(25, 'DRC', 'Design rule checking violations', 'high'),
(25, 'DFM', 'Design for manufacturability issues', 'medium'),
(25, 'ANT', 'Antenna effect issues', 'medium'),
(25, 'LVS', 'Layout vs schematic verification issues', 'high'),
(25, 'ERC', 'Electrical rule checking issues', 'medium'),
(25, 'PERC', 'Process and environment rule checking issues', 'medium'),
(25, 'Bump', 'Bump design issues', 'medium'),
(25, 'ESD', 'ESD verification issues', 'high'),
(25, 'Density', 'Metal density issues', 'low');

-- ESD (stage_id 26)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(26, 'ESD types', 'ESD type selection issues', 'high'),
(26, 'ESD sizes', 'ESD sizing issues', 'high'),
(26, 'Clamps', 'ESD clamp design issues', 'high'),
(26, 'Resistance', 'ESD resistance issues', 'medium'),
(26, 'ESD voltage values', 'ESD voltage specification issues', 'high');

-- Pads (stage_id 27)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(27, 'Bond Pads', 'Bond pad design issues', 'high'),
(27, 'Different types of Bond pads', 'Bond pad type selection issues', 'medium'),
(27, 'Probe pads', 'Probe pad design issues', 'medium'),
(27, 'RDL Routing', 'Redistribution layer routing issues', 'medium');


-- Package (stage_id 28)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(28, 'CSP (Chip Scale package)', 'Chip scale package issues', 'medium'),
(28, 'Wire bond', 'Wire bonding issues', 'medium');


-- Technology & PDKs (stage_id 29)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(29, 'PDKs', 'Process design kit issues', 'high'),
(29, 'Tech file', 'Technology file issues', 'high'),
(29, 'Display file', 'Display file issues', 'low'),
(29, 'Metal stack (FEOL, MEOL, BEOL)', 'Metal stack issues', 'high'),
(29, 'DRM (Design Rule Manual)', 'Design rule manual issues', 'high'),
(29, 'Rule decks', 'Rule deck issues', 'high');

-- DB Version Control (stage_id 30)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(30, 'Project DB', 'Project database issues', 'medium'),
(30, 'Layout Design DB', 'Layout design database issues', 'medium'),
(30, 'Schematic design DB', 'Schematic design database issues', 'medium'),
(30, 'Check list DB', 'Checklist database issues', 'low'),
(30, 'Design DB check-in', 'Design database check-in issues', 'medium'),
(30, 'Design DB check-out', 'Design database check-out issues', 'medium'),
(30, 'Design DB access or edit permission', 'Database access permission issues', 'medium');


-- Project Release & QA (stage_id 31)
INSERT INTO issue_categories (stage_id, name, description, severity) VALUES
(31, 'Devices used', 'Device usage tracking issues', 'medium'),
(31, 'Additional cost Masks', 'Additional mask cost issues', 'medium'),
(31, 'DB Prefixing', 'Database prefixing issues', 'low'),
(31, 'Shapes out side of Boundary', 'Boundary violation issues', 'high'),
(31, 'LEF vs GDS', 'LEF vs GDS consistency issues', 'high'),
(31, 'LEF vs Verilog', 'LEF vs Verilog consistency issues', 'high'),
(31, 'Design Reviews', 'Design review issues', 'medium'),
(31, 'Cross team release', 'Cross-team release issues', 'medium');



-- Insert Sample Users
INSERT INTO users (username, email, password, full_name, role, domain_id) VALUES
('admin', 'admin@vlsiportal.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', NULL),
('expert1', 'expert1@vlsiportal.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John Smith - PD Expert', 'expert_reviewer', 1),
('expert2', 'expert2@vlsiportal.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah Johnson - Analog Expert', 'expert_reviewer', 2),
('student1', 'student1@university.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice Brown', 'student', 1),
('student2', 'student2@university.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob Wilson', 'student', 2),
('professional1', 'pro1@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Mike Davis', 'professional', 1),
('professional2', 'pro2@company.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lisa Chen', 'professional', 2);

-- ==============================================
-- CREATE USEFUL VIEWS
-- ==============================================

-- View for complete query details
CREATE VIEW query_details_view AS
SELECT 
    q.id,
    q.custom_query_id,
    q.title,
    q.description,
    q.status,
    q.priority,
    q.resolution_attempts,
    q.resolution,
    q.debug_steps,
    q.tags,
    q.created_at,
    q.updated_at,
    q.resolved_at,
    
    -- Student info
    u.full_name as student_name,
    u.username as student_username,
    u.email as student_email,
    
    -- Expert reviewer info
    e.full_name as expert_name,
    e.username as expert_username,
    
    -- Domain and stage info
    d.name as domain_name,
    s.name as stage_name,
    s.order_sequence as stage_order,
    
    -- Tool and technology info
    t.name as tool_name,
    t.vendor as tool_vendor,
    q.technology as technology_name,
    
    -- Issue category info
    COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
    ic.severity as issue_severity,
    
    -- Counts
    (SELECT COUNT(*) FROM responses r WHERE r.query_id = q.id) as response_count,
    (SELECT COUNT(*) FROM query_images qi WHERE qi.query_id = q.id) as image_count,
    (SELECT COUNT(*) FROM query_comments qc WHERE qc.query_id = q.id) as comment_count
    
FROM queries q
LEFT JOIN users u ON q.student_id = u.id
LEFT JOIN users e ON q.expert_reviewer_id = e.id
LEFT JOIN domains d ON u.domain_id = d.id
LEFT JOIN stages s ON q.stage_id = s.id
LEFT JOIN tools t ON q.tool_id = t.id
LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id;

-- View for domain statistics
CREATE VIEW domain_stats_view AS
SELECT 
    d.id as domain_id,
    d.name as domain_name,
    d.description as domain_description,
    
    -- User counts
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as student_count,
    COUNT(DISTINCT CASE WHEN u.role = 'expert_reviewer' THEN u.id END) as expert_reviewer_count,
    COUNT(DISTINCT CASE WHEN u.role = 'professional' THEN u.id END) as professional_count,
    
    -- Query counts
    COUNT(DISTINCT q.id) as total_queries,
    COUNT(DISTINCT CASE WHEN q.status = 'open' THEN q.id END) as open_queries,
    COUNT(DISTINCT CASE WHEN q.status = 'in_progress' THEN q.id END) as in_progress_queries,
    COUNT(DISTINCT CASE WHEN q.status = 'resolved' THEN q.id END) as resolved_queries,
    COUNT(DISTINCT CASE WHEN q.status = 'closed' THEN q.id END) as closed_queries,
    
    -- Priority distribution
    COUNT(DISTINCT CASE WHEN q.priority = 'urgent' THEN q.id END) as urgent_queries,
    COUNT(DISTINCT CASE WHEN q.priority = 'high' THEN q.id END) as high_priority_queries,
    COUNT(DISTINCT CASE WHEN q.priority = 'medium' THEN q.id END) as medium_priority_queries,
    COUNT(DISTINCT CASE WHEN q.priority = 'low' THEN q.id END) as low_priority_queries,
    
    -- Average resolution time (in days)
    AVG(CASE 
        WHEN q.resolved_at IS NOT NULL AND q.created_at IS NOT NULL 
        THEN DATEDIFF(q.resolved_at, q.created_at) 
        ELSE NULL 
    END) as avg_resolution_days
    
FROM domains d
LEFT JOIN users u ON d.id = u.domain_id
LEFT JOIN queries q ON u.id = q.student_id
GROUP BY d.id, d.name, d.description;

-- View for expert reviewer workload
CREATE VIEW expert_workload_view AS
SELECT 
    u.id as expert_id,
    u.full_name as expert_name,
    u.username as expert_username,
    d.name as domain_name,
    
    -- Assignment counts
    COUNT(DISTINCT qa.id) as total_assignments,
    COUNT(DISTINCT CASE WHEN qa.status = 'assigned' THEN qa.id END) as pending_assignments,
    COUNT(DISTINCT CASE WHEN qa.status = 'accepted' THEN qa.id END) as accepted_assignments,
    COUNT(DISTINCT CASE WHEN qa.status = 'completed' THEN qa.id END) as completed_assignments,
    
    -- Query counts
    COUNT(DISTINCT q.id) as total_queries,
    COUNT(DISTINCT CASE WHEN q.status = 'open' THEN q.id END) as open_queries,
    COUNT(DISTINCT CASE WHEN q.status = 'in_progress' THEN q.id END) as in_progress_queries,
    COUNT(DISTINCT CASE WHEN q.status = 'resolved' THEN q.id END) as resolved_queries,
    
    -- Response counts
    COUNT(DISTINCT r.id) as total_responses,
    COUNT(DISTINCT CASE WHEN r.is_solution = TRUE THEN r.id END) as solution_responses
    
FROM users u
LEFT JOIN domains d ON u.domain_id = d.id
LEFT JOIN query_assignments qa ON u.id = qa.expert_reviewer_id
LEFT JOIN queries q ON u.id = q.expert_reviewer_id
LEFT JOIN responses r ON u.id = r.responder_id
WHERE u.role = 'expert_reviewer'
GROUP BY u.id, u.full_name, u.username, d.name;

-- ==============================================
-- CREATE STORED PROCEDURES
-- ==============================================

DELIMITER //

-- Procedure to get domain configuration
CREATE PROCEDURE GetDomainConfiguration(IN p_domain_id INT)
BEGIN
    -- Get domain info
    SELECT id, name, description, is_active FROM domains WHERE id = p_domain_id;
    
    -- Get stages for this domain
    SELECT id, name, description, order_sequence FROM stages 
    WHERE domain_id = p_domain_id AND is_active = TRUE 
    ORDER BY order_sequence;
    
    -- Get issue categories grouped by stage
    SELECT 
        s.id as stage_id,
        s.name as stage_name,
        s.order_sequence,
        ic.id as category_id,
        ic.name as category_name,
        ic.description as category_description,
        ic.severity
    FROM stages s
    LEFT JOIN issue_categories ic ON s.id = ic.stage_id AND ic.is_active = TRUE
    WHERE s.domain_id = p_domain_id AND s.is_active = TRUE
    ORDER BY s.order_sequence, ic.name;
    
    -- Get tools for this domain
    SELECT id, name, description, vendor, category 
    FROM tools 
    WHERE (domain_id = p_domain_id OR domain_id IS NULL) AND is_active = TRUE 
    ORDER BY name;
END //

-- Procedure to get queries with pagination and filters
CREATE PROCEDURE GetQueriesWithFilters(
    IN p_domain_id INT,
    IN p_status VARCHAR(20),
    IN p_priority VARCHAR(20),
    IN p_stage_id INT,
    IN p_expert_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        q.id,
        q.custom_query_id,
        q.title,
        q.description,
        q.status,
        q.priority,
        q.created_at,
        q.updated_at,
        u.full_name as student_name,
        d.name as domain_name,
        s.name as stage_name,
        t.name as tool_name,
        q.technology as technology_name,
        COALESCE(ic.name, q.custom_issue_category) as issue_category_name,
        e.full_name as expert_name
    FROM queries q
    JOIN users u ON q.student_id = u.id
    LEFT JOIN domains d ON u.domain_id = d.id
    LEFT JOIN stages s ON q.stage_id = s.id
    LEFT JOIN tools t ON q.tool_id = t.id
    LEFT JOIN issue_categories ic ON q.issue_category_id = ic.id
    LEFT JOIN users e ON q.expert_reviewer_id = e.id
    WHERE 
        (p_domain_id IS NULL OR d.id = p_domain_id)
        AND (p_status IS NULL OR q.status = p_status)
        AND (p_priority IS NULL OR q.priority = p_priority)
        AND (p_stage_id IS NULL OR q.stage_id = p_stage_id)
        AND (p_expert_id IS NULL OR q.expert_reviewer_id = p_expert_id)
    ORDER BY q.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END //

-- Procedure to assign query to expert reviewer
CREATE PROCEDURE AssignQueryToExpert(
    IN p_query_id INT,
    IN p_expert_id INT,
    IN p_assigned_by INT,
    IN p_notes TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Insert assignment
    INSERT INTO query_assignments (query_id, expert_reviewer_id, assigned_by, notes)
    VALUES (p_query_id, p_expert_id, p_assigned_by, p_notes);
    
    -- Update query with expert reviewer
    UPDATE queries 
    SET expert_reviewer_id = p_expert_id, status = 'in_progress'
    WHERE id = p_query_id;
    
    -- Log activity
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_assigned_by, 'query_assigned', 'query', p_query_id, 
            JSON_OBJECT('expert_id', p_expert_id, 'notes', p_notes));
    
    COMMIT;
END //

-- Procedure to resolve query
CREATE PROCEDURE ResolveQuery(
    IN p_query_id INT,
    IN p_resolution TEXT,
    IN p_resolved_by INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Update query status
    UPDATE queries 
    SET status = 'resolved', 
        resolution = p_resolution,
        resolved_at = CURRENT_TIMESTAMP,
        expert_reviewer_id = p_resolved_by
    WHERE id = p_query_id;
    
    -- Update assignment status
    UPDATE query_assignments 
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE query_id = p_query_id;
    
    -- Log activity
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (p_resolved_by, 'query_resolved', 'query', p_query_id, 
            JSON_OBJECT('resolution', p_resolution));
    
    COMMIT;
END //

DELIMITER ;

-- ==============================================
-- CREATE TRIGGERS FOR AUDIT TRAIL
-- ==============================================

DELIMITER //

-- Trigger to log query status changes
CREATE TRIGGER query_status_change_trigger
    AFTER UPDATE ON queries
    FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (NEW.expert_reviewer_id, 'status_changed', 'query', NEW.id, 
                JSON_OBJECT('old_status', OLD.status, 'new_status', NEW.status));
    END IF;
END //

-- Trigger to log new query creation
CREATE TRIGGER query_created_trigger
    AFTER INSERT ON queries
    FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (NEW.student_id, 'query_created', 'query', NEW.id, 
            JSON_OBJECT('title', NEW.title, 'status', NEW.status));
END //

DELIMITER ;

-- ==============================================
-- FINAL OPTIMIZATION
-- ==============================================

-- Analyze all tables to update statistics
ANALYZE TABLE domains, tools, stages, issue_categories, users, queries, responses, query_images, query_assignments, query_comments, user_preferences, activity_logs;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

SELECT 'Database created successfully!' as status;
SELECT 'Tables created:' as info, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'vlsi_portal';
SELECT 'Sample data inserted:' as info, COUNT(*) as domains FROM domains;
SELECT 'Views created:' as info, COUNT(*) as count FROM information_schema.views WHERE table_schema = 'vlsi_portal';
SELECT 'Procedures created:' as info, COUNT(*) as count FROM information_schema.routines WHERE routine_schema = 'vlsi_portal' AND routine_type = 'PROCEDURE';

-- Test the domain configuration procedure
CALL GetDomainConfiguration(1);

-- Test the query filters procedure
CALL GetQueriesWithFilters(1, NULL, NULL, NULL, NULL, 10, 0);

SELECT 'Fresh VLSI Portal database is ready for use!' as completion_message;
