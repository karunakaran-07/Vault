const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { get, run } = require('../config/db');
const { sendOtpEmail } = require('../config/mailer');
require('dotenv').config();

const router = express.Router();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const existing = await get('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing)
      return res.status(409).json({ message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const result = await run(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
      [name.trim(), email.toLowerCase().trim(), hashed]
    );
    return res.status(201).json({ message: 'Account created successfully.', userId: result.lastInsertRowid });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await get('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return res.json({ message: 'Login successful.', token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await get('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user)
      return res.status(404).json({ message: 'This email is not registered. Please check and try again.' });

    await run('UPDATE password_resets SET used = TRUE WHERE email = $1', [email.toLowerCase()]);

    const otp       = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await run(
      'INSERT INTO password_resets (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email.toLowerCase().trim(), otp, expiresAt]
    );

    await sendOtpEmail(email, user.name, otp);
    return res.json({ message: 'OTP sent to your email. Valid for 10 minutes.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const record = await get(
      'SELECT * FROM password_resets WHERE email = $1 AND otp = $2 AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [email.toLowerCase().trim(), otp.trim()]
    );
    if (!record) return res.status(400).json({ message: 'Invalid OTP.' });

    if (new Date() > new Date(record.expires_at)) {
      await run('UPDATE password_resets SET used = TRUE WHERE id = $1', [record.id]);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const resetToken = jwt.sign(
      { email: email.toLowerCase().trim(), otpId: record.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    return res.json({ message: 'OTP verified.', resetToken });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword)
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Reset token is invalid or expired. Please start over.' });
    }

    await run('UPDATE password_resets SET used = TRUE WHERE id = $1', [decoded.otpId]);
    const hashed = await bcrypt.hash(newPassword, 12);
    await run('UPDATE users SET password = $1 WHERE email = $2', [hashed, decoded.email]);

    return res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;