// BlogPost.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { POSTS, CATEGORY_COVER_MAP } from './Blog'
import './BlogPost.scss'

/* ───────────────────────────────
   ICONS
─────────────────────────────── */
function BackIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path
        d="M13.5 8h-11M6.5 3.5L2 8l4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.64h.05c.53-.98 1.83-2.02 3.77-2.02 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.44-2.16 2.96V21H9z"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.3 3H21l-6.6 7.55L22.2 21h-6.1l-4.8-6.3L5.8 21H3l7.1-8.1L2.2 3h6.25l4.35 5.75L18.3 3zm-1.07 16.2h1.69L7.85 4.7H6.05l11.18 14.5z"
      />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M6.5 9.5a2.5 2.5 0 0 0 3.6.1l2-2a2.5 2.5 0 1 0-3.6-3.5l-1 1M9.5 6.5a2.5 2.5 0 0 0-3.6-.1l-2 2a2.5 2.5 0 1 0 3.6 3.5l1-1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
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

/* ───────────────────────────────
   BYLINE + SHARE ROW
─────────────────────────────── */
function Byline({ post }) {
  const initial = post.author?.charAt(0) || 'A'
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard not available — ignore
    }
  }

  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="blog-post__byline">
      <div className="blog-post__author">
        <span className="blog-post__avatar blog-post__avatar--fallback">
          {initial}
        </span>

        <span className="blog-post__meta">
          <span className="blog-post__author-name">
            {post.author}
          </span>

          <span className="blog-post__dot" aria-hidden="true">
            &middot;
          </span>

          <span>{post.date}</span>

          <span className="blog-post__dot" aria-hidden="true">
            &middot;
          </span>

          <span>{post.readTime}</span>
        </span>
      </div>

      <div className="blog-post__share">
        <span>{copied ? 'Link copied' : 'Share'}</span>

        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            shareUrl
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
        >
          <LinkedinIcon />
        </a>

        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
            shareUrl
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
        >
          <XIcon />
        </a>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy link"
        >
          <LinkIcon />
        </button>
      </div>
    </div>
  )
}


/* ───────────────────────────────
   TABLE OF CONTENTS (scrollspy)
─────────────────────────────── */
function TableOfContents({ sections, activeId }) {
  if (!sections.length) return null

  return (
    <aside className="blog-post__toc">
      <span className="blog-post__toc-label">On this page</span>
      <nav>
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={s.id === activeId ? 'is-active' : ''}>
            {s.heading}
          </a>
        ))}
      </nav>
    </aside>
  )
}

/* ───────────────────────────────
   APP GRID (platform breakdown visual)
─────────────────────────────── */
function AppGrid({ apps }) {
  if (!apps || !apps.length) return null

  return (
    <div className="blog-post__app-grid">
      {apps.map((app) => (
        <div
          key={app.name}
          className={`app-card${app.highlight ? ' app-card--highlight' : ''}`}
        >
          <span className="app-card__tag">{app.tag}</span>
          <h4>{app.name}</h4>
          <p>{app.desc}</p>
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────────────
   WORKFLOW STEPS (lifecycle visual)
─────────────────────────────── */
function WorkflowSteps({ steps }) {
  if (!steps || !steps.length) return null

  return (
    <div className="blog-post__workflow">
      {steps.map((step, i) => (
        <div key={step} className="workflow-step">
          <span className="workflow-step__icon">
            <CheckIcon />
          </span>
          <span className="workflow-step__label">{step}</span>
          {i < steps.length - 1 && (
            <span className="workflow-step__connector" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────────────
   SECTION IMAGE (inline figure)
─────────────────────────────── */
function SectionImage({ src, alt, caption }) {
  if (!src) return null

  return (
    <figure className="blog-post__image">
      <img src={src} alt={alt || ''} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

/* ───────────────────────────────
   BODY (heading / paragraphs / quote / visuals)
─────────────────────────────── */
function PostBody({ post }) {
  return (
    <div className="blog-post__body">
      <p className="blog-post__lead">{post.excerpt}</p>

      {post.body.map((section) => (
        <div key={section.id} id={section.id} className="blog-post__section">
          <h2>{section.heading}</h2>
          {section.paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          {section.apps && <AppGrid apps={section.apps} />}
          {section.workflow && <WorkflowSteps steps={section.workflow} />}
          {section.image && (
            <SectionImage
              src={section.image}
              alt={section.imageAlt}
              caption={section.imageCaption}
            />
          )}
          {section.quote && (
            <div className="blog-post__quote">
              <span className="blog-post__quote-mark" aria-hidden="true">&ldquo;</span>
              <p>{section.quote}</p>
              <span className="blog-post__quote-dash" aria-hidden="true" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ───────────────────────────────
   RELATED POSTS
─────────────────────────────── */
function RelatedPosts({ current }) {
  const related = useMemo(() => {
    const sameCategory = POSTS.filter(
      (p) => p.id !== current.id && p.category === current.category
    )
    const others = POSTS.filter(
      (p) => p.id !== current.id && p.category !== current.category
    )
    return [...sameCategory, ...others].slice(0, 3)
  }, [current])

  if (!related.length) return null

  return (
    <section className="blog-post__related">
      <div className="blog-post__related-inner">
        <div className="blog-post__related-header">
          <h2>Related articles</h2>
          <Link to="/blog">View all articles &rarr;</Link>
        </div>

        <div className="blog-post__related-grid">
          {related.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="related-card">
              <div className="related-card__image">
                <img
                  src={CATEGORY_COVER_MAP[post.category] || CATEGORY_COVER_MAP.company}
                  alt={post.title}
                  loading="lazy"
                />
              </div>
              <span className="related-card__category">{post.categoryLabel}</span>
              <h3>{post.title}</h3>
              <div className="related-card__meta">
                <span>{post.date}</span>
                <span aria-hidden="true">&middot;</span>
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────────
   NOT FOUND
─────────────────────────────── */
function PostNotFound() {
  return (
    <>
      <Nav />
      <div className="blog-post__hero">
        <div className="blog-post__hero-inner">
          <Link to="/blog" className="blog-post__back">
            <BackIcon /> Back to all articles
          </Link>
          <h1 className="blog-post__title">Post not found</h1>
          <p className="blog-post__lead">
            The article you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}

/* ───────────────────────────────
   PAGE
─────────────────────────────── */
function BlogPost() {
  const { slug } = useParams()
  const post = POSTS.find((p) => p.slug === slug)

  const sections = useMemo(() => {
    if (!post || !post.body) return []
    return post.body.map((s) => ({ id: s.id, heading: s.heading }))
  }, [post])

  const [activeId, setActiveId] = useState(sections[0]?.id)

  useEffect(() => {
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [slug])

  if (!post) return <PostNotFound />

  const coverSrc = CATEGORY_COVER_MAP[post.category] || CATEGORY_COVER_MAP.company

  return (
    <div className="blog-post">
      <Nav />

      <div className="blog-post__hero">
        <div className="blog-post__hero-inner">
          <Link to="/blog" className="blog-post__back">
            <BackIcon /> Back to all articles
          </Link>
          <span className="blog-post__category">{post.categoryLabel}</span>
          <h1 className="blog-post__title">{post.title}</h1>
          <Byline post={post} />
        </div>
      </div>

      <div className="blog-post__cover">
        <img src={coverSrc} alt={post.title} />
      </div>

      <div className={`blog-post__layout${sections.length ? ' blog-post__layout--with-toc' : ''}`}>
        {sections.length > 0 && <TableOfContents sections={sections} activeId={activeId} />}

        {post.body ? (
          <PostBody post={post} />
        ) : (
          <div className="blog-post__body">
            <p className="blog-post__lead">{post.excerpt}</p>
          </div>
        )}
      </div>

      <RelatedPosts current={post} />

      <Footer />
    </div>
  )
}

export default BlogPost