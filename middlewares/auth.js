// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { BlacklistedToken } = require('../models');
const { Admin, User, Vendor } = require('../models');
require('dotenv').config();

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  const blacklisted = await BlacklistedToken.findOne({ where: { token } });
  if (blacklisted) {
    return res.status(401).json({ message: 'Token has been invalidated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication token has expired' });
    }
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient rights' });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
