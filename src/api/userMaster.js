// src/api/userMaster.js
// Creates the client administrator account in Central Master once a T-ERP
// license exists. The account always gets the ADMIN role, and every product
// flag mirrors the projects that were bought.

import { USER_MASTER_FLAGS, flagsForProjects } from "../config/projectFlags"
import { CENTRAL_ORIGIN, CENTRAL_PROXY_PREFIX, viaProxy } from "./proxy"

// Central Master sends no CORS headers, so the user table is read and written
// through the same-origin '/central-api' prefix (Vite proxy locally, nginx in
// production).
const USER_MASTER_ENDPOINT = viaProxy(
  import.meta.env.VITE_USER_MASTER_API_URL || `${CENTRAL_ORIGIN}/api/user-master/`,
  CENTRAL_ORIGIN,
  CENTRAL_PROXY_PREFIX,
)

// Ambiguous characters (0/o, 1/l/i) are left out so credentials survive being
// read off WhatsApp or typed from a screenshot.
const USERNAME_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"
const USERNAME_LETTERS = "abcdefghijkmnpqrstuvwxyz"
const PASSWORD_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const PASSWORD_LOWER = "abcdefghijkmnpqrstuvwxyz"
const PASSWORD_DIGITS = "23456789"
const PASSWORD_SYMBOLS = "!@#$%&*"
const USERNAME_LENGTH = 9
// Keeps a handle well inside the shortest username limit any service enforces.
const USERNAME_MAX_LENGTH = 30
const USERNAME_EDGE_CHARS = /^[._-]+|[._-]+$/g

export function randomFrom(alphabet, length) {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  let output = ""
  for (let index = 0; index < length; index += 1) {
    output += alphabet[values[index] % alphabet.length]
  }
  return output
}

// The login handle follows the address the client signed in with, so
// "sajiththomas231@gmail.com" becomes "sajiththomas231": the operator and the
// client both recognise the account without checking a spreadsheet. Only the
// local part is kept — the whole domain is dropped, not just "@gmail.com", so a
// company address produces a handle the same way.
export function usernameFromEmail(email) {
  const local = String(email || "").split("@")[0]
  // A typed company address may carry capitals, and usernames are matched
  // case-sensitively, so everything is folded to lower case first.
  const cleaned = local.toLowerCase().replace(/[^a-z0-9._-]+/g, "").replace(USERNAME_EDGE_CHARS, "")
  if (!cleaned) return ""
  // A leading digit is legal for some validators and rejected by stricter ones,
  // so the handle is anchored with a letter rather than refused.
  const anchored = /^[a-z]/.test(cleaned) ? cleaned : `u${cleaned}`
  return anchored.slice(0, USERNAME_MAX_LENGTH)
}

// Fallback for an address that yields no usable handle (for example a login
// keyed by a phone-only contact). A fresh one is drawn on every attempt so a
// collision can never repeat.
export function generateUsername() {
  // Starts with a letter so stricter username validators never reject it.
  return randomFrom(USERNAME_LETTERS, 1) + randomFrom(USERNAME_ALPHABET, USERNAME_LENGTH - 1)
}

// "sajiththomas231" may already be taken, so the next attempts are numbered:
// "sajiththomas2312", "sajiththomas2313", ... and the handle stays recognisable.
export function numberedUsername(base, suffix) {
  const room = USERNAME_MAX_LENGTH - String(suffix).length
  return `${String(base).slice(0, room)}${suffix}`
}

export function generatePassword(length = 12) {
  const required = [
    randomFrom(PASSWORD_UPPER, 1),
    randomFrom(PASSWORD_LOWER, 1),
    randomFrom(PASSWORD_DIGITS, 1),
    randomFrom(PASSWORD_SYMBOLS, 1),
  ]
  const filler = randomFrom(PASSWORD_UPPER + PASSWORD_LOWER + PASSWORD_DIGITS, Math.max(length - required.length, 0))
  const characters = [...required, ...filler]

  // Fisher-Yates so the required characters are not always in the same slots.
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[characters[index], characters[swap]] = [characters[swap], characters[index]]
  }

  return characters.join("")
}

export function splitContactName(fullName, fallback) {
  const cleaned = String(fullName || "").trim()
  if (!cleaned) {
    const fallbackName = String(fallback || "").trim() || "Client"
    return { firstName: fallbackName, lastName: "-" }
  }
  const [firstName, ...rest] = cleaned.split(/\s+/)
  return { firstName, lastName: rest.join(" ") || "-" }
}

export function buildAdminPayload({ clientId, username, password, email, phoneNumber, firstName, lastName, flags }) {
  return {
    client_id: clientId,
    first_name: firstName,
    last_name: lastName,
    username,
    password,
    email,
    phone_number: phoneNumber,
    user_role: "ADMIN",
    ...flags,
    // Central Master stores the Fee Flow flag as "fee_flow" while older
    // payloads sent "feeflow". Both are sent so either serializer accepts it —
    // DRF ignores the unknown one.
    feeflow: flags?.fee_flow ?? false,
    status: "ACTIVE",
  }
}

function isUsernameConflict(status, rawBody) {
  if (status !== 400 && status !== 409) return false
  return /username/i.test(rawBody) && /(exist|unique|already|taken|duplicate)/i.test(rawBody)
}

// Central Master also enforces (client_id, email) and (client_id, phone_number)
// uniqueness, so the same contact can never get a second login for one client.
function isContactConflict(status, rawBody) {
  if (status !== 400 && status !== 409) return false
  return /unique set/i.test(rawBody) && /(email|phone_number)/i.test(rawBody)
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "")
}

async function fetchAllUsers() {
  const response = await fetch(USER_MASTER_ENDPOINT)
  if (!response.ok) return []
  const payload = await response.json().catch(() => [])
  return Array.isArray(payload) ? payload : payload?.results || []
}

export async function findClientAdmins(clientId) {
  const users = await fetchAllUsers()
  return users.filter((user) => String(user?.client_id || "") === String(clientId))
}

/**
 * Logins that already belong to this client. The user table is the only source of
 * truth available before a license exists, so it decides whether a license may
 * be created at all: one client id = one license = one login.
 *
 * A match is any of:
 *   - the same client_id
 *   - a login whose email is the company email (some clients are keyed by email)
 *   - the same email or the same 10-digit phone number
 */
export async function findClientLogins({ clientId = "", email = "", phoneNumber = "" } = {}) {
  const wantedId = String(clientId || "").trim()
  const wantedEmail = String(email || "").trim().toLowerCase()
  const wantedPhone = digitsOnly(phoneNumber).slice(-10)
  if (!wantedId && !wantedEmail && !wantedPhone) return []

  const users = await fetchAllUsers()
  return users.filter((user) => {
    const userId = String(user?.client_id || "").trim()
    const userEmail = String(user?.email || "").trim().toLowerCase()
    const userPhone = digitsOnly(user?.phone_number).slice(-10)
    return (
      (wantedId !== "" && userId === wantedId) ||
      (wantedEmail !== "" && (userEmail === wantedEmail || userId.toLowerCase() === wantedEmail)) ||
      (wantedPhone !== "" && userPhone === wantedPhone)
    )
  })
}

/**
 * Switches extra products on for the logins a client already owns.
 *
 * A returning customer who buys another project must see it in every login that
 * belongs to that client id, so each record is PATCHed with the new flags only —
 * a partial update can never switch an existing product off. Records that already
 * have every requested flag are skipped, and a record without an id is ignored.
 */
export async function enableProjectsForClient({ logins = [], clientId = "", selectedProjects = [] }) {
  const flags = flagsForProjects(selectedProjects)
  const enabled = USER_MASTER_FLAGS.filter((flag) => flags[flag])
  if (!enabled.length) return { updated: 0, enabled }

  // Prefer the logins that really carry this client id; fall back to every match
  // (email / phone) so a legacy code-keyed login is not left behind.
  const wanted = String(clientId || "").trim().toLowerCase()
  const scoped = wanted
    ? logins.filter((user) => String(user?.client_id || "").trim().toLowerCase() === wanted)
    : []
  const targets = (scoped.length ? scoped : logins).filter((user) => user?.id && enabled.some((flag) => !user[flag]))
  let updated = 0

  for (const user of targets) {
    // Only the flags this record is missing: a partial PATCH never removes one.
    const patch = Object.fromEntries(enabled.filter((flag) => !user[flag]).map((flag) => [flag, true]))
    // Same legacy key as buildAdminPayload: older serializers read "feeflow".
    if (patch.fee_flow) patch.feeflow = true

    const response = await fetch(`${USER_MASTER_ENDPOINT}${user.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!response.ok) {
      const failure = await readFailure(response, "Could not enable the new project on the existing login")
      throw new Error(failure.message)
    }
    updated += 1
  }

  return { updated, enabled }
}

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
  return { message: `${fallback} (HTTP ${response.status})${suffix}`, rawBody }
}

/**
 * Creates the client admin. The username is derived from the address the client
 * signed in with and numbered on collision, so one already taken for this
 * client id is never reused.
 *
 * A client gets exactly one admin login: when the client id or the contact
 * details are already taken, nothing is created and no password is ever rotated
 * behind the operator's back. The message stays generic on purpose — usernames
 * and client ids never belong in a message rendered on screen.
 */
export async function createClientAdmin({
  clientId,
  firstName,
  lastName,
  email,
  phoneNumber,
  selectedProjects = [],
  attempts = 4,
  // The Google address is what the client actually signs in with, so it wins
  // over the company email used as the client id.
  usernameEmail = "",
}) {
  const flags = flagsForProjects(selectedProjects)
  const password = generatePassword()
  const baseUsername = usernameFromEmail(usernameEmail || email)
  let username = baseUsername || generateUsername()
  let lastFailure = null

  // A client is allowed exactly one admin login. Checking before the POST keeps
  // the user table clean when the client id already owns an account.
  const existing = await findClientLogins({ clientId }).catch(() => [])
  if (existing.length) {
    throw new Error("This client already has an admin login. No new user was created.")
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const payload = buildAdminPayload({
      clientId,
      username,
      password,
      email,
      phoneNumber,
      firstName,
      lastName,
      flags,
    })

    const response = await fetch(USER_MASTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const rawBody = await response.text()
      let user
      try {
        user = rawBody ? JSON.parse(rawBody) : {}
      } catch {
        user = {}
      }
      return { username, password, flags, user, reused: false, endpoint: USER_MASTER_ENDPOINT }
    }

    const failure = await readFailure(response, "Could not create the T-ERP admin account")
    lastFailure = failure

    if (isUsernameConflict(response.status, failure.rawBody)) {
      // Username collided — number the same handle so the login stays
      // recognisable, and only draw an unrelated one when there is no handle.
      username = baseUsername ? numberedUsername(baseUsername, attempt + 2) : generateUsername()
      continue
    }

    if (isContactConflict(response.status, failure.rawBody)) {
      throw new Error("This client already has an admin login. No second account was created.")
    }
    break
  }

  throw new Error(lastFailure?.message || "Could not create the T-ERP admin account.")
}

export { USER_MASTER_FLAGS, USER_MASTER_ENDPOINT, flagsForProjects }
