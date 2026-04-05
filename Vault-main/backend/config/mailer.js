require('dotenv').config();
const https = require('https');

async function sendOtpEmail(toEmail, userName, otp) {
  const data = JSON.stringify({
    sender: { name: 'DocVault', email: process.env.EMAIL_FROM_ADDRESS || 'securedocvault@gmail.com' },
    to: [{ email: toEmail, name: userName }],
    subject: 'Your DocVault Password Reset OTP',
    htmlContent: `
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
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Email sent successfully');
          resolve();
        } else {
          console.error('❌ Email API error:', body);
          reject(new Error('Failed to send email: ' + body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

console.log('✅ Email service ready (Brevo API)');
module.exports = { sendOtpEmail };