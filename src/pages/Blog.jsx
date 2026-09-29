// src/pages/Blog.jsx  (PUBLIC visitor page)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { fetchPublicPosts } from '../api/blogApi'
import './Blog.scss'


/* ─────────────────────────────────────────────
   CATEGORIES — must match the backend's
   blog.models.CATEGORY_CHOICES and the admin
   dashboard's CATEGORY_OPTIONS exactly.
───────────────────────────────────────────── */
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'company', label: 'Company' },
  { key: 'hrms', label: 'HRMS' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'property', label: 'Property' },
  { key: 'gym', label: 'Gym' },
]

const CATEGORY_ACCENT = {
  company: '#7c3aed',
  hrms: '#1b46f5',
  restaurant: '#f4923b',
  property: '#1fa37e',
  gym: '#e2461f',
}

// A post's cover is only what the admin uploaded — no static fallback.
export function getPostCover(post) {
  return post.coverImage || null
}

/* ─────────────────────────────────────────────
   BLOG HERO + FILTER
───────────────────────────────────────────── */
function BlogHero({ active, onChange }) {
  return (
    <section className="blog-hero">
      <div className="blog-hero__topbar">
        <span className="blog-hero__eyebrow">
          OUR BLOG <i className="blog-hero__eyebrow-line" aria-hidden="true" />
        </span>

        <div className="blog-hero__heading">
          <h1 className="blog-hero__title">Insights for a Smarter Tomorrow</h1>
          <p className="blog-hero__subtitle">
            Product updates, industry trends, and practical guides to help you get the most
            out of Trellisco.
          </p>
        </div>

        <a href="#" className="blog-hero__viewall">
          VIEW ALL ARTICLES <span aria-hidden="true">&rarr;</span>
        </a>
      </div>

      <div className="blog-hero__tabs" role="tablist">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            role="tab"
            aria-selected={cat.key === active}
            className={`blog-hero__tab${cat.key === active ? ' blog-hero__tab--active' : ''}`}
            onClick={() => onChange(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   POST CARDS
───────────────────────────────────────────── */
function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path
        d="M2.5 8h11M9 3.5L13.5 8 9 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PostCover({ post }) {
  const cover = getPostCover(post)
  if (!cover) return null
  return (
    <div className="blog-card__cover">
      <img src={cover} alt={post.coverImageAlt || post.title} loading="lazy" />
    </div>
  )
}

function FeaturedPost({ post }) {
  const accent = CATEGORY_ACCENT[post.category] || CATEGORY_ACCENT.company
  return (
    <Link to={`/blog/${post.slug}`} className="featured-post">
      {getPostCover(post) && (
        <div className="featured-post__cover">
          <img src={getPostCover(post)} alt={post.coverImageAlt || post.title} />
        </div>
      )}
      <div className="featured-post__body">
        <span className="featured-post__category" style={{ color: accent }}>
          {post.categoryLabel}
        </span>
        <h2 className="featured-post__title">{post.title}</h2>
        <p className="featured-post__excerpt">{post.excerpt}</p>
        <div className="featured-post__meta">
          <span>{post.date}</span>
          <span className="featured-post__dot" aria-hidden="true">&middot;</span>
          <span>{post.readTime}</span>
          <span className="featured-post__dot" aria-hidden="true">&middot;</span>
          <span>{post.author}</span>
        </div>
        <span className="featured-post__link">
          READ ARTICLE <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

function PostCard({ post }) {
  const accent = CATEGORY_ACCENT[post.category] || CATEGORY_ACCENT.company
  return (
    <Link to={`/blog/${post.slug}`} className="blog-card">
      <PostCover post={post} />
      <div className="blog-card__body">
        <span className="blog-card__category" style={{ color: accent }}>
          {post.categoryLabel}
        </span>
        <h3 className="blog-card__title">{post.title}</h3>
        <div className="blog-card__meta">
          <span>{post.date}</span>
          <span className="blog-card__dot" aria-hidden="true">&middot;</span>
          <span>{post.readTime}</span>
          <span className="blog-card__dot" aria-hidden="true">&middot;</span>
          <span>{post.author}</span>
        </div>
        <span className="blog-card__link">
          READ ARTICLE <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

function BlogGrid({ posts, showFeatured }) {
  const featured = showFeatured ? posts.find((p) => p.featured) : null
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : posts

  return (
    <section className="blog-grid">
      <div className="blog-grid__inner">
        {featured && <FeaturedPost post={featured} />}

        {rest.length > 0 ? (
          <div className="blog-grid__cards">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="blog-grid__empty">No posts in this category yet.</p>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   COMPARISON SECTION
───────────────────────────────────────────── */
const COMPARISON_ROWS = [
  {
    label: 'Setup time',
    tools: 'Days, per tool',
    erp: '3\u20136 months',
    trellisco: 'Under a week',
  },
  {
    label: 'Data across teams',
    tools: 'Exported and re-entered by hand',
    erp: 'Centralized, but rigid',
    trellisco: 'Synced in real time',
  },
  {
    label: 'Pricing',
    tools: 'A separate bill per tool',
    erp: 'High minimums, long contracts',
    trellisco: 'One predictable plan',
  },
  {
    label: 'Customization',
    tools: 'Limited to what each tool allows',
    erp: 'Slow, usually needs consultants',
    trellisco: 'Configurable from the app',
  },
  {
    label: 'Support',
    tools: 'A different vendor for each issue',
    erp: 'Ticket queue, long turnaround',
    trellisco: 'One team, one thread',
  },
  {
    label: 'Onboarding',
    tools: 'Repeated for every new tool',
    erp: 'A dedicated project',
    trellisco: 'Guided, self-serve',
  },
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Comparison() {
  return (
    <section className="comparison" id="comparison">
      <div className="comparison__inner">
        <span className="comparison__eyebrow">The comparison</span>
        <h2 className="comparison__title">Trellisco vs. running it in pieces</h2>
        <p className="comparison__subtitle">
          {'Point tools and legacy ERPs solve different problems. Here\u2019s where each one tends to land.'}
        </p>

        <div className="comparison__card">
          <div className="comparison__table">
            <div className="comparison__row comparison__row--head">
              <div className="comparison__cell comparison__cell--label" />
              <div className="comparison__cell">Point tools</div>
              <div className="comparison__cell">Legacy ERP</div>
              <div className="comparison__cell comparison__cell--trellisco">Trellisco</div>
            </div>

            {COMPARISON_ROWS.map((row) => (
              <div className="comparison__row" key={row.label}>
                <div className="comparison__cell comparison__cell--label">{row.label}</div>
                <div className="comparison__cell">{row.tools}</div>
                <div className="comparison__cell">{row.erp}</div>
                <div className="comparison__cell comparison__cell--trellisco">
                  <span className="comparison__check">
                    <CheckIcon />
                  </span>
                  {row.trellisco}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   CTA BANNER
───────────────────────────────────────────── */
function BlogCta() {
  return (
    <section className="blog-cta">
      <div className="blog-cta__inner">
        <h2 className="blog-cta__title">Ready to run it from one place?</h2>
        <p className="blog-cta__subtitle">
          See what Trellisco looks like for your team, no separate tools required.
        </p>
        <div className="blog-cta__actions">
          <button type="button" className="blog-cta__btn blog-cta__btn--primary">
            Try it for free
          </button>
          <button type="button" className="blog-cta__btn blog-cta__btn--ghost">
            Chat with sales
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
function Blog() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchPublicPosts()
        if (cancelled) return
        setPosts(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        if (!cancelled) setError('Could not load posts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredPosts =
    activeCategory === 'all'
      ? posts
      : posts.filter((post) => post.category === activeCategory)

  return (
    <>
      <Nav />
      <BlogHero active={activeCategory} onChange={setActiveCategory} />

      {loading ? (
        <p className="blog-grid__empty">Loading articles…</p>
      ) : error ? (
        <p className="blog-grid__empty">{error}</p>
      ) : (
        <BlogGrid posts={filteredPosts} showFeatured={activeCategory === 'all'} />
      )}

      <Comparison />
      <BlogCta />
      <Footer />
    </>
  )
}

export default Blog