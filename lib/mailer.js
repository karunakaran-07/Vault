const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOtpEmail(email, name, otp) {
  await transporter.sendMail({
    from: `"DocVault" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your DocVault OTP Code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
        <h2 style="color:#6c63ff;">DocVault 🔒</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your OTP for password reset is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#6c63ff;margin:24px 0;">${otp}</div>
        <p style="color:#888;">Valid for <strong>10 minutes</strong>. Do not share this with anyone.</p>
      </div>
    `,
  });
}

module.exports = { sendOtpEmail };
