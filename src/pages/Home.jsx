import { useEffect, useRef, useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import FallingText from '../components/FallingText'
import HeroImg from '../assets/Trellisco ERP Laptop Dashboard Illustration.png'
import HRMSImg from '../assets/HRMS.png'
import RestaurantImg from '../assets/Restuart.png'
import PropertyImg from '../assets/propertymanagment.png'
import GymImg from '../assets/gym.png'
import ShowcaseImg from '../assets/ChatGPT Image Sep 14, 2026, 11_36_58 AM.png'
import PlatformFeatures from './PlatformFeatures'
import PromoVideoPlayer from './Promovideoplayer'
import './Home.scss'

/* ─────────────────────────────────────────────
   INDUSTRY SOLUTIONS SECTION
───────────────────────────────────────────── */
const INDUSTRY_TABS = [
  {
    key: 'hrms',
    label: 'HRMS',
    accent: '#1b46f5',
    eyebrow: 'Workforce',
    title: 'People, process, progress',
    lead: 'Run recruitment, attendance, payroll, leave, and performance from one system — instead of five spreadsheets.',
    includes: ['Employees', 'Attendance', 'Payroll', 'Leave', 'Performance'],
    image: HRMSImg,
    href: 'https://trelliscoerp.com/HRMS/',
  },
  {
    key: 'restaurant',
    label: 'Hospitality',
    accent: '#f4923b',
    eyebrow: 'Hospitality',
    title: 'Good food, brighter people',
    lead: 'Keep orders, inventory, staff schedules, and reports moving without leaving the floor.',
    includes: ['Orders', 'Inventory', 'Staff', 'Reports'],
    image: RestaurantImg,
    href: 'https://melone.in/',
  },
  {
    key: 'property',
    label: 'Property',
    accent: '#1fa37e',
    eyebrow: 'Real Estate',
    title: 'Manage properties, grow value',
    lead: 'Track units, tenants, and maintenance requests across your whole portfolio in one dashboard.',
    includes: ['Units', 'Tenants', 'Maintenance', 'Reporting'],
    image: PropertyImg,
    href: 'https://www.venuekart.co.in/',
  },
  {
    key: 'gym',
    label: 'Gym',
    accent: '#e2461f',
    eyebrow: 'Fitness',
    title: 'Stronger than yesterday',
    lead: 'Handle class scheduling, memberships, and check-ins without a whiteboard or a spreadsheet.',
    includes: ['Classes', 'Memberships', 'Check-ins', 'Billing'],
    image: GymImg,
    href: 'https://claudius.in/',
  },
]

function IndustrySolutions() {
  const [activeKey, setActiveKey] = useState(INDUSTRY_TABS[0].key)
  const active = INDUSTRY_TABS.find((tab) => tab.key === activeKey)

  return (
    <section className="solutions">
      <div className="solutions__inner">
        <h2 className="solutions__title">Built for how your industry runs</h2>
        <p className="solutions__subtitle">
          One platform, tuned to the day-to-day of your business.
        </p>

        <div className="solutions__tabs" role="tablist">
          {INDUSTRY_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={tab.key === activeKey}
              className={`solutions__tab${tab.key === activeKey ? ' solutions__tab--active' : ''}`}
              style={tab.key === activeKey ? { background: tab.accent } : undefined}
              onClick={() => setActiveKey(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="solutions__panel">
          <div className="solutions__copy">
            <span className="solutions__eyebrow" style={{ color: active.accent }}>
              {active.eyebrow}
            </span>
            <h3 className="solutions__panel-title">{active.title}</h3>
            <p className="solutions__lead">{active.lead}</p>

            <div className="solutions__includes">
              <span className="solutions__includes-label">Includes</span>
              <ul className="solutions__includes-list">
                {active.includes.map((item) => (
                  <li key={item} className="solutions__includes-item">
                    <span
                      className="solutions__includes-dot"
                      style={{ background: active.accent }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={active.href}
              target="_blank"
              rel="noopener noreferrer"
              className="solutions__link"
              style={{ color: active.accent }}
            >
              Explore {active.label}
              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                <path
                  d="M7 4l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <div className="solutions__media">
            <img
              key={active.key}
              src={active.image}
              alt={`Trellisco for ${active.label}`}
              className="solutions__image"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   FAQ ACCORDION SECTION
───────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: 'What is Trellisco?',
    a: 'Trellisco is an all-in-one business management platform. It brings HR, operations, and growth tools — like HRMS, gym, restaurant, and property management — into a single system so you stop juggling spreadsheets and disconnected apps.',
    icon: 'help',
    tone: 'blue',
  },
  {
    q: 'Which industries does Trellisco support?',
    a: 'Trellisco ships with ready-made modules for HRMS, gyms, restaurants, and property management, and is built to extend to other industries as your business grows.',
    icon: 'layers',
    tone: 'violet',
  },
  {
    q: 'Can I try Trellisco before committing?',
    a: 'Yes. You can start a free trial with no upfront commitment — just hit "Try it for free" above to get set up in a few minutes.',
    icon: 'play',
    tone: 'green',
  },
  {
    q: 'Is my data secure with Trellisco?',
    a: 'Your data is encrypted in transit and at rest, and access is controlled through role-based permissions, so only the right people on your team can see the right information.',
    icon: 'shield',
    tone: 'orange',
  },
  {
    q: 'Can Trellisco integrate with tools we already use?',
    a: 'Trellisco is built to fit into your existing stack, with integrations and an open API so it can connect with the finance, payroll, and reporting tools your team already relies on.',
    icon: 'link',
    tone: 'pink',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'Every plan includes onboarding support, and our team is on hand through chat and email to help you get the most out of the platform as your business scales.',
    icon: 'chat',
    tone: 'blue',
  },
]

const FAQ_ICONS = {
  help: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.6 9.4a2.4 2.4 0 1 1 3.4 2.18c-.75.35-1 .82-1 1.42v.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 12l8.5 4.5L20.5 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 16l8.5 4.5L20.5 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.2 8.7l5.5 3.3-5.5 3.3V8.7Z" fill="currentColor" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M12 3.5 19 6v5.2c0 4.4-2.9 7.7-7 9.3-4.1-1.6-7-4.9-7-9.3V6l7-2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M10 14.2 14.2 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11.3 7.3l1-1a3.6 3.6 0 0 1 5.1 5.1l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12.7 16.7l-1 1a3.6 3.6 0 0 1-5.1-5.1l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M4 12a8 8 0 1 1 3.3 6.4L4 19.5l1.1-3.1A7.9 7.9 0 0 1 4 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
}

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className={`faq__item faq__item--${item.tone}${isOpen ? ' faq__item--open' : ''}`}>
      <button
        type="button"
        className="faq__row"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="faq__icon" aria-hidden="true">
          {FAQ_ICONS[item.icon]}
        </span>

        <span className="faq__content">
          <span className="faq__question">{item.q}</span>
          <span className="faq__answer">{item.a}</span>
        </span>

        <span className="faq__chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" width="12" height="12">
            <path
              d="M4 7l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  )
}

function Faq() {
  const [openIndex, setOpenIndex] = useState(0)

  const handleToggle = (index) => {
    setOpenIndex((current) => (current === index ? -1 : index))
  }

  return (
    <section className="faq">
      <div className="faq__inner">
        <div className="faq__eyebrow-row">
          <span className="faq__eyebrow-line" />
          <span className="faq__eyebrow">FAQ</span>
          <span className="faq__eyebrow-line" />
        </div>

        <h2 className="faq__title">
          Questions? We&apos;ve got <span className="faq__title-accent">answers</span>
          <svg className="faq__sparkle" viewBox="0 0 30 30" width="26" height="26" aria-hidden="true">
            <path
              d="M9 3v9M4.5 7.5h9M20 15l1.6 5.4L27 22l-5.4 1.6L20 29l-1.6-5.4L13 22l5.4-1.6L20 15Z"
              stroke="#1b46f5"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </h2>

        <p className="faq__subtitle">
          Can't find what you're looking for? Reach out and our team will help.
        </p>

        <div className="faq__list">
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem
              key={item.q}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   PRODUCT SHOWCASE SECTION
   Headline now uses the FallingText physics
   animation instead of the scroll-triggered
   gradient sweep. The first sentence ("Trellisco
   is the all-in-one platform built for modern
   teams.") stays bold via highlightWords; the
   rest renders at normal weight.
───────────────────────────────────────────── */
const SHOWCASE_TEXT =
  'Trellisco is the all-in-one platform built for modern teams. Run HR, operations, and growth from a single system that gives you control, visibility, and trust.'

const SHOWCASE_BOLD_WORDS = [
  'Trellisco',
  'is',
  'the',
  'all-in-one',
  'platform',
  'built',
  'for',
  'modern',
  'teams.',
]

function ProductShowcase() {
  return (
    <section className="showcase">
      <div className="showcase__inner">
        <div className="showcase__falling">
          <FallingText
            text={SHOWCASE_TEXT}
            highlightWords={SHOWCASE_BOLD_WORDS}
            highlightClass="fx-bold"
            trigger="scroll"
            gravity={0.6}
            mouseConstraintStiffness={0.2}
            fontSize="clamp(1.1rem, 1.8vw + 0.6rem, 2rem)"
          />
        </div>

        <div className="showcase__frame">
          <img
            src={ShowcaseImg}
            alt="Trellisco platform preview"
            className="showcase__image"
          />
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   HERO — CoFee-style: light gradient, centered
   headline, pill buttons, floating 3D-ish icons
   around the copy, laptop dashboard in the center
───────────────────────────────────────────── */
function GymArt({ p }) {
  return (
    <svg viewBox="0 0 160 90" width="100%">
      <defs>
        <linearGradient id={`${p}Bar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e3e8f2" />
          <stop offset="1" stopColor="#8b97ad" />
        </linearGradient>
        <linearGradient id={`${p}Plate`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a6a" />
          <stop offset="1" stopColor="#e2461f" />
        </linearGradient>
        <linearGradient id={`${p}PlateDark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f77b4a" />
          <stop offset="1" stopColor="#bf3416" />
        </linearGradient>
      </defs>
      <rect x="28" y="38" width="104" height="14" rx="7" fill={`url(#${p}Bar)`} />
      <rect x="18" y="26" width="16" height="38" rx="7" fill={`url(#${p}PlateDark)`} />
      <rect x="126" y="26" width="16" height="38" rx="7" fill={`url(#${p}PlateDark)`} />
      <rect x="36" y="12" width="24" height="66" rx="10" fill={`url(#${p}Plate)`} />
      <rect x="100" y="12" width="24" height="66" rx="10" fill={`url(#${p}Plate)`} />
      <rect x="41" y="18" width="5" height="54" rx="2.5" fill="#fff" opacity="0.4" />
      <rect x="105" y="18" width="5" height="54" rx="2.5" fill="#fff" opacity="0.4" />
    </svg>
  )
}

function BoxArt({ p }) {
  return (
    <svg viewBox="0 0 140 140" width="100%">
      <defs>
        <linearGradient id={`${p}BoxTop`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde7bd" />
          <stop offset="1" stopColor="#f4c47a" />
        </linearGradient>
        <linearGradient id={`${p}BoxL`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6a655" />
          <stop offset="1" stopColor="#c47f33" />
        </linearGradient>
        <linearGradient id={`${p}BoxR`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0be76" />
          <stop offset="1" stopColor="#d6923f" />
        </linearGradient>
      </defs>
      <polygon points="70,22 122,46 70,70 18,46" fill={`url(#${p}BoxTop)`} />
      <polygon points="18,46 70,70 70,126 18,100" fill={`url(#${p}BoxL)`} />
      <polygon points="70,70 122,46 122,100 70,126" fill={`url(#${p}BoxR)`} />
      <polygon points="37.5,37 50.5,31 102.5,55 89.5,61" fill="#fff6e0" opacity="0.8" />
      <g transform="matrix(1 0.4615 0 1 0 0)">
        <rect x="28" y="48" width="24" height="22" rx="2" fill="#fff" opacity="0.9" />
        <g fill="#3b2a12" opacity="0.8">
          <rect x="31" y="52" width="1.6" height="14" />
          <rect x="34" y="52" width="2.6" height="14" />
          <rect x="38.5" y="52" width="1.6" height="14" />
          <rect x="42" y="52" width="2.6" height="14" />
          <rect x="46.5" y="52" width="1.6" height="14" />
        </g>
      </g>
    </svg>
  )
}

function PropertyArt({ p }) {
  const leftCols = [28, 42, 56]
  const leftRows = [57, 71, 85, 99]
  const rightCols = [78, 92, 106]
  const rightRows = [127, 141, 155, 169]

  return (
    <svg viewBox="0 0 140 150" width="100%">
      <defs>
        <linearGradient id={`${p}PropL`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8aa4ff" />
          <stop offset="1" stopColor="#3f66ff" />
        </linearGradient>
        <linearGradient id={`${p}PropR`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2552f7" />
          <stop offset="1" stopColor="#0c2aa8" />
        </linearGradient>
        <linearGradient id={`${p}PropRoof`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d3deff" />
          <stop offset="1" stopColor="#9db4ff" />
        </linearGradient>
        <linearGradient id={`${p}PropPin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3ddc97" />
          <stop offset="1" stopColor="#0f9d63" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="70" cy="136" rx="58" ry="14" fill="#000" opacity="0.16" />

      {/* faces */}
      <polygon points="22,60 70,84 70,146 22,122" fill={`url(#${p}PropL)`} />
      <polygon points="70,84 118,60 118,122 70,146" fill={`url(#${p}PropR)`} />
      <polygon points="70,36 118,60 70,84 22,60" fill={`url(#${p}PropRoof)`} />
      <polygon points="70,46 100,61 70,76 40,61" fill="#e8eeff" opacity="0.75" />

      {/* edge highlights */}
      <polyline points="22,60 70,84 118,60" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.55" strokeLinejoin="round" />
      <line x1="70" y1="84" x2="70" y2="146" stroke="#fff" strokeWidth="1.2" opacity="0.3" />

      {/* left-face windows (skewed to follow the face) */}
      <g transform="matrix(1 0.5 0 1 0 0)">
        {leftRows.flatMap((y, r) =>
          leftCols.map((x, c) =>
            r === 3 && c === 1 ? null : (
              <rect
                key={`l${r}${c}`}
                x={x}
                y={y}
                width="9"
                height="8"
                rx="1.5"
                fill={(r + c) % 3 === 0 ? '#ffd27a' : '#e4ecff'}
              />
            )
          )
        )}
        <rect x="41" y="95" width="12" height="16" rx="2" fill="#0c2aa8" />
        <circle cx="50" cy="104" r="1.2" fill="#ffd27a" />
      </g>

      {/* right-face windows */}
      <g transform="matrix(1 -0.5 0 1 0 0)">
        {rightRows.flatMap((y, r) =>
          rightCols.map((x, c) => (
            <rect
              key={`r${r}${c}`}
              x={x}
              y={y}
              width="9"
              height="8"
              rx="1.5"
              fill={(r + c) % 4 === 1 ? '#ffd27a' : '#a9bfff'}
            />
          ))
        )}
      </g>

      {/* location pin */}
      <path
        d="M112 4c-9 0-16 7-16 15 0 11 16 27 16 27s16-16 16-27c0-8-7-15-16-15Z"
        fill={`url(#${p}PropPin)`}
      />
      <circle cx="112" cy="19" r="6.5" fill="#fff" />
    </svg>
  )
}

function StayArt({ p }) {
  return (
    <svg viewBox="0 0 140 124" width="100%">
      <defs>
        <linearGradient id={`${p}StayWood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc98a" />
          <stop offset="1" stopColor="#e07a1f" />
        </linearGradient>
        <linearGradient id={`${p}StayBlanket`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7f9cff" />
          <stop offset="1" stopColor="#1b46f5" />
        </linearGradient>
        <linearGradient id={`${p}StayMattress`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3eaff" />
        </linearGradient>
        <linearGradient id={`${p}StayStar`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#f4a62a" />
        </linearGradient>
      </defs>

      <ellipse cx="70" cy="113" rx="60" ry="6" fill="#000" opacity="0.16" />

      {/* legs */}
      <rect x="13" y="96" width="8" height="16" rx="3" fill="#b85a10" />
      <rect x="119" y="96" width="8" height="16" rx="3" fill="#b85a10" />

      {/* headboard (padded) + footboard + frame */}
      <rect x="8" y="26" width="16" height="74" rx="7" fill={`url(#${p}StayWood)`} />
      <g fill="#fff" opacity="0.35">
        <circle cx="16" cy="42" r="2" />
        <circle cx="16" cy="56" r="2" />
        <circle cx="16" cy="70" r="2" />
      </g>
      <rect x="116" y="62" width="16" height="38" rx="6" fill={`url(#${p}StayWood)`} />
      <rect x="8" y="80" width="124" height="20" rx="7" fill={`url(#${p}StayWood)`} />
      <rect x="13" y="83" width="114" height="3" rx="1.5" fill="#fff" opacity="0.35" />

      {/* mattress */}
      <rect x="20" y="64" width="100" height="20" rx="8" fill={`url(#${p}StayMattress)`} stroke="#dfe6fb" />

      {/* pillows */}
      <rect x="30" y="44" width="30" height="18" rx="9" fill="#eef3ff" stroke="#dfe6fb" />
      <rect x="24" y="48" width="32" height="19" rx="9.5" fill="#fff" stroke="#dfe6fb" />

      {/* blanket */}
      <rect x="52" y="54" width="70" height="30" rx="10" fill={`url(#${p}StayBlanket)`} />
      <rect x="52" y="54" width="70" height="9" rx="4.5" fill="#b4c6ff" opacity="0.85" />
      <g fill="#fff" opacity="0.14">
        <rect x="70" y="66" width="3" height="18" />
        <rect x="84" y="66" width="3" height="18" />
        <rect x="98" y="66" width="3" height="18" />
      </g>

      {/* star badge */}
      <circle cx="116" cy="20" r="15" fill={`url(#${p}StayStar)`} />
      <polygon
        transform="translate(116 20)"
        points="0,-8 2,-2.75 7.61,-2.47 3.23,1.05 4.7,6.47 0,3.4 -4.7,6.47 -3.23,1.05 -7.61,-2.47 -2,-2.75"
        fill="#fff"
      />
    </svg>
  )
}

function HrmsArt({ p }) {
  const Person = ({ id, cx, cy, r, from, to }) => (
    <g>
      <defs>
        <linearGradient id={`${p}${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${p}${id})`} />
      <circle cx={cx} cy={cy - r * 0.27} r={r * 0.33} fill="#fff" />
      <path
        d={`M${cx - r * 0.58} ${cy + r * 0.7}c0-${r * 0.38} ${r * 0.26}-${r * 0.58} ${r * 0.58}-${r * 0.58}s${r * 0.58} ${r * 0.2} ${r * 0.58} ${r * 0.58}Z`}
        fill="#fff"
      />
    </g>
  )

  return (
    <svg viewBox="0 0 170 118" width="100%">
      <defs>
        <linearGradient id={`${p}HrCard`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9efff" />
        </linearGradient>
        <linearGradient id={`${p}HrCheck`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3ddc97" />
          <stop offset="1" stopColor="#0f9d63" />
        </linearGradient>
      </defs>

      <rect x="6" y="6" width="158" height="102" rx="18" fill={`url(#${p}HrCard)`} stroke="#dfe6fb" />

      {/* org-chart connectors */}
      <path
        d="M85 41v9M38 59V50h94v9M85 50v9"
        fill="none"
        stroke="#bfd0ff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* manager */}
      <circle cx="85" cy="28" r="15.5" fill="none" stroke="#d6cdff" strokeWidth="2" />
      <Person id="HrTop" cx={85} cy={28} r={12} from="#a58bff" to="#6a45f0" />

      {/* team */}
      <Person id="HrA" cx={38} cy={70} r={11} from="#7f9cff" to="#1b46f5" />
      <Person id="HrB" cx={85} cy={70} r={11} from="#3ddc97" to="#0f9d63" />
      <Person id="HrC" cx={132} cy={70} r={11} from="#ffb36b" to="#f4923b" />
      <g fill="#bfd0ff">
        <rect x="25" y="85" width="26" height="5" rx="2.5" />
        <rect x="72" y="85" width="26" height="5" rx="2.5" />
        <rect x="119" y="85" width="26" height="5" rx="2.5" />
      </g>
      <g fill="#dbe5ff">
        <rect x="29" y="94" width="18" height="4" rx="2" />
        <rect x="76" y="94" width="18" height="4" rx="2" />
        <rect x="123" y="94" width="18" height="4" rx="2" />
      </g>

      {/* approved badge */}
      <circle cx="144" cy="24" r="11" fill={`url(#${p}HrCheck)`} />
      <path d="M138.5 24.5l4 4 7-8" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   BOX GEOMETRY — shared by both box layers and the scroll loop.
   Each flap is a parallelogram hinged on a rim edge; `deg` is its fold angle
   (0 = lying flat over the opening, 90 = upright, >90 = leaning outward).
───────────────────────────────────────────── */
const FLAP_LEN = 31
const FLAPS = [
  { key: 'bl', back: true,  p1: [22, 62], p2: [80, 38],  a: [29, 12],   open: 120, fill: '#e0a85a' },
  { key: 'br', back: true,  p1: [80, 38], p2: [138, 62], a: [-29, 12],  open: 120, fill: '#efc27d' },
  { key: 'fl', back: false, p1: [22, 62], p2: [80, 86],  a: [29, -12],  open: 240, fill: '#f3cb8c' },
  { key: 'fr', back: false, p1: [80, 86], p2: [138, 62], a: [-29, -12], open: 240, fill: '#e6b265' },
]

function flapPoints(f, deg) {
  const r = (deg * Math.PI) / 180
  const ox = f.a[0] * Math.cos(r)
  const oy = f.a[1] * Math.cos(r) - FLAP_LEN * Math.sin(r)
  const [x1, y1] = f.p1
  const [x2, y2] = f.p2
  return [x1, y1, x2, y2, x2 + ox, y2 + oy, x1 + ox, y1 + oy]
    .map((n) => n.toFixed(1))
    .join(' ')
}

function BoxBackArt() {
  return (
    <svg viewBox="0 0 160 140" width="100%">
      <defs>
        <linearGradient id="hfDbIn" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b3f14" />
          <stop offset="1" stopColor="#99601f" />
        </linearGradient>
      </defs>
      {/* back flaps while they're open (behind the falling objects) */}
      {FLAPS.filter((f) => f.back).map((f) => (
        <polygon
          key={f.key}
          data-flap={f.key}
          data-layer="back"
          points={flapPoints(f, f.open)}
          fill={f.fill}
          stroke="#fde7bd"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      ))}
      <polygon points="80,38 138,62 80,86 22,62" fill="url(#hfDbIn)" />
    </svg>
  )
}

function BoxFrontArt() {
  return (
    <svg viewBox="0 0 160 140" width="100%">
      <defs>
        <linearGradient id="hfDbL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6a655" />
          <stop offset="1" stopColor="#c47f33" />
        </linearGradient>
        <linearGradient id="hfDbR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0be76" />
          <stop offset="1" stopColor="#d6923f" />
        </linearGradient>
      </defs>
      <polygon points="22,62 80,86 80,140 22,116" fill="url(#hfDbL)" />
      <polygon points="80,86 138,62 138,116 80,140" fill="url(#hfDbR)" />
      <polyline points="22,62 80,86 138,62" fill="none" stroke="#fde7bd" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <g transform="matrix(1 0.4138 0 1 0 0)">
        <rect x="34" y="66" width="26" height="22" rx="2" fill="#fff" opacity="0.9" />
        <g fill="#3b2a12" opacity="0.8">
          <rect x="37" y="70" width="1.6" height="14" />
          <rect x="40" y="70" width="2.6" height="14" />
          <rect x="44.5" y="70" width="1.6" height="14" />
          <rect x="48" y="70" width="2.6" height="14" />
          <rect x="52.5" y="70" width="1.6" height="14" />
        </g>
      </g>
      {/* back flaps once they fold inward (in front of the objects), then the front flaps */}
      {FLAPS.map((f) => (
        <polygon
          key={f.key}
          data-flap={f.key}
          data-layer="front"
          points={flapPoints(f, f.open)}
          fill={f.fill}
          stroke="#fde7bd"
          strokeWidth="1.2"
          strokeLinejoin="round"
          style={f.back ? { display: 'none' } : undefined}
        />
      ))}
    </svg>
  )
}

/* ─────────────────────────────────────────────
   HERO FLOW — one continuous scene (timings are in viewport-heights scrolled).
   1. hero scrolls away; the box rides just under its bottom edge, then rests at the bottom
   2. objects drop into the box
   3. flaps fold shut
   4. headline fades in above the closed box
───────────────────────────────────────────── */
const FLOW_ITEMS = [
  // DOM order = stacking order (later = in front); `delay` staggers the drops
  // s < 0 -> object sinks fully below the rim; sc = size when it lands
  { key: 'hrms',     cls: 'crm',    Art: HrmsArt,     delay: 0.06, fx: 0.08,  s: -0.06, drot: 14,  dir: 1,  sc: 0.6 },
  { key: 'gym',    Art: GymArt,    delay: 0,    fx: -0.25, s: -0.06, drot: 6,   dir: -1, sc: 0.62 },
  { key: 'property', cls: 'funnel', Art: PropertyArt, delay: 0.03, fx: 0.26,  s: -0.06, drot: 2,   dir: 1,  sc: 0.62 },
  { key: 'box',    Art: BoxArt,    delay: 0.04, fx: -0.04, s: -0.06, drot: 2,   dir: -1, sc: 0.6 },
  { key: 'stay',     cls: 'chat',   Art: StayArt,     delay: 0.08, fx: -0.12, s: -0.06, drot: -14, dir: 1,  sc: 0.62 },
]

// Scroll once from the banner and the whole scene plays by itself (seconds):
// hero lifts away -> box rises -> objects drop in -> flaps close -> headline.
// Scrolling is locked while it plays, then the page scrolls on as normal.
// Scrolling up at the very top plays it in reverse.
const HERO_OUT_DUR = 0.8
const BOX_START = 0.25
const BOX_DUR = 0.9
const FALL_START = 1.1
const FALL_DUR = 0.9
const STAGGER = 4 // multiplies each item's `delay` -> tiny offset in seconds
const CLOSE_START = 2.4
const CLOSE_DUR = 0.7
const COPY_START = 3.05
const COPY_DUR = 0.5
const TOTAL = 3.55

// px kept between a landed object and the bottom edge of the box's front face
const LAND_MARGIN = 16

function HeroFlow({ children }) {
  const wrapRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    // phones: no animation at all, just the plain hero banner (matches the 640px CSS breakpoint)
    const mobileMq = window.matchMedia('(max-width: 640px)')
    if (mobileMq.matches) return undefined

    const stage = wrap.querySelector('.hero-flow__stage')
    const boxEl = wrap.querySelector('.hero-dropbox--back')
    const hero = wrap.querySelector('.hero-banner')
    const els = Array.from(wrap.querySelectorAll('.hero-float'))
    if (!stage || !boxEl || !els.length) return undefined

    const flapNodes = FLAPS.map((f) => ({
      f,
      nodes: Array.from(wrap.querySelectorAll(`[data-flap="${f.key}"]`)),
    }))

    const clamp = (v) => Math.min(Math.max(v, 0), 1)
    const easeOut = (t) => 1 - (1 - t) * (1 - t)
    const smooth = (t) => t * t * (3 - 2 * t)
    const atTop = () => window.scrollY <= 2

    let alive = true
    let geo = []
    let restTop = 0
    let time = atTop() ? 0 : TOTAL // seconds into the sequence
    let dir = 0 // 1 = playing in, -1 = playing back
    let last = 0
    let loop = 0

    // rest position of every object (its hero spot) -> where it lands inside the box
    const measure = () => {
      const bw = boxEl.offsetWidth
      const bh = boxEl.offsetHeight
      const bl = boxEl.offsetLeft
      const bt = boxEl.offsetTop
      restTop = bt
      const mx = bl + bw / 2
      geo = els.map((el, i) => {
        const cfg = FLOW_ITEMS[i]
        const w = el.offsetWidth
        const h = el.offsetHeight
        if (!w || !h) return null // hidden on small screens
        const fcx = mx + bw * cfg.fx
        // box rim / front-face bottom are V-shaped (higher at the sides)
        const edge = Math.min(Math.abs(fcx - mx) / (bw * 0.3625), 1)
        const rimY = bt + bh * ((62 + 24 * (1 - edge)) / 140)
        const faceBottomY = bt + bh * ((116 + 24 * (1 - edge)) / 140)
        const sh = h * cfg.sc
        // objects are drawn tilted (inner body rotation + landing rotation), so their
        // real vertical reach is bigger than sh: use the worst-case half diagonal
        const half = (Math.hypot(w, h) * cfg.sc) / 2
        let fcy = rimY - cfg.s * sh + sh / 2
        // keep the whole object below the rim so it hides behind the front face...
        fcy = Math.max(fcy, rimY + half)
        // ...and never let any part of it poke out under the bottom edge (this wins)
        fcy = Math.min(fcy, faceBottomY - LAND_MARGIN - half)
        return {
          el,
          cfg,
          dx: fcx - (el.offsetLeft + w / 2),
          dy: fcy - (el.offsetTop + h / 2),
        }
      })
    }

    // draws the whole scene for the current `time`
    const render = () => {
      // hero lifts away
      const hp = easeOut(clamp(time / HERO_OUT_DUR))
      wrap.style.setProperty('--hp', String(hp))
      if (hero) hero.style.visibility = hp >= 1 ? 'hidden' : ''

      // box slides up from below the screen
      const be = smooth(clamp((time - BOX_START) / BOX_DUR))
      stage.style.setProperty('--by', `${(1 - be) * (window.innerHeight - restTop + 24)}px`)

      // objects fall into the box
      geo.forEach((g) => {
        if (!g) return
        const t = clamp((time - FALL_START - g.cfg.delay * STAGGER) / FALL_DUR)
        const x = g.dx * easeOut(t)
        const y = g.dy * t * t
        const r = g.cfg.drot * easeOut(t) + g.cfg.dir * 60 * Math.sin(Math.PI * t)
        const s = 1 + (g.cfg.sc - 1) * t
        g.el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`
      })

      // flaps close: back flaps first, then the front ones
      const c = clamp((time - CLOSE_START) / CLOSE_DUR)
      const cb = smooth(clamp(c / 0.6))
      const cf = smooth(clamp((c - 0.4) / 0.6))
      flapNodes.forEach(({ f, nodes }) => {
        const deg = f.open * (1 - (f.back ? cb : cf))
        const pts = flapPoints(f, deg)
        nodes.forEach((node) => {
          node.setAttribute('points', pts)
          if (f.back) {
            const show = (node.dataset.layer === 'back') === deg >= 90
            node.style.display = show ? '' : 'none'
          }
        })
      })

      // headline
      const ti = clamp((time - COPY_START) / COPY_DUR)
      stage.style.setProperty('--to', String(ti))
      stage.style.setProperty('--ty', `${(1 - ti) * 24}px`)
      stage.classList.toggle('is-falling', time > FALL_START - 0.05)
    }

    const running = () => (dir > 0 && time < TOTAL) || (dir < 0 && time > 0)

    const tick = (now) => {
      loop = 0
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      time = Math.min(Math.max(time + dir * dt, 0), TOTAL)
      render()
      if (running()) loop = requestAnimationFrame(tick)
    }

    const play = (d) => {
      if (mobileMq.matches) return // window was resized down to phone width
      dir = d
      last = performance.now()
      if (!loop) loop = requestAnimationFrame(tick)
    }

    // ---- triggers: the next scroll gesture from the banner starts everything ----
    const onWheel = (e) => {
      if (running()) {
        e.preventDefault()
        return
      }
      if (!atTop()) return
      if (e.deltaY > 0 && time === 0) {
        e.preventDefault()
        play(1)
      } else if (e.deltaY < 0 && time === TOTAL) {
        e.preventDefault()
        play(-1)
      }
    }

    let touchY = 0
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e) => {
      if (running()) {
        e.preventDefault()
        return
      }
      if (!atTop()) return
      const dy = touchY - e.touches[0].clientY
      if (dy > 8 && time === 0) {
        e.preventDefault()
        play(1)
      } else if (dy < -8 && time === TOTAL) {
        e.preventDefault()
        play(-1)
      }
    }

    const DOWN_KEYS = [' ', 'ArrowDown', 'PageDown']
    const UP_KEYS = ['ArrowUp', 'PageUp']
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || ''
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      const isDown = DOWN_KEYS.includes(e.key) && !e.shiftKey
      const isUp = UP_KEYS.includes(e.key) || (e.key === ' ' && e.shiftKey)
      if (!isDown && !isUp && e.key !== 'End' && e.key !== 'Home') return
      if (running()) {
        e.preventDefault()
        return
      }
      if (!atTop()) return
      if (isDown && time === 0) {
        e.preventDefault()
        play(1)
      } else if (isUp && time === TOTAL) {
        e.preventDefault()
        play(-1)
      }
    }

    const onScroll = () => {
      if (running()) {
        if (window.scrollY !== 0) window.scrollTo(0, 0) // e.g. scrollbar drag
        return
      }
      // jumped past the banner (anchor link, reload, scrollbar): show the finished scene
      if (!atTop() && time < TOTAL) {
        time = TOTAL
        render()
      }
    }

    // re-measure whenever layout may have changed (resize, fonts/images loaded,
    // stylesheet hot-reload) so the objects always land inside the box
    const onResize = () => {
      if (!alive) return
      measure()
      render()
    }

    measure()
    render()
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    window.addEventListener('load', onResize)

    let ro = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize)
      ro.observe(stage)
      ro.observe(boxEl)
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(onResize)
    }

    return () => {
      alive = false
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('load', onResize)
      if (ro) ro.disconnect()
      if (loop) cancelAnimationFrame(loop)
    }
  }, [])

  return (
    <div className="hero-flow" ref={wrapRef}>
      <div className="hero-flow__stage" aria-hidden="true">
        <div className="hero-dropbox hero-dropbox--back">
          <BoxBackArt />
        </div>

        {FLOW_ITEMS.map(({ key, cls, Art }) => (
          <div key={key} className={`hero-float hero-float--${key}${cls ? ` hero-float--${cls}` : ''}`}>
            <div className="hero-float__body">
              <Art p="hf" />
            </div>
          </div>
        ))}

        <div className="hero-dropbox hero-dropbox--front">
          <BoxFrontArt />
        </div>

        <div className="hero-flow__copy">
          <span className="hero-flow__eyebrow">All in one</span>
          <h2 className="hero-flow__title">
            Everything your business runs on,{' '}
            <span className="hero-flow__title-accent">in one box</span>
          </h2>
          <p className="hero-flow__text">
            Gym, inventory, CRM, HRMS and more — one platform, one login.
          </p>
        </div>
      </div>

      {children}

      <div className="hero-flow__runway" />
    </div>
  )
}

function Home() {
  return (
    <>
      <Nav />

      <HeroFlow>
      <section className="hero-banner">

        <div className="hero-banner__inner">
          <h1 className="hero-banner__title">
            AI That Drives Your
            <br />
            <span className="hero-banner__title-accent">Enterprise Growth</span>
          </h1>
          <p className="hero-banner__subtitle">
            Transforming businesses with cutting-edge AI technology for
            efficiency, cost savings, and real-time insights.
          </p>

          <div className="hero-banner__actions">
            <a
              href="https://trellisco.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
            >
              Try Trellisco
            </a>
            <a
              href="https://wa.me/917591907003"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
            >
              Chat with team
            </a>
          </div>

          <div className="hero-banner__visual">
            <img
              src={HeroImg}
              alt="Trellisco ERP dashboard on a laptop"
              className="hero-banner__image"
            />
          </div>
        </div>
      </section>
      </HeroFlow>

      <IndustrySolutions />
      <PlatformFeatures />
      <Faq />
      <ProductShowcase />
      <Footer />

      {/* Floating promo video card (managed from Admin → Promo video) */}
      <PromoVideoPlayer />
    </>
  )
}

export default Home