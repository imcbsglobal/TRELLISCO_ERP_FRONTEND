// src/components/Sidebar.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'
import logo from '../assets/Trellisco logo 2.png'
import './sidebar.scss'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: 'grid' },
  { to: '/admin/dashboard', label: 'Blog posts', icon: 'document' },
  { to: '/admin/announcements', label: 'Announcements', icon: 'megaphone' },
]

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 4h8l4 4v12a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M14 4v4h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M4 10v4a1 1 0 001 1h2l7 4V5L7 9H5a1 1 0 00-1 1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M18 9.5a4 4 0 010 5M7 15l1.2 4.2a1 1 0 001 .8h1.3a.8.8 0 00.8-1L10.5 16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const ICONS = { grid: GridIcon, document: DocumentIcon, megaphone: MegaphoneIcon }

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
      <path
        d="M6.5 3H3.3A1.3 1.3 0 002 4.3v8.4A1.3 1.3 0 003.3 14h8.4a1.3 1.3 0 001.3-1.3V9.5M9.5 2H14v4.5M13.6 2.4L7.3 8.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
      <path
        d="M6.2 2.5H3.3a1 1 0 00-1 1v9a1 1 0 001 1h2.9M11 11.2l3-3.2-3-3.2M14 8H6.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  )
}

function LogoutConfirmModal({ loggingOut, onCancel, onConfirm }) {
  return createPortal(
    <div
      className="logout-modal-overlay"
      role="presentation"
      onClick={() => !loggingOut && onCancel()}
    >
      <div
        className="logout-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="logout-modal__icon">
          <AlertIcon />
        </span>
        <h2 id="logout-confirm-title">Log out?</h2>
        <p>You&rsquo;ll need to sign in again to access the admin dashboard.</p>

        <div className="logout-modal__actions">
          <button
            type="button"
            className="logout-modal__btn logout-modal__btn--ghost"
            onClick={onCancel}
            disabled={loggingOut}
          >
            Cancel
          </button>
          <button
            type="button"
            className="logout-modal__btn logout-modal__btn--danger"
            onClick={onConfirm}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// `title` is no longer needed (the active item now comes from the URL) but is
// still accepted so existing <Sidebar title="..." /> calls don't break.
export default function Sidebar({ eyebrow = 'Admin' }) {
  const navigate = useNavigate()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } finally {
      setLoggingOut(false)
      setConfirmingLogout(false)
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand" aria-label="Trellisco Corp branding">
        <span className="sidebar__brand-logo-wrap">
          <img className="sidebar__brand-logo" src={logo} alt="Trellisco" />
        </span>
      </div>

      <nav className="sidebar__nav">
        <span className="sidebar__nav-label">{eyebrow}</span>

        {NAV_ITEMS.map(({ to, label, icon }) => {
          const Icon = ICONS[icon]
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
              }
            >
              <span className="sidebar__nav-icon">
                <Icon />
              </span>
              <span>{label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <Link to="/" className="sidebar__link">
          <ExternalLinkIcon />
          <span>Back to site</span>
        </Link>

        <button
          type="button"
          className="sidebar__link sidebar__link--danger"
          onClick={() => setConfirmingLogout(true)}
        >
          <LogoutIcon />
          <span>Log out</span>
        </button>
      </div>

      {confirmingLogout && (
        <LogoutConfirmModal
          loggingOut={loggingOut}
          onCancel={() => setConfirmingLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </aside>
  )
}