import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import mascotImage from "../assets/ChatGPT Image Sep 25, 2026, 01_38_19 PM.png"
import CredentialsModal from "../components/CredentialsModal"
import {
  TERP_LICENSE_ENDPOINT,
  createTerpLicense,
  extractClientId,
  extractLicenseKey,
  fetchTerpProjects,
  findClientRecord,
  findClientWorkspace,
  getNetworkError,
  isLicenseRegistered,
  isLicensePayload,
  prefetchTerpRegisters,
  resetTerpRegisters,
} from "../api/terpLicense"
import { USER_MASTER_ENDPOINT, createClientAdmin, enableProjectsForClient, findClientLogins, splitContactName } from "../api/userMaster"
import { normaliseReferralCode, submitAgentReferral } from "../api/agentReferral"
import { ensureClientCountry, fetchFinancialYearCountries, findClientFinancialYears } from "../api/financialYear"
import { findCompanyMaster, pushCompanyMaster } from "../api/companyMaster"
import {
  buildCredentialsMessage,
  buildCredentialsSubject,
  sendCredentialsEmail,
  sendWhatsApp,
} from "../api/notifications"
import "./TERPLogin.scss"

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client"
const DEFAULT_PACKAGES = ["Basic", "Standard", "Platinum", "Enterprise"]
// `place` is the town the licence was taken in and doubles as the city on the
// company record, so it is asked once. Everything Central Master's company
// register needs and the licence API has no field for is collected here. The
// licence's corporate / group name is never asked: it is always the company name.
const INITIAL_COMPANY = {
  name: "",
  place: "",
  email: "",
  contact_no: "",
  country: "",
  addressLine1: "",
  addressLine2: "",
  district: "",
  state: "",
  gstNumber: "",
  panNumber: "",
  referralCode: "",
  // Data URL of the picked image; only the base64 part is posted.
  logo: "",
  logoName: "",
}

// The company form is validated field by field: the order here decides which
// input gets focus when the operator submits an incomplete form.
const COMPANY_FIELDS = ["name", "place", "country", "contact_no", "addressLine1", "district", "state", "gstNumber", "panNumber"]
const COMPANY_FIELD_IDS = {
  name: "terp-company-name",
  place: "terp-company-place",
  country: "terp-company-country",
  contact_no: "terp-company-contact",
  addressLine1: "terp-company-address1",
  district: "terp-company-district",
  state: "terp-company-state",
  gstNumber: "terp-company-gst",
  panNumber: "terp-company-pan",
  referralCode: "terp-company-referral",
}

// Central Master stores the GSTIN and PAN as printed on the registration
// certificate, so they are validated in their canonical shape.
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
// The register stores the logo as base64 in the request itself, so a huge image
// would be uploaded twice (to the SPA request and to the register). 2 MB covers a
// normal logo export while the encoded body stays around 2.7 MB. The label is
// derived from the limit so the two messages below cannot drift from it.
const LOGO_MAX_MB = 2
const LOGO_MAX_BYTES = LOGO_MAX_MB * 1024 * 1024
const LOGO_MAX_LABEL = `${LOGO_MAX_MB} MB`
// The register decodes the image itself and accepts only these three types.
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"]

// Project names arrive from two different services, so they are compared without
// case, spacing or punctuation ("Melone Stay" vs "melone  stay").
const normaliseName = (value) => String(value || "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim()

// The license API creates records and rejects duplicates with a 500, so a license
// that already exists for this address is remembered for the rest of the tab.
const LICENSE_CACHE_PREFIX = "terp-license:"

function readCachedLicense(email) {
  try {
    const raw = window.sessionStorage.getItem(LICENSE_CACHE_PREFIX + String(email).toLowerCase())
    if (!raw) return null
    const cached = JSON.parse(raw)
    // Only a license that names its key / client id is real. Anything else (an
    // empty 2xx body cached by an earlier attempt) would otherwise keep
    // reporting "license created" for a license T-ERP never wrote.
    return isLicensePayload(cached) ? cached : null
  } catch {
    return null
  }
}

function cacheLicense(email, license) {
  try {
    window.sessionStorage.setItem(LICENSE_CACHE_PREFIX + String(email).toLowerCase(), JSON.stringify(license))
  } catch {
    // Private mode or a full quota: the in-memory ref still covers this session.
  }
}

function dropCachedLicense(email) {
  try {
    window.sessionStorage.removeItem(LICENSE_CACHE_PREFIX + String(email).toLowerCase())
  } catch {
    // Nothing to clean up.
  }
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
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

export default function TERPLogin() {
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)
  const licenseRef = useRef(null)
  // True when licenseRef holds a license this page just created, not one restored
  // from sessionStorage: only the latter has to be checked against T-ERP again.
  const createdHereRef = useRef(false)
  const [googleUser, setGoogleUser] = useState(null)
  const [setupStep, setSetupStep] = useState(1)
  const [projects, setProjects] = useState([])
  // Countries come from Central Master's financial-year register; the select is
  // disabled until they arrive so nothing invalid can be picked.
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [selectedProjects, setSelectedProjects] = useState([])
  // Projects the operator picked without a package; they are highlighted and
  // scrolled to so the missing select cannot hide below the fold.
  const [incompleteProjects, setIncompleteProjects] = useState([])
  const projectCardRefs = useRef(new Map())
  // Filled in when the signed-in Gmail already exists in the T-ERP client list.
  const [workspace, setWorkspace] = useState(null)
  // Country already stored in the financial-year register for this Gmail id. It
  // decided the books that exist, so the form shows it but cannot change it.
  const [registeredCountry, setRegisteredCountry] = useState("")
  // True while the license register is being read, so step 1 can say why the
  // owned-project ticks are not there yet.
  const [checkingWorkspace, setCheckingWorkspace] = useState(false)
  // Set when the register could not be read: without it nothing can be ticked,
  // and staying silent made a failed lookup look like "you own nothing".
  const [workspaceError, setWorkspaceError] = useState("")
  const [company, setCompany] = useState(INITIAL_COMPANY)
  // Messages keyed by the company field they belong to, so the form marks
  // exactly which input is missing instead of showing one combined error.
  const [fieldErrors, setFieldErrors] = useState({})
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [credentials, setCredentials] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [delivery, setDelivery] = useState({ whatsapp: { state: "idle" }, email: { state: "idle" } })
  const [retrying, setRetrying] = useState({ whatsapp: false, email: false })

  useEffect(() => {
    let cancelled = false
    fetchTerpProjects()
      .then((items) => {
        if (!cancelled) setProjects(items)
      })
      .catch((fetchError) => {
        if (!cancelled) setError(getNetworkError(fetchError, "the projects API"))
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchFinancialYearCountries()
      .then((items) => {
        if (cancelled) return
        setCountries(items)
        // India stays the default because that is where the licence is sold;
        // any country list without it simply starts on its first entry.
        setCompany((current) => current.country
          ? current
          : { ...current, country: items.some((item) => item.name === "INDIA") ? "INDIA" : items[0]?.name || "" })
      })
      .catch((fetchError) => {
        if (!cancelled) setError(getNetworkError(fetchError, "the country list API"))
      })
      .finally(() => {
        if (!cancelled) setLoadingCountries(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    let frame = 0

    // Google renders its button inside an <iframe> at a fixed pixel width, so the
    // width is measured from the card: 360 is wider than a 360px phone card and
    // would push the button past the card edge.
    const paintGoogleButton = () => {
      const host = googleButtonRef.current
      if (!window.google?.accounts?.id || !host) return
      const width = Math.min(360, Math.max(200, Math.floor(host.clientWidth || 360)))
      // renderButton appends a fresh iframe on every call, so a resize repaint
      // has to clear the previous one instead of stacking them.
      host.replaceChildren()
      window.google.accounts.id.renderButton(host, {
        theme: "outline",
        size: "large",
        width,
        text: "continue_with",
        logo_alignment: "center",
      })
      // Google personalises this button with the signed-in account ("Continue as
      // Arun") and offers no switch to turn that off. The iframe is therefore kept
      // invisible underneath our own label and only serves as the click surface.
      host.querySelectorAll("iframe").forEach((node) => {
        node.setAttribute("title", "Continue with Google")
      })
    }

    const repaintGoogleButton = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(paintGoogleButton)
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current) return
        if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
          setError("Google Sign-In is not configured for this site. Set VITE_GOOGLE_CLIENT_ID and rebuild the production bundle.")
          return
        }
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (response) => {
            // The ID token is intentionally kept in memory. A production API should
            // verify this token server-side before trusting the Google identity.
            const [, payload] = response.credential.split(".")
            const profile = JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
            setGoogleUser({ name: profile.name, email: profile.email, picture: profile.picture, credential: response.credential })
            setCompany((current) => ({ ...current, email: profile.email }))
            setError("")
          },
        })
        paintGoogleButton()
        // Rotating a phone or resizing a desktop window changes the card width.
        window.addEventListener("resize", repaintGoogleButton)
      })
      .catch(() => setError("Google Sign-In could not be loaded. Check your connection and try again."))
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", repaintGoogleButton)
    }
  }, [])

  // A client whose financial year is already on file keeps the country that
  // decided those books: it is shown, locked, and never rewritten here.
  useEffect(() => {
    const candidate = String(googleUser?.email || "").trim()
    if (!candidate.includes("@")) return undefined
    let cancelled = false

    findClientFinancialYears(candidate)
      .then((rows) => {
        if (cancelled || !rows.length) return
        const stored = String(rows[0]?.country_name || "").trim().toUpperCase()
        if (!stored) return
        setRegisteredCountry(stored)
        setCompany((current) => ({ ...current, country: stored }))
      })
      .catch(() => {
        // The register is a convenience here: a failed lookup leaves the
        // dropdown usable instead of blocking the signup.
      })

    return () => { cancelled = true }
  }, [googleUser])

  useEffect(() => {
    // Pull both T-ERP registers while the visitor is still on step 1, so the
    // projects they already own are ready to be ticked the moment Google returns
    // instead of being fetched on that critical path.
    prefetchTerpRegisters()
  }, [])

  // A returning customer is recognised by the Gmail used to sign in and by the
  // company email typed on the form, because either can be the client id in T-ERP:
  // the directory says who they are, the register says what they already own.
  useEffect(() => {
    const candidate = String(company.email || googleUser?.email || "").trim()
    if (!candidate.includes("@")) return
    let cancelled = false

    // The ticks only need the license register, so the cards are marked as soon
    // as it lands; the company name and place follow with the directory.
    setCheckingWorkspace(true)
    setWorkspaceError("")
    const tickOwnedProjects = (projects) => {
      if (cancelled) return
      setWorkspace((current) => ({
        clientId: current?.clientId || candidate,
        companyName: current?.companyName || "",
        place: current?.place || "",
        // Ticks always come from the register that just answered, so a project
        // added in this tab appears and a removed one stops showing.
        projects,
      }))
    }

    findClientWorkspace(candidate, tickOwnedProjects)
      .then((found) => {
        if (cancelled) return
        if (!found) {
          // The live register lists neither this client nor a licence for it, so a
          // tick restored from the local snapshot belongs to a licence that no
          // longer exists and has to go.
          setWorkspace(null)
          return
        }
        // Upgrade the partial workspace the register produced with the company
        // name and place the directory adds — never downgrade those. The projects
        // come from the live register that just answered, so a tick restored from
        // the local snapshot is cleared when the server no longer licenses it.
        setWorkspace((current) => ({
          clientId: found.clientId || current?.clientId || candidate,
          companyName: current?.companyName || found.companyName || "",
          place: current?.place || found.place || "",
          projects: found.projects || [],
        }))
        setCompany((current) => {
          const filled = {
            ...current,
            name: current.name || found.companyName,
            place: current.place || found.place,
          }
          return filled.name === current.name && filled.place === current.place ? current : filled
        })
      })
      .catch((lookupError) => {
        // Recognition is a convenience: a brand new signup must still go through,
        // but the operator has to know the ticks are missing because the lookup
        // failed rather than because the client owns nothing.
        if (cancelled) return
        setWorkspaceError(
          `${getNetworkError(lookupError, "the license register")} Nothing is ticked until it can be read.`,
        )
      })
      .finally(() => {
        if (!cancelled) setCheckingWorkspace(false)
      })

    return () => { cancelled = true }
  }, [googleUser, company.email])

  const ownedProjects = new Set((workspace?.projects || []).map(normaliseName))
  // Only the owned projects that the catalogue can actually show get a ticked card.
  const tickedOwned = projects.filter((item) => ownedProjects.has(normaliseName(item.name))).length

  const getPackages = (project) => project?.packages?.length ? project.packages : DEFAULT_PACKAGES

  // `api_endpoint` is carried along because the user-master product flags are
  // derived from it — the license API itself only receives project + package.
  const toggleProject = (project) => {
    const alreadyPicked = selectedProjects.some((item) => item.project === project.name)
    setSelectedProjects((current) => current.some((item) => item.project === project.name)
      ? current.filter((item) => item.project !== project.name)
      : [...current, { project: project.name, package: "", api_endpoint: project.api_endpoint }])
    setError("")
    setIncompleteProjects([])
    // A newly added card reveals its package select; make sure it is on screen.
    if (!alreadyPicked) {
      requestAnimationFrame(() => {
        projectCardRefs.current.get(project.name)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
      })
    }
  }

  const updateProjectPackage = (projectName, packageName) => {
    setSelectedProjects((current) => current.map((item) => item.project === projectName ? { ...item, package: packageName } : item))
    if (packageName) setIncompleteProjects((current) => current.filter((name) => name !== projectName))
  }

  // Every added project needs its own package before the license can be built.
  const findMissingPackages = () => selectedProjects.filter((item) => !item.package).map((item) => item.project)

  const flagMissingPackages = (missing) => {
    setIncompleteProjects(missing)
    setError(`Choose a package for ${missing.join(" and ")}.`)
    const card = projectCardRefs.current.get(missing[0])
    if (!card) return
    card.scrollIntoView({ block: "center", behavior: "smooth" })
    card.querySelector("select")?.focus({ preventScroll: true })
  }

  const clearFieldError = (field) => setFieldErrors((current) => {
    if (!current[field]) return current
    const next = { ...current }
    delete next[field]
    return next
  })

  const updateCompany = (field) => (event) => {
    const { value } = event.target
    setCompany((current) => ({ ...current, [field]: value }))
    clearFieldError(field)
  }

  const formatContactNumber = (value) => value.replace(/\D/g, "").slice(0, 10)

  // GSTIN and PAN are printed in capitals: folding as the operator types keeps
  // the value valid without asking them to hold shift.
  const updateCompanyCode = (field, maxLength) => (event) => {
    const value = event.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, maxLength)
    setCompany((current) => ({ ...current, [field]: value }))
    clearFieldError(field)
  }

  // Referral codes look like "AG-UFC9RR": capitals, digits and dashes, so the
  // hyphens that separate the partner prefix are kept while the code is folded.
  const updateReferralCode = (event) => {
    const value = event.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, "").slice(0, 32)
    setCompany((current) => ({ ...current, referralCode: value }))
    clearFieldError("referralCode")
  }

  // The register wants the logo as bare base64, so the picked image is kept as a
  // data URL (for the preview) and only the part after the comma is posted. The
  // file is checked here, before a submit, so an oversized image never reaches
  // Central Master.
  // Central Master decodes the logo itself and answers "Logo must be one of:
  // image/jpeg, image/png, image/webp." for anything else, so an SVG picked
  // here would have blocked the whole company record.
  const readCompanyLogo = (event) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    clearFieldError("logo")

    if (!LOGO_TYPES.includes(String(file.type || "").toLowerCase())) {
      input.value = ""
      setFieldErrors((current) => ({ ...current, logo: "Choose a PNG, JPG or WebP image — the company register cannot read other formats." }))
      return
    }
    if (file.size > LOGO_MAX_BYTES) {
      input.value = ""
      setFieldErrors((current) => ({ ...current, logo: `The logo must be smaller than ${LOGO_MAX_LABEL}.` }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setCompany((current) => ({ ...current, logo: String(reader.result || ""), logoName: file.name }))
    }
    reader.onerror = () => {
      input.value = ""
      setFieldErrors((current) => ({ ...current, logo: "That file could not be read." }))
    }
    reader.readAsDataURL(file)
  }

  const removeCompanyLogo = (event) => {
    // The <input type=file> keeps its selection unless the element is cleared.
    const field = event.currentTarget.closest(".terp-login__field")?.querySelector('input[type="file"]')
    if (field) field.value = ""
    setCompany((current) => ({ ...current, logo: "", logoName: "" }))
  }

  const continueToCompany = async () => {
    setError("")
    // Until the register answers, a returning client is indistinguishable from a
    // new one, and asking them for details that are already on file is exactly
    // what this step must avoid.
    if (checkingWorkspace) {
      return setError("Still checking whether this client already exists — try again in a moment.")
    }
    if (!selectedProjects.length) {
      return setError(
        workspace
          ? "Everything you already own is ticked. Add a new project to continue."
          : "Select at least one project to continue.",
      )
    }
    if (selectedProjects.some((item) => !item.package)) return flagMissingPackages(findMissingPackages())
    setIncompleteProjects([])

    // A client who already owns a project already has their company row on file,
    // so they are never asked for it again: the stored details are read here and
    // posted straight to the license API with the new project.
    if (workspace) {
      setSubmitting(true)
      try {
        const stored = await readStoredCompany([workspace.clientId, company.email, googleUser?.email])
        setCompany((current) => ({ ...current, ...stored }))
        // Without a name, a place and a contact number the license API would be
        // given a company it cannot identify, so this client falls back to the
        // form — the only case where it is still shown.
        if (!stored.name || !stored.place || !stored.contact_no) {
          setError(
            "Your company details could not be read from Central Master, so they have to be entered once. " +
              "They are saved against your client id and will not be asked for again.",
          )
          setSetupStep(2)
          return
        }
        await runSignup(stored)
      } catch (lookupError) {
        setError(getNetworkError(lookupError, "the company register"))
      } finally {
        setSubmitting(false)
      }
      return
    }

    setSetupStep(2)
  }

  // The company details Central Master already holds for a returning client:
  // the register row is the source of truth, the T-ERP directory names the
  // company and its place, and the login they already own carries the contact
  // number when the register has no row for them yet. Only the fields the license
  // API itself posts are taken — the statutory ones are already stored and are
  // never re-typed here.
  const readStoredCompany = async (clientIds) => {
    const wanted = clientIds.map((value) => String(value || "").trim()).filter(Boolean)
    const logins = await findClientLogins({
      clientId: wanted[0],
      email: googleUser?.email || company.email,
    }).catch(() => [])
    // A client whose T-ERP id is a generated code is only listed under that code,
    // and the login they own is the one place this page can read it from.
    const candidates = [
      ...new Set([
        ...wanted,
        ...logins.map((login) => String(login?.client_id || "").trim()),
      ].filter(Boolean)),
    ]
    if (!candidates.length) return {}

    const [rows, records] = await Promise.all([
      findCompanyMaster(candidates[0], { alternateClientIds: candidates.slice(1) }).catch(() => []),
      Promise.all(candidates.map((id) => findClientRecord(id).catch(() => null))),
    ])
    const row = rows[0] || null
    const record = records.find(Boolean) || null
    // A client provisioned before the company register existed has no row, but
    // the number they were sent a login for is still on file. Both registers hold
    // numbers that predate the 10-digit rule, so only a full one is used.
    const cleanPhone = (value) => String(value || "").replace(/\D/g, "").slice(0, 10)
    const rowPhone = cleanPhone(row?.phone_number)
    const loginPhone = logins
      .map((login) => cleanPhone(login?.phone_number))
      .find((value) => value.length === 10)
    const stored = {}

    const put = (field, value) => {
      const cleaned = String(value || "").trim()
      if (cleaned) stored[field] = cleaned
    }
    put("name", row?.company_name || workspace?.companyName || record?.companyName)
    put("place", row?.city || workspace?.place || record?.place)
    put("contact_no", (rowPhone.length === 10 ? rowPhone : "") || loginPhone)
    put("country", row?.country || registeredCountry)
    put("addressLine1", row?.address_line_1)
    put("addressLine2", row?.address_line_2)
    put("district", row?.district)
    put("state", row?.state)
    put("gstNumber", row?.gst_number)
    put("panNumber", row?.pan_number)
    put("referralCode", row?.referral_code)

    return stored
  }

  const credentialsMessage = (target) => buildCredentialsMessage({
    companyName: target.companyName,
    projects: target.projects,
    clientId: target.clientId,
    username: target.username,
    password: target.password,
    email: target.email,
    licenseKey: target.licenseKey,
  })

  const deliverWhatsApp = async (target) => {
    setDelivery((current) => ({ ...current, whatsapp: { state: "pending" } }))
    try {
      await sendWhatsApp({ recipient: target.phone, message: credentialsMessage(target) })
      setDelivery((current) => ({ ...current, whatsapp: { state: "sent" } }))
    } catch (deliveryError) {
      setDelivery((current) => ({ ...current, whatsapp: { state: "failed", message: deliveryError.message } }))
    }
  }

  const deliverEmail = async (target) => {
    setDelivery((current) => ({ ...current, email: { state: "pending" } }))
    try {
      await sendCredentialsEmail({
        to: target.email,
        subject: buildCredentialsSubject(target.companyName),
        body: credentialsMessage(target),
      })
      setDelivery((current) => ({ ...current, email: { state: "sent" } }))
    } catch (deliveryError) {
      setDelivery((current) => ({ ...current, email: { state: "failed", message: deliveryError.message } }))
    }
  }

  const retryWhatsApp = async () => {
    if (!credentials) return
    setRetrying((current) => ({ ...current, whatsapp: true }))
    await deliverWhatsApp(credentials)
    setRetrying((current) => ({ ...current, whatsapp: false }))
  }

  const retryEmail = async () => {
    if (!credentials) return
    setRetrying((current) => ({ ...current, email: true }))
    await deliverEmail(credentials)
    setRetrying((current) => ({ ...current, email: false }))
  }

  const closeModal = () => {
    setModalOpen(false)
    // A new submission must build a new license instead of reusing this one.
    licenseRef.current = null
    createdHereRef.current = false
    if (credentials?.email) dropCachedLicense(credentials.email)
  }

  // "Done" ends the signup rather than only dismissing the dialog, so the
  // operator lands back on the home page instead of an empty wizard.
  const finishSetup = () => {
    closeModal()
    navigate("/")
  }

  // The financial-year register is written once per client: when a row already
  // exists the stored country stays untouched, because it already drives the
  // client's books. A lookup or write failure is reported next to the
  // credentials instead of hiding the login that was just created.
  const registerClientCountry = async (clientId, countryName) => {
    try {
      return await ensureClientCountry({ clientId, countryName })
    } catch (countryError) {
      return { created: false, error: ` The country (${countryName}) could not be registered: ${countryError.message}` }
    }
  }

  // Central Master's company register is written after the license exists: its
  // client id and its license key are only known by then, and they are what ties
  // a company row (GSTIN, PAN, address, logo) back to it. The fields the form
  // already collects are reused here — name, email, contact number, country and
  // the place, which the register calls the city — so nothing is asked twice.
  //
  // This only ever runs on the signup path, where the client id was minted
  // seconds ago and nothing can be on file for it yet: the write runs even when
  // the register's list cannot be read, since that read 404s on part of Central
  // Master's fleet. A returning client never reaches here — their row is what
  // their details are read from, and rewriting it would blank stored values.
  const registerCompanyMaster = async ({
    clientId: recordClientId,
    alternateClientIds = [],
    licenseKey: recordLicenseKey,
    email: recordEmail,
    phoneNumber: recordPhone,
    companyName: recordName,
  }) => {
    const details = {
      clientId: recordClientId,
      // The register only accepts a client id T-ERP has on file, and the id the
      // admin login was created under is not always the one T-ERP registered
      // (the Google address versus the id its license API generated). Every id
      // is handed over and the register decides; see writeCompany.
      alternateClientIds,
      licenseKey: recordLicenseKey,
      companyName: recordName,
      email: recordEmail,
      phoneNumber: recordPhone,
      referralCode: company.referralCode,
      gstNumber: company.gstNumber,
      panNumber: company.panNumber,
      addressLine1: company.addressLine1,
      addressLine2: company.addressLine2,
      city: company.place,
      district: company.district,
      state: company.state,
      country: company.country,
      // "data:image/png;base64,XXXX" — the register stores only XXXX.
      logo: String(company.logo || "").split(",")[1] || "",
    }

    try {
      const saved = await pushCompanyMaster(details)
      // The register decodes the image itself: when it refused the logo the row
      // was written again without it, and that is what the operator is told.
      if (saved?.logoDropped) {
        return { ...saved, error: " The company logo was not accepted by the register, so the company details were saved without it." }
      }
      return saved
    } catch (companyError) {
      return { created: false, error: ` The company details could not be saved to Central Master: ${companyError.message}` }
    }
  }

  const submit = (event) => {
    event.preventDefault()
    return runSignup()
  }

  // `stored` is set when the client is returning and their company details were
  // read from Central Master instead of typed here. Nothing on the form was
  // asked, so only what the license API itself needs is required.
  const runSignup = async (stored = null) => {
    setError("")
    setSuccess("")
    const form = stored ? { ...company, ...stored } : company
    const fromRegister = Boolean(stored)
    if (!googleUser) return setError("Continue with Google before submitting your company details.")
    // The ticks that say what the client already owns come from the register. A
    // submit while it is still loading cannot see them and would post a licence
    // for products they already have.
    if (checkingWorkspace) {
      return setError("Still checking which projects you already own — try again in a moment.")
    }
    if (!selectedProjects.length) {
      return setError(workspace
        ? "Everything you already own is ticked. Add a new project to continue."
        : "Select at least one project to continue.")
    }
    if (selectedProjects.some((item) => !item.package)) return flagMissingPackages(findMissingPackages())
    // Missing fields are marked under their own input and the first one is
    // focused, so the operator fixes the form in place.
    const missing = {}
    if (!form.name.trim()) missing.name = "Enter the company name."
    if (!form.place.trim()) missing.place = "Enter the place."
    if (!form.country.trim()) missing.country = "Select the country the license applies to."
    if (!form.contact_no.trim()) missing.contact_no = "Enter the contact number."
    else if (form.contact_no.length !== 10) missing.contact_no = "Enter a valid 10-digit number, for example 1234567890."
    // The address and statutory numbers only exist for Central Master's company
    // register, which a returning client's row already fills — asking again just
    // to blank stored values is exactly what this form must not do.
    if (!fromRegister) {
      if (!form.addressLine1.trim()) missing.addressLine1 = "Enter the street address."
      if (!form.district.trim()) missing.district = "Enter the district."
      if (!form.state.trim()) missing.state = "Enter the state."
      // The register refuses a blank GSTIN or PAN ("This field may not be
      // blank"), so leaving them out only made the company record silently
      // fail. They are required here and whatever is typed has to be the shape
      // support will see on the certificate.
      if (!form.gstNumber.trim()) missing.gstNumber = "Enter the GSTIN."
      else if (!GST_PATTERN.test(form.gstNumber.trim())) {
        missing.gstNumber = "Enter a valid 15-character GSTIN, for example 32AAACA1234A1Z5."
      }
      if (!form.panNumber.trim()) missing.panNumber = "Enter the PAN."
      else if (!PAN_PATTERN.test(form.panNumber.trim())) {
        missing.panNumber = "Enter a valid 10-character PAN, for example AAACA1234A."
      }
    }

    if (Object.keys(missing).length) {
      setFieldErrors(missing)
      const first = COMPANY_FIELDS.find((field) => missing[field])
      requestAnimationFrame(() => document.getElementById(COMPANY_FIELD_IDS[first])?.focus())
      return setError(Object.values(missing)[0])
    }
    setFieldErrors({})

    setSubmitting(true)
    try {
      // The company email is the Google address the client signed in with, so
      // the client id always matches the login they authenticated with.
      const email = (googleUser?.email || form.email).trim()
      const phoneNumber = form.contact_no.replace(/\D/g, "")

      // One client id = one login. Central Master's user list is the only place
      // that can prove the client already exists, so nothing at all is created
      // until that lookup comes back. Only the client id and the address count:
      // a contact number shared with another company must never read as "this
      // client already has a login" while no user and no license carry this id.
      let existingLogins = []
      try {
        existingLogins = await findClientLogins({
          clientId: licenseRef.current ? extractClientId(licenseRef.current) : "",
          email,
        })
      } catch {
        throw new Error(
          `Could not check existing logins, so nothing was created. ${USER_MASTER_ENDPOINT} did not respond.`,
        )
      }
      const hasLogin = existingLogins.length > 0
      // Logins that really carry this client id. Only those collide with the id
      // this signup provisions; an email match stored on a different client id is
      // a separate account and must never block the license.
      const ownLogins = existingLogins.filter(
        (login) => String(login?.client_id || "").trim().toLowerCase() === email.toLowerCase(),
      )

      // An existing login decides who gets the licence, and neither case may mint
      // a second account or resend credentials nobody asked for:
      //   - with a workspace the client is returning for another product;
      //   - without one T-ERP no longer holds their client, so the licence just
      //     rebuilt below is what makes the login they already own work again.
      const returningClient = workspace ? hasLogin : ownLogins.length > 0

      // A partner's referral code is credited on the agent portal for the address
      // the customer signed in with — the same address the licence and the admin
      // login below carry. The credit is confirmed first: a code the portal does
      // not accept stops the signup here, so no licence and no login are created
      // for a referral that was never recorded. A returning client typed no code
      // here (their row carries the one they were credited with the first time),
      // and a pair that already confirmed is never posted twice on a retry.
      const referralCode = normaliseReferralCode(form.referralCode)
      if (!returningClient && referralCode) {
        try {
          await submitAgentReferral({ email, referralCode })
        } catch (referralError) {
          const message =
            `The referral code "${referralCode}" could not be confirmed, so no license and no login were created. ` +
            `${getNetworkError(referralError, "the agent referral API")}`
          setFieldErrors((current) => ({ ...current, referralCode: message }))
          requestAnimationFrame(() => document.getElementById(COMPANY_FIELD_IDS.referralCode)?.focus())
          throw new Error(message, { cause: referralError })
        }
      }

      // A license created during this page session is reused as-is, so a failed
      // account step never posts a duplicate license. One restored from an
      // earlier attempt is reused only while T-ERP still lists its client: when
      // the signup was wiped in T-ERP (license, client and user deleted) the
      // cached license is dead and the signup must start over like a first one.
      let license = createdHereRef.current ? licenseRef.current : null
      if (!license) {
        const cached = licenseRef.current || readCachedLicense(email)
        // A failed lookup keeps the cached license: dropping a live one would
        // cost a duplicate-license error on the next POST.
        const stillRegistered = cached
          ? await isLicenseRegistered({
            email,
            clientId: extractClientId(cached),
          }).catch(() => true)
          : false

        if (cached && stillRegistered) {
          license = cached
        } else {
          license = await createTerpLicense({
            company: form,
            projects: selectedProjects.map(({ project, package: packageName }) => ({ project, package: packageName })),
          })
          createdHereRef.current = true
        }
      }
      licenseRef.current = license
      cacheLicense(email, license)

      // T-ERP reports what it actually wrote: created_count 0 with skipped_count 1
      // means the company still has a license for these projects, so nothing was
      // created and no client id was registered. Central Master can then only
      // answer "Unknown client_id", which used to be reported as a created license.
      const createdCount = Number(license.created_count) || 0
      const skippedCount = Number(license.skipped_count) || 0
      const freshLicense = createdHereRef.current && createdCount > 0

      if (!freshLicense) {
        const stillRegistered = await isLicenseRegistered({ email, clientId: extractClientId(license) }).catch(() => true)
        if (!stillRegistered) {
          // Nothing left can be fixed from here: drop the dead license so the next
          // submit asks T-ERP again instead of reusing it.
          licenseRef.current = null
          createdHereRef.current = false
          dropCachedLicense(email)
          throw new Error(
            `The license was not created. The license server answered: "${license.message || `${skippedCount} licence(s) skipped`}" — ` +
              `it still holds a license/company for "${email}" from the deleted signup, so it creates nothing and ` +
              `registers no client (that is why Central Master answers "Unknown client_id"). Delete that company and ` +
              `its license rows in Trellisco, then submit again — a company the license server no longer knows is licensed and ` +
              `registered exactly like a first-time signup.`,
          )
        }
      }

      // The id the customer is told about is their Gmail address: the same id
      // then identifies the Central Master login, the WhatsApp/email message and
      // their T-ERP sign-in.
      const clientId = email
      // Central Master only accepts an id T-ERP has licensed. The email is what
      // the customer recognises and is tried first; the id the license API
      // actually created is the fallback when T-ERP never registered the email
      // under it (that is the "Unknown client_id" rejection).
      const licensedClientId = extractClientId(license)
      const licenseKey = extractLicenseKey(license)
      const companyName = form.name.trim()
      const addedProjects = selectedProjects.map((item) => item.project)

      // A returning client keeps the account they already own: the project just
      // added is switched on for it, and no second login is created.
      if (returningClient) {
        let updatedLogins = 0
        try {
          updatedLogins = (await enableProjectsForClient({
            logins: workspace ? existingLogins : ownLogins,
            clientId,
            selectedProjects,
          })).updated
        } catch (updateError) {
          throw new Error(
            `The license was created, but the new project could not be enabled on the existing login: ${updateError.message}`,
            { cause: updateError },
          )
        }

        licenseRef.current = null
        dropCachedLicense(email)

        // A returning customer only came back for a new product: if their country
        // is already on file it is left exactly as it is, and it is only added
        // for a legacy client that has no financial year yet.
        const country = await registerClientCountry(clientId, form.country)
        // Their company row is already on file — that is where these details came
        // from — and this signup asked for none of the statutory fields, so there
        // is nothing to write. A blind write would blank the GSTIN, PAN and
        // address support relies on.
        const notes = country.error || ""

        if (notes) {
          // The products were switched on, but the country or the company details
          // could not be written: stay on the page so the operator reads it, and
          // refresh the ticks for the project that was just added.
          setSelectedProjects([])
          setSetupStep(1)
          setSuccess(
            `Added ${addedProjects.join(", ")} to ${companyName}.` +
              (updatedLogins ? ` Switched on for ${updatedLogins} existing login${updatedLogins > 1 ? "s" : ""}.` : "") +
              " Your existing Trellisco login still works — no new user and no new password were created.",
          )
          setError(notes.trim())
          // The registers changed with this licence: drop what was read before so
          // the ticks show the project that was just added.
          resetTerpRegisters()
          findClientWorkspace(email).then((found) => { if (found) setWorkspace(found) }).catch(() => {})
          return
        }

        if (!workspace) {
          // The licence was rebuilt for a client id Central Master already owns:
          // the login it carries starts working again the moment T-ERP lists the
          // client, so the operator is told that instead of being handed a
          // second account. Nothing is left to do on this page.
          setSelectedProjects([])
          setSetupStep(1)
          setSuccess(
            `License ready for ${companyName}.` +
              (updatedLogins ? ` Switched on for ${updatedLogins} existing login${updatedLogins > 1 ? "s" : ""}.` : "") +
              " Your existing Trellisco login works again — no new user and no new password were created.",
          )
          // Same refresh: the projects just licensed have to show as ticked.
          resetTerpRegisters()
          findClientWorkspace(email).then((found) => { if (found) setWorkspace(found) }).catch(() => {})
          return
        }

        // Same exit as the credentials popup's Done button: the project is already
        // on their account, so the signup is over and the wizard returns home.
        navigate("/")
        return
      }

      // The admin account is named after the Google identity the client signed
      // in with; there is no separate contact-person field on the form.
      const { firstName, lastName } = splitContactName(googleUser?.name, companyName)

      let account
      try {
        account = await createClientAdmin({
          clientId,
          alternateClientIds: licensedClientId ? [licensedClientId] : [],
          firstName,
          lastName,
          email,
          phoneNumber,
          selectedProjects,
          // The username is the Gmail handle the client signed in with
          // ("sajiththomas231@gmail.com" -> "sajiththomas231"), not the company
          // email that doubles as the client id.
          usernameEmail: googleUser?.email || email,
        })
      } catch (error) {
        if (!/unknown client_id/i.test(String(error?.message || ""))) throw error
        // The license was accepted, but T-ERP has no client for it, so Central
        // Master has nothing to attach the login to. T-ERP keeps a license/company
        // row for an email whose corporate was deleted, and that row makes
        // license/create skip every further attempt: the signup can never repair
        // itself until the company and its licenses are removed in T-ERP.
        throw new Error(
          `${error.message} — Trellisco has no client for "${email}": the license exists, but the company was not ` +
            `registered again. Delete the company "${form.name}" and its license rows in Trellisco ` +
            `(there is no client-creation API), then submit again.`,
          { cause: error },
        )
      }

      // The login may have been accepted under the id the license generated
      // rather than the email, so the country and the credentials follow the id
      // Central Master stored.
      const accountClientId = account.clientId || clientId

      // The country decides which financial year the client's books follow, so
      // it is registered against the same client id right after the login
      // exists — but never over an existing registration.
      const country = await registerClientCountry(accountClientId, form.country)
      // The company register needs the client id and the licence key, so it can
      // only be written now. This signup minted the client id minutes ago, so the
      // row is created even if the register's list 404s (see findCompanyMaster).
      const companyRecord = await registerCompanyMaster({
        clientId: accountClientId,
        // T-ERP validates the id on every write: the admin account may sit under
        // the Google address while T-ERP registered the client under the id its
        // license API generated.
        alternateClientIds: [licensedClientId],
        licenseKey,
        email,
        phoneNumber,
        companyName,
      })
      const notes = `${country.error || ""}${companyRecord.error || ""}`

      const created = {
        clientId: accountClientId,
        licenseKey,
        companyName,
        email,
        phone: form.contact_no,
        projects: selectedProjects.map((item) => item.project),
        username: account.username,
        password: account.password,
      }

      setCredentials(created)
      // Both channels go out on their own: the credentials are never left behind
      // a button. A channel that fails says why and offers a retry.
      setDelivery({ whatsapp: { state: "pending" }, email: { state: "pending" } })
      setModalOpen(true)
      setSuccess(`License created. The admin login is ready below.${notes}`)

      deliverWhatsApp(created)
      deliverEmail(created)
    } catch (submitError) {
      const licensed = Boolean(licenseRef.current)
      // Errors that already explain the half-finished state must not be prefixed twice.
      const explained = /^The license was created/i.test(submitError.message || "")
      const prefix = licensed && !explained ? "The license was created, but the admin account could not be set up: " : ""
      setError(`${prefix}${getNetworkError(submitError, licensed ? USER_MASTER_ENDPOINT : TERP_LICENSE_ENDPOINT)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={`terp-login${googleUser ? " terp-login--setup" : ""}`}>
      <section className="terp-login__intro">
        <span className="terp-login__eyebrow">Trellisco access</span>
        <h1>Set up your Trellisco workspace.</h1>
        <p>Sign in with Google, choose the products your business needs, and create your company license in a few steps.</p>
        <div className="terp-login__steps"><span className={!googleUser ? "is-active" : "is-complete"}>01 <b>Google auth</b></span><span className={googleUser && setupStep === 1 ? "is-active" : setupStep === 2 ? "is-complete" : ""}>02 <b>Choose products</b></span><span className={googleUser && setupStep === 2 ? "is-active" : workspace ? "is-complete" : ""}>03 <b>Company details</b></span></div>
        <div className="terp-login__mascot" aria-hidden="true"><span className="terp-login__mascot-glow" /><img src={mascotImage} alt="" /></div>
      </section>

      <section className="terp-login__card">
        <div className="terp-login__card-head"><span className="terp-login__mark">T</span><div><p>Trellisco ERP</p><h2>{!googleUser ? "Trellisco Login" : setupStep === 1 ? "Build your Trellisco suite" : "Company details"}</h2></div></div>
        {error && <div className="terp-login__message terp-login__message--error" role="alert">{error}</div>}
        {success && <div className="terp-login__message terp-login__message--success" role="status">{success}</div>}

        {!googleUser ? (
          <div className="terp-login__auth-screen">
            <div className="terp-login__auth-badge"><span>1</span><b>Secure Google authentication</b></div>
            <h3>Welcome to Trellisco</h3>
            <p>Use your Google account to securely continue. Your workspace setup form will appear after you sign in.</p>
            <div className="terp-login__google">
              <p>Continue with your Google account</p>
              <div className="terp-login__google-btn">
                <svg className="terp-login__google-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="terp-login__google-label">Continue with Google</span>
                <div className="terp-login__google-hit" ref={googleButtonRef} aria-label="Continue with Google" />
              </div>
            </div>
            <small className="terp-login__privacy">Your Google identity is used only to start your Trellisco setup.</small>
          </div>
        ) : (
        <form className="terp-login__setup-form" onSubmit={submit}>
          <div className="terp-login__flow-status"><span className="terp-login__flow-dot">✓</span><span><small>Google authentication complete</small><b>{googleUser.email}</b></span><span className="terp-login__flow-next">Step {workspace ? 2 : setupStep + 1} of {workspace ? 2 : 3}</span></div>
          {setupStep === 1 ? (
            <div className="terp-login__product-block">
              <div className="terp-login__section"><div><span className="terp-login__number">1</span><h3>Build your Trellisco suite</h3><span className="terp-login__selection-count">{tickedOwned ? `${tickedOwned} active · ${selectedProjects.length} new` : `${selectedProjects.length} selected`}</span></div><p>{checkingWorkspace && !tickedOwned ? "Checking which projects you already own…" : workspaceError || (tickedOwned ? "Your active projects are ticked below — add another project to extend the suite." : "Select projects and a package for each.")}</p></div>
              {workspace && <div className="terp-login__workspace"><b>{workspace.companyName || workspace.clientId}</b><small>{workspace.projects.length ? `${workspace.projects.join(", ")} ${workspace.projects.length > 1 ? "are" : "is"} already active and ticked below.` : "This client is already registered."} Your company details are already on file, so only the new project is added — nothing is asked again.</small></div>}
              <div className="terp-login__project-grid">
                {loadingProjects && <div className="terp-login__loading">Loading available projects…</div>}
                {!loadingProjects && !projects.length && <div className="terp-login__loading">No projects are available right now.</div>}
                {projects.map((item) => {
                  const selected = selectedProjects.find((entry) => entry.project === item.name)
                  const owned = ownedProjects.has(normaliseName(item.name))
                  const incomplete = incompleteProjects.includes(item.name)
                  const packages = getPackages(item)
                  const state = owned ? "is-owned" : incomplete ? "is-incomplete" : selected ? "is-selected" : ""
                  const hint = owned ? "Already active in your workspace" : selected ? "Added to your suite" : "Tap to add project"
                  return <article
                    className={`terp-login__project${state ? ` ${state}` : ""}`}
                    key={item.name}
                    ref={(node) => {
                      if (node) projectCardRefs.current.set(item.name, node)
                      else projectCardRefs.current.delete(item.name)
                    }}
                  >
                    <button type="button" className="terp-login__project-select" onClick={() => toggleProject(item)} disabled={owned} aria-pressed={Boolean(owned || selected)} aria-label={owned ? `${item.name} — already active` : undefined}>
                      <span className="terp-login__project-icon">{item.name.charAt(0).toUpperCase()}</span><span className="terp-login__project-copy"><b>{item.name}</b><small>{hint}</small></span><span className="terp-login__check">✓</span>
                    </button>
                    {selected && !owned && <label className="terp-login__package">Package{incomplete && <em> — required</em>}<select aria-invalid={incomplete || undefined} value={selected.package} onChange={(event) => updateProjectPackage(item.name, event.target.value)}><option value="">Choose package</option>{packages.map((packageName) => <option key={packageName} value={packageName}>{packageName}</option>)}</select></label>}
                  </article>
                })}
              </div>
              <button className="terp-login__next" type="button" onClick={continueToCompany} disabled={submitting}>{workspace ? (submitting ? "Adding the project…" : "Add project to my account") : "Continue to company details"} <span>→</span></button>
            </div>
          ) : (
          <div className="terp-login__company-block">
              <div className="terp-login__section"><div><span className="terp-login__number">2</span><h3>Company details</h3></div><p>Used for your Trellisco license, the admin login we send you and your Central Master company record.</p></div>
              {/* The form is grouped the way the register stores it: who the
                  company is, where it is registered, its statutory numbers and
                  its branding. Each group is a two-column grid from 640px. */}
              <div className="terp-login__group">
                <h4 className="terp-login__group-title">Business details</h4>
                <div className="terp-login__fields">
                  <div className="terp-login__field">
                    <label htmlFor="terp-company-name">Company name</label>
                    <input
                      id="terp-company-name"
                      name="companyName"
                      value={company.name}
                      onChange={updateCompany("name")}
                      placeholder="Acmes Pvt Ltd"
                      autoComplete="organization"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      aria-invalid={fieldErrors.name ? true : undefined}
                      aria-describedby={fieldErrors.name ? "terp-company-name-error" : undefined}
                    />
                    {fieldErrors.name && <span className="terp-login__field-error" id="terp-company-name-error">{fieldErrors.name}</span>}
                  </div>
                  <div className="terp-login__field">
                    <label htmlFor="terp-company-place">Place / city</label>
                    <input
                      id="terp-company-place"
                      name="place"
                      value={company.place}
                      onChange={updateCompany("place")}
                      placeholder="Kochi"
                      autoComplete="address-level2"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      aria-invalid={fieldErrors.place ? true : undefined}
                      aria-describedby={fieldErrors.place ? "terp-company-place-error" : "terp-company-place-hint"}
                    />
                    {fieldErrors.place
                      ? <span className="terp-login__field-error" id="terp-company-place-error">{fieldErrors.place}</span>
                      : <span className="terp-login__hint" id="terp-company-place-hint">Saved as the city on your company record.</span>}
                  </div>
                  <div className="terp-login__field">
                    <label htmlFor="terp-company-country">Country</label>
                    {registeredCountry ? (
                      <input id="terp-company-country" name="country" value={registeredCountry} readOnly aria-readonly="true" title="Your financial year is already on file for this country" />
                    ) : (
                      <select
                        id="terp-company-country"
                        name="country"
                        value={company.country}
                        onChange={updateCompany("country")}
                        disabled={loadingCountries}
                        aria-invalid={fieldErrors.country ? true : undefined}
                        aria-describedby={fieldErrors.country ? "terp-company-country-error" : "terp-login-country-hint"}
                      >
                        <option value="">{loadingCountries ? "Loading countries…" : "Choose country"}</option>
                        {countries.map((item) => (
                          <option key={item.code || item.name} value={item.name}>{item.name}{item.currency ? ` — ${item.currency}` : ""}</option>
                        ))}
                      </select>
                    )}
                    {fieldErrors.country
                      ? <span className="terp-login__field-error" id="terp-company-country-error">{fieldErrors.country}</span>
                      : <span className="terp-login__hint" id="terp-login-country-hint">{registeredCountry ? "Already on file — cannot be changed." : "Sets the financial year of your books."}</span>}
                  </div>
                  <div className="terp-login__field">
                    <label htmlFor="terp-company-contact">Contact number</label>
                    <input
                      id="terp-company-contact"
                      type="tel"
                      name="contact"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      enterKeyHint="next"
                      value={company.contact_no}
                      onChange={(event) => {
                        setCompany((current) => ({ ...current, contact_no: formatContactNumber(event.target.value) }))
                        clearFieldError("contact_no")
                      }}
                      placeholder="9876543210"
                      maxLength="10"
                      aria-invalid={fieldErrors.contact_no ? true : undefined}
                      aria-describedby={fieldErrors.contact_no ? "terp-company-contact-error" : undefined}
                    />
                    {fieldErrors.contact_no && <span className="terp-login__field-error" id="terp-company-contact-error">{fieldErrors.contact_no}</span>}
                  </div>
                  <div className="terp-login__field terp-login__field--wide">
                    <label htmlFor="terp-company-email">Email</label>
                    <input id="terp-company-email" type="email" name="email" value={googleUser?.email || ""} readOnly aria-readonly="true" aria-describedby="terp-company-email-hint" title="This is the address you signed in with" />
                    <span className="terp-login__hint" id="terp-company-email-hint">The Google address you signed in with — it becomes your Trellisco client id and admin login.</span>
                  </div>
                </div>
              </div>

              {/* Street address and the statutory fields exist for Central
                  Master's company register: the license API has no field for
                  them. Name, contact, country and place above are reused. */}
              <div className="terp-login__group">
                <h4 className="terp-login__group-title">Registered address</h4>
                <div className="terp-login__fields">
                  <div className="terp-login__field terp-login__field--wide">
                    <label htmlFor="terp-company-address1">Address line 1</label>
                    <input
                      id="terp-company-address1"
                      name="addressLine1"
                      value={company.addressLine1}
                      onChange={updateCompany("addressLine1")}
                      placeholder="1st Floor, MG Road"
                      autoComplete="address-line1"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      aria-invalid={fieldErrors.addressLine1 ? true : undefined}
                      aria-describedby={fieldErrors.addressLine1 ? "terp-company-address1-error" : undefined}
                    />
                    {fieldErrors.addressLine1 && <span className="terp-login__field-error" id="terp-company-address1-error">{fieldErrors.addressLine1}</span>}
                  </div>
                  <div className="terp-login__field terp-login__field--wide">
                    <label htmlFor="terp-company-address2">Address line 2 <span className="terp-login__optional">Optional</span></label>
                    <input
                      id="terp-company-address2"
                      name="addressLine2"
                      value={company.addressLine2}
                      onChange={updateCompany("addressLine2")}
                      placeholder="Landmark, building, area"
                      autoComplete="address-line2"
                      autoCapitalize="words"
                      enterKeyHint="next"
                    />
                  </div>
                  <div className="terp-login__field">
                    <label htmlFor="terp-company-district">District</label>
                    <input
                      id="terp-company-district"
                      name="district"
                      value={company.district}
                      onChange={updateCompany("district")}
                      placeholder="Malappuram"
                      autoComplete="address-level2"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      aria-invalid={fieldErrors.district ? true : undefined}
                      aria-describedby={fieldErrors.district ? "terp-company-district-error" : undefined}
                    />
                    {fieldErrors.district && <span className="terp-login__field-error" id="terp-company-district-error">{fieldErrors.district}</span>}
                  </div>
                  <div className="terp-login__field">
                    <label htmlFor="terp-company-state">State</label>
                    <input
                      id="terp-company-state"
                      name="state"
                      value={company.state}
                      onChange={updateCompany("state")}
                      placeholder="Kerala"
                      autoComplete="address-level1"
                      autoCapitalize="words"
                      enterKeyHint="next"
                      aria-invalid={fieldErrors.state ? true : undefined}
                      aria-describedby={fieldErrors.state ? "terp-company-state-error" : undefined}
                    />
                    {fieldErrors.state && <span className="terp-login__field-error" id="terp-company-state-error">{fieldErrors.state}</span>}
                  </div>
                </div>
              </div>

              <div className="terp-login__group">
                <h4 className="terp-login__group-title">Tax &amp; referral</h4>
                <div className="terp-login__fields">
                  <div className="terp-login__field">
                    <label htmlFor="terp-company-gst">GST number</label>
                    <input
                      id="terp-company-gst"
                      name="gstNumber"
                      value={company.gstNumber}
                      onChange={updateCompanyCode("gstNumber", 15)}
                      placeholder="32AAACA1234A1Z5"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck="false"
                      enterKeyHint="next"
                      maxLength="15"
                      aria-invalid={fieldErrors.gstNumber ? true : undefined}
                      aria-describedby={fieldErrors.gstNumber ? "terp-company-gst-error" : undefined}
                    />
                    {fieldErrors.gstNumber && <span className="terp-login__field-error" id="terp-company-gst-error">{fieldErrors.gstNumber}</span>}
                  </div>
                  <div className="terp-login__field">
                    <label htmlFor="terp-company-pan">PAN number</label>
                    <input
                      id="terp-company-pan"
                      name="panNumber"
                      value={company.panNumber}
                      onChange={updateCompanyCode("panNumber", 10)}
                      placeholder="AAACA1234A"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck="false"
                      enterKeyHint="next"
                      maxLength="10"
                      aria-invalid={fieldErrors.panNumber ? true : undefined}
                      aria-describedby={fieldErrors.panNumber ? "terp-company-pan-error" : undefined}
                    />
                    {fieldErrors.panNumber && <span className="terp-login__field-error" id="terp-company-pan-error">{fieldErrors.panNumber}</span>}
                  </div>
                  <div className="terp-login__field terp-login__field--wide">
                    <label htmlFor="terp-company-referral">Referral code <span className="terp-login__optional">Optional</span></label>
                    <input
                      id="terp-company-referral"
                      name="referralCode"
                      value={company.referralCode}
                      onChange={updateReferralCode}
                      placeholder="AG-UFC9RR"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck="false"
                      enterKeyHint="done"
                      maxLength="32"
                      aria-invalid={fieldErrors.referralCode ? true : undefined}
                      aria-describedby={fieldErrors.referralCode ? "terp-company-referral-error" : "terp-company-referral-hint"}
                    />
                    {fieldErrors.referralCode
                      ? <span className="terp-login__field-error" id="terp-company-referral-error">{fieldErrors.referralCode}</span>
                      : <span className="terp-login__hint" id="terp-company-referral-hint">If a partner or reseller referred you, enter their code. It is credited to {googleUser?.email || "your sign-in address"} and verified before your license is created.</span>}
                  </div>
                </div>
              </div>

              <div className="terp-login__group">
                <h4 className="terp-login__group-title">Branding</h4>
                <div className="terp-login__fields">
                  <div className="terp-login__field terp-login__field--wide">
                    <label htmlFor="terp-company-logo">Company logo <span className="terp-login__optional">Optional</span></label>
                    <div className={`terp-login__logo${fieldErrors.logo ? " is-invalid" : ""}`}>
                      {company.logo ? (
                        <>
                          <img className="terp-login__logo-preview" src={company.logo} alt="Selected company logo" />
                          <span className="terp-login__logo-name" title={company.logoName}>{company.logoName || "logo"}</span>
                          <button className="terp-login__logo-remove" type="button" onClick={removeCompanyLogo}>Remove</button>
                        </>
                      ) : (
                        <input
                          id="terp-company-logo"
                          name="logo"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={readCompanyLogo}
                          aria-invalid={fieldErrors.logo ? true : undefined}
                          aria-describedby={fieldErrors.logo ? "terp-company-logo-error" : "terp-company-logo-hint"}
                        />
                      )}
                    </div>
                    {fieldErrors.logo
                      ? <span className="terp-login__field-error" id="terp-company-logo-error">{fieldErrors.logo}</span>
                      : <span className="terp-login__hint" id="terp-company-logo-hint">{`PNG, JPG or WebP up to ${LOGO_MAX_LABEL} — printed on your invoices.`}</span>}
                  </div>
                </div>
              </div>
              <div className="terp-login__form-actions"><button className="terp-login__back" type="button" onClick={() => { setError(""); setFieldErrors({}); setSetupStep(1) }}>← Back</button><button className="terp-login__submit" type="submit" disabled={submitting}>{submitting ? "Creating license…" : "Create license"}</button></div>
            </div>
          )}
        </form>
        )}
      </section>

      <CredentialsModal
        open={modalOpen}
        credentials={credentials}
        whatsapp={delivery.whatsapp}
        email={delivery.email}
        onClose={closeModal}
        onDone={finishSetup}
        onRetryWhatsApp={retryWhatsApp}
        onRetryEmail={retryEmail}
        retryingWhatsApp={retrying.whatsapp}
        retryingEmail={retrying.email}
      />
    </main>
  )
}
