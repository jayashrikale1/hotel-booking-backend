// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
};

module.exports = {
  register: async (req, res) => {
    try {
      const { full_name, email, phone, password, role } = req.body;
      if (!full_name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(400).json({ message: 'Email already exists' });

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ full_name, email, phone, password: hashed });
      const token = generateToken(user);
      res.json({ user: { id: user.id, full_name: user.full_name, email: user.email }, token });
    } catch (err) {
      console.error(err); res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'Missing email or password' });

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ message: 'Invalid credentials' });

      const token = generateToken(user);
      res.json({ user: { id: user.id, full_name: user.full_name, email: user.email }, token });
    } catch (err) {
      console.error(err); res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { old_password, new_password } = req.body;
      const user = await User.findByPk(userId);
      const matched = await bcrypt.compare(old_password, user.password);
      if (!matched) return res.status(400).json({ message: 'Old password incorrect' });
      const hash = await bcrypt.hash(new_password, 10);
      user.password = hash;
      await user.save();
      res.json({ message: 'Password updated' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: 'User not found' });
      
      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      // Send password reset email
      const { sendPasswordResetEmail } = require('../utils/mailer');
      console.log('Attempting to send email to:', email);
      console.log('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER
      });
      
      const emailResult = await sendPasswordResetEmail(email, resetToken);
      
      if (emailResult.success) {
        res.json({ message: 'Password reset email sent successfully. Please check your inbox.' });
      } else {
        console.error('Email sending failed:', emailResult.error);
        res.status(500).json({ message: 'Failed to send reset email. Please try again later.', error: emailResult.error });
      }
    } catch (err) { 
      console.error('Forgot password error:', err); 
      res.status(500).json({ message: 'Server error', error: err.message }); 
    }
  },

  // Reset password with token
  resetPassword: async (req, res) => {
    try {
      const { token, new_password } = req.body;
      if (!token || !new_password) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) return res.status(400).json({ message: 'Invalid token' });

      // Update password
      const hashed = await bcrypt.hash(new_password, 10);
      user.password = hashed;
      await user.save();

      res.json({ message: 'Password reset successfully' });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Reset token has expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: 'Invalid reset token' });
      }
      console.error(err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
};
