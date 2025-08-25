

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table (updated schema with admin role and domain_id)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'expert_reviewer', 'admin') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    domain_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);



-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    domain_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

-- Create technologies table
CREATE TABLE IF NOT EXISTS technologies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Physical Design stages table
CREATE TABLE IF NOT EXISTS pd_stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Physical Design issue categories table
CREATE TABLE IF NOT EXISTS pd_issue_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stage_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stage_id) REFERENCES pd_stages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_stage_category (stage_id, name)
);


-- Create domain stages table
CREATE TABLE IF NOT EXISTS domain_stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    domain_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
    UNIQUE KEY unique_domain_stage (domain_id, name)
);

-- Create domain issue categories table
CREATE TABLE IF NOT EXISTS domain_issue_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    domain_id INT NOT NULL,
    stage_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES domain_stages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_domain_stage_category (domain_id, stage_id, name)
);

-- Create queries table (updated with stage and category IDs)
CREATE TABLE IF NOT EXISTS queries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    teacher_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tool_id INT,
    technology VARCHAR(100),
    stage_id INT,
    issue_category_id INT,
    custom_issue_category VARCHAR(200), -- For custom categories when "Others" is selected
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    resolution_attempts INT DEFAULT 0,
    resolution TEXT,
    debug_steps TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE SET NULL,
    FOREIGN KEY (stage_id) REFERENCES domain_stages(id) ON DELETE SET NULL,
    FOREIGN KEY (issue_category_id) REFERENCES domain_issue_categories(id) ON DELETE SET NULL
);

-- Create query_images table for image uploads
CREATE TABLE IF NOT EXISTS query_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query_id INT NOT NULL,
    teacher_id INT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create query_assignments table for admin to assign queries to expert reviewers
CREATE TABLE IF NOT EXISTS query_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    query_id INT NOT NULL,
    expert_reviewer_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('assigned', 'accepted', 'rejected', 'completed') DEFAULT 'assigned',
    notes TEXT,
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE,
    FOREIGN KEY (expert_reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_query_assignment (query_id)
);

-- Insert domains data
INSERT INTO domains (name, description) VALUES
('Specification', 'System specification and requirements analysis'),
('Architecture', 'System architecture and high-level design'),
('Design', 'Digital design and RTL development'),
('Design Verification', 'Design verification and testing'),
('Physical Design', 'Physical design and layout'),
('DFT', 'Design for Testability'),
('Analog Layout', 'Analog circuit layout design'),
('Analog Design', 'Analog circuit design and simulation');

-- Insert Physical Design stages
INSERT INTO pd_stages (name, description) VALUES
('Synthesis', 'Logic synthesis and optimization'),
('Design initialization', 'Design initialization and setup'),
('Floorplan', 'Floorplanning and macro placement'),
('Placement', 'Cell placement and optimization'),
('CTS', 'Clock tree synthesis'),
('Post CTS opt', 'Post clock tree synthesis optimization'),
('Routing', 'Signal routing'),
('Post route opt', 'Post routing optimization'),
('Filler insertion', 'Filler cell insertion'),
('PD outputs', 'Physical design outputs'),
('RC extraction', 'RC parasitic extraction'),
('ECO', 'Engineering change order'),
('STA', 'Static timing analysis'),
('EMIR', 'Electromigration and IR drop analysis'),
('Physical verification', 'Physical design verification'),
('CLP', 'Clock level power analysis'),
('LEC', 'Logic equivalence checking');

-- Insert Physical Design issue categories
INSERT INTO pd_issue_categories (stage_id, name, description) VALUES
-- Synthesis categories
(1, 'SDC', 'Synopsys Design Constraints'),
(1, 'RTL', 'RTL design issues'),
(1, '.lib', 'Library file issues'),
(1, 'Optimization', 'Synthesis optimization issues'),
(1, 'Timing', 'Timing related issues'),
(1, 'Area', 'Area optimization issues'),
(1, 'Power', 'Power optimization issues'),
(1, 'Clock gating', 'Clock gating implementation'),
(1, 'multibit flops', 'Multibit flip-flop issues'),
(1, 'Others', 'Other synthesis issues'),

-- Design initialization categories
(2, 'Tech LEF', 'Technology LEF file issues'),
(2, 'LEF', 'LEF file issues'),
(2, 'NDM', 'NDM file issues'),
(2, 'ITF', 'ITF file issues'),
(2, 'TLUPLUS', 'TLUPLUS file issues'),
(2, 'QRC tech', 'QRC technology file issues'),
(2, 'Netlist', 'Netlist file issues'),
(2, 'SDC', 'SDC file issues'),
(2, 'MMMC', 'MMMC file issues'),
(2, 'others', 'Other initialization issues'),

-- Floorplan categories
(3, 'Macro placement', 'Macro cell placement issues'),
(3, 'power planning', 'Power planning issues'),
(3, 'endcap', 'Endcap cell issues'),
(3, 'tap cells', 'Tap cell issues'),
(3, 'Placement blockages', 'Placement blockage issues'),
(3, 'Marco halo (keepout)', 'Macro halo keepout issues'),
(3, 'others', 'Other floorplan issues'),

-- Placement categories
(4, 'SDC', 'SDC constraints during placement'),
(4, 'Bounds', 'Placement bounds issues'),
(4, 'Port buffers', 'Port buffer issues'),
(4, 'Setup timing', 'Setup timing violations'),
(4, 'DRVs', 'Design rule violations'),
(4, 'Cell denisty', 'Cell density issues'),
(4, 'Pin density', 'Pin density issues'),
(4, 'congestion', 'Congestion issues'),
(4, 'Optimization', 'Placement optimization issues'),
(4, 'Scan reordering', 'Scan chain reordering'),
(4, 'others', 'Other placement issues'),

-- CTS categories
(5, 'Clock skew', 'Clock skew issues'),
(5, 'Clock latency', 'Clock latency issues'),
(5, 'Clock tree exceptions', 'Clock tree exception issues'),
(5, 'Clock cells', 'Clock cell issues'),
(5, 'clock NDR', 'Clock non-default routing'),
(5, 'Clock routing', 'Clock routing issues'),
(5, 'Congestion', 'Congestion during CTS'),
(5, 'cell density', 'Cell density during CTS'),
(5, 'CCD', 'Clock common path pessimism'),
(5, 'CCOPT', 'Clock optimization issues'),
(5, 'Setup timing', 'Setup timing during CTS'),
(5, 'Clock path DRVs', 'Clock path design rule violations'),
(5, 'Clock gating setup', 'Clock gating setup issues'),

-- Post CTS opt categories
(6, 'Hold cells', 'Hold timing cell issues'),
(6, 'hold timing', 'Hold timing violations'),
(6, 'setup timing', 'Setup timing violations'),
(6, 'Congestion', 'Congestion after CTS'),
(6, 'cell density', 'Cell density after CTS'),
(6, 'DRVs', 'Design rule violations'),
(6, 'Clock path DRVs', 'Clock path design rule violations'),
(6, 'Clock NDR', 'Clock non-default routing'),
(6, 'Clock routing', 'Clock routing issues'),
(6, 'Clock gating setup', 'Clock gating setup issues'),
(6, 'Clock gating hold', 'Clock gating hold issues'),

-- Routing categories
(7, 'Antenna', 'Antenna effect issues'),
(7, 'Crosstalk', 'Crosstalk issues'),
(7, 'Detour', 'Routing detour issues'),
(7, 'Open', 'Open circuit issues'),
(7, 'short', 'Short circuit issues'),
(7, 'DRCs', 'Design rule check violations'),
(7, 'Setup timing', 'Setup timing violations'),
(7, 'Hold Timing', 'Hold timing violations'),
(7, 'DRVs', 'Design rule violations'),
(7, 'Clock DRVs', 'Clock design rule violations'),
(7, 'Clock DRCs', 'Clock design rule check violations'),
(7, 'Preroute to postroute correlation', 'Pre-route to post-route correlation issues'),

-- Post route opt categories
(8, 'Antenna', 'Antenna effect issues'),
(8, 'Crosstalk', 'Crosstalk issues'),
(8, 'Detour', 'Routing detour issues'),
(8, 'Open', 'Open circuit issues'),
(8, 'short', 'Short circuit issues'),
(8, 'DRCs', 'Design rule check violations'),
(8, 'Setup timing', 'Setup timing violations'),
(8, 'Hold Timing', 'Hold timing violations'),
(8, 'DRVs', 'Design rule violations'),
(8, 'Clock DRVs', 'Clock design rule violations'),
(8, 'Clock DRCs', 'Clock design rule check violations'),
(8, 'Preroute to postroute correlation', 'Pre-route to post-route correlation issues'),

-- Filler insertion categories
(9, 'Filler gaps', 'Filler cell gap issues'),
(9, 'Decap density', 'Decoupling capacitor density issues'),
(9, 'flow issue', 'Filler insertion flow issues'),
(9, 'cell padding', 'Cell padding issues'),

-- PD outputs categories
(10, 'DEF', 'DEF file generation issues'),
(10, 'LEF', 'LEF file generation issues'),
(10, 'Netlist', 'Netlist generation issues'),
(10, 'Physical Netlist', 'Physical netlist generation issues'),
(10, 'GDS', 'GDS file generation issues'),

-- RC extraction categories
(11, 'SPEF', 'SPEF file generation issues'),
(11, 'Flow', 'RC extraction flow issues'),
(11, 'Inputs', 'RC extraction input issues'),
(11, 'Shorts', 'Short circuit detection'),
(11, 'Opens', 'Open circuit detection'),

-- ECO categories
(12, 'Setup timing fixes', 'Setup timing fix issues'),
(12, 'Hold timing fixes', 'Hold timing fix issues'),
(12, 'ECO implementation', 'ECO implementation issues'),
(12, 'ECO flow', 'ECO flow issues'),
(12, 'DRV fixes', 'Design rule violation fixes'),
(12, 'Crosstalk delay fixes', 'Crosstalk delay fix issues'),
(12, 'Crosstalk noise fixes', 'Crosstalk noise fix issues'),

-- STA categories
(13, 'SDC', 'SDC file issues'),
(13, 'Flow', 'STA flow issues'),
(13, 'DMSA', 'DMSA analysis issues'),
(13, 'Annotation', 'Timing annotation issues'),
(13, 'Setup timing', 'Setup timing analysis'),
(13, 'Hold timing', 'Hold timing analysis'),
(13, 'DRVs', 'Design rule violations'),
(13, 'Crosstalk Delay', 'Crosstalk delay analysis'),
(13, 'Crosstalk noise', 'Crosstalk noise analysis'),
(13, 'Clock DRVs', 'Clock design rule violations'),
(13, 'Clock gating Violations', 'Clock gating violations'),
(13, 'ECO generation', 'ECO generation issues'),
(13, 'Physical aware eco', 'Physical aware ECO issues'),

-- EMIR categories
(14, 'Static IR drop analysis', 'Static IR drop analysis issues'),
(14, 'Dynamic vectorless analysis', 'Dynamic vectorless analysis issues'),
(14, 'Dynamic vectored analysis', 'Dynamic vectored analysis issues'),
(14, 'Power EM', 'Power electromigration issues'),
(14, 'Signal EM', 'Signal electromigration issues'),
(14, 'IR fix', 'IR drop fix issues'),
(14, 'IR hotspots', 'IR drop hotspot issues'),
(14, 'EM fix', 'Electromigration fix issues'),
(14, 'Ploc file', 'Power location file issues'),
(14, 'Inputs', 'EMIR analysis input issues'),
(14, 'VCD', 'VCD file issues'),
(14, 'Others', 'Other EMIR issues'),

-- Physical verification categories
(15, 'DRC', 'Design rule check violations'),
(15, 'LVS', 'Layout vs schematic issues'),
(15, 'Antenna', 'Antenna effect violations'),
(15, 'ERC', 'Electrical rule check violations'),
(15, 'PERC', 'Programmable electrical rule check'),
(15, 'Bump', 'Bump related issues'),
(15, 'ESD', 'ESD protection issues'),

-- CLP categories
(16, 'Isolation cell', 'Isolation cell issues'),
(16, 'Level shifter', 'Level shifter issues'),
(16, 'Power switch', 'Power switch issues'),
(16, 'UPF', 'Unified power format issues'),

-- LEC categories
(17, 'Settings', 'LEC settings issues'),
(17, 'Debug Analysis', 'LEC debug analysis issues');

-- Insert Physical Design stages into domain_stages
INSERT INTO domain_stages (domain_id, name, description) VALUES
(5, 'Synthesis', 'Logic synthesis and optimization'),
(5, 'Design initialization', 'Design initialization and setup'),
(5, 'Floorplan', 'Floorplanning and macro placement'),
(5, 'Placement', 'Cell placement and optimization'),
(5, 'CTS', 'Clock tree synthesis'),
(5, 'Post CTS opt', 'Post clock tree synthesis optimization'),
(5, 'Routing', 'Signal routing'),
(5, 'Post route opt', 'Post routing optimization'),
(5, 'Filler insertion', 'Filler cell insertion'),
(5, 'PD outputs', 'Physical design outputs'),
(5, 'RC extraction', 'RC parasitic extraction'),
(5, 'ECO', 'Engineering change order'),
(5, 'STA', 'Static timing analysis'),
(5, 'EMIR', 'Electromigration and IR drop analysis'),
(5, 'Physical verification', 'Physical design verification'),
(5, 'CLP', 'Clock level power analysis'),
(5, 'LEC', 'Logic equivalence checking');

-- Insert Physical Design issue categories into domain_issue_categories
INSERT INTO domain_issue_categories (domain_id, stage_id, name, description) VALUES
-- Synthesis categories
(5, 1, 'SDC', 'Synopsys Design Constraints'),
(5, 1, 'RTL', 'RTL design issues'),
(5, 1, '.lib', 'Library file issues'),
(5, 1, 'Optimization', 'Synthesis optimization issues'),
(5, 1, 'Timing', 'Timing related issues'),
(5, 1, 'Area', 'Area optimization issues'),
(5, 1, 'Power', 'Power optimization issues'),
(5, 1, 'Clock gating', 'Clock gating implementation'),
(5, 1, 'multibit flops', 'Multibit flip-flop issues'),
(5, 1, 'Others', 'Other synthesis issues'),

-- Design initialization categories
(5, 2, 'Tech LEF', 'Technology LEF file issues'),
(5, 2, 'LEF', 'LEF file issues'),
(5, 2, 'NDM', 'NDM file issues'),
(5, 2, 'ITF', 'ITF file issues'),
(5, 2, 'TLUPLUS', 'TLUPLUS file issues'),
(5, 2, 'QRC tech', 'QRC technology file issues'),
(5, 2, 'Netlist', 'Netlist file issues'),
(5, 2, 'SDC', 'SDC file issues'),
(5, 2, 'MMMC', 'MMMC file issues'),
(5, 2, 'others', 'Other initialization issues'),

-- Floorplan categories
(5, 3, 'Macro placement', 'Macro cell placement issues'),
(5, 3, 'power planning', 'Power planning issues'),
(5, 3, 'endcap', 'Endcap cell issues'),
(5, 3, 'tap cells', 'Tap cell issues'),
(5, 3, 'Placement blockages', 'Placement blockage issues'),
(5, 3, 'Marco halo (keepout)', 'Macro halo keepout issues'),
(5, 3, 'others', 'Other floorplan issues'),

-- Placement categories
(5, 4, 'SDC', 'SDC constraints during placement'),
(5, 4, 'Bounds', 'Placement bounds issues'),
(5, 4, 'Port buffers', 'Port buffer issues'),
(5, 4, 'Setup timing', 'Setup timing violations'),
(5, 4, 'DRVs', 'Design rule violations'),
(5, 4, 'Cell denisty', 'Cell density issues'),
(5, 4, 'Pin density', 'Pin density issues'),
(5, 4, 'congestion', 'Congestion issues'),
(5, 4, 'Optimization', 'Placement optimization issues'),
(5, 4, 'Scan reordering', 'Scan chain reordering'),
(5, 4, 'others', 'Other placement issues'),

-- CTS categories
(5, 5, 'Clock skew', 'Clock skew issues'),
(5, 5, 'Clock latency', 'Clock latency issues'),
(5, 5, 'Clock tree exceptions', 'Clock tree exception issues'),
(5, 5, 'Clock cells', 'Clock cell issues'),
(5, 5, 'clock NDR', 'Clock non-default routing'),
(5, 5, 'Clock routing', 'Clock routing issues'),
(5, 5, 'Congestion', 'Congestion during CTS'),
(5, 5, 'cell density', 'Cell density during CTS'),
(5, 5, 'CCD', 'Clock common path pessimism'),
(5, 5, 'CCOPT', 'Clock optimization issues'),
(5, 5, 'Setup timing', 'Setup timing during CTS'),
(5, 5, 'Clock path DRVs', 'Clock path design rule violations'),
(5, 5, 'Clock gating setup', 'Clock gating setup issues'),

-- Post CTS opt categories
(5, 6, 'Hold cells', 'Hold timing cell issues'),
(5, 6, 'hold timing', 'Hold timing violations'),
(5, 6, 'setup timing', 'Setup timing violations'),
(5, 6, 'Congestion', 'Congestion after CTS'),
(5, 6, 'cell density', 'Cell density after CTS'),
(5, 6, 'DRVs', 'Design rule violations'),
(5, 6, 'Clock path DRVs', 'Clock path design rule violations'),
(5, 6, 'Clock NDR', 'Clock non-default routing'),
(5, 6, 'Clock routing', 'Clock routing issues'),
(5, 6, 'Clock gating setup', 'Clock gating setup issues'),
(5, 6, 'Clock gating hold', 'Clock gating hold issues'),

-- Routing categories
(5, 7, 'Antenna', 'Antenna effect issues'),
(5, 7, 'Crosstalk', 'Crosstalk issues'),
(5, 7, 'Detour', 'Routing detour issues'),
(5, 7, 'Open', 'Open circuit issues'),
(5, 7, 'short', 'Short circuit issues'),
(5, 7, 'DRCs', 'Design rule check violations'),
(5, 7, 'Setup timing', 'Setup timing violations'),
(5, 7, 'Hold Timing', 'Hold timing violations'),
(5, 7, 'DRVs', 'Design rule violations'),
(5, 7, 'Clock DRVs', 'Clock design rule violations'),
(5, 7, 'Clock DRCs', 'Clock design rule check violations'),
(5, 7, 'Preroute to postroute correlation', 'Pre-route to post-route correlation issues'),

-- Post route opt categories
(5, 8, 'Antenna', 'Antenna effect issues'),
(5, 8, 'Crosstalk', 'Crosstalk issues'),
(5, 8, 'Detour', 'Routing detour issues'),
(5, 8, 'Open', 'Open circuit issues'),
(5, 8, 'short', 'Short circuit issues'),
(5, 8, 'DRCs', 'Design rule check violations'),
(5, 8, 'Setup timing', 'Setup timing violations'),
(5, 8, 'Hold Timing', 'Hold timing violations'),
(5, 8, 'DRVs', 'Design rule violations'),
(5, 8, 'Clock DRVs', 'Clock design rule violations'),
(5, 8, 'Clock DRCs', 'Clock design rule check violations'),
(5, 8, 'Preroute to postroute correlation', 'Pre-route to post-route correlation issues'),

-- Filler insertion categories
(5, 9, 'Filler gaps', 'Filler cell gap issues'),
(5, 9, 'Decap density', 'Decoupling capacitor density issues'),
(5, 9, 'flow issue', 'Filler insertion flow issues'),
(5, 9, 'cell padding', 'Cell padding issues'),

-- PD outputs categories
(5, 10, 'DEF', 'DEF file generation issues'),
(5, 10, 'LEF', 'LEF file generation issues'),
(5, 10, 'Netlist', 'Netlist generation issues'),
(5, 10, 'Physical Netlist', 'Physical netlist generation issues'),
(5, 10, 'GDS', 'GDS file generation issues'),

-- RC extraction categories
(5, 11, 'SPEF', 'SPEF file generation issues'),
(5, 11, 'Flow', 'RC extraction flow issues'),
(5, 11, 'Inputs', 'RC extraction input issues'),
(5, 11, 'Shorts', 'Short circuit detection'),
(5, 11, 'Opens', 'Open circuit detection'),

-- ECO categories
(5, 12, 'Setup timing fixes', 'Setup timing fix issues'),
(5, 12, 'Hold timing fixes', 'Hold timing fix issues'),
(5, 12, 'ECO implementation', 'ECO implementation issues'),
(5, 12, 'ECO flow', 'ECO flow issues'),
(5, 12, 'DRV fixes', 'Design rule violation fixes'),
(5, 12, 'Crosstalk delay fixes', 'Crosstalk delay fix issues'),
(5, 12, 'Crosstalk noise fixes', 'Crosstalk noise fix issues'),

-- STA categories
(5, 13, 'SDC', 'SDC file issues'),
(5, 13, 'Flow', 'STA flow issues'),
(5, 13, 'DMSA', 'DMSA analysis issues'),
(5, 13, 'Annotation', 'Timing annotation issues'),
(5, 13, 'Setup timing', 'Setup timing analysis'),
(5, 13, 'Hold timing', 'Hold timing analysis'),
(5, 13, 'DRVs', 'Design rule violations'),
(5, 13, 'Crosstalk Delay', 'Crosstalk delay analysis'),
(5, 13, 'Crosstalk noise', 'Crosstalk noise analysis'),
(5, 13, 'Clock DRVs', 'Clock design rule violations'),
(5, 13, 'Clock gating Violations', 'Clock gating violations'),
(5, 13, 'ECO generation', 'ECO generation issues'),
(5, 13, 'Physical aware eco', 'Physical aware ECO issues'),

-- EMIR categories
(5, 14, 'Static IR drop analysis', 'Static IR drop analysis issues'),
(5, 14, 'Dynamic vectorless analysis', 'Dynamic vectorless analysis issues'),
(5, 14, 'Dynamic vectored analysis', 'Dynamic vectored analysis issues'),
(5, 14, 'Power EM', 'Power electromigration issues'),
(5, 14, 'Signal EM', 'Signal electromigration issues'),
(5, 14, 'IR fix', 'IR drop fix issues'),
(5, 14, 'IR hotspots', 'IR drop hotspot issues'),
(5, 14, 'EM fix', 'Electromigration fix issues'),
(5, 14, 'Ploc file', 'Power location file issues'),
(5, 14, 'Inputs', 'EMIR analysis input issues'),
(5, 14, 'VCD', 'VCD file issues'),
(5, 14, 'Others', 'Other EMIR issues'),

-- Physical verification categories
(5, 15, 'DRC', 'Design rule check violations'),
(5, 15, 'LVS', 'Layout vs schematic issues'),
(5, 15, 'Antenna', 'Antenna effect violations'),
(5, 15, 'ERC', 'Electrical rule check violations'),
(5, 15, 'PERC', 'Programmable electrical rule check'),
(5, 15, 'Bump', 'Bump related issues'),
(5, 15, 'ESD', 'ESD protection issues'),

-- CLP categories
(5, 16, 'Isolation cell', 'Isolation cell issues'),
(5, 16, 'Level shifter', 'Level shifter issues'),
(5, 16, 'Power switch', 'Power switch issues'),
(5, 16, 'UPF', 'Unified power format issues'),

-- LEC categories
(5, 17, 'Settings', 'LEC settings issues'),
(5, 17, 'Debug Analysis', 'LEC debug analysis issues');

-- Insert Analog Layout stages into domain_stages
INSERT INTO domain_stages (domain_id, name, description) VALUES
(7, 'Schematic design inputs', 'Schematic design input requirements and specifications'),
(7, 'Floorplan', 'Floorplanning and device placement for analog layout'),
(7, 'Routing', 'Analog signal routing and interconnect'),
(7, 'AL outputs', 'Analog layout output files and deliverables'),
(7, 'RC extraction', 'RC parasitic extraction for analog circuits'),
(7, 'ECO', 'Engineering change orders for analog layout'),
(7, 'EMIR', 'Electromigration and IR drop analysis for analog'),
(7, 'Physical verification', 'Physical verification for analog layout'),
(7, 'ESD', 'ESD protection and design'),
(7, 'Pads', 'Bond pads and probe pads design'),
(7, 'Package', 'Package design and integration'),
(7, 'Technology & PDKs', 'Technology files and PDK management'),
(7, 'DB Version control', 'Database version control and management'),
(7, 'Project Release & QA', 'Project release and quality assurance');

-- Insert Analog Layout issue categories into domain_issue_categories
INSERT INTO domain_issue_categories (domain_id, stage_id, name, description) VALUES
-- Schematic design inputs categories
(7, 18, 'Matching (devices, nets - resistances, capacitance)', 'Device and net matching issues'),
(7, 18, 'High speed', 'High speed design considerations'),
(7, 18, 'High Voltage', 'High voltage design requirements'),
(7, 18, 'Different voltage domains', 'Multiple voltage domain issues'),
(7, 18, 'Clk & Data paths', 'Clock and data path design'),
(7, 18, 'Power (current & voltage) ratings', 'Power rating specifications'),
(7, 18, 'Branch currents', 'Branch current analysis'),
(7, 18, 'Node Voltages in cross voltage domains', 'Cross voltage domain node voltage issues'),

-- Floorplan categories
(7, 19, 'Devices Placement', 'Device placement optimization'),
(7, 19, 'Macro placement', 'Macro cell placement'),
(7, 19, 'Power planning', 'Power distribution planning'),
(7, 19, 'Different types of MOS devices', 'Various MOS device types'),
(7, 19, 'Different types of devices', 'Various device types'),
(7, 19, 'Blocks integration', 'Block integration issues'),
(7, 19, 'Analog & Digital blocks integration', 'Mixed-signal block integration'),
(7, 19, 'Area', 'Area optimization'),
(7, 19, 'ESD & Clamps integration', 'ESD protection integration'),
(7, 19, 'Latchup', 'Latchup prevention'),

-- Routing categories
(7, 20, 'Opens', 'Open circuit issues'),
(7, 20, 'Shorts', 'Short circuit issues'),
(7, 20, 'DRCs', 'Design rule check violations'),
(7, 20, 'High Speed signal routing', 'High speed signal routing issues'),
(7, 20, 'High Current', 'High current routing issues'),
(7, 20, 'Power mesh', 'Power distribution mesh'),
(7, 20, 'Crosstalk', 'Crosstalk issues'),

-- AL outputs categories
(7, 21, 'GDS', 'GDS file generation'),
(7, 21, 'LEF', 'LEF file generation'),
(7, 21, 'DEF', 'DEF file generation'),
(7, 21, 'Netlist', 'Netlist generation'),
(7, 21, 'PV reports', 'Physical verification reports'),
(7, 21, 'PERC & ESD reports', 'PERC and ESD analysis reports'),

-- RC extraction categories
(7, 22, 'Design updates', 'Design update issues'),
(7, 22, 'Post layout sims', 'Post layout simulation issues'),
(7, 22, 'LVS fail', 'LVS failure issues'),

-- ECO categories
(7, 23, 'Design updates', 'Design update issues'),
(7, 23, 'Post layout sims updates', 'Post layout simulation updates'),
(7, 23, 'Clk & Data Timing', 'Clock and data timing issues'),

-- EMIR categories
(7, 24, 'Static IR drop analysis', 'Static IR drop analysis'),
(7, 24, 'Dynamic IR drop analysis', 'Dynamic IR drop analysis'),
(7, 24, 'Power EM Iavg', 'Power electromigration average current'),
(7, 24, 'Power EM Irms', 'Power electromigration RMS current'),
(7, 24, 'Signal EM Iavg', 'Signal electromigration average current'),
(7, 24, 'Signal EM Irms', 'Signal electromigration RMS current'),
(7, 24, 'EMIR calculations', 'EMIR calculation issues'),

-- Physical verification categories
(7, 25, 'DRC', 'Design rule check violations'),
(7, 25, 'DFM', 'Design for manufacturability'),
(7, 25, 'ANT', 'Antenna effect violations'),
(7, 25, 'LVS', 'Layout vs schematic issues'),
(7, 25, 'ERC', 'Electrical rule check violations'),
(7, 25, 'PERC', 'Programmable electrical rule check'),
(7, 25, 'Bump', 'Bump related issues'),
(7, 25, 'ESD', 'ESD protection issues'),
(7, 25, 'Density', 'Density check issues'),

-- ESD categories
(7, 26, 'ESD types', 'ESD protection types'),
(7, 26, 'ESD sizes', 'ESD device sizing'),
(7, 26, 'Clamps', 'ESD clamp circuits'),
(7, 26, 'Resistance', 'ESD resistance issues'),
(7, 26, 'ESD voltage values', 'ESD voltage specifications'),

-- Pads categories
(7, 27, 'Bond Pads', 'Bond pad design'),
(7, 27, 'Different types of Bond pads', 'Various bond pad types'),
(7, 27, 'Probe pads', 'Probe pad design'),
(7, 27, 'RDL Routing', 'Redistribution layer routing'),

-- Package categories
(7, 28, 'CSP (Chip Scale package)', 'Chip scale package design'),
(7, 28, 'Wire bond', 'Wire bonding design'),

-- Technology & PDKs categories
(7, 29, 'PDKs', 'Process design kit issues'),
(7, 29, 'Tech file', 'Technology file issues'),
(7, 29, 'Display file', 'Display file issues'),
(7, 29, 'Metal stack (FEOL, MEOL, BEOL)', 'Metal stack configuration'),
(7, 29, 'DRM (Design Rule Manual)', 'Design rule manual issues'),
(7, 29, 'Rule decks', 'Rule deck configuration'),

-- DB Version control categories
(7, 30, 'Project DB', 'Project database management'),
(7, 30, 'Layout Design DB', 'Layout design database'),
(7, 30, 'Schematic design DB', 'Schematic design database'),
(7, 30, 'Check list DB', 'Checklist database'),
(7, 30, 'Design DB check-in', 'Design database check-in'),
(7, 30, 'Design DB check-out', 'Design database check-out'),
(7, 30, 'Design DB access or edit permission', 'Database access permissions'),

-- Project Release & QA categories
(7, 31, 'Devices used', 'Device usage tracking'),
(7, 31, 'Additional cost Masks', 'Additional mask costs'),
(7, 31, 'DB Prefixing', 'Database prefixing'),
(7, 31, 'Shapes out side of Boundary', 'Shapes outside boundary'),
(7, 31, 'LEF vs GDS', 'LEF vs GDS comparison'),
(7, 31, 'LEF vs Verilog', 'LEF vs Verilog comparison'),
(7, 31, 'Design Reviews', 'Design review process'),
(7, 31, 'Cross team release', 'Cross-team release coordination');

-- Insert sample tools
INSERT INTO tools (name, description, domain_id) VALUES
-- Physical Design Tools
('Design Compiler', 'Synopsys Design Compiler for synthesis', 5),
('Genus', 'Cadence Genus Synthesis Solution', 5),
('Fusion Compiler', 'Synopsys Fusion Compiler for design implementation', 5),
('Innovus', 'Cadence Innovus Implementation System', 5),
('ICC2', 'Synopsys IC Compiler II for place and route', 5),
('Redhawk', 'Ansys Redhawk for power analysis', 5),
('Voltus', 'Cadence Voltus IC Power Integrity Solution', 5),
('Tempus', 'Cadence Tempus Timing Signoff Solution', 5),
('PrimeTime', 'Synopsys PrimeTime for timing analysis', 5),
('StarRC', 'Synopsys StarRC for parasitic extraction', 5),
('Quantus', 'Cadence Quantus Extraction Solution', 5),
('Pegasus', 'Synopsys Pegasus Verification System', 5),
('Calibre', 'Mentor Graphics Calibre for DRC/LVS', 5),
('IC Validator', 'Synopsys IC Validator for physical verification', 5),

-- Analog Layout Tools
('Calibre', 'Mentor Graphics Calibre for DRC/LVS verification in analog layout', 7),
('ICV', 'Synopsys IC Validator for physical verification in analog layout', 7),
('Pegasus', 'Synopsys Pegasus Verification System for analog layout verification', 7),
('Virtuoso', 'Cadence Virtuoso for analog layout design and editing', 7),
('Custom Compiler', 'Synopsys Custom Compiler for analog layout design', 7),

-- Other domain tools (keeping some existing ones for other domains)
('Virtuoso', 'Cadence Virtuoso for analog design', 8),
('ModelSim', 'Mentor Graphics ModelSim for simulation', 4),
('VCS', 'Synopsys VCS for simulation', 4);



-- Insert admin user (password: admin123)
INSERT INTO users (username, password, role, full_name, domain_id) VALUES
('admin1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator', NULL);

