// src/api/terpLicense.js
// T-ERP license API: project catalogue + license creation.
// In development both calls go through the Vite proxy so the browser never
// trips over CORS; in a build the absolute URLs from .env are used.

export const TERP_PROJECTS_ENDPOINT = import.meta.env.DEV
  ? "/terp-api/t-erp/mobileapp/api/projects/"
  : import.meta.env.VITE_TERP_PROJECTS_API_URL

export const TERP_LICENSE_ENDPOINT = import.meta.env.DEV
  ? "/terp-api/t-erp/mobileapp/api/license/create/"
  : import.meta.env.VITE_TERP_LICENSE_CREATE_API_URL

// Directory of client ids that already exist (client_id → company name, place).
// Used to recognise a returning customer by the Gmail they sign in with.
export const TERP_CLIENT_IDS_ENDPOINT = import.meta.env.DEV
  ? "/terp-api/client-id-list/get-client-ids/"
  : import.meta.env.VITE_TERP_CLIENT_IDS_API_URL

// Licensed projects per client: corporate → shops (client_id) → projects. The
// directory above knows who the client is, this one knows what they already own.
export const TERP_CORPORATE_CLIENT_ENDPOINT = import.meta.env.DEV
  ? "/terp-api/corporate-clientid/list/"
  : import.meta.env.VITE_TERP_CORPORATE_CLIENT_API_URL

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
  return normaliseProjects(await response.json())
}

async function fetchList(endpoint, fallback) {
  const response = await fetch(endpoint)
  if (!response.ok) await throwApiError(response, fallback)
  const payload = await response.json().catch(() => ({}))
  return Array.isArray(payload) ? payload : payload?.data || payload?.results || []
}

// Both registers total ~100 KB and change only when a client is onboarded, so one
// fetch per page load is enough however often the email field is edited.
let registerCache = null

function loadRegisters() {
  if (!registerCache) {
    registerCache = Promise.all([
      fetchList(TERP_CLIENT_IDS_ENDPOINT, "Unable to load the T-ERP client list"),
      fetchList(TERP_CORPORATE_CLIENT_ENDPOINT, "Unable to load the T-ERP license register"),
    ]).catch((error) => {
      registerCache = null
      throw error
    })
  }
  return registerCache
}

/**
 * The workspace behind an email address, or null when it has never been
 * provisioned. Some client ids are the company email itself, which is why the
 * address used to sign in can be enough to recognise a returning customer.
 */
export async function findClientWorkspace(email) {
  const wanted = String(email || "").trim().toLowerCase()
  if (!wanted) return null

  const [clients, corporates] = await loadRegisters()

  const client = clients.find((item) => String(item?.client_id || "").trim().toLowerCase() === wanted)
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

  if (!client && !projects.size) return null
  return {
    clientId: client?.client_id || email,
    companyName: client?.company_name || "",
    corporateName,
    place: client?.place || "",
    projects: [...projects],
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
