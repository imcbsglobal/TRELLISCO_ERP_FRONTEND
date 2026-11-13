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
  findClientWorkspace,
  getNetworkError,
  isLicenseRegistered,
  isLicensePayload,
  prefetchTerpRegisters,
} from "../api/terpLicense"
import { USER_MASTER_ENDPOINT, createClientAdmin, enableProjectsForClient, findClientLogins, splitContactName } from "../api/userMaster"
import { ensureClientCountry, fetchFinancialYearCountries, findClientFinancialYears } from "../api/financialYear"
import {
  buildCredentialsMessage,
  buildCredentialsSubject,
  canAutoSendEmail,
  sendCredentialsEmail,
  sendWhatsApp,
} from "../api/notifications"
import "./TERPLogin.scss"

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client"
const DEFAULT_PACKAGES = ["Basic", "Standard", "Platinum", "Enterprise"]
const INITIAL_COMPANY = { corporateName: "", name: "", place: "", email: "", contact_no: "", country: "" }

// The company form is validated field by field: the order here decides which
// input gets focus when the operator submits an incomplete form.
const COMPANY_FIELDS = ["name", "corporateName", "place", "country", "contact_no"]
const COMPANY_FIELD_IDS = {
  name: "terp-company-name",
  corporateName: "terp-company-corporate",
  place: "terp-company-place",
  country: "terp-company-country",
  contact_no: "terp-company-contact",
}

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
        if (!cancelled) setError(getNetworkError(fetchError, "the T-ERP projects API"))
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
    }

    const repaintGoogleButton = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(paintGoogleButton)
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current || !import.meta.env.VITE_GOOGLE_CLIENT_ID) return
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
    const tickOwnedProjects = (projects, corporateName) => {
      if (cancelled) return
      setCheckingWorkspace(false)
      setWorkspace((current) => ({
        clientId: current?.clientId || candidate,
        companyName: current?.companyName || "",
        corporateName: current?.corporateName || corporateName || "",
        place: current?.place || "",
        projects,
      }))
    }

    findClientWorkspace(candidate, tickOwnedProjects)
      .then((found) => {
        if (cancelled || !found) return
        // Upgrade the partial workspace the register produced with the company
        // name and place the directory adds — never downgrade it.
        setWorkspace((current) => ({ ...current, ...found }))
        setCompany((current) => {
          const filled = {
            ...current,
            name: current.name || found.companyName,
            corporateName: current.corporateName || found.corporateName || found.companyName,
            place: current.place || found.place,
          }
          return filled.name === current.name && filled.place === current.place ? current : filled
        })
      })
      .catch(() => {
        // Recognition is a convenience: a brand new signup must still go through.
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

  const continueToCompany = () => {
    setError("")
    if (!selectedProjects.length) {
      return setError(
        workspace
          ? "Everything you already own is ticked. Add a new project to continue."
          : "Select at least one T-ERP project to continue.",
      )
    }
    if (selectedProjects.some((item) => !item.package)) return flagMissingPackages(findMissingPackages())
    setIncompleteProjects([])
    setSetupStep(2)
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

  const submit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    if (!googleUser) return setError("Continue with Google before submitting your company details.")
    if (!selectedProjects.length) {
      return setError(workspace
        ? "Everything you already own is ticked. Add a new project to continue."
        : "Select at least one T-ERP project to continue.")
    }
    if (selectedProjects.some((item) => !item.package)) return flagMissingPackages(findMissingPackages())
    // Missing fields are marked under their own input and the first one is
    // focused, so the operator fixes the form in place.
    const missing = {}
    if (!company.name.trim()) missing.name = "Enter the company name."
    if (!company.corporateName.trim()) missing.corporateName = "Enter the corporate or group name."
    if (!company.place.trim()) missing.place = "Enter the place."
    if (!company.country.trim()) missing.country = "Select the country the license applies to."
    if (!company.contact_no.trim()) missing.contact_no = "Enter the contact number."
    else if (company.contact_no.length !== 10) missing.contact_no = "Enter a valid 10-digit number, for example 1234567890."

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
      const email = (googleUser?.email || company.email).trim()
      const phoneNumber = company.contact_no.replace(/\D/g, "")

      // One client id = one login. Central Master's user list is the only place
      // that can prove the client already exists, so nothing at all is created
      // until that lookup comes back.
      let existingLogins = []
      try {
        existingLogins = await findClientLogins({
          clientId: licenseRef.current ? extractClientId(licenseRef.current) : "",
          email,
          phoneNumber,
        })
      } catch {
        throw new Error(
          `Could not check existing T-ERP logins, so nothing was created. ${USER_MASTER_ENDPOINT} did not respond.`,
        )
      }
      const hasLogin = existingLogins.length > 0
      if (hasLogin && !workspace) {
        // A login we cannot place in the T-ERP client list: refuse to touch
        // anything rather than risk a second license for the same client.
        throw new Error(
          "This client already has a T-ERP login. No license and no user were created — " +
            "sign in with the existing credentials, or ask Trellisco support to reset them.",
        )
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
            corporate: { name: company.corporateName, place: company.place },
            company,
            projects: selectedProjects.map(({ project, package: packageName }) => ({ project, package: packageName })),
          })
          createdHereRef.current = true
        }
      }
      licenseRef.current = license
      cacheLicense(email, license)

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
      const companyName = company.name.trim()
      const addedProjects = selectedProjects.map((item) => item.project)

      // A returning customer keeps the login they already have: adding a project
      // must never mint a second account or resend credentials nobody asked for,
      // but every login under this client id must see the new product.
      if (hasLogin) {
        let updatedLogins = 0
        try {
          updatedLogins = (await enableProjectsForClient({ logins: existingLogins, clientId, selectedProjects })).updated
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
        const country = await registerClientCountry(clientId, company.country)

        if (country.error) {
          // The products were switched on, but the country could not be written:
          // stay on the page so the operator reads it, and refresh the ticks for
          // the project that was just added.
          setSelectedProjects([])
          setSetupStep(1)
          setSuccess(
            `Added ${addedProjects.join(", ")} to ${companyName}.` +
              (updatedLogins ? ` Switched on for ${updatedLogins} existing login${updatedLogins > 1 ? "s" : ""}.` : "") +
              " Your existing T-ERP login still works — no new user and no new password were created.",
          )
          setError(country.error.trim())
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
        // The license was accepted, but T-ERP never registered the company, so
        // Central Master has no client to attach the login to. A corporate left
        // over from a deleted signup keeps its old (now shop-less) record and
        // blocks the shop from being created again, which is why the same email
        // works once and fails on every retry.
        throw new Error(
          `${error.message} — T-ERP has no client for "${email}": the license exists, but the company was not ` +
            `registered again. T-ERP already holds the corporate "${company.corporateName}" from the deleted ` +
            `signup without a shop, which blocks the new shop "${company.name}". Delete that corporate in T-ERP ` +
            `(no client-creation API exists) and submit again.`,
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
      const country = await registerClientCountry(accountClientId, company.country)
      const countryNote = country.error || ""

      const created = {
        clientId: accountClientId,
        licenseKey,
        companyName,
        email,
        phone: company.contact_no,
        projects: selectedProjects.map((item) => item.project),
        username: account.username,
        password: account.password,
      }

      setCredentials(created)
      // Only auto-send when the transport cannot hit a consent popup.
      const autoEmail = canAutoSendEmail()
      setDelivery({ whatsapp: { state: "pending" }, email: { state: autoEmail ? "pending" : "idle" } })
      setModalOpen(true)
      setSuccess(`T-ERP license created. The admin login is ready below.${countryNote}`)

      deliverWhatsApp(created)
      if (autoEmail) deliverEmail(created)
    } catch (submitError) {
      const licensed = Boolean(licenseRef.current)
      // Errors that already explain the half-finished state must not be prefixed twice.
      const explained = /^The license was created/i.test(submitError.message || "")
      const prefix = licensed && !explained ? "The license was created, but the T-ERP admin account could not be set up: " : ""
      setError(`${prefix}${getNetworkError(submitError, licensed ? USER_MASTER_ENDPOINT : TERP_LICENSE_ENDPOINT)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={`terp-login${googleUser ? " terp-login--setup" : ""}`}>
      <section className="terp-login__intro">
        <span className="terp-login__eyebrow">T-ERP access</span>
        <h1>Set up your T-ERP workspace.</h1>
        <p>Sign in with Google, choose the products your business needs, and create your company license in a few steps.</p>
        <div className="terp-login__steps"><span className={!googleUser ? "is-active" : "is-complete"}>01 <b>Google auth</b></span><span className={googleUser && setupStep === 1 ? "is-active" : setupStep === 2 ? "is-complete" : ""}>02 <b>Choose products</b></span><span className={googleUser && setupStep === 2 ? "is-active" : ""}>03 <b>Company details</b></span></div>
        <div className="terp-login__mascot" aria-hidden="true"><span className="terp-login__mascot-glow" /><img src={mascotImage} alt="" /></div>
      </section>

      <section className="terp-login__card">
        <div className="terp-login__card-head"><span className="terp-login__mark">T</span><div><p>Trellisco ERP</p><h2>{!googleUser ? "T-ERP Login" : setupStep === 1 ? "Build your T-ERP suite" : "Company details"}</h2></div></div>
        {error && <div className="terp-login__message terp-login__message--error" role="alert">{error}</div>}
        {success && <div className="terp-login__message terp-login__message--success" role="status">{success}</div>}

        {!googleUser ? (
          <div className="terp-login__auth-screen">
            <div className="terp-login__auth-badge"><span>1</span><b>Secure Google authentication</b></div>
            <h3>Welcome to T-ERP</h3>
            <p>Use your Google account to securely continue. Your workspace setup form will appear after you sign in.</p>
            <div className="terp-login__google"><p>Continue with your Google account</p><div ref={googleButtonRef} /></div>
            <small className="terp-login__privacy">Your Google identity is used only to start your T-ERP setup.</small>
          </div>
        ) : (
        <form className="terp-login__setup-form" onSubmit={submit}>
          <div className="terp-login__flow-status"><span className="terp-login__flow-dot">✓</span><span><small>Google authentication complete</small><b>{googleUser.email}</b></span><span className="terp-login__flow-next">Step {setupStep + 1} of 3</span></div>
          {setupStep === 1 ? (
            <div className="terp-login__product-block">
              <div className="terp-login__section"><div><span className="terp-login__number">1</span><h3>Build your T-ERP suite</h3><span className="terp-login__selection-count">{tickedOwned ? `${tickedOwned} active · ${selectedProjects.length} new` : `${selectedProjects.length} selected`}</span></div><p>{checkingWorkspace && !tickedOwned ? "Checking which projects you already own…" : tickedOwned ? "Your active projects are ticked below — add another project to extend the suite." : "Select projects and a package for each."}</p></div>
              {workspace && <div className="terp-login__workspace"><b>{workspace.companyName || workspace.clientId}</b><small>{workspace.projects.length ? `${workspace.projects.join(", ")} ${workspace.projects.length > 1 ? "are" : "is"} already active and ticked below. Add another project whenever you need it.` : "This client already exists. Choose the projects to add."}</small></div>}
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
              <button className="terp-login__next" type="button" onClick={continueToCompany}>Continue to company details <span>→</span></button>
            </div>
          ) : (
          <div className="terp-login__company-block">
              <div className="terp-login__section"><div><span className="terp-login__number">2</span><h3>Company details</h3></div><p>Used for your T-ERP license and the admin login we send you.</p></div>
              <div className="terp-login__fields">
                <div className="terp-login__field">
                  <label htmlFor="terp-company-name">Company name</label>
                  <input
                    id="terp-company-name"
                    name="companyName"
                    value={company.name}
                    onChange={updateCompany("name")}
                    placeholder="ABC Company"
                    autoComplete="organization"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    aria-invalid={fieldErrors.name ? true : undefined}
                    aria-describedby={fieldErrors.name ? "terp-company-name-error" : undefined}
                  />
                  {fieldErrors.name && <span className="terp-login__field-error" id="terp-company-name-error">{fieldErrors.name}</span>}
                </div>
                <div className="terp-login__field">
                  <label htmlFor="terp-company-corporate">Corporate / group name</label>
                  <input
                    id="terp-company-corporate"
                    name="corporateName"
                    value={company.corporateName}
                    onChange={updateCompany("corporateName")}
                    placeholder="ABC Corporate"
                    autoComplete="organization"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    aria-invalid={fieldErrors.corporateName ? true : undefined}
                    aria-describedby={fieldErrors.corporateName ? "terp-company-corporate-error" : undefined}
                  />
                  {fieldErrors.corporateName && <span className="terp-login__field-error" id="terp-company-corporate-error">{fieldErrors.corporateName}</span>}
                </div>
                <div className="terp-login__field">
                  <label htmlFor="terp-company-place">Place</label>
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
                    aria-describedby={fieldErrors.place ? "terp-company-place-error" : undefined}
                  />
                  {fieldErrors.place && <span className="terp-login__field-error" id="terp-company-place-error">{fieldErrors.place}</span>}
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
                  <label htmlFor="terp-company-email">Email</label>
                  <input id="terp-company-email" type="email" name="email" value={googleUser?.email || ""} readOnly aria-readonly="true" title="This is the address you signed in with" />
                </div>
                <div className="terp-login__field">
                  <label htmlFor="terp-company-contact">Contact number</label>
                  <input
                    id="terp-company-contact"
                    type="tel"
                    name="contact"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    enterKeyHint="done"
                    value={company.contact_no}
                    onChange={(event) => {
                      setCompany((current) => ({ ...current, contact_no: formatContactNumber(event.target.value) }))
                      clearFieldError("contact_no")
                    }}
                    placeholder="1234567890"
                    maxLength="10"
                    aria-invalid={fieldErrors.contact_no ? true : undefined}
                    aria-describedby={fieldErrors.contact_no ? "terp-company-contact-error" : undefined}
                  />
                  {fieldErrors.contact_no && <span className="terp-login__field-error" id="terp-company-contact-error">{fieldErrors.contact_no}</span>}
                </div>
              </div>
              <div className="terp-login__form-actions"><button className="terp-login__back" type="button" onClick={() => { setError(""); setFieldErrors({}); setSetupStep(1) }}>← Back</button><button className="terp-login__submit" type="submit" disabled={submitting}>{submitting ? "Creating license…" : "Create T-ERP license"}</button></div>
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
