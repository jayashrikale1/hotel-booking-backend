// utils/otpHelper.js
const bcrypt = require('bcrypt');

const DEFAULT_EXP_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);

function generateNumericOtp(digits = 6) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

async function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

function getExpiry(minutes = DEFAULT_EXP_MINUTES) {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + minutes);
  return expires;
}

module.exports = {
  generateNumericOtp,
  hashOtp,
  verifyOtp,
  getExpiry,
};