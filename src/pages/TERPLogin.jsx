import { useEffect, useRef, useState } from "react"
import mascotImage from "../assets/ChatGPT Image Sep 25, 2026, 01_38_19 PM.png"
import "./TERPLogin.scss"

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client"
const DEFAULT_PACKAGES = ["Basic", "Standard", "Platinum", "Enterprise"]
const TERP_PROJECTS_ENDPOINT = import.meta.env.DEV
  ? "/terp-api/t-erp/mobileapp/api/projects/"
  : import.meta.env.VITE_TERP_PROJECTS_API_URL
const TERP_LICENSE_ENDPOINT = import.meta.env.DEV
  ? "/terp-api/t-erp/mobileapp/api/license/create/"
  : import.meta.env.VITE_TERP_LICENSE_CREATE_API_URL

function normaliseProjects(payload) {
  const items = Array.isArray(payload)
    ? payload
    : payload?.results || payload?.projects || payload?.data || []

  return items
    .map((item) => {
      if (typeof item === "string") return { name: item, packages: [] }

      const name = item.project || item.name || item.title
      const packages = item.packages || item.package_options || item.plans || []
      return {
        name,
        packages: Array.isArray(packages)
          ? packages.map((value) => (typeof value === "string" ? value : value.name || value.package)).filter(Boolean)
          : [],
      }
    })
    .filter((item) => item.name)
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

async function throwApiError(response, fallback) {
  const rawBody = await response.text()
  let detail = rawBody

  try {
    const body = JSON.parse(rawBody)
    detail = body.detail || body.message || body.error || body.errors || body
    if (typeof detail !== "string") detail = JSON.stringify(detail)
  } catch {
    // Keep non-JSON response bodies exactly as the API returned them.
  }

  const suffix = detail?.trim() ? ` — ${detail.trim()}` : ""
  throw new Error(`${fallback} (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""})${suffix}`)
}

function getNetworkError(error, endpoint) {
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
    return `Cannot reach ${endpoint}. The browser received no API response. Check that the URL is reachable and that the API allows this site's origin (CORS).`
  }
  return error.message || "The API request failed."
}

export default function TERPLogin() {
  const googleButtonRef = useRef(null)
  const [googleUser, setGoogleUser] = useState(null)
  const [setupStep, setSetupStep] = useState(1)
  const [projects, setProjects] = useState([])
  const [selectedProjects, setSelectedProjects] = useState([])
  const [company, setCompany] = useState({ corporateName: "", name: "", place: "", email: "", contact_no: "", country: "India" })
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    let cancelled = false
    const endpoint = TERP_PROJECTS_ENDPOINT
    fetch(endpoint)
      .then(async (response) => {
        if (!response.ok) await throwApiError(response, "Unable to load T-ERP projects")
        return response.json()
      })
      .then((payload) => {
        if (!cancelled) setProjects(normaliseProjects(payload))
      })
      .catch((fetchError) => {
        if (!cancelled) setError(getNetworkError(fetchError, endpoint))
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
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
            setCompany((current) => ({ ...current, email: current.email || profile.email }))
            setError("")
          },
        })
        window.google.accounts.id.renderButton(googleButtonRef.current, { theme: "outline", size: "large", width: 360, text: "continue_with" })
      })
      .catch(() => setError("Google Sign-In could not be loaded. Check your connection and try again."))
    return () => { cancelled = true }
  }, [])

  const getPackages = (project) => project?.packages?.length ? project.packages : DEFAULT_PACKAGES

  const toggleProject = (projectName) => {
    setSelectedProjects((current) => current.some((item) => item.project === projectName)
      ? current.filter((item) => item.project !== projectName)
      : [...current, { project: projectName, package: "" }])
    setError("")
  }

  const updateProjectPackage = (projectName, packageName) => {
    setSelectedProjects((current) => current.map((item) => item.project === projectName ? { ...item, package: packageName } : item))
  }

  const updateCompany = (field) => (event) => setCompany((current) => ({ ...current, [field]: event.target.value }))

  const formatContactNumber = (value) => value.replace(/\D/g, "").slice(0, 10)

  const continueToCompany = () => {
    setError("")
    if (!selectedProjects.length) return setError("Select at least one T-ERP project to continue.")
    if (selectedProjects.some((item) => !item.package)) return setError("Choose a package for every selected project.")
    setSetupStep(2)
  }

  const submit = async (event) => {
    event.preventDefault()
    setError("")
    setSuccess("")
    if (!googleUser) return setError("Continue with Google before submitting your company details.")
    if (!selectedProjects.length) return setError("Select at least one T-ERP project to continue.")
    if (selectedProjects.some((item) => !item.package)) return setError("Choose a package for every selected project.")
    if (!company.corporateName.trim() || !company.name.trim() || !company.place.trim() || !company.email.trim() || !company.contact_no.trim()) return setError("Complete all company details to continue.")
    if (company.contact_no.length !== 10) return setError("Enter a valid 10-digit contact number, for example 1234567890.")

    setSubmitting(true)
    try {
      const endpoint = TERP_LICENSE_ENDPOINT
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate: { name: company.corporateName.trim(), place: company.place.trim() },
          company: { name: company.name.trim(), place: company.place.trim(), email: company.email.trim(), contact_no: company.contact_no.replace(/\D/g, ""), country: company.country.trim(), is_active: true },
          projects: selectedProjects,
        }),
      })
      if (!response.ok) await throwApiError(response, "License creation failed")
      setSuccess("Your T-ERP license request was created successfully.")
    } catch (submitError) {
      setError(getNetworkError(submitError, TERP_LICENSE_ENDPOINT))
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
              <div className="terp-login__section"><div><span className="terp-login__number">1</span><h3>Build your T-ERP suite</h3><span className="terp-login__selection-count">{selectedProjects.length} selected</span></div><p>Select projects and a package for each.</p></div>
              <div className="terp-login__project-grid">
                {loadingProjects && <div className="terp-login__loading">Loading available projects…</div>}
                {!loadingProjects && !projects.length && <div className="terp-login__loading">No projects are available right now.</div>}
                {projects.map((item) => {
                  const selected = selectedProjects.find((entry) => entry.project === item.name)
                  const packages = getPackages(item)
                  return <article className={`terp-login__project${selected ? " is-selected" : ""}`} key={item.name}>
                    <button type="button" className="terp-login__project-select" onClick={() => toggleProject(item.name)} aria-pressed={Boolean(selected)}>
                      <span className="terp-login__project-icon">{item.name.charAt(0).toUpperCase()}</span><span className="terp-login__project-copy"><b>{item.name}</b><small>{selected ? "Added to your suite" : "Tap to add project"}</small></span><span className="terp-login__check">✓</span>
                    </button>
                    {selected && <label className="terp-login__package">Package<select value={selected.package} onChange={(event) => updateProjectPackage(item.name, event.target.value)}><option value="">Choose package</option>{packages.map((packageName) => <option key={packageName} value={packageName}>{packageName}</option>)}</select></label>}
                  </article>
                })}
              </div>
              <button className="terp-login__next" type="button" onClick={continueToCompany}>Continue to company details <span>→</span></button>
            </div>
          ) : (
          <div className="terp-login__company-block">
              <div className="terp-login__section"><div><span className="terp-login__number">2</span><h3>Company details</h3></div><p>Used for your T-ERP license.</p></div>
              <div className="terp-login__fields"><label>Company name<input value={company.name} onChange={updateCompany("name")} placeholder="ABC Company" /></label><label>Corporate / group name<input value={company.corporateName} onChange={updateCompany("corporateName")} placeholder="ABC Corporate" /></label><label>Place<input value={company.place} onChange={updateCompany("place")} placeholder="Kochi" /></label><label>Country<input value={company.country} onChange={updateCompany("country")} placeholder="India" /></label><label>Email<input type="email" value={company.email} onChange={updateCompany("email")} placeholder="you@company.com" /></label><label>Contact number<input type="tel" inputMode="numeric" autoComplete="tel" value={company.contact_no} onChange={(event) => setCompany((current) => ({ ...current, contact_no: formatContactNumber(event.target.value) }))} placeholder="1234567890" maxLength="10" pattern="[0-9]{10}" /></label></div>
              <div className="terp-login__form-actions"><button className="terp-login__back" type="button" onClick={() => { setError(""); setSetupStep(1) }}>← Back</button><button className="terp-login__submit" type="submit" disabled={submitting}>{submitting ? "Creating license…" : "Create T-ERP license"}</button></div>
            </div>
          )}
        </form>
        )}
      </section>
    </main>
  )
}
