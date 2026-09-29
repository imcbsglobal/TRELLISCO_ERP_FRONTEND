// BlogPost.jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { fetchPublicPost, fetchPublicPosts } from '../api/blogApi'
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
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.44-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"
      />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.6 10.4 21 2h-2.1l-6.4 7.3L7.1 2H1l7.8 11.3L1 22h2.1l6.8-7.8 5.7 7.8H22l-8.4-11.6Zm-2.4 2.7-.8-1.1L3.9 3.4h2.4l5.1 7.3.8 1.1 6.6 9.4h-2.4l-5.2-7.4Z"
      />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M10.5 13.5a3 3 0 0 0 4.24.24l.24-.24 3-3a3 3 0 0 0-4.14-4.34l-.1.1-1.5 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 10.5a3 3 0 0 0-4.24-.24l-.24.24-3 3a3 3 0 0 0 4.14 4.34l.1-.1 1.5-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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
        <span className="blog-post__share-label">
          {copied ? 'Link copied' : 'Share'}
        </span>

        <a
          className="blog-post__share-btn blog-post__share-btn--linkedin"
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
          className="blog-post__share-btn blog-post__share-btn--x"
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
          className={`blog-post__share-btn blog-post__share-btn--copy${copied ? ' is-copied' : ''}`}
          onClick={handleCopy}
          aria-label="Copy link"
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
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
   APP GRID (platform breakdown visual) — legacy sections
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
   WORKFLOW STEPS (lifecycle visual) — legacy sections
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
   SECTION VIDEO — always an uploaded file now, so just <video>
─────────────────────────────── */
function SectionVideo({ src, caption }) {
  if (!src) return null

  return (
    <figure className="blog-post__video">
      <video controls src={src} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

/* ───────────────────────────────
   BLOCK RENDERER — new block-based body
   (heading, paragraph, image, video, quote,
   bullet_list, numbered_list, code, cta, divider)
─────────────────────────────── */
function Block({ block }) {
  switch (block.type) {
    case 'heading':
      return <h2 id={block.id}>{block.text}</h2>
    case 'paragraph':
      return <p>{block.text}</p>
    case 'image':
      return <SectionImage src={block.image} alt={block.alt} caption={block.caption} />
    case 'video':
      return <SectionVideo src={block.video} caption={block.caption} />
    case 'quote':
      return (
        <div className="blog-post__quote">
          <span className="blog-post__quote-mark" aria-hidden="true">&ldquo;</span>
          <p>{block.text}</p>
          <span className="blog-post__quote-dash" aria-hidden="true" />
        </div>
      )
    case 'bullet_list':
      return (
        <ul className="blog-post__list">
          {(block.items || []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    case 'numbered_list':
      return (
        <ol className="blog-post__list">
          {(block.items || []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      )
    case 'code':
      return (
        <pre className="blog-post__code">
          <code>{block.code}</code>
        </pre>
      )
    case 'cta':
      return (
        <Link to={block.url || '#'} className="blog-post__cta">
          {block.label}
        </Link>
      )
    case 'divider':
      return <hr className="blog-post__hr" />
    default:
      return null
  }
}

/* ───────────────────────────────
   BODY (heading / paragraphs / quote / visuals)
   Supports both the new flat block list (items with a `type`) and the
   older section list (heading/paragraphs/apps/workflow/image/quote),
   so existing posts keep rendering as-is.
─────────────────────────────── */
function PostBody({ post }) {
  const body = post.body || []
  const isBlockSchema = body.some((item) => item.type)

  return (
    <div className="blog-post__body">
      <p className="blog-post__lead">{post.excerpt}</p>

      {isBlockSchema
        ? body.map((block) => <Block key={block.id} block={block} />)
        : body.map((section) => (
            <div key={section.id} id={section.id} className="blog-post__section">
              <h2>{section.heading}</h2>
              {(section.paragraphs || []).map((para, i) => (
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
              {section.video && (
                <SectionVideo src={section.video} caption={section.videoCaption} />
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
function RelatedPosts({ current, allPosts }) {
  const related = useMemo(() => {
    const sameCategory = allPosts.filter(
      (p) => p.id !== current.id && p.category === current.category
    )
    const others = allPosts.filter(
      (p) => p.id !== current.id && p.category !== current.category
    )
    return [...sameCategory, ...others].slice(0, 3)
  }, [current, allPosts])

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
              {post.coverImage && (
                <div className="related-card__image">
                  <img src={post.coverImage} alt={post.title} loading="lazy" />
                </div>
              )}
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

  const [post, setPost] = useState(null)
  const [allPosts, setAllPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)
      try {
        const [postData, listData] = await Promise.all([
          fetchPublicPost(slug),
          fetchPublicPosts(),
        ])
        if (cancelled) return
        setPost(postData)
        setAllPosts(Array.isArray(listData) ? listData : listData.results || [])
      } catch (err) {
        if (cancelled) return
        if (err.response?.status === 404) {
          setNotFound(true)
        } else {
          setNotFound(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    window.scrollTo({ top: 0 })

    return () => {
      cancelled = true
    }
  }, [slug])

  // TOC entries: heading blocks (new schema) or section headings (legacy schema).
  const sections = useMemo(() => {
    if (!post || !post.body) return []
    const isBlockSchema = post.body.some((item) => item.type)
    if (isBlockSchema) {
      return post.body
        .filter((b) => b.type === 'heading')
        .map((b) => ({ id: b.id, heading: b.text }))
    }
    return post.body.map((s) => ({ id: s.id, heading: s.heading }))
  }, [post])

  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    setActiveId(sections[0]?.id)
  }, [sections])

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

  if (loading) {
    return (
      <>
        <Nav />
        <div className="blog-post__hero">
          <div className="blog-post__hero-inner">
            <p className="blog-post__lead">Loading article…</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (notFound || !post) return <PostNotFound />

  const coverSrc = post.coverImage || ''

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

      {coverSrc && (
        <div className="blog-post__cover">
          <img src={coverSrc} alt={post.coverImageAlt || post.title} />
        </div>
      )}

      <div className={`blog-post__layout${sections.length ? ' blog-post__layout--with-toc' : ''}`}>
        {sections.length > 0 && <TableOfContents sections={sections} activeId={activeId} />}

        {post.body && post.body.length ? (
          <PostBody post={post} />
        ) : (
          <div className="blog-post__body">
            <p className="blog-post__lead">{post.excerpt}</p>
          </div>
        )}
      </div>

      <RelatedPosts current={post} allPosts={allPosts} />

      <Footer />
    </div>
  )
}

export default BlogPost