const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(toEmail, userName, otp) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `DocVault <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🔐 Your DocVault Password Reset OTP`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { margin:0; padding:0; background:#0b0c0f; font-family: 'Segoe UI', sans-serif; }
          .wrap { max-width:520px; margin:40px auto; background:#13151a; border:1px solid #2a2d38; border-radius:12px; overflow:hidden; }
          .header { background:#13151a; border-bottom:1px solid #2a2d38; padding:28px 36px; text-align:center; }
          .brand { font-size:22px; font-weight:600; color:#c9a84c; letter-spacing:0.1em; }
          .body { padding:36px; }
          .greeting { font-size:16px; color:#e8e4d9; margin-bottom:12px; }
          .msg { font-size:14px; color:#7d8296; line-height:1.7; margin-bottom:28px; }
          .otp-box { background:#1c1f27; border:2px solid #c9a84c; border-radius:10px; padding:24px; text-align:center; margin-bottom:28px; }
          .otp-label { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:#7d8296; margin-bottom:10px; }
          .otp-code { font-size:42px; font-weight:700; letter-spacing:0.18em; color:#c9a84c; font-family:monospace; }
          .otp-expiry { font-size:12px; color:#4a4e60; margin-top:10px; }
          .warning { background:#1c1f27; border-left:3px solid #c0392b; padding:14px 18px; border-radius:6px; font-size:12px; color:#7d8296; margin-bottom:24px; }
          .footer { border-top:1px solid #2a2d38; padding:20px 36px; text-align:center; font-size:11px; color:#4a4e60; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="header">
            <div class="brand">🔒 DOCVAULT</div>
          </div>
          <div class="body">
            <div class="greeting">Hello, ${userName}!</div>
            <div class="msg">
              We received a request to reset your DocVault password. Use the OTP below to verify your identity.
            </div>
            <div class="otp-box">
              <div class="otp-label">Your One-Time Password</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">⏱ Expires in 10 minutes</div>
            </div>
            <div class="warning">
              ⚠️ If you did not request a password reset, please ignore this email. Your account is safe.
            </div>
          </div>
          <div class="footer">
            &copy; 2025 DocVault — Secure Document Storage. Do not reply to this email.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };