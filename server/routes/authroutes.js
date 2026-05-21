const express = require('express');
const bcrypt = require('bcrypt');
const { createOtp, verifyOtp } = require('../services/otpStore');
const { sendOtpEmail } = require('../services/emailService');
const userStore = require('../services/userStore');

const router = express.Router();

const normalizeEmail = (email) => email.trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@gmail\.com$/i.test(email);

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
});

router.get('/status', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.json({ loggedIn: false, user: null });
  }
  try {
    const user = await userStore.findUserById(userId);
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
      return res.status(400).json({ message: 'Email must end with @gmail.com' });
    }
    if (!['signup', 'signin'].includes(purpose)) {
      return res.status(400).json({ message: 'Invalid verification type.' });
    }

    const existing = await userStore.findUserByEmail(normalizedEmail);

    if (purpose === 'signup' && !name?.trim()) {
      return res.status(400).json({ message: 'Please enter your name.' });
    }

    const code = createOtp(normalizedEmail, purpose, {
      name: name?.trim() || existing?.name || normalizedEmail.split('@')[0],
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

    let user = await userStore.findUserByEmail(normalizedEmail);

    if (!user) {
      user = await userStore.createUser({
        name: result.meta.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        emailVerified: true,
        password: '',
        passwordHash: null,
      });
    } else {
      user.emailVerified = true;
      await userStore.updateUser(user);
    }

    res.json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Verification failed.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email?.trim() || password === undefined || password === '') {
      return res.status(400).json({ message: 'Enter email and password.' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Email must end with @gmail.com' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await userStore.upsertUserByEmail({
      name: (name || normalizedEmail.split('@')[0]).trim(),
      email: normalizedEmail,
      password: String(password),
      passwordHash,
      emailVerified: true,
    });

    res.status(201).json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Registration failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || password === undefined || password === '') {
      return res.status(400).json({ message: 'Enter email and password.' });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Email must end with @gmail.com' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await userStore.upsertUserByEmail({
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password: String(password),
      passwordHash,
      emailVerified: true,
    });

    res.json({ user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Sign in failed.' });
  }
});

module.exports = router;
