-- Migration script to update existing database to use domains table
-- Run this after creating the domains table

-- Step 1: Create domains table if it doesn't exist
CREATE TABLE IF NOT EXISTS domains (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert domains data
INSERT IGNORE INTO domains (name, description) VALUES
('Specification', 'System specification and requirements analysis'),
('Architecture', 'System architecture and high-level design'),
('Design', 'Digital design and RTL development'),
('Design Verification', 'Design verification and testing'),
('Physical Design', 'Physical design and layout'),
('DFT', 'Design for Testability'),
('Analog Layout', 'Analog circuit layout design'),
('Analog Design', 'Analog circuit design and simulation');

-- Step 3: Add domain_id column to users table
ALTER TABLE users ADD COLUMN domain_id INT AFTER domain;

-- Step 4: Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_domain FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL;

-- Step 5: Update existing users to map their domain string to domain_id
-- This maps common domain strings to the new domain IDs
UPDATE users SET domain_id = 1 WHERE domain = 'Specification' OR domain LIKE '%spec%';
UPDATE users SET domain_id = 2 WHERE domain = 'Architecture' OR domain LIKE '%arch%';
UPDATE users SET domain_id = 3 WHERE domain = 'Design' OR domain LIKE '%design%' AND domain NOT LIKE '%verification%' AND domain NOT LIKE '%physical%';
UPDATE users SET domain_id = 4 WHERE domain = 'Design Verification' OR domain LIKE '%verification%';
UPDATE users SET domain_id = 5 WHERE domain = 'Physical Design' OR domain LIKE '%physical%';
UPDATE users SET domain_id = 6 WHERE domain = 'DFT' OR domain LIKE '%dft%' OR domain LIKE '%test%';
UPDATE users SET domain_id = 7 WHERE domain = 'Analog Layout' OR domain LIKE '%analog layout%';
UPDATE users SET domain_id = 8 WHERE domain = 'Analog Design' OR domain LIKE '%analog design%';

-- Step 6: Set default domain for any remaining users (optional)
UPDATE users SET domain_id = 3 WHERE domain_id IS NULL;

-- Step 7: Remove the old domain column (optional - uncomment if you want to remove it)
-- ALTER TABLE users DROP COLUMN domain;
