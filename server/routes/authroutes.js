const express = require('express');
const bcrypt = require('bcrypt');
const { createOtp, verifyOtp } = require('../services/otpStore');
const { sendOtpEmail } = require('../services/emailService');
const User = require('../models/User');

const router = express.Router();

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@gmail\.com$/i.test(email);

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
});

router.get('/status', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.json({ loggedIn: false, user: null });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ loggedIn: false, user: null });
    }
    return res.json({ loggedIn: true, user: publicUser(user) });
  } catch {
    return res.json({ loggedIn: false, user: null });
  }
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

    const existing = await User.findOne({ email: normalizedEmail });

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

    let user = await User.findOne({ email: normalizedEmail });

    if (purpose === 'signup') {
      if (user) {
        return res.status(409).json({ message: 'Email already registered.' });
      }
      user = await User.create({
        name: result.meta.name,
        email: normalizedEmail,
        emailVerified: true,
        passwordHash: null,
      });
    } else {
      if (!user) {
        return res.status(404).json({ message: 'Account not found.' });
      }
      user.emailVerified = true;
      await user.save();
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

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid @gmail.com email.' });
    }
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
    });

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

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid @gmail.com email.' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await User.create({
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        passwordHash,
        emailVerified: true,
      });
    }

    res.json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Sign in failed.' });
  }
});

module.exports = router;
