// src/api/blogApi.js
import { api, publicApi } from './client'

/**
 * Admin reads.
 * When called with a valid admin token attached (see client.js), the
 * backend returns every post (draft, scheduled, published). Use these in
 * admin pages only.
 */
export async function fetchPosts(params = {}) {
  const { data } = await api.get('/blog/posts/', { params })
  return data
}

export async function fetchPost(slug) {
  const { data } = await api.get(`/blog/posts/${slug}/`)
  return data
}

/**
 * Public reads — used by the visitor-facing Blog and BlogPost pages.
 * These never send the admin token, so drafts, scheduled posts and
 * expired posts stay hidden even if an admin is logged in in this browser.
 */
export async function fetchPublicPosts(params = {}) {
  const { data } = await publicApi.get('/blog/posts/', { params })
  return data
}

export async function fetchPublicPost(slug) {
  const { data } = await publicApi.get(`/blog/posts/${slug}/`)
  return data
}

export async function createPost(formData) {
  const { data } = await api.post('/blog/posts/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function updatePost(slug, formData) {
  const { data } = await api.patch(`/blog/posts/${slug}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deletePost(slug) {
  await api.delete(`/blog/posts/${slug}/`)
}

export async function togglePublish(slug) {
  const { data } = await api.post(`/blog/posts/${slug}/publish/`)
  return data
}

/**
 * Uploads one image/video for a content block.
 * Returns { url, type } from the backend; throws an Error with a readable
 * message on failure.
 */
export async function uploadContentFile(file) {
  const form = new FormData()
  form.append('file', file)
  try {
    const { data } = await api.post('/blog/upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  } catch (err) {
    throw new Error(err.response?.data?.detail || 'Upload failed')
  }
}

/**
 * Converts a <input type="datetime-local"> value ("2026-10-05T14:30",
 * browser-local time) into a UTC ISO string the backend can store.
 * Returns '' for empty input, which the backend treats as "no schedule".
 */
export function toIsoOrEmpty(localValue) {
  if (!localValue) return ''
  const d = new Date(localValue)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

/**
 * Builds a multipart FormData payload from the admin editor's form state.
 * Multipart is required because cover_image is a real file upload —
 * a plain JSON body can't carry a file.
 *
 * `body` (the section list) is JSON-stringified before appending, since
 * multipart fields are always sent as strings; DRF's JSONField parses
 * the string back into a list/dict on the way in.
 *
 * NOTE: FormData keys must match the SERIALIZER's field names, not the
 * Django model's field names. Everything below is camelCase to match
 * PostSerializer (coverImage, categoryLabelOverride, readTime, etc.) —
 * `cover_image` was previously used here by mistake, which meant DRF
 * never received the file at all (it silently dropped an unrecognized
 * key), so cover images never got saved or uploaded to R2.
 *
 * FIXED: `category_label`, `read_time` and `is_published` were the same
 * mistake under different names — those are model/snake_case names, not
 * the serializer's field names (`categoryLabelOverride`, `readTime`),
 * so DRF was silently dropping all three. `is_published` isn't even a
 * writable serializer field at all — publish state is driven by `status`,
 * which was never being sent, so every post created/edited through this
 * function stayed stuck on the default `status: 'draft'`.
 *
 * SCHEDULING: `fields.publishAt` / `fields.deleteAt` are datetime-local
 * strings (or empty). Empty is still sent, so clearing a date in the
 * editor really clears it on the server → the post becomes permanent.
 * With status 'published' and a future publishAt, the backend stores
 * the post as 'scheduled' and it goes live at that time.
 */
export function buildPostFormData(fields, coverImageFile) {
  const formData = new FormData()
  formData.append('title', fields.title)
  formData.append('excerpt', fields.excerpt)
  formData.append('author', fields.author)
  formData.append('category', fields.category)
  formData.append('categoryLabelOverride', fields.categoryLabel)
  formData.append('readTime', fields.readTime)
  formData.append('status', fields.status || 'published')
  formData.append('body', JSON.stringify(fields.body))
  formData.append('publishAt', toIsoOrEmpty(fields.publishAt))
  formData.append('deleteAt', toIsoOrEmpty(fields.deleteAt))

  if (coverImageFile) {
    formData.append('coverImage', coverImageFile)
  }

  return formData
}