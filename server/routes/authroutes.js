const express = require('express');
const bcrypt = require('bcrypt');
const { createOtp, verifyOtp } = require('../services/otpStore');
const { sendOtpEmail } = require('../services/emailService');

const router = express.Router();
const users = [];

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

router.get('/status', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.json({ loggedIn: false, user: null });
  }
  const user = users.find((item) => item.id === userId);
  if (!user) {
    return res.json({ loggedIn: false, user: null });
  }
  res.json({ loggedIn: true, user: publicUser(user) });
});

router.post('/otp/send', async (req, res) => {
  try {
    const { email, purpose, name } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (!['signup', 'signin'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid verification type.' });
    }

    const existing = users.find((u) => u.email === normalizedEmail);

    if (purpose === 'signup') {
      if (!name?.trim()) {
        return res.status(400).json({ message: 'Please enter your name.' });
      }
      if (existing) {
        return res.status(409).json({ message: 'Email already registered. Sign in instead.' });
      }
    }

    if (purpose === 'signin' && !existing) {
      return res.status(404).json({ message: 'No account found for this email. Sign up first.' });
    }

    const code = createOtp(normalizedEmail, purpose, {
      name: name?.trim() || existing?.name,
    });

    const mailResult = await sendOtpEmail({ email: normalizedEmail, code, purpose });

    const payload = {
      message: 'Verification code sent to your email.',
      expiresIn: 300,
    };

    if (mailResult.devMode && process.env.NODE_ENV !== 'production') {
      payload.devOtp = code;
    }

    res.json(payload);
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({ message: 'Could not send verification code.' });
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!isValidEmail(normalizedEmail) || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const result = verifyOtp(normalizedEmail, purpose, otp);
    if (!result.ok) {
      return res.status(400).json({ message: result.message });
    }

    let user = users.find((u) => u.email === normalizedEmail);

    if (purpose === 'signup') {
      if (user) {
        return res.status(409).json({ message: 'Email already registered.' });
      }
      user = {
        id: `user_${Date.now()}`,
        name: result.meta.name,
        email: normalizedEmail,
        emailVerified: true,
        passwordHash: null,
      };
      users.push(user);
    } else {
      if (!user) {
        return res.status(404).json({ message: 'Account not found.' });
      }
      user.emailVerified = true;
    }

    res.json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Verification failed.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (users.some((item) => item.email === normalizedEmail)) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
    };
    users.push(user);

    res.status(201).json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Please enter email and password.' });
    }

    const user = users.find((item) => item.email === normalizeEmail(email));
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ message: 'This account uses email OTP. Switch to Email OTP to sign in.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Sign in failed.' });
  }
});

module.exports = router;
