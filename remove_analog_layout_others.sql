-- SQL script to remove "Other" entries from Analog Layout domain
-- Run these commands in your MySQL database

-- Remove "Other" entries from domain_issue_categories for Analog Layout (domain_id = 7)
DELETE FROM domain_issue_categories 
WHERE domain_id = 7 AND name = 'Other';

-- Verify the changes
SELECT 'Analog Layout "Other" entries removed successfully' as status;
SELECT COUNT(*) as remaining_analog_layout_categories FROM domain_issue_categories WHERE domain_id = 7;
SELECT name, stage_id FROM domain_issue_categories WHERE domain_id = 7 ORDER BY stage_id, name;
