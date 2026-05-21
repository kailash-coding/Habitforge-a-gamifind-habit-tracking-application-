import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sign() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, sendOtp, verifyOtp, signIn } = useAuth()

  const [otpStep, setOtpStep] = useState('email')
  const [otpForm, setOtpForm] = useState({ name: '', email: '', otp: '' })
  const [passwordForm, setPasswordForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [submittingOtp, setSubmittingOtp] = useState(false)
  const [submittingPassword, setSubmittingPassword] = useState(false)
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

  const handleOtpChange = (event) => {
    const { name, value } = event.target
    const next = name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value
    setOtpForm((prev) => ({ ...prev, [name]: next }))
    setOtpError('')
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSendOtp = async (event) => {
    event.preventDefault()
    setSubmittingOtp(true)
    setOtpError('')
    setDevOtp('')

    try {
      const data = await sendOtp({
        email: otpForm.email,
        purpose: 'signin',
        name: otpForm.name,
      })
      setOtpStep('otp')
      setResendIn(60)
      if (data.devOtp) setDevOtp(data.devOtp)
    } catch (err) {
      setOtpError(err.message || 'Could not send code.')
    } finally {
      setSubmittingOtp(false)
    }
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()
    setSubmittingOtp(true)
    setOtpError('')

    try {
      await verifyOtp({
        email: otpForm.email,
        otp: otpForm.otp,
        purpose: 'signin',
        name: otpForm.name,
      })
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setOtpError(err.message || 'Verification failed.')
    } finally {
      setSubmittingOtp(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setSubmittingPassword(true)
    setError('')

    try {
      await signIn({
        email: passwordForm.email,
        password: passwordForm.password,
      })
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmittingPassword(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0) return
    setSubmittingOtp(true)
    setOtpError('')
    try {
      const data = await sendOtp({
        email: otpForm.email,
        purpose: 'signin',
        name: otpForm.name,
      })
      setResendIn(60)
      setOtpForm((prev) => ({ ...prev, otp: '' }))
      if (data.devOtp) setDevOtp(data.devOtp)
    } catch (err) {
      setOtpError(err.message || 'Could not resend code.')
    } finally {
      setSubmittingOtp(false)
    }
  }

  return (
    <div className="sign-page">
      <div className="sign-hero">
        <div className="sign-brand">🔥</div>
        <h1>HabitForge</h1>
        <p>Use any @gmail.com email — saved to database on sign in</p>
      </div>

      <div className="sign-card sign-card-stacked">
        <section className="sign-section">
          <h2 className="sign-section-title">Email OTP</h2>
          <p className="sign-section-desc">Get a 6-digit code (top section)</p>

          {otpStep === 'email' ? (
            <form className="sign-form" onSubmit={handleSendOtp}>
              {otpError && <p className="form-error">{otpError}</p>}

              <label className="form-field">
                <span>Name (optional)</span>
                <input
                  name="name"
                  value={otpForm.name}
                  onChange={handleOtpChange}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>

              <label className="form-field">
                <span>Gmail address</span>
                <input
                  name="email"
                  type="email"
                  value={otpForm.email}
                  onChange={handleOtpChange}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  required
                />
              </label>

              <button type="submit" className="primary-btn" disabled={submittingOtp}>
                {submittingOtp ? 'Sending…' : 'Send OTP to Email'}
              </button>
            </form>
          ) : (
            <form className="sign-form" onSubmit={handleVerifyOtp}>
              {otpError && <p className="form-error">{otpError}</p>}

              <p className="otp-sent-msg">
                Code sent to <strong>{otpForm.email}</strong>
              </p>

              {devOtp && (
                <p className="otp-dev-hint">
                  Dev code: <strong>{devOtp}</strong>
                </p>
              )}

              <label className="form-field">
                <span>Verification code</span>
                <input
                  name="otp"
                  className="otp-input"
                  value={otpForm.otp}
                  onChange={handleOtpChange}
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
                disabled={submittingOtp || otpForm.otp.length !== 6}
              >
                {submittingOtp ? 'Verifying…' : 'Verify & Sign In'}
              </button>

              <div className="otp-actions">
                <button
                  type="button"
                  className="text-btn"
                  disabled={resendIn > 0 || submittingOtp}
                  onClick={handleResend}
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    setOtpStep('email')
                    setOtpForm((prev) => ({ ...prev, otp: '' }))
                    setDevOtp('')
                    setOtpError('')
                  }}
                >
                  Change email
                </button>
              </div>
            </form>
          )}
        </section>

        <div className="sign-divider">
          <span>or</span>
        </div>

        <section className="sign-section">
          <h2 className="sign-section-title">Password</h2>
          <p className="sign-section-desc">
            Any @gmail.com + any password — creates account if new
          </p>

          <form className="sign-form" onSubmit={handlePasswordSubmit}>
            {error && <p className="form-error">{error}</p>}

            <label className="form-field">
              <span>Gmail address</span>
              <input
                name="email"
                type="email"
                value={passwordForm.email}
                onChange={handlePasswordChange}
                placeholder="you@gmail.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="form-field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={passwordForm.password}
                onChange={handlePasswordChange}
                placeholder="Any password"
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit" className="primary-btn secondary-btn" disabled={submittingPassword}>
              {submittingPassword ? 'Signing in…' : 'Sign In with Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
