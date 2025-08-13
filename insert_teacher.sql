-- Insert teacher user for VLSI Portal
-- Username: admin@1.com
-- Password: test (will be hashed)

INSERT INTO users (username, password, role, full_name, domain) VALUES
('admin@1.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Admin Teacher', 'VLSI Design');

-- Note: The password hash above is for 'test' 
-- If you want to use a different password, you'll need to generate a new bcrypt hash
