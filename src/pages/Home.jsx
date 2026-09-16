import { useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import FallingText from '../components/FallingText'
import HeroImg from '../assets/ChatGPT Image Sep 12, 2026, 04_26_49 PM.png'
import HRMSImg from '../assets/HRMS.png'
import RestaurantImg from '../assets/Restuart.png'
import PropertyImg from '../assets/propertymanagment.png'
import GymImg from '../assets/gym.png'
import ShowcaseImg from '../assets/ChatGPT Image Sep 14, 2026, 11_36_58 AM.png'
import PlatformFeatures from './PlatformFeatures'
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
  },
  {
    key: 'restaurant',
    label: 'Restaurant',
    accent: '#f4923b',
    eyebrow: 'Hospitality',
    title: 'Good food, brighter people',
    lead: 'Keep orders, inventory, staff schedules, and reports moving without leaving the floor.',
    includes: ['Orders', 'Inventory', 'Staff', 'Reports'],
    image: RestaurantImg,
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

            <a href="#" className="solutions__link" style={{ color: active.accent }}>
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
            fontSize="clamp(1.5rem, 2.6vw, 2rem)"
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

function Home() {
  return (
    <>
      <Nav />

      <section className="hero-banner">
        <div className="hero-banner__glow" aria-hidden="true" />

        <div className="hero-banner__inner">
          <div className="hero-banner__content">
            <h1 className="hero-banner__title">
              AI That Drives Your
              <br />
              Enterprise Growth
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
                Try it for free
              </a>
              <a
                href="https://wa.me/917591907003"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
              >
                Chat with sales
              </a>
            </div>
          </div>

          <div className="hero-banner__visual">
            <img
              src={HeroImg}
              alt="Trellisco AI enterprise platform"
              className="hero-banner__image"
            />
          </div>
        </div>
      </section>

      <IndustrySolutions />
      <PlatformFeatures />
      <Faq />
      <ProductShowcase />
      <Footer />
    </>
  )
}

export default Home