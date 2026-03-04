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
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Your DocVault Password Reset OTP`,
    html: `<div style="font-family:sans-serif; padding:20px;">
      <h2 style="color:#c9a84c;">Hello ${userName}!</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:0.2em; color:#c9a84c;">${otp}</h1>
      <p>Expires in 10 minutes.</p>
    </div>`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };