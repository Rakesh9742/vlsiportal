-- DV Domain Data Insertion Script
-- This script adds the specific tools for Design Verification domain
-- Note: Issue categories are handled by domain_config.js, not the 
database

-- Add DV-specific tools to the tools table
-- Note: Some tools like VCS, Questa, Verdi already exist for domain_id 3

INSERT INTO `tools` VALUES 
(27, 'Document', 'Documentation and specification tools', 'General', 'other', 3, 1, NOW()),
(28, 'Synopsys VCS', 'Synopsys VCS for compilation and simulation', 'Synopsys', 'simulation', 3, 1, NOW()),
(29, 'Cadence Xcelium', 'Cadence Xcelium simulator', 'Cadence', 'simulation', 3, 1, NOW()),
(30, 'Cadence Incisive', 'Cadence Incisive simulator', 'Cadence', 'simulation', 3, 1, NOW()),
(31, 'Questasim', 'Mentor Graphics Questa simulator', 'Mentor', 'simulation', 3, 1, NOW()),
(32, 'Synopsys Verdi', 'Synopsys Verdi for waveform analysis', 'Synopsys', 'analysis', 3, 1, NOW()),
(33, 'Cadence Simvision', 'Cadence Simvision for waveform analysis', 'Cadence', 'analysis', 3, 1, NOW()),
(34, 'Synopsys URG', 'Synopsys Unified Report Generator for coverage', 'Synopsys', 'analysis', 3, 1, NOW()),
(35, 'Cadence IMC', 'Cadence Integrated Metrics Center for coverage', 'Cadence', 'analysis', 3, 1, NOW()),
(36, 'Vmanager', 'Cadence Vmanager for regression analysis', 'Cadence', 'analysis', 3, 1, NOW()),
(37, 'Git', 'Git version control system', 'Open Source', 'other', 3, 1, NOW()),
(38, 'SVN', 'Apache Subversion version control', 'Apache', 'other', 3, 1, NOW()),
(39, 'Perforce', 'Perforce version control system', 'Perforce', 'other', 3, 1, NOW()),
(40, 'Shell script', 'Shell scripting for automation', 'Unix/Linux', 'other', 3, 1, NOW()),
(41, 'SLURM', 'SLURM workload manager', 'SchedMD', 'other', 3, 1, NOW()),
(42, 'Python', 'Python scripting for automation', 'Python Software Foundation', 'other', 3, 1, NOW());

-- Note: Issue categories for DV domain are handled by domain_config.js
-- The DV domain uses a simplified structure without stages, where tools are
-- mapped directly to issue categories in the frontend configuration.
