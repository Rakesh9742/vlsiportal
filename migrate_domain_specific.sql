-- Migration script to update existing database to use domain-specific fields
-- Run this after updating the database schema

-- Step 1: Add new domain-specific columns to queries table
ALTER TABLE queries ADD COLUMN pd_stage_name VARCHAR(100) AFTER tool_id;
ALTER TABLE queries ADD COLUMN pd_issue_category VARCHAR(100) AFTER pd_stage_name;
ALTER TABLE queries ADD COLUMN spec_stage_name VARCHAR(100) AFTER pd_issue_category;
ALTER TABLE queries ADD COLUMN spec_issue_category VARCHAR(100) AFTER spec_stage_name;
ALTER TABLE queries ADD COLUMN arch_stage_name VARCHAR(100) AFTER spec_issue_category;
ALTER TABLE queries ADD COLUMN arch_issue_category VARCHAR(100) AFTER arch_stage_name;
ALTER TABLE queries ADD COLUMN design_stage_name VARCHAR(100) AFTER arch_issue_category;
ALTER TABLE queries ADD COLUMN design_issue_category VARCHAR(100) AFTER design_stage_name;
ALTER TABLE queries ADD COLUMN dv_stage_name VARCHAR(100) AFTER design_issue_category;
ALTER TABLE queries ADD COLUMN dv_issue_category VARCHAR(100) AFTER dv_stage_name;
ALTER TABLE queries ADD COLUMN dft_stage_name VARCHAR(100) AFTER dv_issue_category;
ALTER TABLE queries ADD COLUMN dft_issue_category VARCHAR(100) AFTER dft_stage_name;
ALTER TABLE queries ADD COLUMN analog_layout_stage_name VARCHAR(100) AFTER dft_issue_category;
ALTER TABLE queries ADD COLUMN analog_layout_issue_category VARCHAR(100) AFTER analog_layout_stage_name;
ALTER TABLE queries ADD COLUMN analog_design_stage_name VARCHAR(100) AFTER analog_layout_issue_category;
ALTER TABLE queries ADD COLUMN analog_design_issue_category VARCHAR(100) AFTER analog_design_stage_name;

-- Step 2: Migrate existing data (optional - only if you have existing data)
-- This maps existing design_stage_id and issue_category_id to the new domain-specific fields
-- You may need to adjust this based on your existing data

-- Example migration for Physical Design domain queries
UPDATE queries q 
JOIN users u ON q.student_id = u.id 
JOIN design_stages ds ON q.design_stage_id = ds.id 
JOIN issue_categories ic ON q.issue_category_id = ic.id 
SET q.pd_stage_name = ds.name, q.pd_issue_category = ic.name 
WHERE u.domain_id = 5; -- Physical Design domain_id

-- Example migration for other domains (adjust domain_id as needed)
UPDATE queries q 
JOIN users u ON q.student_id = u.id 
JOIN design_stages ds ON q.design_stage_id = ds.id 
JOIN issue_categories ic ON q.issue_category_id = ic.id 
SET q.spec_stage_name = ds.name, q.spec_issue_category = ic.name 
WHERE u.domain_id = 1; -- Specification domain_id

UPDATE queries q 
JOIN users u ON q.student_id = u.id 
JOIN design_stages ds ON q.design_stage_id = ds.id 
JOIN issue_categories ic ON q.issue_category_id = ic.id 
SET q.arch_stage_name = ds.name, q.arch_issue_category = ic.name 
WHERE u.domain_id = 2; -- Architecture domain_id

UPDATE queries q 
JOIN users u ON q.student_id = u.id 
JOIN design_stages ds ON q.design_stage_id = ds.id 
JOIN issue_categories ic ON q.issue_category_id = ic.id 
SET q.design_stage_name = ds.name, q.design_issue_category = ic.name 
WHERE u.domain_id = 3; -- Design domain_id

UPDATE queries q 
JOIN users u ON q.student_id = u.id 
JOIN design_stages ds ON q.design_stage_id = ds.id 
JOIN issue_categories ic ON q.issue_category_id = ic.id 
SET q.dv_stage_name = ds.name, q.dv_issue_category = ic.name 
WHERE u.domain_id = 4; -- Design Verification domain_id

UPDATE queries q 
JOIN users u ON q.student_id = u.id 
JOIN design_stages ds ON q.design_stage_id = ds.id 
JOIN issue_categories ic ON q.issue_category_id = ic.id 
SET q.dft_stage_name = ds.name, q.dft_issue_category = ic.name 
WHERE u.domain_id = 6; -- DFT domain_id

UPDATE queries q 
JOIN users u ON q.student_id = u.id 
JOIN design_stages ds ON q.design_stage_id = ds.id 
JOIN issue_categories ic ON q.issue_category_id = ic.id 
SET q.analog_layout_stage_name = ds.name, q.analog_layout_issue_category = ic.name 
WHERE u.domain_id = 7; -- Analog Layout domain_id

UPDATE queries q 
JOIN users u ON q.student_id = u.id 
JOIN design_stages ds ON q.design_stage_id = ds.id 
JOIN issue_categories ic ON q.issue_category_id = ic.id 
SET q.analog_design_stage_name = ds.name, q.analog_design_issue_category = ic.name 
WHERE u.domain_id = 8; -- Analog Design domain_id

-- Step 3: Remove old foreign key constraints
ALTER TABLE queries DROP FOREIGN KEY queries_ibfk_4; -- design_stage_id foreign key
ALTER TABLE queries DROP FOREIGN KEY queries_ibfk_5; -- issue_category_id foreign key

-- Step 4: Remove old columns
ALTER TABLE queries DROP COLUMN design_stage_id;
ALTER TABLE queries DROP COLUMN issue_category_id;

-- Step 5: Drop old tables (optional - uncomment if you want to remove them)
-- DROP TABLE IF EXISTS design_stages;
-- DROP TABLE IF EXISTS issue_categories;
