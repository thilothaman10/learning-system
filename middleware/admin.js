const admin = (req, res, next) => {
  // Check if user exists and has admin role
  if (!req.user) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  next();
};

module.exports = admin;
