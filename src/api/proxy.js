// src/api/proxy.js
// Some imcbs services answer without a single Access-Control-* header, so a
// browser on https://trelliscoerp.com is blocked before it can read the reply —
// and the license POST is rejected outright because its preflight gets a 405.
//
// Those hosts are reached through a same-origin prefix instead. The prefix is
// mirrored by a reverse proxy in both environments: the Vite dev server
// (vite.config.js) locally and nginx (deploy/nginx-cors-proxy.conf) on the
// server, so the browser only ever talks to its own origin.

export const TERP_ORIGIN = "https://activate.imcbs.com"
export const CENTRAL_ORIGIN = "https://centralmastermanagement.imcbs.com"

export const TERP_PROXY_PREFIX = "/terp-api"
export const CENTRAL_PROXY_PREFIX = "/central-api"

/**
 * `url` moved onto `prefix` when it points at `host`, so a host that sends no
 * CORS headers can still be read by the SPA.
 *
 * Anything else is returned untouched: a relative URL is already same-origin,
 * and a URL on another host is assumed to answer with CORS headers — which is
 * also how a future CORS-enabled endpoint gets adopted (point the env var at
 * it, and no rebuild of this module is needed).
 */
export function viaProxy(url, host, prefix) {
  const value = String(url || "").trim()
  if (!value || value.startsWith("/")) return value

  try {
    const { origin, pathname, search } = new URL(value)
    return origin === host ? `${prefix}${pathname}${search}` : value
  } catch {
    return value
  }
}

/**
 * A miss on the reverse proxy is invisible in the HTTP status: the site's own
 * SPA fallback answers 200 with index.html, so the body then fails as a JSON
 * parse error — or, worse, parses into an empty list and looks like "no data".
 * Callers pass every successful response through this so a missing proxy is
 * reported as exactly that.
 */
export function assertJson(response, label) {
  const type = String(response.headers.get("content-type") || "").toLowerCase()
  if (!type.includes("text/html")) return response

  const path = response.url || "the requested path"
  const prefix = [TERP_PROXY_PREFIX, CENTRAL_PROXY_PREFIX].find((item) => path.includes(item))
  throw new Error(
    `${label}: ${path} returned the site's HTML page instead of JSON — ` +
      `the ${prefix || "API"} reverse proxy is not configured on the server (see deploy/nginx-cors-proxy.conf).`,
  )
}
