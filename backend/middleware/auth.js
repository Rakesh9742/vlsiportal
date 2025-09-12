const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Middleware to check if user has admin privileges (either admin or domain_admin)
const checkAdminRole = (req, res, next) => {
  if (!['admin', 'domain_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Middleware to check if user is super admin (only admin role, not domain_admin)
const checkSuperAdminRole = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
  }
  next();
};

module.exports = { auth, checkRole, checkAdminRole, checkSuperAdminRole }; 