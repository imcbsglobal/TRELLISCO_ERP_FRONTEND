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
  let fields = null
  try {
    const parsed = JSON.parse(rawBody)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && !parsed.detail) {
      // A validation failure is answered as { field: ["message"] }. Kept on the
      // error so a caller can tell one rejection from another, and flattened to
      // "field: message" so the note next to the credentials reads plainly.
      fields = parsed
      detail = Object.entries(parsed)
        .map(([field, messages]) => `${field}: ${[].concat(messages).join(" ")}`)
        .join("; ")
    } else {
      detail = parsed.detail || parsed.message || parsed.error || parsed.errors || parsed
      if (typeof detail !== "string") detail = JSON.stringify(detail)
    }
  } catch {
    // Non-JSON bodies (HTML error pages) are kept as-is.
  }
  const suffix = detail?.trim() ? ` — ${detail.trim()}` : ""
  const error = new Error(`${fallback} (HTTP ${response.status})${suffix}`)
  error.status = response.status
  error.fields = fields
  return error
}

function asList(payload) {
  return Array.isArray(payload) ? payload : payload?.results || payload?.data || []
}

// The register's list route 404s on part of Central Master's fleet: an identical
// request answers 200 and then 404 a second later, while /api/user-master/ and
// /api/financial-year/ answer every time from the same host. The 404 body is the
// site's own HTML page, so it is read as "this instance does not carry the route"
// and retried — never as "no rows", which the register returns as 200 with [].
// POST is answered every time, so the write must never be gated behind this read.
const RETRY_DELAYS = [250, 500, 1000, 1500]
const UNREACHABLE = "The company register is not reachable"

const wait = (milliseconds) => new Promise((resolve) => { setTimeout(resolve, milliseconds) })

// A 404 cached by the CDN would otherwise be served again for every retry, so
// each read gets its own URL. The register ignores unknown query parameters.
function cacheBusted(url) {
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}_=${Date.now()}${Math.floor(Math.random() * 1000)}`
}

// The register only accepts a client id that T-ERP has on file, and answers
// every other id with {"client_id": ["Unknown client_id."]}. A demo signup is
// keyed by the Google address while T-ERP may have registered the client under
// the id its license API generated, so callers hand over every id they know and
// the write uses the first one the register accepts.
function clientIdCandidates(clientId, alternateClientIds = []) {
  return [clientId, ...alternateClientIds]
    .map((value) => String(value || "").trim())
    .filter(
      (value, index, all) =>
        Boolean(value) && all.findIndex((other) => other.toLowerCase() === value.toLowerCase()) === index,
    )
}

function isUnknownClientId(error) {
  const reported = error?.fields?.client_id
  if (reported) return /unknown client_id/i.test([].concat(reported).join(" "))
  return /unknown client_id/i.test(String(error?.message || ""))
}

// The license that was just created may not be in T-ERP's directory yet, and
// until it is every candidate id reads as unknown. The whole list is therefore
// tried again once after a pause before the write is reported as failed.
const SYNC_DELAYS = [800]

async function requestWithRetry(init, { retryNetwork, attempts = RETRY_DELAYS.length + 1 } = {}) {
  const isRead = String(init?.method || "GET").toUpperCase() === "GET"
  let lastError = null
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(isRead ? cacheBusted(COMPANY_ENDPOINT) : COMPANY_ENDPOINT, init)
      if (response.status !== 404) return response
      lastError = await readFailure(response, UNREACHABLE)
    } catch (networkError) {
      // A write whose answer was lost may already be stored, so only reads are
      // repeated after a network error.
      lastError = networkError
      if (!retryNetwork) throw networkError
    }
    if (attempt < attempts - 1) await wait(RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)])
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
 * from an earlier submission. `logo` is the exception — see below.
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
  const payload = {
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
    status: "ACTIVE",
  }

  // The register decodes the logo whenever the key is present, so an empty
  // string is rejected with "logo must be a base64 encoded image" and a client
  // without a logo is stored by leaving the key out entirely.
  const logoValue = String(logo || "").replace(/^data:[^,]*,/, "").trim()
  if (logoValue) payload.logo = logoValue

  return payload
}

/**
 * Company rows already registered for a client id. The register keeps one row per
 * client, so anything returned here means the details are already on file.
 *
 * Every id the caller knows for the client counts as a match: the row may have
 * been written under the email while T-ERP knows the client by its generated id.
 *
 * `attempts` lets a caller that only wants a hint (see pushCompanyMaster) ask
 * once instead of sitting through the whole backoff.
 */
export async function findCompanyMaster(clientId, { alternateClientIds = [], attempts } = {}) {
  const wanted = clientIdCandidates(clientId, alternateClientIds).map((id) => id.toLowerCase())
  if (!wanted.length) return []

  const response = await requestWithRetry({ method: "GET" }, { retryNetwork: true, attempts })
  if (!response.ok) throw await readFailure(response, "Unable to load the company register")
  assertJson(response, "Unable to load the company register")

  const payload = await response.json().catch(() => [])
  return asList(payload).filter((item) => wanted.includes(String(item?.client_id || "").trim().toLowerCase()))
}

export async function saveCompanyMaster(details) {
  const response = await requestWithRetry(
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildCompanyPayload(details)),
    },
    // A write is retried less than a read: the candidate loop in writeCompany
    // already repeats it, and an unanswered POST is the expensive case.
    { retryNetwork: false, attempts: 3 },
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
 * The register rejects a second row for a client id with a unique-constraint
 * message rather than a status code of its own, so the message is what decides
 * whether a failed write already has the row on file.
 */
const DUPLICATE_PATTERN = /already (exists|registered|saved|present)|duplicate|unique/i

const isDuplicateRejection = (error) => DUPLICATE_PATTERN.test(String(error?.message || ""))

/**
 * Writes the row, trying each client id the caller knows until the register
 * accepts one. Only "Unknown client_id" moves on to the next id — every other
 * rejection would fail the same way for the rest.
 */
async function writeCompany(details) {
  const candidates = clientIdCandidates(details.clientId, details.alternateClientIds)
  if (!candidates.length) throw new Error("No client id is known for this company, so nothing was written")
  let lastError = null

  for (let round = 0; round <= SYNC_DELAYS.length; round += 1) {
    for (const candidate of candidates) {
      const scoped = { ...details, clientId: candidate }
      try {
        const record = await saveCompanyMaster(scoped)
        return { created: true, clientId: candidate, record }
      } catch (error) {
        if (isDuplicateRejection(error)) return { created: false, clientId: candidate, duplicate: true }
        if (isUnknownClientId(error)) {
          lastError = error
          continue
        }
        // The register decodes the logo with its own rules, so an image it will
        // not take must not cost the company record. The same row is written
        // again without it and the caller is told the logo was left out.
        if (scoped.logo && error?.fields?.logo) {
          try {
            const record = await saveCompanyMaster({ ...scoped, logo: "" })
            return { created: true, clientId: candidate, record, logoDropped: true }
          } catch (retryError) {
            if (isDuplicateRejection(retryError)) return { created: false, clientId: candidate, duplicate: true }
            throw retryError
          }
        }
        throw error
      }
    }
    if (round < SYNC_DELAYS.length) await wait(SYNC_DELAYS[round])
  }

  throw lastError
}

/**
 * Writes the company once per client id.
 *
 * A client that only came back to add a project already has their row, and
 * rewriting it from a form the operator may have half-filled would replace
 * statutory data (GSTIN, PAN, address) that support relies on. Callers get
 * `created: false` and the row that is really stored. A read that cannot be
 * answered at all still fails here: writing blind could duplicate a row.
 */
export async function ensureCompanyMaster(details) {
  const existing = await findCompanyMaster(details.clientId, { alternateClientIds: details.alternateClientIds })
  if (existing.length) return { created: false, clientId: existing[0].client_id, record: existing[0] }

  return writeCompany(details)
}

/**
 * Writes the company details of a client that has just been licensed.
 *
 * This is the signup path, so the client id was minted seconds ago and nothing
 * can be on file for it yet. The list endpoint is only asked once, as a hint:
 * when it answers, an existing row is respected; when it 404s (see the retry
 * note above) the write runs anyway. Gating this write behind that read is what
 * made the company details of new demo accounts disappear.
 */
export async function pushCompanyMaster(details) {
  const existing = await findCompanyMaster(details.clientId, {
    alternateClientIds: details.alternateClientIds,
    attempts: 1,
  }).catch(() => [])
  if (existing.length) return { created: false, clientId: existing[0].client_id, record: existing[0] }

  return writeCompany(details)
}

export { COMPANY_ENDPOINT }
