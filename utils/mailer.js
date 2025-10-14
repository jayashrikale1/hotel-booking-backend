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
