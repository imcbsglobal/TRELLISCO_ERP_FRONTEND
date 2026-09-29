// src/pages/AdminDashboard/Blog.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
  togglePublish,
  toIsoOrEmpty,
  uploadContentFile,
} from '../../api/blogApi'
import Sidebar from '../../components/Sidebar'
import './Blog.scss'

const CATEGORY_OPTIONS = [
  { value: 'company', label: 'Company' },
  { value: 'hrms', label: 'HRMS' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'property', label: 'Property' },
  { value: 'gym', label: 'Gym' },
]

const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
]

const FILTER_TABS = [
  { value: 'all', label: 'All posts' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
]

const CATEGORY_FILTER_OPTIONS = [{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

const PAGE_SIZE = 10

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading' },
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'image', label: 'Image' },
  { type: 'video', label: 'Video' },
  { type: 'quote', label: 'Quote' },
  { type: 'bullet_list', label: 'Bullet List' },
  { type: 'numbered_list', label: 'Numbered List' },
  { type: 'cta', label: 'Button / CTA' },
  { type: 'divider', label: 'Divider' },
]

const uid = () => Math.random().toString(36).slice(2, 10)

// Resolves a post's status bucket for filtering/badges, falling back to
// the boolean is_published flag for older records that predate `status`.
function postStatus(post) {
  return post.status || (post.is_published ? 'published' : 'draft')
}

// ── Scheduling helpers ──────────────────────────
// Converts an ISO string from the API (UTC) into the local
// "YYYY-MM-DDTHH:mm" format a <input type="datetime-local"> expects.
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// "05 Oct 2026, 2:30 PM" in the admin's local time
function formatWhen(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// "Goes live … · Expires …" — empty string means a permanent post.
function scheduleNote(post) {
  const parts = []
  if (postStatus(post) === 'scheduled' && post.publishAt) {
    parts.push(`Goes live ${formatWhen(post.publishAt)}`)
  }
  if (post.deleteAt) {
    parts.push(
      postStatus(post) === 'expired'
        ? `Expired ${formatWhen(post.deleteAt)}`
        : `Expires ${formatWhen(post.deleteAt)}`,
    )
  }
  return parts.join(' · ')
}

// Turns a DRF error response ({ deleteAt: ['...'] } / { detail: '...' })
// into one readable line.
function formatApiError(err) {
  const data = err.response?.data
  if (!data) return err.message || 'Something went wrong while saving. Please try again.'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  return Object.entries(data)
    .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(' ') : msg}`)
    .join(' · ')
}

// Whether a block has any real content in it yet — drives the filled/empty
// indicator on the block header so a stack of same-type blocks doesn't
// read as identical placeholders.
function isBlockFilled(block) {
  switch (block.type) {
    case 'heading':
    case 'quote':
    case 'paragraph':
      return Boolean(block.text && block.text.trim())
    case 'image':
      return Boolean(block.image)
    case 'video':
      return Boolean(block.video)
    case 'bullet_list':
    case 'numbered_list':
      return (block.items || []).some((item) => item.trim())
    case 'cta':
      return Boolean(block.label && block.label.trim())
    case 'divider':
      return true
    default:
      return false
  }
}

// Short, single-line summary of a block's current content, shown next to
// its type badge so it's obvious at a glance what's filled in and what
// still needs attention.
function blockPreviewText(block) {
  switch (block.type) {
    case 'heading':
    case 'quote':
    case 'paragraph':
      return block.text?.trim() || 'Empty — nothing typed yet'
    case 'image':
      return block.image ? block.alt?.trim() || 'Image added' : 'No image uploaded yet'
    case 'video':
      return block.video ? block.caption?.trim() || 'Video added' : 'No video uploaded yet'
    case 'bullet_list':
    case 'numbered_list': {
      const filled = (block.items || []).filter((item) => item.trim())
      return filled.length ? filled.join(', ') : 'No items yet'
    }
    case 'cta':
      return block.label?.trim() || 'No button text yet'
    case 'divider':
      return 'Divider'
    default:
      return ''
  }
}

function emptyBlock(type) {
  switch (type) {
    case 'heading':
      return { id: uid(), type, text: '' }
    case 'paragraph':
      return { id: uid(), type, text: '' }
    case 'image':
      return { id: uid(), type, image: '', alt: '', caption: '', uploading: false }
    case 'video':
      return { id: uid(), type, video: '', caption: '', uploading: false }
    case 'quote':
      return { id: uid(), type, text: '' }
    case 'bullet_list':
    case 'numbered_list':
      return { id: uid(), type, items: [''] }
    case 'cta':
      return { id: uid(), type, label: '', url: '' }
    case 'divider':
      return { id: uid(), type }
    default:
      return { id: uid(), type: 'paragraph', text: '' }
  }
}

// Migrates an older heading/paragraphs/image/video/quote section into
// the new block list, so editing an existing post doesn't lose content.
function sectionToBlocks(section) {
  const blocks = []
  if (section.heading) blocks.push({ id: uid(), type: 'heading', text: section.heading })
  ;(section.paragraphs || []).forEach((p) =>
    blocks.push({ id: uid(), type: 'paragraph', text: p })
  )
  if (section.image) {
    blocks.push({
      id: uid(),
      type: 'image',
      image: section.image,
      alt: section.imageAlt || '',
      caption: section.imageCaption || '',
    })
  }
  if (section.video) {
    blocks.push({
      id: uid(),
      type: 'video',
      video: section.video,
      caption: section.videoCaption || '',
    })
  }
  if (section.quote) blocks.push({ id: uid(), type: 'quote', text: section.quote })
  return blocks
}

function emptyForm() {
  return {
    title: '',
    excerpt: '',
    author: '',
    category: 'company',
    categoryLabelOverride: '',
    tags: [],
    readTime: '',
    coverImageAlt: '',
    coverImageCaption: '',
    body: [emptyBlock('paragraph')],
    seoTitle: '',
    metaDescription: '',
    seoKeywords: [],
    status: 'published',
    featured: false,
    allowComments: true,
    publishAt: '',
    deleteAt: '',
  }
}

/* ───────────────────────────────
   ICONS
─────────────────────────────── */
function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M4.5 4.5l.6 8.4a1 1 0 001 .9h3.8a1 1 0 001-.9l.6-8.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M11 2.5l2.5 2.5-8 8-3 .5.5-3 8-8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="3.2" r="1.3" fill="currentColor" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <circle cx="8" cy="12.8" r="1.3" fill="currentColor" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M13.3 13.3l-2.9-2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path
        d="M2 4.2A1.2 1.2 0 013.2 3h3l1.3 1.5h5.3A1.2 1.2 0 0114 5.7v6.1A1.2 1.2 0 0112.8 13H3.2A1.2 1.2 0 012 11.8V4.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
      <rect x="2.3" y="3.2" width="11.4" height="10.5" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.3 6.4h11.4M5.3 2v2.6M10.7 2v2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
      <path
        d="M5.5 3.5h6l3 3v10a1 1 0 01-1 1h-8a1 1 0 01-1-1v-12a1 1 0 011-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.2 9.5h5.6M7.2 12.3h5.6M7.2 15h3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M10 3l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ───────────────────────────────
   POST LIST
─────────────────────────────── */
function PostList({
  posts,
  onEdit,
  onDelete,
  onTogglePublish,
  busySlug,
}) {
  if (!posts.length) {
    return (
      <div className="admin-blog__empty">
        <p>No posts match this view.</p>
      </div>
    )
  }

  return (
    <div className="admin-blog__table">
      <div className="admin-blog__table-head">
        <span>Cover</span>
        <span>Title</span>
        <span>Category</span>
        <span>Status</span>
        <span className="admin-blog__sort">Updated at ↓</span>
        <span>Actions</span>
      </div>

      {posts.map((post) => {
        const status = postStatus(post)
        const note = scheduleNote(post)
        return (
          <div className="admin-blog__row" key={post.id}>
            {/*
              Cover cell: the outer <span className="admin-blog__cover"> is the
              actual grid cell — it must stay full width so its border-right
              divider lines up with every other column's divider. The fixed
              40x28 thumbnail box lives inside as __cover-thumb so its size
              doesn't collapse the cell itself.
            */}
            <span className="admin-blog__cover">
              <span className="admin-blog__cover-thumb">
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} />
                ) : (
                  <span className="admin-blog__cover-placeholder" />
                )}
              </span>
            </span>

            <span className="admin-blog__title-cell">
              <strong>{post.title}</strong>
              <small>
                {post.readTime ? `${post.readTime} · ` : ''}Created by {post.author}
                {note ? ` · ${note}` : ''}
              </small>
            </span>

            <span>
              <span className="admin-blog__category">
                <FolderIcon />
                {post.categoryLabel || post.category}
              </span>
            </span>

            <span>
              <button
                type="button"
                className={`admin-blog__status${status === 'published' ? ' is-published' : ''}${status === 'scheduled' ? ' is-scheduled' : ''}${status === 'expired' ? ' is-expired' : ''}`}
                onClick={() => onTogglePublish(post)}
                disabled={busySlug === post.slug}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            </span>

            <span className="admin-blog__updated">
              <CalendarIcon />
              <span className="admin-blog__updated-text">
                <strong>{new Date(post.updated_at).toLocaleDateString()}</strong>
                <span>
                  {new Date(post.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            </span>

            <span className="admin-blog__row-actions">
              <button type="button" onClick={() => onEdit(post)} aria-label="Edit post">
                <EditIcon />
              </button>
              <button
                type="button"
                className="admin-blog__danger"
                onClick={() => onDelete(post)}
                disabled={busySlug === post.slug}
                aria-label="Delete post"
              >
                <TrashIcon />
              </button>
              <button type="button" className="admin-blog__more" aria-label="More actions">
                <MoreIcon />
              </button>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────────────────────────
   CHIP INPUT (tags / SEO keywords)
─────────────────────────────── */
function ChipInput({ values, onChange, placeholder, disabled }) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }

  return (
    <div className="admin-blog__chips">
      {values.map((v) => (
        <span className="admin-blog__chip" key={v}>
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} disabled={disabled}>
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !draft && values.length) {
            onChange(values.slice(0, -1))
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}

/* ───────────────────────────────
   FILE UPLOAD FIELD (direct upload, no URL input)
─────────────────────────────── */
function FileDropField({ label, hint, previewUrl, accept, onFile, uploading, disabled }) {
  const inputRef = useRef(null)
  return (
    <div className="admin-blog__file-drop">
      {label && <span className="admin-blog__field-label">{label}</span>}
      <div
        className="admin-blog__file-drop-zone"
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (disabled) return
          const file = e.dataTransfer.files?.[0]
          if (file) onFile(file)
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="admin-blog__file-drop-preview" />
        ) : (
          <>
            <span>{uploading ? 'Uploading…' : 'Drag & drop or click to upload'}</span>
            {hint && <small>{hint}</small>}
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/* ───────────────────────────────
   CONTENT BLOCK EDITOR
─────────────────────────────── */
function BlockEditor({ blocks, onChange, disabled }) {
  // Which "add content block" type button is currently highlighted — set
  // to whichever type was added last, so it's clear which one is selected
  // instead of every button looking identical.
  const [activeAddType, setActiveAddType] = useState(null)

  const update = (id, patch) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)))

  const remove = (id) => onChange(blocks.filter((b) => b.id !== id))

  const move = (id, dir) => {
    const i = blocks.findIndex((b) => b.id === id)
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    const next = [...blocks]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  const add = (type) => {
    onChange([...blocks, emptyBlock(type)])
    setActiveAddType(type)
  }

  const uploadBlockFile = async (id, file, field) => {
    update(id, { uploading: true })
    try {
      const data = await uploadContentFile(file)
      update(id, { [field]: data.url, uploading: false })
    } catch (err) {
      update(id, { uploading: false })
      alert(`Upload failed: ${err.message}`)
    }
  }

  return (
    <div className="admin-blog__blocks">
      {blocks.map((block, idx) => {
        const filled = isBlockFilled(block)
        return (
        <div className={`admin-blog__block${filled ? ' is-filled' : ' is-empty'}`} key={block.id}>
          <div className="admin-blog__block-toolbar">
            <div className="admin-blog__block-heading">
              <span className="admin-blog__block-type">
                {BLOCK_TYPES.find((t) => t.type === block.type)?.label}
              </span>
              <span className={`admin-blog__block-status-dot${filled ? ' is-filled' : ''}`} aria-hidden="true" />
              <span className="admin-blog__block-preview" title={blockPreviewText(block)}>
                {blockPreviewText(block)}
              </span>
            </div>
            <div className="admin-blog__block-actions">
              <button type="button" disabled={disabled || idx === 0} onClick={() => move(block.id, -1)}>
                ↑
              </button>
              <button
                type="button"
                disabled={disabled || idx === blocks.length - 1}
                onClick={() => move(block.id, 1)}
              >
                ↓
              </button>
              <button type="button" className="admin-blog__danger" disabled={disabled} onClick={() => remove(block.id)}>
                <TrashIcon /> Remove
              </button>
            </div>
          </div>

          {(block.type === 'heading' || block.type === 'quote') && (
            <input
              type="text"
              value={block.text}
              disabled={disabled}
              placeholder={block.type === 'heading' ? 'Heading text' : 'Quote text'}
              onChange={(e) => update(block.id, { text: e.target.value })}
            />
          )}

          {block.type === 'paragraph' && (
            <textarea
              rows={4}
              value={block.text}
              disabled={disabled}
              placeholder="Paragraph text"
              onChange={(e) => update(block.id, { text: e.target.value })}
            />
          )}

          {block.type === 'image' && (
            <div className="admin-blog__block-image">
              <FileDropField
                hint="Recommended: 1600 × 900px"
                accept="image/*"
                previewUrl={block.image}
                uploading={block.uploading}
                disabled={disabled}
                onFile={(file) => uploadBlockFile(block.id, file, 'image')}
              />
              <input
                type="text"
                value={block.alt}
                disabled={disabled}
                placeholder="Alt text"
                onChange={(e) => update(block.id, { alt: e.target.value })}
              />
              <input
                type="text"
                value={block.caption}
                disabled={disabled}
                placeholder="Caption (optional)"
                onChange={(e) => update(block.id, { caption: e.target.value })}
              />
            </div>
          )}

          {block.type === 'video' && (
            <div className="admin-blog__block-video">
              {block.video ? (
                <video src={block.video} controls className="admin-blog__block-video-preview" />
              ) : (
                <FileDropField
                  hint="MP4 recommended, 50MB max"
                  accept="video/*"
                  uploading={block.uploading}
                  disabled={disabled}
                  onFile={(file) => uploadBlockFile(block.id, file, 'video')}
                />
              )}
              <input
                type="text"
                value={block.caption}
                disabled={disabled}
                placeholder="Caption (optional)"
                onChange={(e) => update(block.id, { caption: e.target.value })}
              />
            </div>
          )}

          {(block.type === 'bullet_list' || block.type === 'numbered_list') && (
            <div className="admin-blog__block-list">
              {block.items.map((item, i) => (
                <div className="admin-blog__block-list-row" key={i}>
                  <input
                    type="text"
                    value={item}
                    disabled={disabled}
                    placeholder={`Item ${i + 1}`}
                    onChange={(e) => {
                      const items = [...block.items]
                      items[i] = e.target.value
                      update(block.id, { items })
                    }}
                  />
                  <button
                    type="button"
                    className="admin-blog__danger"
                    disabled={disabled}
                    onClick={() => update(block.id, { items: block.items.filter((_, x) => x !== i) })}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" disabled={disabled} onClick={() => update(block.id, { items: [...block.items, ''] })}>
                <PlusIcon /> Add item
              </button>
            </div>
          )}

          {block.type === 'cta' && (
            <div className="admin-blog__block-cta">
              <input
                type="text"
                value={block.label}
                disabled={disabled}
                placeholder="Button label"
                onChange={(e) => update(block.id, { label: e.target.value })}
              />
              <input
                type="text"
                value={block.url}
                disabled={disabled}
                placeholder="Link (internal path, e.g. /pricing)"
                onChange={(e) => update(block.id, { url: e.target.value })}
              />
            </div>
          )}

          {block.type === 'divider' && <hr className="admin-blog__block-divider" />}
        </div>
        )
      })}

      <div className="admin-blog__block-add">
        <span>+ Add content block</span>
        <div className="admin-blog__block-add-options">
          {BLOCK_TYPES.map((t) => (
            <button
              type="button"
              key={t.type}
              className={activeAddType === t.type ? 'is-active' : ''}
              disabled={disabled}
              onClick={() => add(t.type)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────────────
   POST EDITOR (create / edit)
─────────────────────────────── */
function PostEditor({ initialPost, onCancel, onSaved }) {
  const [form, setForm] = useState(emptyForm())
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [socialImageFile, setSocialImageFile] = useState(null)
  const [socialPreview, setSocialPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!initialPost) {
      setForm(emptyForm())
      setCoverPreview(null)
      setSocialPreview(null)
      return
    }

    const isBlockSchema = (initialPost.body || []).some((item) => item.type)
    const body = isBlockSchema
      ? initialPost.body
      : (initialPost.body || []).flatMap(sectionToBlocks)

    setForm({
      title: initialPost.title || '',
      excerpt: initialPost.excerpt || '',
      author: initialPost.author || '',
      category: initialPost.category || 'company',
      categoryLabelOverride: initialPost.categoryLabelOverride || '',
      tags: initialPost.tags || [],
      readTime: initialPost.readTime || '',
      coverImageAlt: initialPost.coverImageAlt || '',
      coverImageCaption: initialPost.coverImageCaption || '',
      body: body.length ? body : [emptyBlock('paragraph')],
      seoTitle: initialPost.seoTitle || '',
      metaDescription: initialPost.metaDescription || '',
      seoKeywords: initialPost.seoKeywords || [],
      status: initialPost.status === 'scheduled' ? 'scheduled' : 'published',
      featured: Boolean(initialPost.featured),
      allowComments: initialPost.allowComments !== false,
      // API sends UTC ISO strings; the datetime-local input needs local time.
      publishAt: toLocalInput(initialPost.publishAt),
      deleteAt: toLocalInput(initialPost.deleteAt),
    })
    setCoverPreview(initialPost.coverImage || null)
    setSocialPreview(initialPost.socialShareImage || null)
  }, [initialPost])

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    set({ [field]: value })
  }

  const handleCoverChange = (file) => {
    setCoverImageFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleSocialChange = (file) => {
    setSocialImageFile(file)
    setSocialPreview(URL.createObjectURL(file))
  }

  // True when the chosen publish time is still in the future — the main
  // button then reads "Schedule" instead of "Publish".
  const willSchedule = Boolean(form.publishAt) && new Date(form.publishAt).getTime() > Date.now()

  const saveWithStatus = async (status) => {
    if (!form.title.trim() || !form.excerpt.trim() || !form.author.trim()) {
      setError('Title, excerpt, and author are required.')
      return
    }

    // Schedule checks (the backend re-validates these too).
    const publishTime = form.publishAt ? new Date(form.publishAt).getTime() : null
    const deleteTime = form.deleteAt ? new Date(form.deleteAt).getTime() : null
    if (deleteTime && deleteTime <= Date.now()) {
      setError('Expiry time must be in the future.')
      return
    }
    if (publishTime && deleteTime && deleteTime <= publishTime) {
      setError('Expiry time must be after the publish time.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('excerpt', form.excerpt)
      formData.append('author', form.author)
      formData.append('category', form.category)
      formData.append('categoryLabelOverride', form.categoryLabelOverride)
      formData.append('tags', JSON.stringify(form.tags))
      formData.append('readTime', form.readTime)
      formData.append('coverImageAlt', form.coverImageAlt)
      formData.append('coverImageCaption', form.coverImageCaption)
      formData.append('body', JSON.stringify(form.body))
      formData.append('seoTitle', form.seoTitle)
      formData.append('metaDescription', form.metaDescription)
      formData.append('seoKeywords', JSON.stringify(form.seoKeywords))
      formData.append('status', status || form.status)
      formData.append('featured', form.featured)
      formData.append('allowComments', form.allowComments)
      // Always sent (even when empty) so clearing a date really clears it
      // on the server — an empty value means "no schedule / permanent".
      formData.append('publishAt', toIsoOrEmpty(form.publishAt))
      formData.append('deleteAt', toIsoOrEmpty(form.deleteAt))
      if (coverImageFile) formData.append('coverImage', coverImageFile)
      if (socialImageFile) formData.append('socialShareImage', socialImageFile)

      if (initialPost) {
        await updatePost(initialPost.slug, formData)
      } else {
        await createPost(formData)
      }

      onSaved()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    saveWithStatus()
  }

  return (
    <form className="admin-blog__editor" onSubmit={handleSubmit}>
      <div className="admin-blog__editor-head">
        <h2>{initialPost ? 'Edit post' : 'New post'}</h2>
        <div className="admin-blog__editor-head-actions">
          <button type="button" className="admin-blog__ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="admin-blog__primary" disabled={saving} onClick={() => saveWithStatus('published')}>
            {willSchedule ? 'Schedule' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <div className="admin-blog__error">{error}</div>}

      {/* ── Post Details ── */}
      <section className="admin-blog__panel admin-blog__panel--details">
        <h3>Post details</h3>

        <label className="admin-blog__field">
          <span>Title</span>
          <input type="text" value={form.title} onChange={setField('title')} disabled={saving} />
        </label>

        <label className="admin-blog__field">
          <span>Excerpt</span>
          <textarea rows={2} value={form.excerpt} onChange={setField('excerpt')} disabled={saving} />
        </label>

        <div className="admin-blog__field-grid">
          <label className="admin-blog__field">
            <span>Author</span>
            <input type="text" value={form.author} onChange={setField('author')} disabled={saving} />
          </label>

          <label className="admin-blog__field">
            <span>Read time</span>
            <input
              type="text"
              value={form.readTime}
              onChange={setField('readTime')}
              placeholder="e.g. 5 min read"
              disabled={saving}
            />
          </label>
        </div>

        <div className="admin-blog__field-grid">
          <label className="admin-blog__field">
            <span>Category</span>
            <select value={form.category} onChange={setField('category')} disabled={saving}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-blog__field">
            <span>Badge label (optional override)</span>
            <input
              type="text"
              value={form.categoryLabelOverride}
              onChange={setField('categoryLabelOverride')}
              placeholder="Defaults to the category name"
              disabled={saving}
            />
          </label>
        </div>

        <label className="admin-blog__field">
          <span>Tags</span>
          <ChipInput
            values={form.tags}
            onChange={(tags) => set({ tags })}
            placeholder="Add a tag, press Enter"
            disabled={saving}
          />
        </label>
      </section>

      {/* ── Cover Image ── */}
      <section className="admin-blog__panel admin-blog__panel--cover">
        <h3>Cover image</h3>
        <FileDropField
          hint="Recommended: 1600 × 900px"
          accept="image/*"
          previewUrl={coverPreview}
          disabled={saving}
          onFile={handleCoverChange}
        />
        <label className="admin-blog__field">
          <span>Alt text</span>
          <input type="text" value={form.coverImageAlt} onChange={setField('coverImageAlt')} disabled={saving} />
        </label>
        <label className="admin-blog__field">
          <span>Caption (optional)</span>
          <input type="text" value={form.coverImageCaption} onChange={setField('coverImageCaption')} disabled={saving} />
        </label>
      </section>

      {/* ── Content ── */}
      <section className="admin-blog__panel admin-blog__panel--content">
        <h3>Content</h3>
        <BlockEditor blocks={form.body} onChange={(body) => set({ body })} disabled={saving} />
      </section>

      {/* ── SEO & Social ── */}
      <section className="admin-blog__panel admin-blog__panel--seo">
        <h3>SEO & social</h3>
        <label className="admin-blog__field">
          <span>SEO title</span>
          <input
            type="text"
            value={form.seoTitle}
            placeholder={form.title}
            onChange={setField('seoTitle')}
            disabled={saving}
          />
        </label>
        <label className="admin-blog__field">
          <span>Meta description</span>
          <textarea
            rows={2}
            value={form.metaDescription}
            placeholder={form.excerpt}
            onChange={setField('metaDescription')}
            disabled={saving}
          />
        </label>
        <label className="admin-blog__field">
          <span>SEO keywords</span>
          <ChipInput
            values={form.seoKeywords}
            onChange={(seoKeywords) => set({ seoKeywords })}
            placeholder="Add a keyword, press Enter"
            disabled={saving}
          />
        </label>
        <FileDropField
          label="Social share image"
          hint="Recommended: 1200 × 630px"
          accept="image/*"
          previewUrl={socialPreview}
          disabled={saving}
          onFile={handleSocialChange}
        />
      </section>

      {/* ── Publishing ── */}
      <section className="admin-blog__panel admin-blog__panel--publishing">
        <h3>Publishing</h3>
        <div className="admin-blog__field-grid">
          <label className="admin-blog__field">
            <span>Status</span>
            <select value={form.status} onChange={setField('status')} disabled={saving}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-blog__field">
            <span>Publish date & time (optional)</span>
            <input type="datetime-local" value={form.publishAt} onChange={setField('publishAt')} disabled={saving} />
          </label>
        </div>

        <div className="admin-blog__field-grid">
          <label className="admin-blog__field">
            <span>Expiry date & time (optional)</span>
            <input type="datetime-local" value={form.deleteAt} onChange={setField('deleteAt')} disabled={saving} />
          </label>

          <div className="admin-blog__field">
            <span>Schedule</span>
            <small>
              {form.publishAt || form.deleteAt
                ? [
                    form.publishAt ? `Goes live ${formatWhen(toIsoOrEmpty(form.publishAt))}` : '',
                    form.deleteAt ? `Expires ${formatWhen(toIsoOrEmpty(form.deleteAt))}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : 'No schedule set — this post stays live permanently.'}
            </small>
            {(form.publishAt || form.deleteAt) && (
              <button
                type="button"
                className="admin-blog__ghost"
                disabled={saving}
                onClick={() => set({ publishAt: '', deleteAt: '' })}
              >
                Clear schedule
              </button>
            )}
          </div>
        </div>

        <div className="admin-blog__field-grid">
          <fieldset className="admin-blog__fieldset">
            <legend>Featured post</legend>
            <label className="admin-blog__radio">
              <input type="radio" checked={form.featured} onChange={() => set({ featured: true })} disabled={saving} />
              Yes
            </label>
            <label className="admin-blog__radio">
              <input type="radio" checked={!form.featured} onChange={() => set({ featured: false })} disabled={saving} />
              No
            </label>
          </fieldset>

          <fieldset className="admin-blog__fieldset">
            <legend>Allow comments</legend>
            <label className="admin-blog__radio">
              <input
                type="radio"
                checked={form.allowComments}
                onChange={() => set({ allowComments: true })}
                disabled={saving}
              />
              Yes
            </label>
            <label className="admin-blog__radio">
              <input
                type="radio"
                checked={!form.allowComments}
                onChange={() => set({ allowComments: false })}
                disabled={saving}
              />
              No
            </label>
          </fieldset>
        </div>
      </section>

      <div className="admin-blog__editor-actions">
        <button type="button" className="admin-blog__ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="admin-blog__primary" disabled={saving} onClick={() => saveWithStatus('published')}>
          {saving ? 'Saving…' : willSchedule ? 'Schedule' : 'Publish'}
        </button>
      </div>
    </form>
  )
}

/* ───────────────────────────────
   PAGE
─────────────────────────────── */
export default function AdminBlogDashboard() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [view, setView] = useState('list') // 'list' | 'editor'
  const [editingPost, setEditingPost] = useState(null)
  const [busySlug, setBusySlug] = useState(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [page, setPage] = useState(1)

  const loadPosts = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await fetchPosts()
      setPosts(Array.isArray(data) ? data : data.results || [])
    } catch (err) {
      setLoadError(err.response?.data?.detail || 'Could not load posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  // Counts per tab, computed from the full unfiltered post list.
  const tabCounts = useMemo(() => {
    const counts = { all: posts.length, published: 0, scheduled: 0 }
    posts.forEach((post) => {
      const status = postStatus(post)
      if (status in counts) counts[status] += 1
    })
    return counts
  }, [posts])

  // Search + active tab + category, applied together for the visible list.
  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesFilter = activeFilter === 'all' || postStatus(post) === activeFilter
      if (!matchesFilter) return false
      const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter
      if (!matchesCategory) return false
      if (!query) return true
      const haystack = `${post.title || ''} ${post.author || ''} ${post.categoryLabel || post.category || ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [posts, search, activeFilter, categoryFilter])

  // Sort (client-side only — doesn't touch the underlying posts array).
  const sortedPosts = useMemo(() => {
    const copy = [...filteredPosts]
    copy.sort((a, b) => {
      const diff = new Date(b.updated_at) - new Date(a.updated_at)
      return sortOrder === 'newest' ? diff : -diff
    })
    return copy
  }, [filteredPosts, sortOrder])

  // Reset to page 1 whenever the effective result set changes.
  useEffect(() => {
    setPage(1)
  }, [search, activeFilter, categoryFilter, sortOrder])

  const totalPages = Math.max(1, Math.ceil(sortedPosts.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedPosts = useMemo(
    () => sortedPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sortedPosts, currentPage]
  )

  const handleNew = () => {
    setEditingPost(null)
    setView('editor')
  }

  const handleEdit = (post) => {
    setEditingPost(post)
    setView('editor')
  }

  const handleSaved = () => {
    setView('list')
    setEditingPost(null)
    loadPosts()
  }

  const handleDelete = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    setBusySlug(post.slug)
    try {
      await deletePost(post.slug)
      setPosts((prev) => prev.filter((p) => p.slug !== post.slug))
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not delete this post.')
    } finally {
      setBusySlug(null)
    }
  }

  const handleTogglePublish = async (post) => {
    setBusySlug(post.slug)
    try {
      const updated = await togglePublish(post.slug)
      setPosts((prev) => prev.map((p) => (p.slug === post.slug ? updated : p)))
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not update publish status.')
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <div className="admin-blog">
      <div className="admin-blog__shell">
        <Sidebar />

        <main className="admin-blog__main">
        {view === 'list' ? (
          <>
            <div className="admin-blog__hero">
              <div className="admin-blog__hero-top">
                <div className="admin-blog__hero-title">
                  <div className="admin-blog__hero-heading">
                    <h2>Blog posts</h2>
                    <p>Manage, edit and publish your blog posts</p>
                  </div>
                </div>

                <div className="admin-blog__hero-actions">
                  <button type="button" className="admin-blog__primary" onClick={handleNew}>
                    <PlusIcon /> New post
                  </button>
                </div>
              </div>

              <div className="admin-blog__tabs">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    className={`admin-blog__tab${activeFilter === tab.value ? ' is-active' : ''}`}
                    onClick={() => setActiveFilter(tab.value)}
                  >
                    {tab.label}
                    <span>{tabCounts[tab.value] ?? 0}</span>
                  </button>
                ))}
              </div>

              <div className="admin-blog__toolbar-row">
                <div className="admin-blog__search">
                  <SearchIcon />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search posts by title..."
                  />
                </div>

                <label className="admin-blog__select">
                  <FolderIcon />
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    {CATEGORY_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon />
                </label>

                <label className="admin-blog__select">
                  <CalendarIcon />
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon />
                </label>
              </div>
            </div>

            {loading && <p className="admin-blog__hint">Loading posts…</p>}
            {loadError && <div className="admin-blog__error">{loadError}</div>}

            {!loading && !loadError && (
              <>
                <PostList
                  posts={pagedPosts}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                  busySlug={busySlug}
                />

                {sortedPosts.length > 0 && (
                  <div className="admin-blog__pagination">
                    <span className="admin-blog__pagination-summary">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1} to{' '}
                      {Math.min(currentPage * PAGE_SIZE, sortedPosts.length)} of {sortedPosts.length} posts
                    </span>
                    <div className="admin-blog__pagination-controls">
                      <button
                        type="button"
                        className="admin-blog__page-btn"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                      >
                        <ChevronLeftIcon />
                      </button>
                      <span className="admin-blog__page-current">{currentPage}</span>
                      <button
                        type="button"
                        className="admin-blog__page-btn"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                      >
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <PostEditor
            initialPost={editingPost}
            onCancel={() => {
              setView('list')
              setEditingPost(null)
            }}
            onSaved={handleSaved}
          />
        )}
        </main>
      </div>
    </div>
  )
}