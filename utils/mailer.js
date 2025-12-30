// utils/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();

function createTransporter() {
  const { SMTP_SERVICE, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  // Prefer explicit host/port configuration
  if (SMTP_HOST) {
    const port = Number(SMTP_PORT) || 587;
    const secure = port === 465; // implicit TLS for 465
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      tls: { rejectUnauthorized: false }
    });
  }

  // Use a well-known service if provided (e.g., 'gmail')
  if (SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: SMTP_SERVICE,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      tls: { rejectUnauthorized: false }
    });
  }

  // Fallback to sendmail (useful in some dev environments)
  return nodemailer.createTransport({ sendmail: true, newline: 'unix', path: '/usr/sbin/sendmail' });
}

const transporter = createTransporter();

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Hotel Booking System" <${process.env.SMTP_USER || 'no-reply@example.com'}>`,
    to: email,
    subject: 'Password Reset Request - Hotel Booking System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password for your Hotel Booking System account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email from Hotel Booking System. Please do not reply to this email.</p>
      </div>
    `
  };

  try {
    console.log('Sending email via transporter:', {
      host: transporter.options?.host,
      port: transporter.options?.port,
      service: transporter.options?.service,
      secure: transporter.options?.secure,
      to: mailOptions.to
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('Detailed email error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return { success: false, message: 'Failed to send email', error: error.message };
  }
};

module.exports = { transporter, sendPasswordResetEmail };

// Send OTP via email
const sendOtpEmail = async (email, otp, purpose = 'Login OTP') => {
  const mailOptions = {
    from: `"Hotel Booking System" <${process.env.SMTP_USER || 'no-reply@example.com'}>`,
    to: email,
    subject: `${purpose} - Hotel Booking System`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${purpose}</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</div>
        </div>
        <p>This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated email from Hotel Booking System.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
};

const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  const {
    userName,
    hotelName,
    hotelAddress,
    checkIn,
    checkOut,
    roomType,
    totalAmount,
    bookingId,
    guests
  } = bookingDetails;

  const mailOptions = {
    from: `"Hotel Booking System" <${process.env.SMTP_USER || 'no-reply@example.com'}>`,
    to: email,
    subject: `Booking Confirmation - ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #007bff;">
          <h2 style="margin: 0; color: #007bff;">Booking Confirmed!</h2>
          <p style="margin: 10px 0 0;">Booking ID: <strong>#${bookingId}</strong></p>
        </div>
        
        <div style="padding: 20px;">
          <p>Dear <strong>${userName}</strong>,</p>
          <p>Thank you for choosing <strong>${hotelName}</strong>. Your booking has been successfully confirmed.</p>
          
          <div style="background-color: #f1f1f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Hotel:</td>
                <td style="padding: 8px 0; font-weight: bold;">${hotelName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Address:</td>
                <td style="padding: 8px 0;">${hotelAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Check-in:</td>
                <td style="padding: 8px 0; font-weight: bold;">${new Date(checkIn).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Check-out:</td>
                <td style="padding: 8px 0; font-weight: bold;">${new Date(checkOut).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Room Type:</td>
                <td style="padding: 8px 0;">${roomType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Guests:</td>
                <td style="padding: 8px 0;">${guests}</td>
              </tr>
               <tr>
                <td style="padding: 8px 0; color: #666; border-top: 1px solid #ddd;">Total Amount:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #28a745; border-top: 1px solid #ddd;">₹${totalAmount}</td>
              </tr>
            </table>
          </div>

          <p>We look forward to hosting you!</p>
          <p>If you have any questions, please contact our support.</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>&copy; ${new Date().getFullYear()} Hotel Booking System. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { transporter, sendPasswordResetEmail, sendOtpEmail, sendBookingConfirmationEmail };
