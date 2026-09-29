import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import mascotImage from '../../assets/ChatGPT Image Sep 25, 2026, 01_38_19 PM.png'
import './Login.scss'

/* ───────────────────────────────
   ICONS
─────────────────────────────── */
function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 5.5l6.5 5 6.5-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
      <rect x="4" y="9" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
      <path
        d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
      <path
        d="M2.5 2.5l15 15M8.2 8.35a2.4 2.4 0 0 0 3.4 3.4M6 5.15C7.2 4.5 8.55 4 10 4c5.5 0 8.5 6 8.5 6a15.6 15.6 0 0 1-3.05 3.9M4.1 6.1A15.7 15.7 0 0 0 1.5 10s3 6 8.5 6c1.05 0 2.02-.16 2.9-.44"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="13.6" r="0.9" fill="currentColor" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="login__spinner" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="45 90"
      />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <path
        d="M2.5 8h11M9 3.5L13.5 8 9 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ───────────────────────────────
   LOGIN PAGE
─────────────────────────────── */
function Login() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.email.trim() || !form.password) {
      setError('Enter both your email and password.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await login(form.email.trim(), form.password, { remember })
      navigate('/admin/dashboard')
    } catch (err) {
      // Django/DRF sends the real reason as { detail: "..." } in the
      // response body. Axios's own err.message is just a generic
      // "Request failed with status code 401" and never shows that.
      const backendMessage = err.response?.data?.detail
      setError(backendMessage || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      {/* ---- LEFT: brand / illustration panel ---- */}
      <div className="login__brand">
        <div className="login__brand-glow" aria-hidden="true" />

        <img
          src={mascotImage}
          alt=""
          className="login__mascot"
          aria-hidden="true"
        />
      </div>

      {/* ---- RIGHT: sign-in form panel ---- */}
      <div className="login__panel">
        <div className="login__card">
          <div className="login__card-head">
            <h2>Sign In</h2>
          </div>

          {error && (
            <div className="login__error" role="alert">
              <AlertIcon />
              <span>{error}</span>
            </div>
          )}

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <label className="login__field">
              <span className="login__label">Email ID</span>
              <span className="login__input-wrap">
                <span className="login__input-icon">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange('email')}
                  disabled={submitting}
                />
              </span>
            </label>

            <label className="login__field">
              <span className="login__label">Password</span>
              <span className="login__input-wrap">
                <span className="login__input-icon">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange('password')}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="login__toggle-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </span>
            </label>

            <div className="login__row">
              <label className="login__checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              <a href="#" className="login__forgot">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="login__submit" disabled={submitting}>
              {submitting ? (
                <>
                  <SpinnerIcon />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login