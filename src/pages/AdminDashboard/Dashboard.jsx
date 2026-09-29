// src/pages/AdminDashboard/Dashboard.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { fetchPosts } from '../../api/blogApi'
import { listAnnouncements } from '../../api/announcements'
import './Dashboard.scss'

// Same fallback used on the Blog admin page — some older records predate
// the `status` field, so is_published is the source of truth for those.
function postStatus(post) {
  return post.status || (post.is_published ? 'published' : 'draft')
}

/* ───────────────────────────────
   ICONS
─────────────────────────────── */
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

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12.3l2.6 2.6L16.2 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M16.5 3.5l4 4-11 11-4.6.6.6-4.6 11-11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M2.5 8h11M9 3.5L13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const STATUS_LABEL = {
  published: 'Published',
  draft: 'Draft',
  scheduled: 'Scheduled',
  archived: 'Archived',
}

export default function Dashboard() {
  const [posts, setPosts] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [postData, announcementData] = await Promise.all([
          fetchPosts(),
          listAnnouncements(),
        ])
        if (cancelled) return
        setPosts(Array.isArray(postData) ? postData : postData.results || [])
        setAnnouncements(announcementData)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || err.message || 'Could not load dashboard data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const published = posts.filter((p) => postStatus(p) === 'published').length
    const drafts = posts.filter((p) => postStatus(p) === 'draft').length
    const liveAnnouncement = announcements.some((a) => a.isActive)

    return [
      { label: 'Total posts', value: posts.length, icon: DocumentIcon, to: '/admin/dashboard' },
      { label: 'Published', value: published, icon: CheckCircleIcon, to: '/admin/dashboard' },
      { label: 'Drafts', value: drafts, icon: PencilIcon, to: '/admin/dashboard' },
      {
        label: 'Announcements',
        value: announcements.length,
        icon: MegaphoneIcon,
        to: '/admin/announcements',
        hint: liveAnnouncement ? '1 live now' : 'None live',
      },
    ]
  }, [posts, announcements])

  const recentPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
  }, [posts])

  return (
    <div className="admin-dash">
      <div className="admin-dash__shell">
        <Sidebar />

        <main className="admin-dash__main">
          <div className="admin-dash__hero">
            <div className="admin-dash__hero-heading">
              <h2>Dashboard</h2>
              <p>An overview of your blog posts and announcements.</p>
            </div>
            <div className="admin-dash__hero-actions">
              <Link to="/admin/dashboard" className="admin-dash__ghost">
                <DocumentIcon /> Manage posts
              </Link>
              <Link to="/admin/announcements" className="admin-dash__primary">
                <PlusIcon /> New announcement
              </Link>
            </div>
          </div>

          {error && <div className="admin-dash__error">{error}</div>}

          <div className="admin-dash__stats">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Link key={stat.label} to={stat.to} className="admin-dash__stat-card">
                  <span className="admin-dash__stat-icon">
                    <Icon />
                  </span>
                  <span className="admin-dash__stat-value">{loading ? '—' : stat.value}</span>
                  <span className="admin-dash__stat-label">{stat.label}</span>
                  {stat.hint && <span className="admin-dash__stat-hint">{stat.hint}</span>}
                </Link>
              )
            })}
          </div>

          <section className="admin-dash__panel">
            <div className="admin-dash__panel-head">
              <h3>Recent posts</h3>
              <Link to="/admin/dashboard" className="admin-dash__link">
                View all <ArrowRightIcon />
              </Link>
            </div>

            {loading ? (
              <p className="admin-dash__hint">Loading…</p>
            ) : recentPosts.length === 0 ? (
              <p className="admin-dash__empty">No posts yet. Create your first one from the blog manager.</p>
            ) : (
              <ul className="admin-dash__list">
                {recentPosts.map((post) => (
                  <li key={post.slug} className="admin-dash__list-row">
                    <div className="admin-dash__list-main">
                      <span className="admin-dash__list-title">{post.title}</span>
                      <span className="admin-dash__list-meta">
                        {post.categoryLabel || post.category} · {post.author}
                      </span>
                    </div>
                    <span className={`admin-dash__pill admin-dash__pill--${postStatus(post)}`}>
                      {STATUS_LABEL[postStatus(post)] || postStatus(post)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}