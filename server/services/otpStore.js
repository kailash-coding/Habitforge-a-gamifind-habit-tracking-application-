const otps = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const getKey = (email, purpose) => `${email.trim().toLowerCase()}:${purpose}`;

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const createOtp = (email, purpose, meta = {}) => {
  const key = getKey(email, purpose);
  const code = generateCode();
  otps.set(key, {
    code,
    expires: Date.now() + OTP_TTL_MS,
    attempts: 0,
    ...meta,
  });
  return code;
};

const getOtp = (email, purpose) => {
  const entry = otps.get(getKey(email, purpose));
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    otps.delete(getKey(email, purpose));
    return null;
  }
  return entry;
};

const verifyOtp = (email, purpose, code) => {
  const key = getKey(email, purpose);
  const entry = otps.get(key);
  if (!entry) return { ok: false, message: 'OTP expired or not found. Request a new code.' };
  if (Date.now() > entry.expires) {
    otps.delete(key);
    return { ok: false, message: 'OTP expired. Request a new code.' };
  }
  entry.attempts += 1;
  if (entry.attempts > MAX_ATTEMPTS) {
    otps.delete(key);
    return { ok: false, message: 'Too many attempts. Request a new code.' };
  }
  if (entry.code !== String(code).trim()) {
    return { ok: false, message: 'Invalid OTP. Please try again.' };
  }
  otps.delete(key);
  return { ok: true, meta: entry };
};

const clearOtp = (email, purpose) => {
  otps.delete(getKey(email, purpose));
};

module.exports = { createOtp, getOtp, verifyOtp, clearOtp, OTP_TTL_MS };
