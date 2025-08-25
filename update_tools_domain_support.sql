-- SQL script to update tools table for domain-specific tools
-- Run these commands in your MySQL database

-- 1. Add domain_id column to tools table
ALTER TABLE tools ADD COLUMN domain_id INT AFTER description;

-- 2. Add foreign key constraint for domain_id
ALTER TABLE tools ADD CONSTRAINT fk_tools_domain 
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL;

-- 3. Clear existing tools data (optional - only if you want to replace all tools)
-- DELETE FROM tools;

-- 4. Insert Physical Design specific tools
INSERT INTO tools (name, description, domain_id) VALUES
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
('IC Validator', 'Synopsys IC Validator for physical verification', 5);

-- 5. Insert tools for other domains (optional - you can add more as needed)
INSERT INTO tools (name, description, domain_id) VALUES
('Virtuoso', 'Cadence Virtuoso for analog design', 8),
('ModelSim', 'Mentor Graphics ModelSim for simulation', 4),
('VCS', 'Synopsys VCS for simulation', 4);

-- 6. Verify the changes
SELECT 'Tools table updated successfully' as status;
SELECT COUNT(*) as total_tools FROM tools;
SELECT COUNT(*) as pd_tools FROM tools WHERE domain_id = 5;
SELECT 'Domain-specific tools support added' as status;
