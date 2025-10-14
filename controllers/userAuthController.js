// controllers/userAuthController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
};

module.exports = {
  // User registration - Open registration for customers
  register: async (req, res) => {
    try {
      const { full_name, email, phone, password } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const exists = await User.findOne({ where: { email } });
      if (exists) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ 
        full_name, 
        email, 
        phone, 
        password: hashed
      });

      const token = generateToken(user);
      res.status(201).json({ 
        message: 'User registered successfully',
        user: { 
          id: user.id, 
          full_name: user.full_name, 
          email: user.email, 
          role: 'USER' 
        }, 
        token 
      });
    } catch (err) {
      console.error('User registration error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid user credentials' });
      }

      if (!user.is_active) {
        return res.status(403).json({ message: 'Account has been deactivated' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid user credentials' });
      }

      const token = generateToken(user);
      res.json({ 
        message: 'User login successful',
        user: { 
          id: user.id, 
          full_name: user.full_name, 
          email: user.email, 
          role: 'USER' 
        }, 
        token 
      });
    } catch (err) {
      console.error('User login error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // User change password
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        return res.status(400).json({ message: 'Old password and new password are required' });
      }

      const user = await User.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const matched = await bcrypt.compare(old_password, user.password);
      if (!matched) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      const hash = await bcrypt.hash(new_password, 10);
      user.password = hash;
      await user.save();

      res.json({ message: 'User password updated successfully' });
    } catch (err) {
      console.error('User change password error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // User forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: 'User account not found' });
      }
      
      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign({ 
        id: user.id, 
        email: user.email, 
        role: 'USER' 
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
      console.error('User forgot password error:', err); 
      res.status(500).json({ message: 'Server error', error: err.message }); 
    }
  },

  // User reset password with token
  resetPassword: async (req, res) => {
    try {
      const { token, new_password } = req.body;
      if (!token || !new_password) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ where: { id: decoded.id } });
      if (!user) {
        return res.status(400).json({ message: 'Invalid token or user not found' });
      }

      // Update password
      const hashed = await bcrypt.hash(new_password, 10);
      user.password = hashed;
      await user.save();

      res.json({ message: 'User password reset successfully' });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Reset token has expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: 'Invalid reset token' });
      }
      console.error('User reset password error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
};
