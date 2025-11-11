// utils/sms.js
// Provides a simple abstraction for sending OTP via SMS.
// Uses Twilio if environment variables are configured; otherwise logs output for development.

require('dotenv').config();

async function sendOtpSms(phone, otp) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
    try {
      // Attempt to load twilio; if not installed, fallback
      const twilioModule = require('twilio');
      const twilio = twilioModule(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const msg = await twilio.messages.create({
        body: `Your Hotel Booking login OTP is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
        from: TWILIO_FROM,
        to: phone
      });
      console.log('OTP SMS sent:', msg.sid);
      return { success: true };
    } catch (error) {
      console.error('Failed to send OTP SMS via Twilio, falling back to dev log:', error);
      console.log(`[DEV] OTP SMS to ${phone}: ${otp}`);
      return { success: true, dev: true };
    }
  }

  // Fallback: log to console for development/testing
  console.log(`[DEV] OTP SMS to ${phone}: ${otp}`);
  return { success: true, dev: true };
}

module.exports = { sendOtpSms };