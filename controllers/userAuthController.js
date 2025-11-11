// controllers/userAuthController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, UserOtp, BlacklistedToken } = require('../models');
const { generateNumericOtp, hashOtp, verifyOtp, getExpiry } = require('../utils/otpHelper');
const { sendOtpEmail } = require('../utils/mailer');
const { sendOtpSms } = require('../utils/sms');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: 'USER' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
};

module.exports = {
  // User signup
  signup: async (req, res) => {
    try {
      const { full_name, email, phone, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        full_name,
        email,
        phone,
        password: hashedPassword,
        is_active: false, // User is inactive until OTP verification
      });

      const otp = generateNumericOtp();
      const codeHash = await hashOtp(otp);
      const expiresAt = getExpiry();

      await UserOtp.create({
        user_id: newUser.id,
        channel: 'email',
        destination: email,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

      const emailResult = await sendOtpEmail(email, otp, 'Account Verification OTP');
      if (!emailResult.success) {
        return res.status(500).json({ message: 'Failed to send verification OTP', error: emailResult.error });
      }

      res.status(201).json({ message: 'User registered successfully. Please verify your email with the OTP sent.' });
    } catch (err) {
      console.error('User signup error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // Request OTP for mobile login
  requestMobileLoginOtp: async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ message: 'Phone is required' });
      }

      const user = await User.findOne({ where: { phone } });
      if (!user) {
        return res.status(404).json({ message: 'User not found for this phone' });
      }
      if (!user.is_active) {
        return res.status(403).json({ message: 'Account has been deactivated' });
      }

      const otp = generateNumericOtp();
      const codeHash = await hashOtp(otp);
      const expiresAt = getExpiry();

      await UserOtp.create({
        user_id: user.id,
        channel: 'phone',
        destination: phone,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

      const smsResult = await sendOtpSms(phone, otp);
      if (!smsResult.success) {
        return res.status(500).json({ message: 'Failed to send OTP', error: smsResult.error });
      }

      res.json({ message: 'OTP sent to mobile number' });
    } catch (err) {
      console.error('Request mobile OTP error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // Request OTP for email+password login
  requestEmailPasswordLoginOtp: async (req, res) => {
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

      const otp = generateNumericOtp();
      const codeHash = await hashOtp(otp);
      const expiresAt = getExpiry();

      await UserOtp.create({
        user_id: user.id,
        channel: 'email',
        destination: email,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

      const emailResult = await sendOtpEmail(email, otp, 'Login OTP');
      if (!emailResult.success) {
        return res.status(500).json({ message: 'Failed to send OTP email', error: emailResult.error });
      }

      res.json({ message: 'OTP sent to email' });
    } catch (err) {
      console.error('Request email+password OTP error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // Verify OTP for login (email or phone)
  verifyLoginOtp: async (req, res) => {
    try {
      const { channel, email, phone, otp } = req.body;
      if (!otp || !channel || !['email', 'phone'].includes(channel)) {
        return res.status(400).json({ message: 'Channel (email|phone) and otp are required' });
      }

      let user;
      let destination;
      if (channel === 'email') {
        if (!email) return res.status(400).json({ message: 'Email is required' });
        user = await User.findOne({ where: { email } });
        destination = email;
      } else {
        if (!phone) return res.status(400).json({ message: 'Phone is required' });
        user = await User.findOne({ where: { phone } });
        destination = phone;
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If user is inactive, this is a signup verification
      const isSignupVerification = !user.is_active;

      if (user.is_active === false) {
        // Activate user if this is a signup verification
        user.is_active = true;
      } else if (!user.is_active) {
        return res.status(403).json({ message: 'Account has been deactivated' });
      }

      // Find latest unconsumed OTP for this user/channel/destination
      const otpRecord = await UserOtp.findOne({
        where: {
          user_id: user.id,
          channel,
          destination,
          consumed: false,
        },
        order: [['created_at', 'DESC']]
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'No active OTP found' });
      }

      // Expiry check
      if (new Date(otpRecord.expires_at) < new Date()) {
        return res.status(400).json({ message: 'OTP expired' });
      }

      // Verify entered OTP against hash
      const valid = await verifyOtp(otp, otpRecord.code_hash);
      if (!valid) {
        // increment attempts
        otpRecord.attempts = (otpRecord.attempts || 0) + 1;
        await otpRecord.save();
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // consume OTP and update last_login
      otpRecord.consumed = true;
      await otpRecord.save();

      user.last_login = new Date();
      await user.save();

      const token = generateToken(user);
      const responseMessage = isSignupVerification ? 'Account activated successfully' : 'Login successful';

      res.json({
        message: responseMessage,
        user: { id: user.id, full_name: user.full_name, email: user.email, role: 'USER' },
        token
      });
    } catch (err) {
      console.error('Verify login OTP error:', err);
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
  },

  // User logout
  logout: async (req, res) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      await BlacklistedToken.create({
        token,
        expires_at: new Date(decoded.exp * 1000),
      });

      res.json({ message: 'User logged out successfully' });
    } catch (err) {
      console.error('User logout error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
};
