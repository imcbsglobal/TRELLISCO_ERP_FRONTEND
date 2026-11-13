// src/api/terpLicense.js
// T-ERP license API: project catalogue, license creation and the two client
// registers. activate.imcbs.com sends no CORS headers and rejects the license
// POST's preflight with a 405, so every call goes through the same-origin
// '/terp-api' prefix (Vite proxy locally, nginx in production).

import { TERP_ORIGIN, TERP_PROXY_PREFIX, assertJson, viaProxy } from "./proxy"

export const TERP_PROJECTS_ENDPOINT = viaProxy(
  import.meta.env.VITE_TERP_PROJECTS_API_URL || `${TERP_ORIGIN}/t-erp/mobileapp/api/projects/`,
  TERP_ORIGIN,
  TERP_PROXY_PREFIX,
)

export const TERP_LICENSE_ENDPOINT = viaProxy(
  import.meta.env.VITE_TERP_LICENSE_CREATE_API_URL || `${TERP_ORIGIN}/t-erp/mobileapp/api/license/create/`,
  TERP_ORIGIN,
  TERP_PROXY_PREFIX,
)

// Directory of client ids that already exist (client_id → company name, place).
// Used to recognise a returning customer by the Gmail they sign in with.
export const TERP_CLIENT_IDS_ENDPOINT = viaProxy(
  import.meta.env.VITE_TERP_CLIENT_IDS_API_URL || `${TERP_ORIGIN}/client-id-list/get-client-ids/`,
  TERP_ORIGIN,
  TERP_PROXY_PREFIX,
)

// Licensed projects per client: corporate → shops (client_id) → projects. The
// directory above knows who the client is, this one knows what they already own.
export const TERP_CORPORATE_CLIENT_ENDPOINT = viaProxy(
  import.meta.env.VITE_TERP_CORPORATE_CLIENT_API_URL || `${TERP_ORIGIN}/corporate-clientid/list/`,
  TERP_ORIGIN,
  TERP_PROXY_PREFIX,
)

const CLIENT_ID_KEYS = ["client_id", "clientId", "clientID", "client"]
const LICENSE_KEY_KEYS = ["license_key", "licence_key", "licenseKey", "licenceKey", "licence", "license"]

const HTML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#x27": "'", "#39": "'", nbsp: " " }

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x27|#39|quot|amp|lt|gt|nbsp);/g, (_, code) => HTML_ENTITIES[code] || " ")
    .replace(/\s+/g, " ")
    .trim()
}

// A Django 500 page is ~100 KB of CSS, but the two rows that matter are the
// exception type and value. Anything else HTML is reduced to plain text so the
// operator never sees a stylesheet in the error box.
function readHtmlError(html) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || ""
  const type = html.match(/<th>\s*Exception Type:\s*<\/th>\s*<td>([\s\S]*?)<\/td>/i)?.[1]
  const value = html.match(/<th>\s*Exception Value:\s*<\/th>\s*<td>\s*<pre>([\s\S]*?)<\/pre>/i)?.[1]

  const label = stripHtml(type || title)
  const detail = stripHtml(value)
  if (detail) return `${label ? `${label}: ` : ""}${detail}`.slice(0, 300)
  return stripHtml(title || html).slice(0, 200)
}

function readErrorDetail(rawBody) {
  let detail
  try {
    const body = JSON.parse(rawBody)
    detail = body.detail || body.message || body.error || body.errors || body
    if (typeof detail !== "string") detail = JSON.stringify(detail)
  } catch {
    // Non-JSON bodies are either an HTML error page or plain text.
    const text = String(rawBody || "").trim()
    detail = text.startsWith("<") ? readHtmlError(text) : text
  }
  return detail?.trim() || ""
}

export async function throwApiError(response, fallback) {
  const detail = readErrorDetail(await response.text())
  const suffix = detail ? ` — ${detail}` : ""
  throw new Error(`${fallback} (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""})${suffix}`)
}

export function getNetworkError(error, endpoint) {
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return `Cannot reach ${endpoint}. The browser received no API response. Check that the URL is reachable and that the API allows this site's origin (CORS).`
  }
  return error.message || "The API request failed."
}

// The catalogue may be a bare array or wrapped (results / projects / data).
// `api_endpoint` is kept because it is what the user-master flags map from.
export function normaliseProjects(payload) {
  const items = Array.isArray(payload)
    ? payload
    : payload?.results || payload?.projects || payload?.data || []

  return items
    .map((item) => {
      if (typeof item === "string") return { name: item, api_endpoint: "", packages: [] }

      const name = item.project || item.name || item.title
      const packages = item.packages || item.package_options || item.plans || []
      return {
        name,
        api_endpoint: item.api_endpoint || item.apiEndpoint || "",
        packages: Array.isArray(packages)
          ? packages.map((value) => (typeof value === "string" ? value : value.name || value.package)).filter(Boolean)
          : [],
      }
    })
    .filter((item) => item.name)
}

export async function fetchTerpProjects() {
  const response = await fetch(TERP_PROJECTS_ENDPOINT)
  if (!response.ok) await throwApiError(response, "Unable to load T-ERP projects")
  assertJson(response, "Unable to load T-ERP projects")
  return normaliseProjects(await response.json())
}

async function fetchList(endpoint, fallback) {
  const response = await fetch(endpoint)
  if (!response.ok) await throwApiError(response, fallback)
  assertJson(response, fallback)
  const payload = await response.json().catch(() => ({}))
  return Array.isArray(payload) ? payload : payload?.data || payload?.results || []
}

// Both registers total ~100 KB and change only when a client is onboarded, so one
// fetch per page load is enough however often the email field is edited. They are
// cached separately because the ticks only need the license register: waiting for
// the (larger) client directory as well made the owned-project ticks appear late.
let clientDirectoryCache = null
let licenseRegisterCache = null

function loadClientDirectory() {
  if (!clientDirectoryCache) {
    clientDirectoryCache = fetchList(TERP_CLIENT_IDS_ENDPOINT, "Unable to load the T-ERP client list")
      .catch((error) => {
        // Drop the failed promise so the next lookup can retry.
        clientDirectoryCache = null
        throw error
      })
  }
  return clientDirectoryCache
}

function loadLicenseRegister() {
  if (!licenseRegisterCache) {
    licenseRegisterCache = fetchList(TERP_CORPORATE_CLIENT_ENDPOINT, "Unable to load the T-ERP license register")
      .catch((error) => {
        licenseRegisterCache = null
        throw error
      })
  }
  return licenseRegisterCache
}

/**
 * Starts both registers while the visitor is still on the first step, so they are
 * already in memory by the time Google sign-in returns. Failures are ignored
 * here: the lookup that really needs the data retries and reports them.
 */
export function prefetchTerpRegisters() {
  Promise.allSettled([loadClientDirectory(), loadLicenseRegister()])
}

// Projects a client already owns, taken from the license register alone.
function ownedProjectsOf(corporates, wanted) {
  const projects = new Set()
  let corporateName = ""
  for (const corporate of corporates) {
    for (const shop of corporate?.shops || []) {
      if (String(shop?.client_id || "").trim().toLowerCase() !== wanted) continue
      // The corporate that owns this shop is the name the license API expects,
      // which is not always the shop name shown in the client directory.
      if (!corporateName) corporateName = corporate?.corporate_name || ""
      for (const project of shop?.projects || []) if (project) projects.add(project)
    }
  }
  return { projects: [...projects], corporateName }
}

/**
 * The workspace behind an email address, or null when it has never been
 * provisioned. Some client ids are the company email itself, which is why the
 * address used to sign in can be enough to recognise a returning customer.
 *
 * `onProjects` fires as soon as the license register resolves — it is the only
 * input for "already owned" — so the cards can be ticked without waiting for the
 * client directory that only adds the company name and place.
 */
export async function findClientWorkspace(email, onProjects) {
  const wanted = String(email || "").trim().toLowerCase()
  if (!wanted) return null

  const register = loadLicenseRegister()
  register
    .then((corporates) => {
      const owned = ownedProjectsOf(corporates, wanted)
      if (owned.projects.length) onProjects?.(owned.projects, owned.corporateName)
    })
    .catch(() => {
      // Reported by the full lookup below.
    })

  const [clients, corporates] = await Promise.all([loadClientDirectory(), register])

  const client = clients.find((item) => String(item?.client_id || "").trim().toLowerCase() === wanted)
  const { projects, corporateName } = ownedProjectsOf(corporates, wanted)

  if (!client && !projects.length) return null
  return {
    clientId: client?.client_id || email,
    companyName: client?.company_name || "",
    corporateName,
    place: client?.place || "",
    projects,
  }
}

// Creates the license and returns the raw JSON body so the caller can pick the
// client id / license key out of it.
export async function createTerpLicense({ company, corporate, projects }) {
  const response = await fetch(TERP_LICENSE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      corporate: { name: corporate.name.trim(), place: corporate.place?.trim() || company.place.trim() },
      company: {
        name: company.name.trim(),
        place: company.place.trim(),
        email: company.email.trim(),
        contact_no: company.contact_no.replace(/\D/g, ""),
        country: (company.country || "").trim(),
        is_active: true,
      },
      projects,
    }),
  })

  if (!response.ok) await throwApiError(response, "License creation failed")
  assertJson(response, "License creation failed")

  // Some deployments answer 201 with an empty body — never let that throw.
  const rawBody = await response.text()
  if (!rawBody.trim()) return {}
  try {
    return JSON.parse(rawBody)
  } catch {
    return { raw: rawBody }
  }
}

function deepFindValue(payload, keys, depth = 0) {
  if (!payload || typeof payload !== "object" || depth > 4) return ""
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  for (const value of Object.values(payload)) {
    if (value && typeof value === "object") {
      const found = deepFindValue(value, keys, depth + 1)
      if (found) return found
    }
  }
  return ""
}

export function extractClientId(payload) {
  return deepFindValue(payload, CLIENT_ID_KEYS)
}

export function extractLicenseKey(payload) {
  return deepFindValue(payload, LICENSE_KEY_KEYS)
}
