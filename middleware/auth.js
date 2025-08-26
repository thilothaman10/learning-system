const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1]; // remove "Bearer "
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
module.exports.isAdmin = function(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Middleware to check if user is instructor or admin
module.exports.isInstructor = function(req, res, next) {
  if (!['instructor', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Instructor or admin role required.' });
  }
  next();
};

// Middleware to check if user is the owner of a resource or admin
module.exports.isOwnerOrAdmin = function(ownerField = 'user') {
  return function(req, res, next) {
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (req.params.id && req.user.id === req.params.id) {
      return next();
    }
    
    if (req.body[ownerField] && req.user.id === req.body[ownerField]) {
      return next();
    }
    
    res.status(403).json({ message: 'Access denied. Owner or admin role required.' });
  };
};
