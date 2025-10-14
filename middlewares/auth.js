// middlewares/auth.js
const jwt = require('jsonwebtoken');
const { Admin, User, Vendor } = require('../models');
require('dotenv').config();

const authenticateToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = null;
    let role = decoded.role;

    // Find user based on role
    if (role === 'ADMIN') {
      user = await Admin.findByPk(decoded.id);
    } else if (role === 'VENDOR') {
      user = await Vendor.findByPk(decoded.id);
    } else if (role === 'USER') {
      user = await User.findByPk(decoded.id);
    }

    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = { id: user.id, role: role, email: user.email };
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
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

module.exports = { authenticateToken, requireRole };
