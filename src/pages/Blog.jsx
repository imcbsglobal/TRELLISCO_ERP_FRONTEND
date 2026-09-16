// Blog.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import './Blog.scss'

import cover1 from '../assets/1.png'
import cover2 from '../assets/2.png'
import cover3 from '../assets/3.png'
import cover4 from '../assets/4.png'
import hrComparisonImage from '../assets/6.png'
import platformCoverImage from '../assets/7.png'

/* ─────────────────────────────────────────────
   BLOG DATA
───────────────────────────────────────────── */
const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'company', label: 'Company' },
  { key: 'hrms', label: 'HRMS' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'property', label: 'Property' },
  { key: 'gym', label: 'Gym' },
]

const CATEGORY_ACCENT = {
  company: '#7c3aed',
  hrms: '#1b46f5',
  restaurant: '#f4923b',
  property: '#1fa37e',
  gym: '#e2461f',
}

// swap these for per-category images once you have more covers —
// right now hrms shares the company cover since there's no dedicated art yet
const CATEGORY_COVER = {
  company: cover1,
  hrms: cover1,
  restaurant: cover3,
  property: cover4,
  gym: cover2,
}

// resolves a post's card/hero cover — a post's own `coverImage` wins,
// falling back to the shared category cover
export function getPostCover(post) {
  return post.coverImage || CATEGORY_COVER[post.category] || CATEGORY_COVER.company
}

export const POSTS = [
  {
    id: 1,
    slug: 'why-we-built-one-platform-instead-of-five',
    category: 'company',
    categoryLabel: 'Company',
    title: 'Why we built one platform instead of five',
    excerpt:
      'Every team we talked to was running a different tool for every job, and paying for the gaps between them. Here\u2019s what that actually costs, and what changed when we closed the gaps.',
    date: 'Sep 2, 2026',
    readTime: '6 min read',
    author: 'Ali Corak',
    featured: true,
    coverImage: platformCoverImage,
  },
  {
    id: 2,
    slug: 'payroll-attendance-different-systems',
    category: 'hrms',
    categoryLabel: 'HRMS',
    title: 'What\u2019s actually inside Trellisco: the web portal and the three apps',
    excerpt:
      'Trellisco isn\u2019t three separate products bolted together \u2014 it\u2019s one HRMS that shows up as a web portal for HR and three native apps for everyone else, all reading from the same database.',
    date: 'Aug 26, 2026',
    readTime: '5 min read',
    author: 'Ali Corak',
    body: [
      {
        id: 'what-trellisco-is',
        heading: 'One system instead of a stack of them',
        paragraphs: [
          'Trellisco is an AI-powered HR management system built to cover the full employee lifecycle \u2014 recruitment, attendance, payroll, and offboarding \u2014 from one centralized web portal, with dedicated mobile apps sitting on top of it.',
          'It\u2019s designed for businesses of any size, and the goal is simple: cut down manual effort by keeping every team working off the same data instead of stitching separate tools together.',
        ],
      },
      {
        id: 'web-portal',
        heading: 'The web portal: one control centre for HR',
        paragraphs: [
          'The Trellisco web portal is the main control centre for the entire HR operation. It\u2019s built for HR managers and admins to run day-to-day activities from one place, with no switching between different tools or systems.',
        ],
        workflow: [
          'Employee Management',
          'Recruitment',
          'Attendance',
          'Payroll',
          'Leave Management',
          'Increment Log',
          'Offboarding',
          'Master Settings',
          'User Management',
        ],
      },
      {
        id: 'three-apps',
        heading: 'Three apps, each built for a different job',
        paragraphs: [
          'Beyond the portal, Trellisco ships as three purpose-built mobile apps that all read from and write back to the same system \u2014 nothing lives in isolation.',
        ],
        apps: [
          {
            name: 'Trellisco Pro',
            tag: 'Admin & Reports',
            desc: 'A mobile-first control centre for owners, directors, and senior managers \u2014 a live dashboard, attendance analytics, employee quick lookup, and smart alerts for pending approvals, without needing to log into the full HRMS.',
          },
          {
            name: 'Trellisco Bio',
            tag: 'Face & Location Attendance',
            desc: 'Replaces manual registers and biometric machines with a smartphone punch-in \u2014 AI-verified face recognition, geofenced check-ins restricted to defined site perimeters, and full work-hour capture including overtime.',
          },
          {
            name: 'Trellisco',
            tag: 'Employee Self-Service',
            desc: 'Gives every employee direct access to their HR profile \u2014 leave requests, salary advance requests, WFH sign-off, attendance history, and company announcements \u2014 all routed to the web portal for manager approval.',
            highlight: true,
          },
        ],
      },
      {
        id: 'platform-integration',
        heading: 'One database, three apps',
        paragraphs: [
          'All three apps are native extensions of the same platform \u2014 same database, same permissions model \u2014 so nothing needs to be re-entered or reconciled between them.',
        ],
        workflow: [
          'Real-time sync with the web platform \u2014 no lag, no duplicate data',
          'Role-based access \u2014 admins see everything, employees see their own data',
          'Push notifications for approvals and announcements',
          'Multi-client support for CA firms, HR consultancies, and group companies',
          'WhatsApp integration for alerts',
          'Multi-branch support',
        ],
        quote:
          'It isn\u2019t three products bolted together \u2014 it\u2019s one system that shows up differently depending on who\u2019s using it.',
      },
      {
        id: 'final-thoughts',
        heading: 'Final thoughts',
        paragraphs: [
          'An owner checking attendance analytics, an HR manager processing payroll, an employee applying for leave \u2014 it\u2019s the same data and the same source of truth behind all three, with no reconciliation step in between.',
        ],
      },
    ],
  },
  {
    id: 3,
    slug: 'melone-lite-pos-stay-one-ecosystem',
    category: 'restaurant',
    categoryLabel: 'Melone',
    title: 'Three products, one Melone ecosystem: Lite, POS, and Stay explained',
    excerpt:
      'Melone isn\u2019t one product trying to fit every business \u2014 it\u2019s three, each built for a different scale and a different setup. Here\u2019s what actually goes into Lite, POS, and Stay.',
    date: 'Aug 19, 2026',
    readTime: '6 min read',
    author: 'Ali Corak',
    body: [
      {
        id: 'why-three-products',
        heading: 'Every business runs differently, so Melone doesn\u2019t assume one setup',
        paragraphs: [
          'A small shop run from a phone and a large multi-outlet business with a checkout counter don\u2019t need the same tool wearing a different skin \u2014 they need software built around how each one actually operates.',
          'Melone is structured as three products instead of one, so a business picks the version that matches its scale and setup rather than paying for complexity it doesn\u2019t need, or outgrowing something too simple too fast.',
        ],
      },
      {
        id: 'the-three-products',
        heading: 'Lite, POS, and Stay: the three products',
        paragraphs: [
          'Each product in the Melone ecosystem is built for a specific kind of business, and none of them are a stripped-down or padded-out version of another.',
        ],
        apps: [
          {
            name: 'Melone Lite',
            tag: 'Mobile-First & Lightweight',
            desc: 'Built for small-scale industries and businesses that need essential management functionality without a complex setup. Melone Lite runs primarily from a mobile phone, keeping it lightweight and simple to pick up on day one.',
          },
          {
            name: 'Melone POS',
            tag: 'Hybrid Cloud POS',
            desc: 'Built for large-scale industries and businesses that need a robust POS and centralized management. Melone POS is fully cloud-based and works as a hybrid system \u2014 online or offline \u2014 with data and operations synchronizing to the cloud the moment connectivity is available.',
            highlight: true,
          },
          {
            name: 'Melone Stay',
            tag: 'Accommodation Management',
            desc: 'Built specifically for room-stay and accommodation businesses \u2014 hotels, lodges, resorts, homestays, and similar operations \u2014 as the dedicated accommodation-focused product in the Melone ecosystem.',
          },
        ],
      },
      {
        id: 'how-pos-handles-offline',
        heading: 'How Melone POS keeps working when the connection doesn\u2019t',
        paragraphs: [
          'A checkout counter can\u2019t stop taking orders because the internet dropped, so Melone POS is built to keep running locally and catch up with the cloud as soon as it can.',
        ],
        workflow: [
          'Operates normally offline \u2014 sales and records keep moving with no connectivity',
          'Full cloud-based backbone once connected, not just an add-on sync layer',
          'Automatic synchronization to the cloud the moment a connection is available',
          'Centralized management across locations from the same cloud data',
        ],
        quote:
          'A hybrid POS shouldn\u2019t mean choosing between fast and connected \u2014 it should work offline and still end up centralized.',
      },
      {
        id: 'final-thoughts',
        heading: 'Final thoughts',
        paragraphs: [
          'A homestay owner running Melone Stay, a small vendor running Melone Lite from a phone, and a multi-outlet business running Melone POS across locations are all on the same ecosystem \u2014 just the version built for how they actually work.',
        ],
      },
    ],
  },
  {
    id: 5,
    slug: 'cluadius-membership-fees-notifications-one-platform',
    category: 'gym',
    categoryLabel: 'cluadius',
    title: 'How cluadius runs a gym: membership, fees, and notifications in one place',
    excerpt:
      'A gym\u2019s day runs on three things \u2014 who\u2019s a member, who owes what, and who needs to know it. cluadius connects all three from a single dashboard instead of three separate habits.',
    date: 'Aug 4, 2026',
    readTime: '6 min read',
    author: 'Ali Corak',
    body: [
      {
        id: 'one-platform-for-the-gym',
        heading: 'One platform for the whole gym operation',
        paragraphs: [
          'Between members, trainers, branches, and fees, a gym has a lot of moving parts to track \u2014 and most of that tracking still happens across registers, spreadsheets, and someone\u2019s memory of who paid last month.',
          'cluadius is built to run gyms, fitness centers, and clubs from one centralized platform, so membership status, fee collection, and day-to-day operations all live in the same place instead of three different habits.',
        ],
      },
      {
        id: 'gym-management',
        heading: 'Gym management, from one dashboard',
        paragraphs: [
          'The dashboard is where the complete gym operation is run \u2014 gym and branch details, staff records, and a view into what\u2019s actually happening day to day.',
        ],
        workflow: [
          'Gym and branch information',
          'Trainers and staff records',
          'Member records',
          'Day-to-day gym activity monitoring',
        ],
      },
      {
        id: 'membership-management',
        heading: 'Membership management, start to finish',
        paragraphs: [
          'Every member\u2019s membership is tracked from the day it\u2019s created to the day it lapses, so nobody has to check a register to know who\u2019s current.',
        ],
        workflow: [
          'Create different membership plans',
          'Assign memberships to members',
          'Track start and expiry dates',
          'Separate active, expired, and upcoming memberships',
          'View a member\u2019s complete history',
        ],
      },
      {
        id: 'automated-fee-management',
        heading: 'Automated fee management',
        paragraphs: [
          'Fee collection is usually the part that depends most on someone remembering to follow up. cluadius sets the schedule once and tracks the rest on its own.',
        ],
        workflow: [
          'Set up membership fees and payment schedules',
          'Automatically track upcoming and overdue payments',
          'See paid, pending, and overdue fees at a glance',
          'Keep a payment history for every member',
        ],
        quote: 'Fee collection shouldn\u2019t depend on someone remembering to chase it down.',
      },
      {
        id: 'member-notifications',
        heading: 'Keeping members in the loop automatically',
        paragraphs: [
          'Most missed payments and lapsed memberships aren\u2019t a member deciding to leave \u2014 they\u2019re a reminder that never went out. cluadius sends the reminder before it becomes a problem.',
        ],
        workflow: [
          'Membership expiry reminders',
          'Upcoming fee/payment reminders',
          'Overdue payment notifications',
          'Payment confirmation',
          'Membership renewal reminders',
          'Important gym announcements',
        ],
      },
      {
        id: 'the-mobile-app',
        heading: 'The cluadius app: everything a member needs to check',
        paragraphs: [
          'Members get their own view into the same system \u2014 no need to ask the front desk whether a payment went through or when a membership expires.',
        ],
        workflow: [
          'View membership details',
          'Check membership expiry',
          'View fee/payment status',
          'Receive notifications',
          'View payment history',
          'Receive renewal reminders',
          'Access important gym information',
        ],
      },
      {
        id: 'final-thoughts',
        heading: 'Final thoughts',
        paragraphs: [
          'A gym administrator managing branches and staff, and a member checking their next payment date on the app, are both looking at the same underlying data \u2014 just from opposite sides of the same platform.',
        ],
      },
    ],
  },
  {
    id: 6,
    slug: 'trellisco-vs-duct-taping-five-tools',
    category: 'company',
    categoryLabel: 'Company',
    title: 'Trellisco vs. duct-taping five tools together: an honest look',
    excerpt:
      'We\u2019re not neutral here, so we\u2019re showing our work instead. A side-by-side of what changes when your tools share one system.',
    date: 'Jul 28, 2026',
    readTime: '7 min read',
    author: 'Ali Corak',
    coverImage: hrComparisonImage,
    body: [
      {
        id: 'how-hr-used-to-run',
        heading: 'How HR used to run without a system',
        paragraphs: [
          'Before an HRMS, most of this ran on registers, spreadsheets, and whoever happened to remember the details. Attendance was marked on paper or a biometric machine nobody else could see into, leave requests went through a WhatsApp message or a physical form, and payroll got calculated by pulling numbers from three or four different places by hand.',
          'None of that is a failure of effort \u2014 it\u2019s just what happens when the process depends on people instead of a shared system.',
        ],
      },
      {
        id: 'where-the-old-way-breaks',
        heading: 'Where the old way breaks down',
        paragraphs: [
          'The cracks usually don\u2019t show up on a normal day \u2014 they show up at month-end, at audit time, or the one week someone\u2019s away and nobody else knows where things stand.',
        ],
        workflow: [
          'No single source of truth \u2014 attendance, leave, and payroll live in different places',
          'Attendance re-entered by hand from a register or a separate machine',
          'Payroll errors from copying numbers between spreadsheets',
          'Leave and salary approvals buried in chat threads, easy to lose',
          'No real-time view into who\u2019s in, who\u2019s out, or what\u2019s pending',
          'No audit trail if a number gets questioned later',
        ],
      },
      {
        id: 'what-changes-with-trellisco',
        heading: 'What changes with Trellisco',
        paragraphs: [
          'The same activities still happen \u2014 people still clock in, apply for leave, and get paid \u2014 but every one of them now writes to the same system instead of a separate one.',
        ],
        workflow: [
          'Attendance captured through the app, with face and location verification',
          'Payroll calculated from the same attendance and leave data, not re-entered',
          'Leave and salary-advance requests routed for approval and logged automatically',
          'Owners and managers see live attendance and payroll status from a dashboard',
          'Every employee record traceable end to end, no reconstruction needed',
        ],
        quote: 'The old way isn\u2019t broken because people aren\u2019t trying hard enough \u2014 it\u2019s broken because it depends on someone remembering.',
      },
      {
        id: 'comparison-snapshot',
        heading: 'The comparison, at a glance',
        paragraphs: [
          'Put side by side, the difference isn\u2019t about any one feature \u2014 it\u2019s that one approach depends on people remembering things, and the other doesn\u2019t.',
        ],
        image: hrComparisonImage,
        imageAlt: 'Comparison of old-way HR management versus Trellisco',
      },
      {
        id: 'final-thoughts',
        heading: 'Final thoughts',
        paragraphs: [
          'None of the individual old-way habits are unreasonable on their own \u2014 a register, a spreadsheet, a WhatsApp approval all work in the moment. What they don\u2019t do is add up to one reliable picture of the business, which is the entire point of running HR on a system instead of a set of habits.',
        ],
      },
    ],
  },
  {
    id: 7,
    slug: 'venukart-one-dashboard-for-every-property',
    category: 'property',
    categoryLabel: 'Venukart',
    title: 'One dashboard for every property: how Venukart\u2019s property management actually works',
    excerpt:
      'Owners running more than one property usually end up running more than one system too. Venukart puts every property \u2014 hotel, homestay, or commercial unit \u2014 under a single account instead.',
    date: 'Aug 7, 2026',
    readTime: '5 min read',
    author: 'Ali Corak',
    body: [
      {
        id: 'why-one-account',
        heading: 'Managing five properties shouldn\u2019t mean five logins',
        paragraphs: [
          'A lot of property management tools are built around a single listing, so the moment an owner adds a second or third property, they end up juggling separate logins, separate dashboards, or separate spreadsheets to keep track of what\u2019s where.',
          'Venukart is built the other way around: one account, any number of properties. A property owner or manager adds every property they run to the same account and manages all of them from one place.',
        ],
      },
      {
        id: 'adding-a-property',
        heading: 'Adding a property',
        paragraphs: [
          'Adding a property is meant to capture everything a listing needs up front, not just a name and an address.',
        ],
        workflow: [
          'Property name and type',
          'Address',
          'Description',
          'Photos',
          'Amenities',
          'Any other relevant property details',
        ],
        quote: 'One account, any number of properties \u2014 nothing about adding a fifth property should feel different from adding the first.',
      },
      {
        id: 'managing-properties',
        heading: 'Managing properties after they\u2019re live',
        paragraphs: [
          'A listing isn\u2019t finished once it\u2019s added \u2014 pricing changes, photos get updated, availability shifts, and sometimes a property needs to come off the platform for a season without being deleted outright.',
        ],
        workflow: [
          'Edit property information at any time',
          'Update photos, amenities, pricing, and availability',
          'Activate a property to make it live',
          'Deactivate a property temporarily',
          'Archive a property that\u2019s no longer in use',
        ],
      },
      {
        id: 'the-property-dashboard',
        heading: 'The property dashboard',
        paragraphs: [
          'The dashboard is where an owner or manager lands to see the state of everything they run \u2014 status, key details, and a way into each individual property without hunting for it.',
          'The goal is a glance, not a report: what\u2019s active, what needs attention, and one click into any property that needs a closer look.',
        ],
      },
      {
        id: 'property-types',
        heading: 'Built for more than one kind of property',
        paragraphs: [
          'Venukart isn\u2019t scoped to a single category of property \u2014 the same account structure supports very different kinds of listings side by side.',
        ],
        workflow: [
          'Hotels',
          'Resorts',
          'Homestays',
          'Apartments',
          'Villas',
          'Guest houses',
          'Commercial properties',
          'Other rental or managed properties',
        ],
      },
      {
        id: 'final-thoughts',
        heading: 'Final thoughts',
        paragraphs: [
          'Whether it\u2019s a single homestay or a portfolio spanning hotels, apartments, and commercial units, the account structure doesn\u2019t change \u2014 it\u2019s the same dashboard, just with more cards on it.',
        ],
      },
    ],
  },
]

export const CATEGORY_COVER_MAP = CATEGORY_COVER

/* ─────────────────────────────────────────────
   BLOG HERO + FILTER
───────────────────────────────────────────── */
function BlogHero({ active, onChange }) {
  return (
    <section className="blog-hero">
      <div className="blog-hero__topbar">
        <span className="blog-hero__eyebrow">
          OUR BLOG <i className="blog-hero__eyebrow-line" aria-hidden="true" />
        </span>

        <div className="blog-hero__heading">
          <h1 className="blog-hero__title">Insights for a Smarter Tomorrow</h1>
          <p className="blog-hero__subtitle">
            Product updates, industry trends, and practical guides to help you get the most
            out of Trellisco.
          </p>
        </div>

        <a href="#" className="blog-hero__viewall">
          VIEW ALL ARTICLES <span aria-hidden="true">&rarr;</span>
        </a>
      </div>

      <div className="blog-hero__tabs" role="tablist">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            role="tab"
            aria-selected={cat.key === active}
            className={`blog-hero__tab${cat.key === active ? ' blog-hero__tab--active' : ''}`}
            onClick={() => onChange(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   POST CARDS
───────────────────────────────────────────── */
function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <path
        d="M2.5 8h11M9 3.5L13.5 8 9 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PostCover({ post }) {
  return (
    <div className="blog-card__cover">
      <img src={getPostCover(post)} alt={post.title} loading="lazy" />
    </div>
  )
}

function FeaturedPost({ post }) {
  const accent = CATEGORY_ACCENT[post.category] || CATEGORY_ACCENT.company
  return (
    <Link to={`/blog/${post.slug}`} className="featured-post">
      <div className="featured-post__cover">
        <img src={getPostCover(post)} alt={post.title} />
      </div>
      <div className="featured-post__body">
        <span className="featured-post__category" style={{ color: accent }}>
          {post.categoryLabel}
        </span>
        <h2 className="featured-post__title">{post.title}</h2>
        <p className="featured-post__excerpt">{post.excerpt}</p>
        <div className="featured-post__meta">
          <span>{post.date}</span>
          <span className="featured-post__dot" aria-hidden="true">&middot;</span>
          <span>{post.readTime}</span>
          <span className="featured-post__dot" aria-hidden="true">&middot;</span>
          <span>{post.author}</span>
        </div>
        <span className="featured-post__link">
          READ ARTICLE <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

function PostCard({ post }) {
  const accent = CATEGORY_ACCENT[post.category] || CATEGORY_ACCENT.company
  return (
    <Link to={`/blog/${post.slug}`} className="blog-card">
      <PostCover post={post} />
      <div className="blog-card__body">
        <span className="blog-card__category" style={{ color: accent }}>
          {post.categoryLabel}
        </span>
        <h3 className="blog-card__title">{post.title}</h3>
        <div className="blog-card__meta">
          <span>{post.date}</span>
          <span className="blog-card__dot" aria-hidden="true">&middot;</span>
          <span>{post.readTime}</span>
          <span className="blog-card__dot" aria-hidden="true">&middot;</span>
          <span>{post.author}</span>
        </div>
        <span className="blog-card__link">
          READ ARTICLE <ArrowIcon />
        </span>
      </div>
    </Link>
  )
}

function BlogGrid({ posts, showFeatured }) {
  const featured = showFeatured ? posts.find((p) => p.featured) : null
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : posts

  return (
    <section className="blog-grid">
      <div className="blog-grid__inner">
        {featured && <FeaturedPost post={featured} />}

        {rest.length > 0 ? (
          <div className="blog-grid__cards">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="blog-grid__empty">No posts in this category yet.</p>
        )}
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   COMPARISON SECTION
───────────────────────────────────────────── */
const COMPARISON_ROWS = [
  {
    label: 'Setup time',
    tools: 'Days, per tool',
    erp: '3\u20136 months',
    trellisco: 'Under a week',
  },
  {
    label: 'Data across teams',
    tools: 'Exported and re-entered by hand',
    erp: 'Centralized, but rigid',
    trellisco: 'Synced in real time',
  },
  {
    label: 'Pricing',
    tools: 'A separate bill per tool',
    erp: 'High minimums, long contracts',
    trellisco: 'One predictable plan',
  },
  {
    label: 'Customization',
    tools: 'Limited to what each tool allows',
    erp: 'Slow, usually needs consultants',
    trellisco: 'Configurable from the app',
  },
  {
    label: 'Support',
    tools: 'A different vendor for each issue',
    erp: 'Ticket queue, long turnaround',
    trellisco: 'One team, one thread',
  },
  {
    label: 'Onboarding',
    tools: 'Repeated for every new tool',
    erp: 'A dedicated project',
    trellisco: 'Guided, self-serve',
  },
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 8.5l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Comparison() {
  return (
    <section className="comparison" id="comparison">
      <div className="comparison__inner">
        <span className="comparison__eyebrow">The comparison</span>
        <h2 className="comparison__title">Trellisco vs. running it in pieces</h2>
        <p className="comparison__subtitle">
          {'Point tools and legacy ERPs solve different problems. Here\u2019s where each one tends to land.'}
        </p>

        <div className="comparison__card">
          <div className="comparison__table">
            <div className="comparison__row comparison__row--head">
              <div className="comparison__cell comparison__cell--label" />
              <div className="comparison__cell">Point tools</div>
              <div className="comparison__cell">Legacy ERP</div>
              <div className="comparison__cell comparison__cell--trellisco">Trellisco</div>
            </div>

            {COMPARISON_ROWS.map((row) => (
              <div className="comparison__row" key={row.label}>
                <div className="comparison__cell comparison__cell--label">{row.label}</div>
                <div className="comparison__cell">{row.tools}</div>
                <div className="comparison__cell">{row.erp}</div>
                <div className="comparison__cell comparison__cell--trellisco">
                  <span className="comparison__check">
                    <CheckIcon />
                  </span>
                  {row.trellisco}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   CTA BANNER
───────────────────────────────────────────── */
function BlogCta() {
  return (
    <section className="blog-cta">
      <div className="blog-cta__inner">
        <h2 className="blog-cta__title">Ready to run it from one place?</h2>
        <p className="blog-cta__subtitle">
          See what Trellisco looks like for your team, no separate tools required.
        </p>
        <div className="blog-cta__actions">
          <button type="button" className="blog-cta__btn blog-cta__btn--primary">
            Try it for free
          </button>
          <button type="button" className="blog-cta__btn blog-cta__btn--ghost">
            Chat with sales
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
function Blog() {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredPosts =
    activeCategory === 'all'
      ? POSTS
      : POSTS.filter((post) => post.category === activeCategory)

  return (
    <>
      <Nav />
      <BlogHero active={activeCategory} onChange={setActiveCategory} />
      <BlogGrid posts={filteredPosts} showFeatured={activeCategory === 'all'} />
      <Comparison />
      <BlogCta />
      <Footer />
    </>
  )
}

export default Blog