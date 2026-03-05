const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

async function sendOtpEmail(toEmail, userName, otp) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `DocVault <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Your DocVault Password Reset OTP`,
    html: `
      <div style="max-width:520px; margin:40px auto; background:#13151a; border:1px solid #2a2d38; border-radius:12px; overflow:hidden; font-family:sans-serif;">
        <div style="padding:28px 36px; text-align:center; border-bottom:1px solid #2a2d38;">
          <div style="font-size:22px; font-weight:600; color:#c9a84c; letter-spacing:0.1em;">🔒 DOCVAULT</div>
        </div>
        <div style="padding:36px;">
          <div style="font-size:16px; color:#e8e4d9; margin-bottom:12px;">Hello, ${userName}!</div>
          <div style="font-size:14px; color:#7d8296; line-height:1.7; margin-bottom:28px;">
            We received a request to reset your DocVault password. Use the OTP below to verify your identity.
          </div>
          <div style="background:#1c1f27; border:2px solid #c9a84c; border-radius:10px; padding:24px; text-align:center; margin-bottom:28px;">
            <div style="font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:#7d8296; margin-bottom:10px;">Your One-Time Password</div>
            <div style="font-size:42px; font-weight:700; letter-spacing:0.18em; color:#c9a84c; font-family:monospace;">${otp}</div>
            <div style="font-size:12px; color:#4a4e60; margin-top:10px;">⏱ Expires in 10 minutes</div>
          </div>
          <div style="background:#1c1f27; border-left:3px solid #c0392b; padding:14px 18px; border-radius:6px; font-size:12px; color:#7d8296;">
            ⚠️ If you did not request a password reset, please ignore this email.
          </div>
        </div>
        <div style="border-top:1px solid #2a2d38; padding:20px 36px; text-align:center; font-size:11px; color:#4a4e60;">
          &copy; 2025 DocVault — Secure Document Storage
        </div>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };