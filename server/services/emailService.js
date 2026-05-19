const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  return transporter;
};

const sendOtpEmail = async ({ email, code, purpose }) => {
  const subject = purpose === 'signup'
    ? 'Verify your HabitForge account'
    : 'Your HabitForge sign-in code';

  const text = `Your verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, you can ignore this email.`;

  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #7c4dff;">HabitForge</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1a1a2e;">${code}</p>
      <p style="color: #888;">Expires in 5 minutes.</p>
    </div>
  `;

  const mail = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!mail) {
    console.log('\n--- HabitForge OTP (no SMTP configured) ---');
    console.log(`To: ${email}`);
    console.log(`Code: ${code}`);
    console.log('-------------------------------------------\n');
    return { sent: false, devMode: true };
  }

  await mail.sendMail({ from, to: email, subject, text, html });
  return { sent: true, devMode: false };
};

module.exports = { sendOtpEmail };
