/* ─────────────────────────────────────────────
   ECOSYSTEM SECTION — "More than software"
   Drop-in replacement for the EcosystemSection
   block in Home.jsx. Paste this whole block in
   place of your current ProMock / BioMock /
   EmployeeMock / ECOSYSTEM_CARDS / EcosystemSection
   code, and import MascotImg exactly as you already do:

   import MascotImg from '../assets/mascot.png'

   Pair with EcosystemSection.scss (append it to
   Home.scss, or @use it) for the mascot pop-in,
   3D card tilt, and hover micro-interactions.
───────────────────────────────────────────── */

// Tiny filled cursor-arrow used to fake a click landing on a button.
function EcoCursor({ className, style }) {
  return (
    <svg className={`eco-cursor${className ? ` ${className}` : ''}`} style={style} viewBox="0 0 24 24">
      <path d="M3 2l7.07 17 2.51-7.39L20 9.07z" stroke="#fff" strokeWidth="1" />
    </svg>
  )
}

/* ── Trellisco Pro — reporting card w/ progress bar that fills on hover ── */
function ProMock({ accent = '#d97706' }) {
  return (
    <div className="eco-mock eco-mock--pro">
      <div className="eco-mock__head">
        <span className="eco-mock__eyebrow">Trellisco Pro</span>
        <span className="eco-mock__badge-icon" style={{ color: accent }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10 12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
          </svg>
        </span>
      </div>
      <div className="eco-mock__title">Attendance &amp; approval overview</div>
      <div className="eco-mock__track">
        <span className="eco-mock__fill" style={{ background: accent }} />
      </div>
      <div className="eco-mock__caption">78% of reports ready</div>
      <button type="button" className="eco-mock__btn" style={{ background: accent }}>
        Open dashboard
      </button>
      <EcoCursor style={{ left: '58%', top: '76%' }} />
    </div>
  )
}

/* ── Trellisco Bio — chat card w/ reply bubble that slides in on hover ── */
function BioMock({ accent = '#16a34a' }) {
  return (
    <div className="eco-mock eco-mock--bio">
      <div className="eco-mock__head">
        <span className="eco-mock__eyebrow">#bio-attendance</span>
        <div className="eco-mock__avatars">
          {['A', 'R', 'M'].map((initial, i) => (
            <span key={initial} className="eco-mock__avatar" style={{ color: accent, zIndex: 3 - i }}>
              {initial}
            </span>
          ))}
        </div>
      </div>
      <div className="eco-mock__chat">
        <div className="eco-mock__bubble eco-mock__bubble--in">How do we validate remote punch-ins?</div>
        <div className="eco-mock__bubble eco-mock__bubble--out" style={{ background: accent }}>
          Geofence + face check verified ✅
        </div>
      </div>
      <div className="eco-mock__composer">
        <span className="eco-mock__input">Write a reply…</span>
        <button type="button" className="eco-mock__send" style={{ background: accent }} aria-label="Send">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <EcoCursor style={{ right: '9%', bottom: '17%', left: 'auto' }} />
    </div>
  )
}

/* ── Trellisco Employee — file list; top file "downloads" into a check ── */
function EmployeeMock({ accent = '#2563eb' }) {
  const files = [
    { name: 'Leave_Request_Form.pdf', size: '42 KB', action: 'download' },
    { name: 'WFH_Policy_2026.pdf', size: '118 KB', action: 'check' },
    { name: 'Payslip_Summary.xlsx', size: '27 KB', action: 'none' },
  ]

  return (
    <div className="eco-mock eco-mock--employee">
      <div className="eco-mock__eyebrow eco-mock__eyebrow--standalone" style={{ color: accent }}>
        Employee portal
      </div>
      <div className="eco-mock__files">
        {files.map((f) => (
          <div key={f.name} className="eco-mock__file">
            <span className="eco-mock__file-icon" style={{ color: accent }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </span>
            <div className="eco-mock__file-info">
              <span className="eco-mock__file-name">{f.name}</span>
              <span className="eco-mock__file-size">{f.size}</span>
            </div>
            {f.action === 'download' && (
              <button
                type="button"
                className="eco-mock__file-action eco-mock__file-action--download"
                style={{ background: accent }}
                aria-label="Download"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
            {f.action === 'check' && (
              <span className="eco-mock__file-action eco-mock__file-action--check">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
            {f.action === 'none' && <span className="eco-mock__file-action" />}
          </div>
        ))}
      </div>
      <EcoCursor style={{ right: '13%', top: '26%' }} />
    </div>
  )
}

const ECOSYSTEM_CARDS = [
  {
    key: 'pro',
    title: 'Trellisco Pro',
    desc: 'For companies, directors, finance leaders and senior managers — a reporting and control app with dashboards, approvals and live HR visibility.',
    accent: '#d97706',
    variant: 'pro',
  },
  {
    key: 'bio',
    title: 'Trellisco Bio',
    desc: 'For office, field and remote employees — attendance tracking with face recognition, geofence validation and smart punch-in checks.',
    accent: '#16a34a',
    variant: 'bio',
  },
  {
    key: 'employee',
    title: 'Trellisco Employee',
    desc: 'For every employee in the organisation — a self-service portal for leave, WFH, attendance, salary advances and approval requests.',
    accent: '#2563eb',
    variant: 'employee',
  },
  {
    key: 'academy',
    title: 'Trellisco Academy',
    desc: 'For leaders and HR teams — track learning paths, onboarding progress and upskilling milestones in one place.',
    accent: '#7c3aed',
    variant: 'bio',
  },
  {
    key: 'community',
    title: 'Trellisco Community',
    desc: 'For people managers and employees — connect with HR communities, share ideas and stay aligned through live discussions.',
    accent: '#f59e0b',
    variant: 'pro',
  },
  {
    key: 'compliance',
    title: 'Trellisco Compliance',
    desc: 'For compliance teams — centralise policies, audits, reminders and documentation so every process stays ready.',
    accent: '#0f766e',
    variant: 'employee',
  },
  {
    key: 'payroll',
    title: 'Trellisco Payroll',
    desc: 'For finance and payroll admins — automated salary runs, tax calculations and payslip generation, synced straight from attendance.',
    accent: '#db2777',
    variant: 'pro',
  },
  {
    key: 'insights',
    title: 'Trellisco Insights',
    desc: 'For leadership and HR analysts — real-time workforce analytics, attrition signals and headcount trends in one dashboard.',
    accent: '#0ea5e9',
    variant: 'bio',
  },
  {
    key: 'support',
    title: 'Trellisco Support',
    desc: 'For every employee — a built-in helpdesk to raise HR tickets, track resolutions and get answers without leaving the app.',
    accent: '#ea580c',
    variant: 'employee',
  },
]

function EcosystemMockup({ card }) {
  const variant = card.variant || card.key

  if (variant === 'pro') return <ProMock accent={card.accent} />
  if (variant === 'bio') return <BioMock accent={card.accent} />
  return <EmployeeMock accent={card.accent} />
}

/* ── 3D tilt-on-hover wrapper, same math as the HRMS bento cards ── */
function handleEcoCardTilt(e) {
  const el = e.currentTarget
  const { left, top, width, height } = el.getBoundingClientRect()
  const x = (e.clientX - left) / width - 0.5
  const y = (e.clientY - top) / height - 0.5
  el.style.transform = `perspective(1000px) rotateY(${-x * 7}deg) rotateX(${y * 7}deg) translateY(-6px) scale(1.015)`
}
function handleEcoCardTiltReset(e) {
  e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0) scale(1)'
}

/* ── Mascot — standing to the left, overlapping the first card's edge ── */
function EcosystemMascot({ src, onClick }) {
  return (
    <img
      src={src}
      alt="Trellisco mascot giving a thumbs up"
      className="ecosystem__mascot"
      draggable={false}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? 'Book a 15-minute demo' : undefined}
    />
  )
}

function EcosystemSection({ mascotSrc, onBookDemo }) {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(node)
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className={`ecosystem${isVisible ? ' ecosystem--visible' : ''}`}>
      <div className="ecosystem__inner">
        <h2 className="ecosystem__title ecosystem__reveal">
          More than software. An <span className="ecosystem__title-accent">ecosystem</span> that grows
          with your HR team.
        </h2>
        <p className="ecosystem__subtitle ecosystem__reveal" style={{ transitionDelay: '120ms' }}>
          Free courses, an HR community, compliance resources and live webinars —
          included with every plan, no premium tier required.
        </p>

        <div className="ecosystem__cards-wrap">
          <EcosystemMascot src={mascotSrc} onClick={onBookDemo} />

          <div className="ecosystem__grid">
            {ECOSYSTEM_CARDS.map((card, i) => (
              <div
                key={card.key}
                className="eco-card ecosystem__reveal"
                style={{ transitionDelay: `${240 + i * 130}ms` }}
                onMouseMove={handleEcoCardTilt}
                onMouseLeave={handleEcoCardTiltReset}
              >
                <EcosystemMockup card={card} />
                <h3 className="eco-card__title">{card.title}</h3>
                <p className="eco-card__desc">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="ecosystem__cta-bar">
            <span className="ecosystem__cta-text">
              You don&rsquo;t need five tools to run HR. You need one.
            </span>
            <button type="button" className="ecosystem__cta-btn" onClick={onBookDemo}>
              Book a 15-Minute Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   Usage in Home():

   import MascotImg from '../assets/mascot.png'
   ...
   <EcosystemSection mascotSrc={MascotImg} onBookDemo={() => {}} />
───────────────────────────────────────────── */