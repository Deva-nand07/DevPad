const express    = require('express');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const User       = require('../models/User');

const router = express.Router();

// ── Nodemailer transporter (Gmail SMTP + App Password) ────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── POST /api/reset/request — generate OTP and email it ──────────────
router.post('/request', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }

    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode   = otp;
    user.otpExpiry = expiry;
    await user.save();

    // ── Send OTP email ────────────────────────────────────────────────
    const transporter = createTransporter();

    const mailOptions = {
      from: `"DevPad" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your DevPad Password Reset OTP',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#13131f;border:1px solid #1e1e35;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;border-bottom:1px solid #1e1e35;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:800;color:#e8e8f0;">
                      Dev<span style="color:#a855f7;">Pad</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e8e8f0;">
                Password Reset Request
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#8888aa;line-height:1.6;">
                Hi <strong style="color:#e8e8f0;">${user.name || email}</strong>, we received a request to reset your DevPad password.
                Use the OTP below to continue. It expires in <strong style="color:#e8e8f0;">10 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:24px;background:#0f0f1a;border:1px solid #1e1e35;border-radius:12px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#8888aa;letter-spacing:2px;text-transform:uppercase;">
                      Your One-Time Password
                    </p>
                    <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:10px;color:#a855f7;font-family:'Courier New',monospace;">
                      ${otp}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;color:#444466;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #1e1e35;background:#0d0d18;">
              <p style="margin:0;font-size:11px;color:#444466;font-family:'Courier New',monospace;">
                DevPad &mdash; Code. Note. Focus. Create. &copy; ${new Date().getFullYear()} by Deva Nand
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: `OTP sent to ${email}. Check your inbox (valid for 10 minutes).` });
  } catch (err) {
    console.error('[reset/request]', err.message);

    // Give a helpful message if Gmail credentials are missing / wrong
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      return res.status(500).json({ message: 'Email delivery failed. Check GMAIL_USER and GMAIL_APP_PASS in server .env.' });
    }
    res.status(500).json({ message: 'Server error. Could not send OTP email.' });
  }
});

// ── POST /api/reset/verify-otp — verify OTP ──────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const otp   = (req.body.otp   || '').trim();
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    const user = await User.findOne({ email });
    if (!user || user.otpCode !== otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    res.json({ message: 'OTP verified.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/reset/confirm — set new password ───────────────────────
router.post('/confirm', async (req, res) => {
  try {
    const email    = (req.body.email    || '').trim().toLowerCase();
    const otp      = (req.body.otp      || '').trim();
    const password = (req.body.password || '');

    if (!email || !otp || !password) return res.status(400).json({ message: 'All fields are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const user = await User.findOne({ email });
    if (!user || user.otpCode !== otp || !user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'OTP is invalid or expired. Request a new one.' });
    }

    user.password  = await bcrypt.hash(password, 12);
    user.otpCode   = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('[reset/confirm]', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
