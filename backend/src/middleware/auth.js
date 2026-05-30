const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PlatformAdmin = require('../models/PlatformAdmin');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (decoded.role === 'super_admin') {
      const admin = await PlatformAdmin.findById(decoded.userId);
      if (!admin) {
        return res.status(401).json({ error: 'Admin not found' });
      }
    } else {
      const user = await User.findOne({ _id: decoded.userId });
      if (!user || user.status !== 'active') {
        return res.status(401).json({ error: 'User not found or inactive' });
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const checkPermission = (...permissions) => {
  return (req, res, next) => {
    if (req.user.role === 'super_admin') return next();

    const hasPermission = permissions.some(p => req.user.permissions?.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ error: 'Unauthorized: insufficient permissions' });
    }
    next();
  };
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized: invalid role' });
    }
    next();
  };
};

module.exports = { authenticate, checkPermission, checkRole };
