// src/api/agentReferral.js
// The agent portal on activate.imcbs.com credits the partner (agent) whose code
// was typed on the demo form, keyed by the address the customer signed in with.
//
// The endpoint is POST-only (GET and the browser's OPTIONS preflight both answer
// 405) and it refuses a request with a bare HTTP 400 that carries no body, so a
// reply is never read as "no error, so the code is fine": only a body that
// actually confirms the code counts. A code the portal does not confirm stops
// the signup before the license and the login are created.
//
// Like the license API, it is reached through the same-origin '/terp-api' prefix
// (Vite proxy locally, nginx in production).

import { TERP_ORIGIN, TERP_PROXY_PREFIX, assertJson, viaProxy } from "./proxy"

export const AGENT_REFERRAL_ENDPOINT = viaProxy(
  import.meta.env.VITE_TERP_AGENT_REFERRAL_API_URL || `${TERP_ORIGIN}/agents/api/agent-referral/`,
  TERP_ORIGIN,
  TERP_PROXY_PREFIX,
)

// Codes are issued in capitals ("AG-UFC9RR"), so a code typed in lower case is
// folded before it is posted or remembered.
export const normaliseReferralCode = (value) => String(value || "").trim().toUpperCase()

// Every key the portal might use to answer yes or no. A bare `true` body is the
// documented answer; the flags keep the check working if the reply is wrapped.
const FLAG_KEYS = ["success", "valid", "ok", "accepted", "confirmed", "created", "referred", "result", "status"]
const TRUTHY_WORDS = new Set(["true", "ok", "success", "succeeded", "accepted", "valid", "confirmed", "1"])
const FALSY_WORDS = new Set(["false", "0", "error", "failed", "invalid", "rejected", "not found", "notfound"])

function verdictOf(value) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : null
  if (typeof value === "string") {
    const word = value.trim().toLowerCase()
    if (TRUTHY_WORDS.has(word)) return true
    if (FALSY_WORDS.has(word)) return false
  }
  return null
}

// The most specific sentence the body carries, for the operator-facing note.
function messageOf(payload) {
  if (!payload || typeof payload !== "object") return ""
  const detail = payload.detail ?? payload.message ?? payload.error ?? payload.errors ?? payload.reason
  if (!detail) return ""
  const text = Array.isArray(detail) ? detail.join(" ") : typeof detail === "string" ? detail : JSON.stringify(detail)
  return String(text).trim().slice(0, 200)
}

/**
 * True only when the body confirms the code. `true` (the documented answer), a
 * "true" / "success" string and an object whose flag is true all count; an
 * explicitly false flag wins over any other key, and a body that says nothing
 * about acceptance counts as a refusal rather than a success.
 */
export function isReferralConfirmed(payload) {
  const direct = verdictOf(payload)
  if (direct !== null) return direct
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false

  let confirmed = false
  for (const key of FLAG_KEYS) {
    const verdict = verdictOf(payload[key])
    if (verdict === false) return false
    if (verdict === true) confirmed = true
  }
  return confirmed
}

function parseBody(rawBody) {
  const text = String(rawBody || "").trim()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    // A plain-text "true" is still a confirmation.
    return text
  }
}

// A confirmed (address, code) pair is never posted twice: a submit that already
// credited the partner and then failed at the license or the account step must
// not credit them again when the operator retries.
const confirmedReferrals = new Set()

/**
 * Credits `referralCode` to `mailId` on the agent portal and resolves only when
 * the portal has confirmed the code — a rejection (HTTP 400, an empty body, a
 * false flag) throws instead, so the caller can refuse to create the license.
 *
 * `mailId` must be the address the customer signed in with: the portal keys the
 * credit by it, and it is the same address the license and the admin login use.
 */
export async function submitAgentReferral({ email, referralCode }) {
  const mailId = String(email || "").trim()
  const code = normaliseReferralCode(referralCode)

  if (!mailId) throw new Error("the sign-in email is missing, so the code cannot be credited.")
  if (!code) throw new Error("no referral code was entered.")

  const key = `${mailId.toLowerCase()}|${code}`
  if (confirmedReferrals.has(key)) return { mailId, referralCode: code, alreadyConfirmed: true }

  const response = await fetch(AGENT_REFERRAL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ mail_id: mailId, referral_code: code }),
  })

  // A missing reverse proxy answers 200 with the site's HTML page.
  assertJson(response, "The referral code could not be checked")

  const payload = parseBody(await response.text())
  const confirmed = response.ok && isReferralConfirmed(payload)
  if (!confirmed) {
    const reason = messageOf(payload)
      || (payload === null ? "the agent portal returned an empty reply" : `the agent portal answered ${JSON.stringify(payload).slice(0, 200)}`)
    const status = response.ok ? "" : ` (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""})`
    throw new Error(`${reason}${status}`)
  }

  confirmedReferrals.add(key)
  return { mailId, referralCode: code, payload }
}
