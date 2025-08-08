

-- Create users table (updated schema)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create design_stages table
CREATE TABLE IF NOT EXISTS design_stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create issue_categories table
CREATE TABLE IF NOT EXISTS issue_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create queries table (completely restructured)
CREATE TABLE IF NOT EXISTS queries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    teacher_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tool_id INT,
    design_stage_id INT,
    issue_category_id INT,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    resolution_attempts INT DEFAULT 0,
    resolution TEXT,
    debug_steps TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE SET NULL,
    FOREIGN KEY (design_stage_id) REFERENCES design_stages(id) ON DELETE SET NULL,
    FOREIGN KEY (issue_category_id) REFERENCES issue_categories(id) ON DELETE SET NULL
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

-- Insert sample design stages
INSERT INTO design_stages (name, description) VALUES
('Specification', 'Initial design specification and requirements'),
('Architecture', 'System architecture and high-level design'),
('RTL Design', 'Register Transfer Level design'),
('Synthesis', 'Logic synthesis and optimization'),
('Place and Route', 'Physical design and routing'),
('Verification', 'Design verification and testing'),
('Fabrication', 'Chip fabrication and manufacturing');

-- Insert sample issue categories
INSERT INTO issue_categories (name, description) VALUES
('Synthesis Issues', 'Problems during logic synthesis'),
('Timing Issues', 'Timing violations and constraints'),
('Power Issues', 'Power consumption and optimization'),
('Area Issues', 'Area optimization and utilization'),
('Verification Issues', 'Design verification problems'),
('Tool Issues', 'EDA tool related problems'),
('Methodology Issues', 'Design methodology questions');

-- Insert sample tools
INSERT INTO tools (name, description) VALUES
('Design Compiler', 'Synopsys Design Compiler for synthesis'),
('PrimeTime', 'Synopsys PrimeTime for timing analysis'),
('IC Compiler', 'Synopsys IC Compiler for place and route'),
('Virtuoso', 'Cadence Virtuoso for analog design'),
('Innovus', 'Cadence Innovus for digital design'),
('Calibre', 'Mentor Graphics Calibre for DRC/LVS'),
('ModelSim', 'Mentor Graphics ModelSim for simulation'),
('VCS', 'Synopsys VCS for simulation');

-- Insert sample teacher data (updated schema)
INSERT INTO users (username, password, role, full_name, domain) VALUES
('teacher1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Dr. John Smith', 'VLSI Design'),
('teacher2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Prof. Sarah Johnson', 'Digital Electronics');

-- Note: Password hash above is for 'password' - change in production 