import { useCallback, useEffect, useMemo, useState } from "react"
import { mailCopyAddress, mailSenderAddress } from "../api/notifications"
import "./CredentialsModal.scss"

const STATUS_COPY = {
  pending: "Sending…",
  sent: "Delivered",
  failed: "Failed",
  skipped: "Not sent",
  idle: "Not sent yet",
}

function statusClass(status) {
  if (status === "sent") return "is-sent"
  if (status === "failed") return "is-failed"
  if (status === "pending") return "is-pending"
  return "is-idle"
}

function DeliveryRow({ label, status, message, onRetry, retrying, extra, idleLabel = "Try again" }) {
  const actionLabel = status === "idle" ? idleLabel : "Try again"
  return (
    <div className={`terp-credentials__delivery ${statusClass(status)}`}>
      <div className="terp-credentials__delivery-main">
        <span className="terp-credentials__delivery-label">{label}</span>
        <span className="terp-credentials__delivery-status">{STATUS_COPY[status] || STATUS_COPY.idle}</span>
      </div>
      {message && status !== "sent" && <p className="terp-credentials__delivery-message">{message}</p>}
      {(onRetry || extra) && status !== "sent" && status !== "pending" && (
        <div className="terp-credentials__delivery-actions">
          {onRetry && (
            <button type="button" className="terp-credentials__retry" onClick={onRetry} disabled={retrying}>
              {retrying ? "Sending…" : actionLabel}
            </button>
          )}
          {extra}
        </div>
      )}
    </div>
  )
}

export default function CredentialsModal({
  open,
  credentials,
  whatsapp,
  email,
  onClose,
  // "Done" finishes the flow (the page decides where to go); every other way of
  // closing the dialog — ×, Escape, backdrop — only dismisses it.
  onDone,
  onRetryWhatsApp,
  onRetryEmail,
  retryingWhatsApp = false,
  retryingEmail = false,
}) {
  const [copied, setCopied] = useState(false)
  const sender = mailSenderAddress()
  const copyTo = mailCopyAddress()

  const handleClose = useCallback(() => {
    setCopied(false)
    onClose?.()
  }, [onClose])

  const handleDone = useCallback(() => {
    setCopied(false)
    ;(onDone || onClose)?.()
  }, [onDone, onClose])

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, handleClose])

  const copyText = useMemo(() => {
    if (!credentials) return ""
    const lines = [
      `Client ID: ${credentials.clientId || "-"}`,
      `Username: ${credentials.username}`,
      `Password: ${credentials.password}`,
      `Projects: ${(credentials.projects || []).join(", ") || "-"}`,
    ]
    if (credentials.licenseKey) lines.push(`License key: ${credentials.licenseKey}`)
    if (credentials.email) lines.push(`Email: ${credentials.email}`)
    return lines.join("\n")
  }, [credentials])

  const mailtoHref = useMemo(() => {
    if (!credentials?.email) return ""
    const subject = `Your Trellisco T-ERP login details${credentials.companyName ? ` for ${credentials.companyName}` : ""}`
    const body = [
      `Hello ${credentials.companyName || "there"},`,
      "",
      "Your Trellisco T-ERP account is ready.",
      "",
      `Projects: ${(credentials.projects || []).join(", ") || "-"}`,
      `Client ID: ${credentials.clientId || "-"}`,
      `Username: ${credentials.username}`,
      `Password: ${credentials.password}`,
      "",
      "Please change your password after the first sign-in.",
    ].join("\n")
    const query = [`subject=${encodeURIComponent(subject)}`, `body=${encodeURIComponent(body)}`]
    const copyTo = mailCopyAddress()
    if (copyTo) query.push(`cc=${encodeURIComponent(copyTo)}`)
    return `mailto:${encodeURIComponent(credentials.email)}?${query.join("&")}`
  }, [credentials])

  if (!open || !credentials) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="terp-credentials" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose() }}>
      <div className="terp-credentials__card" role="dialog" aria-modal="true" aria-labelledby="terp-credentials-title" aria-describedby="terp-credentials-lede">
        <header className="terp-credentials__head">
          <span className="terp-credentials__badge" aria-hidden="true">✓</span>
          <div>
            <p className="terp-credentials__eyebrow">T-ERP license created</p>
            <h2 id="terp-credentials-title">{credentials.companyName || "Client"} login details</h2>
          </div>
          <button type="button" className="terp-credentials__close" onClick={handleClose} aria-label="Close">×</button>
        </header>

        <div className="terp-credentials__body">
        <p className="terp-credentials__lede" id="terp-credentials-lede">
          Share these details with the customer. They are sent to the registered WhatsApp number and email address
          automatically — use the buttons if a channel needs another attempt.
        </p>

        <dl className="terp-credentials__grid">
          <div className="terp-credentials__row terp-credentials__row--highlight">
            <dt>Username</dt>
            <dd>{credentials.username}</dd>
          </div>
          <div className="terp-credentials__row terp-credentials__row--highlight">
            <dt>Password</dt>
            <dd>{credentials.password}</dd>
          </div>
          <div className="terp-credentials__row">
            <dt>Client ID</dt>
            <dd>{credentials.clientId || "—"}</dd>
          </div>
          <div className="terp-credentials__row">
            <dt>Role</dt>
            <dd>ADMIN</dd>
          </div>
          {credentials.licenseKey && (
            <div className="terp-credentials__row">
              <dt>License key</dt>
              <dd>{credentials.licenseKey}</dd>
            </div>
          )}
          <div className="terp-credentials__row">
            <dt>Email</dt>
            <dd>{credentials.email || "—"}</dd>
          </div>
          <div className="terp-credentials__row">
            <dt>Phone</dt>
            <dd>{credentials.phone || "—"}</dd>
          </div>
        </dl>

        <div className="terp-credentials__projects">
          <span>Projects</span>
          <div className="terp-credentials__chips">
            {(credentials.projects || []).length
              ? credentials.projects.map((project) => <span className="terp-credentials__chip" key={project}>{project}</span>)
              : <span className="terp-credentials__chip">—</span>}
          </div>
        </div>

        <div className="terp-credentials__deliveries">
          <DeliveryRow
            label="WhatsApp"
            status={whatsapp?.state}
            message={whatsapp?.message}
            onRetry={onRetryWhatsApp}
            retrying={retryingWhatsApp}
          />
          <DeliveryRow
            label="Email"
            status={email?.state}
            message={email?.message}
            onRetry={onRetryEmail}
            retrying={retryingEmail}
            idleLabel="Send email"
            extra={mailtoHref ? (
              <a className="terp-credentials__fallback" href={mailtoHref}>
                Open in mail app
              </a>
            ) : null}
          />
        </div>

        {sender && (
          <p className="terp-credentials__from">
            Sent as <strong>{sender}</strong>
            {copyTo && (
              <>
                {" · copy to "}
                <strong>{copyTo}</strong>
              </>
            )}
          </p>
        )}

        </div>

        <footer className="terp-credentials__actions">
          <button type="button" className="terp-credentials__copy" onClick={copy}>
            {copied ? "Copied" : "Copy credentials"}
          </button>
          <button type="button" className="terp-credentials__done" onClick={handleDone}>Done</button>
        </footer>
      </div>
    </div>
  )
}
