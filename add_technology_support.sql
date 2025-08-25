-- SQL script to add technology support to VLSI Portal database
-- Run these commands in your MySQL database

-- 1. Add technology column to queries table
ALTER TABLE queries ADD COLUMN technology VARCHAR(100) AFTER tool_id;

-- 2. Verify the changes
SELECT 'Technology support added to queries table' as status;
DESCRIBE queries;
