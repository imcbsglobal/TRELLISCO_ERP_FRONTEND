// src/api/financialYear.js
// Central Master's financial-year register. It drives the Country dropdown on
// the T-ERP signup form and stores which country's financial year applies to a
// client. Central Master sends no CORS headers and answers a preflight without
// Access-Control-Allow-Origin, so every call goes through the same-origin
// '/central-api' prefix (Vite proxy locally, nginx in production).

import { CENTRAL_ORIGIN, CENTRAL_PROXY_PREFIX, assertJson, viaProxy } from "./proxy"

const COUNTRY_ENDPOINT = viaProxy(
  import.meta.env.VITE_FINANCIAL_YEAR_COUNTRY_API_URL || `${CENTRAL_ORIGIN}/api/financial-year/country-wise/`,
  CENTRAL_ORIGIN,
  CENTRAL_PROXY_PREFIX,
)

const CUSTOMER_ENDPOINT = viaProxy(
  import.meta.env.VITE_FINANCIAL_YEAR_CUSTOMER_API_URL || `${CENTRAL_ORIGIN}/api/financial-year/customer-wise/`,
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

/**
 * Countries the financial-year register knows about, in the order the API
 * returns them (already alphabetical). The ISO code and currency ride along for
 * the option labels, but the customer endpoint wants the display name only.
 */
export async function fetchFinancialYearCountries() {
  const response = await fetch(COUNTRY_ENDPOINT)
  if (!response.ok) throw await readFailure(response, "Unable to load the country list")
  assertJson(response, "Unable to load the country list")

  const payload = await response.json().catch(() => [])
  const items = Array.isArray(payload) ? payload : payload?.results || payload?.data || []

  return items
    .map((item) => ({
      name: String(item?.country_name || "").trim().toUpperCase(),
      code: String(item?.country_code || "").trim().toUpperCase(),
      currency: String(item?.currency_code || "").trim().toUpperCase(),
    }))
    .filter((item) => item.name)
}

/**
 * Binds a client id to the country whose financial year applies to it. The id is
 * the customer's Gmail address — the same value used as the client id and the
 * Central Master login name — so the register, the license and the login agree.
 */
export async function saveClientCountry({ clientId, countryName }) {
  const response = await fetch(CUSTOMER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: String(clientId || "").trim(),
      country_name: String(countryName || "").trim().toUpperCase(),
    }),
  })

  if (!response.ok) throw await readFailure(response, "The client country could not be saved")
  assertJson(response, "The client country could not be saved")

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
 * Financial-year rows already registered for a client id. The register keeps one
 * row per financial year (FY-2026-2027, FY-2027-2028, …), so the same client id
 * legitimately appears several times; every row carries the same country.
 */
export async function findClientFinancialYears(clientId) {
  const wanted = String(clientId || "").trim().toLowerCase()
  if (!wanted) return []

  const response = await fetch(CUSTOMER_ENDPOINT)
  if (!response.ok) throw await readFailure(response, "Unable to load the client's financial year")
  assertJson(response, "Unable to load the client's financial year")

  const payload = await response.json().catch(() => [])
  const items = Array.isArray(payload) ? payload : payload?.results || payload?.data || []

  return items.filter((item) => String(item?.client_id || "").trim().toLowerCase() === wanted)
}

/**
 * Registers the country only when the client has no financial year yet.
 *
 * An existing registration is never rewritten: its country decided the financial
 * years already created for the client, so overwriting it (for example while the
 * customer only came back to add a project) would change books that are already
 * in use. Callers get `created: false` and the country that is really stored.
 */
export async function ensureClientCountry({ clientId, countryName }) {
  const existing = await findClientFinancialYears(clientId)
  if (existing.length) {
    return { created: false, country: existing[0]?.country_name || "", record: existing[0], years: existing.length }
  }

  const record = await saveClientCountry({ clientId, countryName })
  return { created: true, country: String(countryName || "").trim().toUpperCase(), record, years: 1 }
}

export { COUNTRY_ENDPOINT, CUSTOMER_ENDPOINT }
