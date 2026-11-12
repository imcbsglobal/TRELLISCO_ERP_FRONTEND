// src/api/notifications.js
// Delivers the new credentials to the customer: a WhatsApp message through the
// Dxing gateway, and an email.
//
// A browser cannot open an SMTP connection, so an app password is never used
// here — it belongs inside an HTTP mail relay such as EmailJS, which is where
// the Hostinger mailbox (info@imcbs.com, smtp.hostinger.com:465) is configured.
// Send order:
//   1. VITE_MAIL_API_URL      generic HTTP endpoint
//   2. EmailJS                Hostinger/Gmail SMTP handled server-side
//   3. Gmail REST API         direct, needs a one-time OAuth consent
//
// The visible sender is VITE_MAIL_FROM (info@imcbs.com by default), and every
// mail can be copied to VITE_MAIL_CC so the team keeps a record of it.

const WHATSAPP_ENDPOINT = import.meta.env.VITE_WHATSAPP_API_URL || "https://app.dxing.in/api/send/whatsapp"
const WHATSAPP_SECRET = import.meta.env.VITE_WHATSAPP_SECRET || ""
const WHATSAPP_ACCOUNT = import.meta.env.VITE_WHATSAPP_ACCOUNT || ""

const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
const GMAIL_SENDER = import.meta.env.VITE_GMAIL_SENDER || ""
const MAIL_API_URL =
  import.meta.env.VITE_MAIL_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8081/send.php" : "")
// Shared secret with mailer/send.php so the relay cannot be used by strangers.
const MAIL_API_TOKEN = import.meta.env.VITE_MAIL_API_TOKEN || ""
const TERP_APP_LOGIN_URL = import.meta.env.VITE_TERP_APP_LOGIN_URL || ""

// Sender identity. The relay (EmailJS custom SMTP / mail API) must be allowed to
// send as this address — a Gmail mailbox can never send as another domain, which
// is why info@imcbs.com has to go through the Hostinger SMTP service.
const MAIL_FROM = import.meta.env.VITE_MAIL_FROM || "info@imcbs.com"
const MAIL_FROM_NAME = import.meta.env.VITE_MAIL_FROM_NAME || "Trellisco ERP"
const MAIL_CC = import.meta.env.VITE_MAIL_CC || ""

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send"
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ""
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ""
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ""

const GMAIL_AUTO_SEND = String(import.meta.env.VITE_GMAIL_AUTO_SEND || "").toLowerCase() === "true"

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"
const GMAIL_SEND_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client"

export const NOT_CONFIGURED = "not-configured"

/* ───────────────────────────────
   MESSAGE CONTENT
─────────────────────────────── */
export function normaliseWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/g, "")
  if (!digits) return ""
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`
  return digits
}

export function buildCredentialsSubject(companyName) {
  return `Your Trellisco T-ERP login details${companyName ? ` for ${companyName}` : ""}`
}

export function buildCredentialsMessage({ companyName, projects = [], clientId, username, password, email, licenseKey }) {
  const lines = [
    `Hello ${companyName || "there"},`,
    "",
    "Your Trellisco T-ERP account is ready.",
    "",
    `Projects: ${projects.join(", ") || "-"}`,
    `Client ID: ${clientId || "-"}`,
    `Username: ${username}`,
    `Password: ${password}`,
  ]
  if (licenseKey) lines.push(`License key: ${licenseKey}`)
  if (email) lines.push(`Email: ${email}`)
  if (TERP_APP_LOGIN_URL) lines.push("", `Sign in: ${TERP_APP_LOGIN_URL}`)
  lines.push("", "Please change your password after the first sign-in.")
  return lines.join("\n")
}

/* ───────────────────────────────
   WHATSAPP (Dxing)
─────────────────────────────── */
export async function sendWhatsApp({ recipient, message }) {
  const number = normaliseWhatsAppNumber(recipient)
  if (!number) throw new Error("No WhatsApp number is available for this customer.")
  if (!WHATSAPP_SECRET || !WHATSAPP_ACCOUNT) {
    throw new Error("WhatsApp is not configured: set VITE_WHATSAPP_SECRET and VITE_WHATSAPP_ACCOUNT in .env.")
  }

  const query = new URLSearchParams({
    secret: WHATSAPP_SECRET,
    account: WHATSAPP_ACCOUNT,
    recipient: number,
    type: "text",
    message,
    priority: "1",
  })

  const response = await fetch(`${WHATSAPP_ENDPOINT}?${query.toString()}`)
  const payload = await response.json().catch(() => ({}))

  // The gateway answers HTTP 200 even for rejections and reports the real
  // outcome in `status`, so both layers have to be checked.
  if (!response.ok) throw new Error(`WhatsApp delivery failed (HTTP ${response.status}).`)
  const status = Number(payload?.status)
  if (Number.isFinite(status) && status >= 400) {
    throw new Error(payload?.message || "WhatsApp delivery was rejected by the gateway.")
  }

  return { recipient: number, payload }
}

/* ───────────────────────────────
   EMAIL — Gmail API (browser only)
─────────────────────────────── */
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve()
      return
    }
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener("load", resolve, { once: true })
      existing.addEventListener("error", reject, { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = GOOGLE_SCRIPT
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

let tokenClient = null
let cachedToken = null

// Session-scoped so a second send in the same tab never re-prompts for consent.
const GMAIL_TOKEN_KEY = "trellisco_gmail_token"

function readStoredToken() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(GMAIL_TOKEN_KEY) || "null")
    if (!parsed?.value || !parsed.expiresAt || parsed.expiresAt <= Date.now() + 60_000) return null
    return parsed
  } catch {
    return null
  }
}

function storeToken(token) {
  try {
    sessionStorage.setItem(GMAIL_TOKEN_KEY, JSON.stringify(token))
  } catch {
    // Private mode / storage disabled — the in-memory token still works.
  }
}

// Google reports OAuth setup problems as short codes. They surface as a blocked
// popup with no explanation, so each one is turned into the exact console fix.
function describeGoogleAuthError(code, detail) {
  const reason = String(code || "").trim()
  const origin = typeof window === "undefined" ? "this origin" : window.location.origin
  const base = `Google authorisation failed${reason ? ` (${reason})` : ""}${detail ? `: ${detail}` : ""}.`

  if (/origin_mismatch|idpiframe_initialization_failed/i.test(reason)) {
    return `${base} Add ${origin} to the OAuth client's "Authorized JavaScript origins" in Google Cloud Console, then retry — Google can take a few minutes to pick up the change.`
  }
  if (/invalid_client|deleted_client/i.test(reason)) {
    return `${base} The OAuth client id in VITE_GMAIL_CLIENT_ID does not exist anymore — check Google Cloud Console → Credentials.`
  }
  if (/access_not_configured|invalid_scope/i.test(reason)) {
    return `${base} Add https://www.googleapis.com/auth/gmail.send to the OAuth consent screen scopes, then retry.`
  }
  if (/access_denied/i.test(reason)) {
    return `${base} The Google account was not granted access. If the consent screen is in testing mode, add this address as a test user and retry.`
  }
  if (/popup_closed|popup_failed_to_open/i.test(reason)) {
    return `${base} The Google popup was blocked — allow popups for this site and use "Try again".`
  }
  return base
}

async function requestAccessToken() {
  if (!GMAIL_CLIENT_ID) throw new Error(NOT_CONFIGURED)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const stored = readStoredToken()
  if (stored) {
    cachedToken = stored
    return stored.value
  }

  await loadGoogleScript()
  if (!window.google?.accounts?.oauth2) throw new Error("Google Identity Services could not be loaded.")

  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GMAIL_CLIENT_ID,
        scope: GMAIL_SEND_SCOPE,
        callback: () => {},
      })
    }

    tokenClient.callback = (response) => {
      if (response?.error) {
        reject(new Error(describeGoogleAuthError(response.error, response.error_description)))
        return
      }
      cachedToken = {
        value: response.access_token,
        expiresAt: Date.now() + Number(response.expires_in || 3600) * 1000,
      }
      storeToken(cachedToken)
      resolve(response.access_token)
    }
    tokenClient.error_callback = (error) => reject(new Error(describeGoogleAuthError(error?.type || error?.message, "")))

    // prompt: "" makes Google reuse an existing grant silently, so the send is
    // automatic after the first consent. The first time (or when a popup is
    // blocked) it surfaces as an error the operator can retry with a click.
    tokenClient.requestAccessToken({ prompt: "" })
  })
}

function formatSender(address, name) {
  if (!address) return ""
  return name ? `${name} <${address}>` : address
}

/** The address every credentials mail is sent from, for UI copy. */
export function mailSenderAddress() {
  return MAIL_FROM
}

/** The address that receives a copy, if the team wants one. */
export function mailCopyAddress() {
  return MAIL_CC
}

function toBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function toBase64Url(value) {
  return toBase64Utf8(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function encodeSubject(subject) {
  // RFC 2047 keeps non-ASCII company names intact in the subject line.
  return `=?UTF-8?B?${toBase64Utf8(subject)}?=`
}

function buildRawMessage({ to, cc, subject, body }) {
  const headers = []
  // Gmail only accepts the authenticated mailbox (or a verified "Send as"
  // alias) as From, so a Hostinger identity becomes Reply-To instead.
  if (GMAIL_SENDER) headers.push(`From: ${formatSender(GMAIL_SENDER, MAIL_FROM_NAME)}`)
  headers.push(`To: ${to}`)
  if (cc) headers.push(`Cc: ${cc}`)
  if (MAIL_FROM && MAIL_FROM !== GMAIL_SENDER) headers.push(`Reply-To: ${formatSender(MAIL_FROM, MAIL_FROM_NAME)}`)
  headers.push(
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  )
  const mime = `${headers.join("\r\n")}\r\n\r\n${toBase64Utf8(body)}`
  return toBase64Url(mime)
}

export async function sendMailViaGmail({ to, cc = MAIL_CC, subject, body }) {
  const token = await requestAccessToken()
  const response = await fetch(GMAIL_SEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: buildRawMessage({ to, cc, subject, body }) }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    // 401/403 here means the token was not granted the send scope.
    if (response.status === 401 || response.status === 403) {
      throw new Error(describeGoogleAuthError(response.status === 403 ? "access_not_configured" : "access_denied", detail.slice(0, 200)))
    }
    throw new Error(`Gmail rejected the message (HTTP ${response.status})${detail ? ` — ${detail.slice(0, 300)}` : ""}`)
  }

  return response.json()
}

/* ───────────────────────────────
   EMAIL — orchestrator
─────────────────────────────── */
export function isEmailjsConfigured() {
  return Boolean(EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID)
}

export function isEmailConfigured() {
  return Boolean(MAIL_API_URL || isEmailjsConfigured() || GMAIL_CLIENT_ID)
}

/**
 * Whether the email can be sent without the operator clicking anything.
 *
 * EmailJS and a mail API are plain HTTPS calls, so they always qualify. Gmail
 * needs a consent popup the first time, and a popup opened after several awaits
 * is blocked — so Gmail only runs unattended when a token is already cached
 * (or VITE_GMAIL_AUTO_SEND forces it). Otherwise the popup offers the button.
 */
export function canAutoSendEmail() {
  if (MAIL_API_URL || isEmailjsConfigured()) return true
  if (!GMAIL_CLIENT_ID) return false
  return GMAIL_AUTO_SEND || Boolean(readStoredToken())
}

// EmailJS holds the SMTP credentials (Gmail address + app password) on its own
// servers, so this is a plain CORS request: no popup, no consent, no backend.
async function sendMailViaEmailjs({ to, cc = MAIL_CC, subject, body }) {
  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: to,
        cc_email: cc,
        reply_to: MAIL_FROM,
        from_name: MAIL_FROM_NAME,
        from_email: MAIL_FROM,
        subject,
        message: body,
        // Aliases so the template works whether it uses {{message}} or {{body}}.
        body,
        content: body,
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`EmailJS rejected the message (HTTP ${response.status})${detail ? ` — ${detail.slice(0, 300)}` : ""}`)
  }

  return { transport: "emailjs" }
}

export async function sendCredentialsEmail({ to, cc = MAIL_CC, subject, body }) {
  if (!to) throw new Error("No customer email address is available.")

  if (MAIL_API_URL) {
    let response
    try {
      response = await fetch(MAIL_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(MAIL_API_TOKEN ? { Authorization: `Bearer ${MAIL_API_TOKEN}` } : {}),
        },
        // `from` is the visible sender; the relay must own that mailbox or the
        // receiving server will treat the message as spoofed.
        body: JSON.stringify({
          to,
          cc: cc || undefined,
          subject,
          body,
          from: MAIL_FROM,
          from_name: MAIL_FROM_NAME,
          reply_to: MAIL_FROM,
        }),
      })
    } catch {
      // A blocked request means the relay is down or the origin is refused.
      throw new Error(
        `The mail relay at ${MAIL_API_URL} could not be reached. Check that it is running and allows ${window.location.origin}.`,
      )
    }

    const result = await response.json().catch(() => null)
    if (!response.ok || result?.ok === false) {
      throw new Error(result?.error || `Mail relay rejected the message (HTTP ${response.status}).`)
    }
    return { transport: "mail-api", messageId: result?.messageId }
  }

  if (isEmailjsConfigured()) {
    return sendMailViaEmailjs({ to, cc, subject, body })
  }

  if (GMAIL_CLIENT_ID) {
    await sendMailViaGmail({ to, cc, subject, body })
    return { transport: "gmail" }
  }

  throw new Error(
    "Email is not configured: point VITE_MAIL_API_URL at mailer/send.php (the relay that speaks SMTP), " +
      "or set VITE_EMAILJS_* , or VITE_GMAIL_CLIENT_ID in .env.",
  )
}
