// controllers/adminAuthController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const { sendPasswordResetEmail } = require('../utils/mailer');
require('dotenv').config();

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
};

module.exports = {
  // ✅ Admin registration - NO authentication required for first admin
  register: async (req, res) => {
    try {
      const { full_name, email, phone, password } = req.body;

      // Validate required fields
      if (!full_name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: full_name, email, password'
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Check if email already exists
      const exists = await Admin.findOne({ where: { email } });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash password
      const hashed = await bcrypt.hash(password, 10);

      // Create admin
      const admin = await Admin.create({
        full_name,
        email,
        phone: phone || null,
        password: hashed
      });

      // Generate token
      const token = generateToken(admin);

      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        admin: {
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          role: 'ADMIN'
        },
        token
      });
    } catch (err) {
      console.error('Admin registration error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  // ✅ Admin login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find admin by email
      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const match = await bcrypt.compare(password, admin.password);
      if (!match) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      try {
        admin.last_login = new Date();
        await admin.save();
      } catch (saveErr) {
        console.warn('Warning: failed to update last_login:', saveErr.message);
      }

      // Generate token
      const token = generateToken(admin);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        admin: {
          id: admin.id,
          full_name: admin.full_name,
          email: admin.email,
          role: 'ADMIN'
        },
        token
      });
    } catch (err) {
      console.error('Admin login error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error during login',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  // ✅ Admin change password (requires authentication)
  changePassword: async (req, res) => {
    try {
      const adminId = req.user.id;
      const { old_password, new_password } = req.body;

      // Validate input
      if (!old_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Old password and new password are required'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Find admin
      const admin = await Admin.findOne({ where: { id: adminId } });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Verify old password
      const matched = await bcrypt.compare(old_password, admin.password);
      if (!matched) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash and update new password
      const hash = await bcrypt.hash(new_password, 10);
      admin.password = hash;
      await admin.save();

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (err) {
      console.error('Admin change password error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  // ✅ Admin forgot password (no authentication needed)
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Find admin by email
      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        // Don't reveal if email exists (security best practice)
        return res.status(200).json({
          success: true,
          message: 'If an admin account exists with this email, a password reset link will be sent'
        });
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          type: 'password_reset'
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send password reset email
      try {
        const emailResult = await sendPasswordResetEmail(email, resetToken);

        if (emailResult.success) {
          res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully. Please check your inbox.'
          });
        } else {
          console.error('Email sending failed:', emailResult.error);
          res.status(500).json({
            success: false,
            message: 'Failed to send reset email. Please try again later.'
          });
        }
      } catch (emailErr) {
        console.error('Error sending email:', emailErr);
        res.status(500).json({
          success: false,
          message: 'Failed to send reset email'
        });
      }
    } catch (err) {
      console.error('Admin forgot password error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  // ✅ Admin reset password with token (no authentication needed)
  resetPassword: async (req, res) => {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (tokenErr) {
        if (tokenErr.name === 'TokenExpiredError') {
          return res.status(400).json({
            success: false,
            message: 'Reset token has expired. Please request a new one.'
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token'
        });
      }


      // Find admin
      const admin = await Admin.findOne({ where: { id: decoded.id } });
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      // Hash and update password
      const hashed = await bcrypt.hash(new_password, 10);
      admin.password = hashed;
      await admin.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (err) {
      console.error('Admin reset password error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  },

  // ✅ Admin logout (requires authentication)
  logout: async (req, res) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      const userId = req.user?.id;

      if (token && userId) {
        console.info(`Admin logout: User ID ${userId} at ${new Date().toISOString()}`);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful. Please clear your token from client storage.'
      });
    } catch (err) {
      console.error('Admin logout error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error during logout',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};