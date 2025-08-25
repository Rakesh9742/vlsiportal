-- SQL script to add Analog Layout tools
-- Run these commands in your MySQL database

-- Add Analog Layout specific tools
INSERT INTO tools (name, description, domain_id) VALUES
('Calibre', 'Mentor Graphics Calibre for DRC/LVS verification in analog layout', 7),
('IC Validator', 'Synopsys IC Validator for physical verification in analog layout', 7),
('Pegasus', 'Synopsys Pegasus Verification System for analog layout verification', 7),
('Virtuoso', 'Cadence Virtuoso for analog layout design and editing', 7),
('Custom Compiler', 'Synopsys Custom Compiler for analog layout design', 7),
('Redhawk', 'Synopsys Redhawk for power analysis and IR drop analysis in analog layout', 7),
('StarRC', 'Synopsys StarRC for parasitic extraction in analog layout', 7),
('Quantus', 'Cadence Quantus for parasitic extraction and analysis in analog layout', 7);

-- Verify the changes
SELECT 'Analog Layout tools added successfully' as status;
SELECT COUNT(*) as total_analog_layout_tools FROM tools WHERE domain_id = 7;
SELECT name, description FROM tools WHERE domain_id = 7 ORDER BY name;
