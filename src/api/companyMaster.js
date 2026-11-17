// src/api/companyMaster.js
// Central Master's company register. The licence API only knows the trading name,
// place and contact details, so the statutory fields (GSTIN, PAN, full address,
// logo) are written here once the licence — and with it the client id and the
// licence key — exists. Central Master sends no CORS headers, so every call goes
// through the same-origin '/central-api' prefix (Vite proxy locally, nginx in
// production).

import { CENTRAL_ORIGIN, CENTRAL_PROXY_PREFIX, assertJson, viaProxy } from "./proxy"

const COMPANY_ENDPOINT = viaProxy(
  import.meta.env.VITE_COMPANY_MASTER_API_URL || `${CENTRAL_ORIGIN}/api/company-master/`,
  CENTRAL_ORIGIN,
  CENTRAL_PROXY_PREFIX,
)

async function readFailure(response, fallback) {
  const rawBody = await response.text().catch(() => "")
  let detail = rawBody
  try {
    const parsed = JSON.parse(rawBody)
    detail = parsed.detail || parsed.message || parsed.error || parsed.errors || parsed
    if (typeof detail !== "string") detail = JSON.stringify(detail)
  } catch {
    // Non-JSON bodies (HTML error pages) are kept as-is.
  }
  const suffix = detail?.trim() ? ` — ${detail.trim()}` : ""
  return new Error(`${fallback} (HTTP ${response.status})${suffix}`)
}

function asList(payload) {
  return Array.isArray(payload) ? payload : payload?.results || payload?.data || []
}

// Central Master answers through more than one instance and some of them do not
// carry this route: the very same request 404s and then succeeds a moment later.
// A 404 is therefore never read as "no rows" — the register reports an empty
// result as 200 with an empty list — and it is retried instead of failing the
// write.
const RETRY_DELAYS = [250, 500, 1000, 1500]
const UNREACHABLE = "The company register is not reachable"

const wait = (milliseconds) => new Promise((resolve) => { setTimeout(resolve, milliseconds) })

async function requestWithRetry(init, { retryNetwork }) {
  let lastError = null
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
    try {
      const response = await fetch(COMPANY_ENDPOINT, init)
      if (response.status !== 404) return response
      lastError = await readFailure(response, UNREACHABLE)
    } catch (networkError) {
      // A write whose answer was lost may already be stored, so only reads are
      // repeated after a network error.
      lastError = networkError
      if (!retryNetwork) throw networkError
    }
    if (attempt < RETRY_DELAYS.length) await wait(RETRY_DELAYS[attempt])
  }
  throw lastError
}

/**
 * The body the register expects. `logo` is a bare base64 string — no "data:"
 * prefix — because the register stores the bytes and publishes the file itself
 * under logo_url, which is what the list endpoint returns.
 *
 * Empty optional fields are sent as "" rather than omitted: the serializer has a
 * column for each of them, and a missing key repeated the values it already had
 * from an earlier submission.
 */
export function buildCompanyPayload({
  clientId,
  licenseKey,
  companyName,
  email,
  phoneNumber,
  referralCode,
  gstNumber,
  panNumber,
  addressLine1,
  addressLine2,
  city,
  district,
  state,
  country,
  logo,
}) {
  return {
    client_id: String(clientId || "").trim(),
    referral_code: String(referralCode || "").trim(),
    company_name: String(companyName || "").trim(),
    license_key: String(licenseKey || "").trim(),
    gst_number: String(gstNumber || "").trim().toUpperCase(),
    pan_number: String(panNumber || "").trim().toUpperCase(),
    email: String(email || "").trim(),
    phone_number: String(phoneNumber || "").replace(/\D/g, ""),
    address_line_1: String(addressLine1 || "").trim(),
    address_line_2: String(addressLine2 || "").trim(),
    city: String(city || "").trim(),
    district: String(district || "").trim(),
    state: String(state || "").trim(),
    country: String(country || "").trim().toUpperCase(),
    logo: String(logo || "").trim(),
    status: "ACTIVE",
  }
}

/**
 * Company rows already registered for a client id. The register keeps one row per
 * client, so anything returned here means the details are already on file.
 */
export async function findCompanyMaster(clientId) {
  const wanted = String(clientId || "").trim().toLowerCase()
  if (!wanted) return []

  const response = await requestWithRetry({ method: "GET" }, { retryNetwork: true })
  if (!response.ok) throw await readFailure(response, "Unable to load the company register")
  assertJson(response, "Unable to load the company register")

  const payload = await response.json().catch(() => [])
  return asList(payload).filter((item) => String(item?.client_id || "").trim().toLowerCase() === wanted)
}

export async function saveCompanyMaster(details) {
  const response = await requestWithRetry(
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildCompanyPayload(details)),
    },
    { retryNetwork: false },
  )

  if (!response.ok) throw await readFailure(response, "The company details could not be saved")
  assertJson(response, "The company details could not be saved")

  // Some deployments answer 201 with an empty body — never let that throw.
  const rawBody = await response.text()
  if (!rawBody.trim()) return {}
  try {
    return JSON.parse(rawBody)
  } catch {
    return { raw: rawBody }
  }
}

/**
 * Writes the company once per client id.
 *
 * A client that only came back to add a project already has their row, and
 * rewriting it from a form the operator may have half-filled would replace
 * statutory data (GSTIN, PAN, address) that support relies on. Callers get
 * `created: false` and the row that is really stored.
 */
export async function ensureCompanyMaster(details) {
  const existing = await findCompanyMaster(details.clientId)
  if (existing.length) return { created: false, record: existing[0] }

  const record = await saveCompanyMaster(details)
  return { created: true, record }
}

export { COMPANY_ENDPOINT }
