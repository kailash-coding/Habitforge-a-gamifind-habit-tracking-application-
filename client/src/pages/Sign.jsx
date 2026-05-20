import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sign() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, sendOtp, verifyOtp, signUp, signIn } = useAuth()

  const [mode, setMode] = useState('signin')
  const [authMethod, setAuthMethod] = useState('password')
  const [step, setStep] = useState('email')
  const [form, setForm] = useState({ name: '', email: '', password: '', otp: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [devOtp, setDevOtp] = useState('')
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (isLoggedIn) {
      navigate(location.state?.from || '/', { replace: true })
    }
  }, [isLoggedIn, navigate, location.state])

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendIn])

  const resetFlow = (nextMode) => {
    setMode(nextMode)
    setStep('email')
    setForm({ name: '', email: '', password: '', otp: '' })
    setError('')
    setDevOtp('')
    setResendIn(0)
  }

  const switchMethod = (method) => {
    setAuthMethod(method)
    setStep('email')
    setForm({ name: '', email: '', password: '', otp: '' })
    setError('')
    setDevOtp('')
    setResendIn(0)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    const next = name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value
    setForm((prev) => ({ ...prev, [name]: next }))
    setError('')
  }

  const handleSendOtp = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setDevOtp('')

    try {
      const data = await sendOtp({
        email: form.email,
        purpose: mode === 'signup' ? 'signup' : 'signin',
        name: form.name,
      })
      setStep('otp')
      setResendIn(60)
      if (data.devOtp) setDevOtp(data.devOtp)
    } catch (err) {
      setError(err.message || 'Could not send code.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await verifyOtp({
        email: form.email,
        otp: form.otp,
        purpose: mode === 'signup' ? 'signup' : 'signin',
        name: form.name,
      })
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message || 'Verification failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (mode === 'signup') {
        await signUp(form)
      } else {
        await signIn({ email: form.email, password: form.password })
      }
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0) return
    setSubmitting(true)
    setError('')
    try {
      const data = await sendOtp({
        email: form.email,
        purpose: mode === 'signup' ? 'signup' : 'signin',
        name: form.name,
      })
      setResendIn(60)
      setForm((prev) => ({ ...prev, otp: '' }))
      if (data.devOtp) setDevOtp(data.devOtp)
    } catch (err) {
      setError(err.message || 'Could not resend code.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sign-page">
      <div className="sign-hero">
        <div className="sign-brand">🔥</div>
        <h1>HabitForge</h1>
        <p>
          {authMethod === 'otp'
            ? 'Sign in with a code sent to your email'
            : 'Sign in with your email and password'}
        </p>
      </div>

      <div className="sign-card">
        <div className="sign-tabs">
          <button
            type="button"
            className={mode === 'signin' ? 'active' : ''}
            onClick={() => resetFlow('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => resetFlow('signup')}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-method-tabs">
          <button
            type="button"
            className={authMethod === 'otp' ? 'active' : ''}
            onClick={() => switchMethod('otp')}
          >
            Email OTP
          </button>
          <button
            type="button"
            className={authMethod === 'password' ? 'active' : ''}
            onClick={() => switchMethod('password')}
          >
            Password
          </button>
        </div>

        {authMethod === 'password' ? (
          <form className="sign-form" onSubmit={handlePasswordSubmit}>
            {error && <p className="form-error">{error}</p>}

            {mode === 'signup' && (
              <label className="form-field">
                <span>Full name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label className="form-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="form-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            </label>

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>
        ) : step === 'email' ? (
          <form className="sign-form" onSubmit={handleSendOtp}>
            {error && <p className="form-error">{error}</p>}

            {mode === 'signup' && (
              <label className="form-field">
                <span>Full name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label className="form-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send OTP to Email'}
            </button>
          </form>
        ) : (
          <form className="sign-form" onSubmit={handleVerifyOtp}>
            {error && <p className="form-error">{error}</p>}

            <p className="otp-sent-msg">
              We sent a 6-digit code to <strong>{form.email}</strong>
            </p>

            {devOtp && (
              <p className="otp-dev-hint">
                Dev code: <strong>{devOtp}</strong> (SMTP not configured)
              </p>
            )}

            <label className="form-field">
              <span>Verification code</span>
              <input
                name="otp"
                className="otp-input"
                value={form.otp}
                onChange={handleChange}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </label>

            <button
              type="submit"
              className="primary-btn"
              disabled={submitting || form.otp.length !== 6}
            >
              {submitting ? 'Verifying…' : 'Verify & Continue'}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="text-btn"
                disabled={resendIn > 0 || submitting}
                onClick={handleResend}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
              <button
                type="button"
                className="text-btn"
                onClick={() => {
                  setStep('email')
                  setForm((prev) => ({ ...prev, otp: '' }))
                  setDevOtp('')
                  setError('')
                }}
              >
                Change email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
