// controllers/vendorAuthController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Vendor, BlacklistedToken } = require('../models');
require('dotenv').config();

const generateToken = (vendor) => {
  return jwt.sign({ id: vendor.id, role: 'VENDOR' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
};

module.exports = {
  // Vendor registration - Can be self-registered but requires admin approval
  register: async (req, res) => {
    try {
      const { full_name, email, phone, password, business_name, business_address } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const exists = await Vendor.findOne({ where: { email } });
      if (exists) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const vendor = await Vendor.create({ 
        full_name, 
        email, 
        phone, 
        password: hashed,
        business_name,
        business_address,
        status: 'PENDING' // Requires admin approval
      });

      const token = generateToken(vendor);
      res.status(201).json({ 
        message: 'Vendor registration submitted. Awaiting admin approval.',
        vendor: { 
          id: vendor.id, 
          full_name: vendor.full_name, 
          email: vendor.email, 
          role: 'VENDOR',
          status: vendor.status
        }, 
        token 
      });
    } catch (err) {
      console.error('Vendor registration error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // Vendor login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const vendor = await Vendor.findOne({ where: { email } });
      if (!vendor) {
        return res.status(401).json({ message: 'Invalid vendor credentials' });
      }

      if (vendor.status === 'PENDING') {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      if (vendor.status === 'SUSPENDED') {
        return res.status(403).json({ message: 'Account has been suspended' });
      }

      const match = await bcrypt.compare(password, vendor.password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid vendor credentials' });
      }

      const token = generateToken(vendor);
      res.json({ 
        message: 'Vendor login successful',
        vendor: { 
          id: vendor.id, 
          full_name: vendor.full_name, 
          email: vendor.email, 
          role: 'VENDOR',
          status: vendor.status
        }, 
        token 
      });
    } catch (err) {
      console.error('Vendor login error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // Vendor logout
  logout: async (req, res) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      await BlacklistedToken.create({ token });
      res.json({ message: 'Logout successful' });
    } catch (err) {
      console.error('Vendor logout error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // Vendor change password
  changePassword: async (req, res) => {
    try {
      const vendorId = req.user.id;
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        return res.status(400).json({ message: 'Old password and new password are required' });
      }

      const vendor = await Vendor.findOne({ where: { id: vendorId } });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const matched = await bcrypt.compare(old_password, vendor.password);
      if (!matched) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const hash = await bcrypt.hash(new_password, 10);
      vendor.password = hash;
      await vendor.save();

      res.json({ message: 'Vendor password updated successfully' });
    } catch (err) {
      console.error('Vendor change password error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // Vendor forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const vendor = await Vendor.findOne({ where: { email } });
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor account not found' });
      }
      
      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign({ 
        id: vendor.id, 
        email: vendor.email, 
        role: 'VENDOR' 
      }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      // Send password reset email
      const { sendPasswordResetEmail } = require('../utils/mailer');
      const emailResult = await sendPasswordResetEmail(email, resetToken);
      
      if (emailResult.success) {
        res.json({ message: 'Password reset email sent successfully. Please check your inbox.' });
      } else {
        console.error('Email sending failed:', emailResult.error);
        res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
      }
    } catch (err) { 
      console.error('Vendor forgot password error:', err); 
      res.status(500).json({ message: 'Server error', error: err.message }); 
    }
  },

  // Vendor reset password with token
  resetPassword: async (req, res) => {
    try {
      const { token, new_password } = req.body;
      if (!token || !new_password) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const vendor = await Vendor.findOne({ where: { id: decoded.id } });
      if (!vendor) {
        return res.status(400).json({ message: 'Invalid token or vendor not found' });
      }

      // Update password
      const hashed = await bcrypt.hash(new_password, 10);
      vendor.password = hashed;
      await vendor.save();

      res.json({ message: 'Vendor password reset successfully' });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Reset token has expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: 'Invalid reset token' });
      }
      console.error('Vendor reset password error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
};
