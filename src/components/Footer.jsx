import React from "react";
import TrelliscoLogo from "../assets/Trellisco logo 2.png";
import "./Footer.scss";

const FOOTER_LINKS = [
  {
    heading: "Products",
    links: [
      { label: "Trellisco HRMS", href: "https://trellisco.in/" },
      { label: "Trellisco CRM", href: "#" },
      { label: "Trellis Asset", href: "#" },
      { label: "Cluadius", href: "#" },
      { label: "Venukart", href: "#" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "HRMS", href: "#" },
      { label: "Restaurant", href: "#" },
      { label: "Property", href: "#" },
      { label: "Gym", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Customers", href: "#" },
      { label: "Partners", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

const SOCIALS = [
  {
    key: "twitter",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <path
          d="M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.6.8-2.5 1a4 4 0 0 0-6.9 3.6A11.3 11.3 0 0 1 3.8 4.6a4 4 0 0 0 1.2 5.3c-.6 0-1.3-.2-1.8-.5v.1a4 4 0 0 0 3.2 3.9c-.6.1-1.2.2-1.8.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.4a11.3 11.3 0 0 0 6.1 1.8c7.3 0 11.3-6.1 11.3-11.3v-.5c.8-.6 1.4-1.3 1.9-2.1-.7.3-1.5.5-2.3.6Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "linkedin",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <path
          d="M6.9 8.6H3.5V20h3.4V8.6ZM5.2 3.5A2 2 0 1 0 5.2 7.5 2 2 0 0 0 5.2 3.5ZM20.5 20h-3.4v-5.8c0-1.4 0-3.1-1.9-3.1-1.9 0-2.2 1.5-2.2 3v5.9H9.6V8.6H13v1.6h.05c.5-.9 1.7-1.9 3.4-1.9 3.7 0 4.4 2.4 4.4 5.5V20Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    key: "instagram",
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
];

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
    <path
      d="M12 22s7-7.2 7-12.5A7 7 0 0 0 5 9.5C5 14.8 12 22 12 22Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
    <path
      d="M4.6 3.6h3.2l1.4 4.2-2 1.6a12.4 12.4 0 0 0 5.4 5.4l1.6-2 4.2 1.4v3.2c0 .9-.75 1.6-1.65 1.5A17.2 17.2 0 0 1 3.1 5.25 1.55 1.55 0 0 1 4.6 3.6Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M3.5 12h17M12 3.5a13 13 0 0 1 3.6 8.5A13 13 0 0 1 12 20.5 13 13 0 0 1 8.4 12 13 13 0 0 1 12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
    <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <a className="footer__logo" href="/">
            <img src={TrelliscoLogo} alt="Trellisco" className="footer__logo-img" />
          </a>
          <p className="footer__tagline">
            AI-driven tools for HR, operations, and growth — built to run your business,
            not add to it.
          </p>

          <div className="footer__socials">
            {SOCIALS.map((s) => (
              <a key={s.key} href={s.href} className="footer__social" aria-label={s.key}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="footer__columns">
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading} className="footer__column">
              <span className="footer__column-heading">{col.heading}</span>
              <ul className="footer__column-list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="footer__column-link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer__address">
       <div className="footer__address-inner">
        <div className="footer__address-col">
          <span className="footer__address-office">Head office</span>

          <div className="footer__address-group">
            <div className="footer__address-item">
              <span className="footer__address-icon">
                <PinIcon />
              </span>
              <p className="footer__address-text">
                No. 4/461, 2nd Floor, Valamkottil Towers, Judgemukku, Kakkanad, Kochi,
                Kerala–682021
              </p>
            </div>
            <div className="footer__address-item">
              <span className="footer__address-icon">
                <PhoneIcon />
              </span>
              <p className="footer__address-text">
                <strong className="footer__address-label">IMCB Solutions LLP</strong>
                +91 7591 907 003
                <br />
                +91 7594 820 733
              </p>
            </div>
          </div>

          <span className="footer__address-heading">Branches</span>
          <div className="footer__address-group">
            <div className="footer__address-item">
              <span className="footer__address-icon">
                <PinIcon />
              </span>
              <p className="footer__address-text">
                Wayanad, Calicut, Thrissur, Kottayam, Kannur
              </p>
            </div>
          </div>
        </div>

        <div className="footer__address-divider" aria-hidden="true" />

        <div className="footer__address-col">
          <span className="footer__address-office">International office</span>

          <div className="footer__address-group">
            <div className="footer__address-item">
              <span className="footer__address-icon">
                <PinIcon />
              </span>
              <p className="footer__address-text">
                Cyber Vibe Technologies
                <br />
                Business Tower, Sharjah Corniche, UAE
              </p>
            </div>
            <div className="footer__address-item">
              <span className="footer__address-icon">
                <PhoneIcon />
              </span>
              <p className="footer__address-text">+971 50 707 9358</p>
            </div>
          </div>

          <span className="footer__address-heading">Reach us</span>
          <div className="footer__address-group">
            <div className="footer__address-item">
              <span className="footer__address-icon">
                <GlobeIcon />
              </span>
              <a
                href="https://trelliscoerp.com"
                className="footer__address-text footer__address-link"
              >
                trelliscoerp.com
              </a>
            </div>
            <div className="footer__address-item">
              <span className="footer__address-icon">
                <MailIcon />
              </span>
              <a
                href="mailto:enquiry@trellisco.in"
                className="footer__address-text footer__address-link"
              >
                enquiry@trellisco.in
              </a>
            </div>
          </div>
        </div>
       </div>
      </div>

      <div className="footer__cta">
        <div className="footer__cta-copy">
          <span className="footer__cta-eyebrow">Get started</span>
          <h3 className="footer__cta-title">Ready to run your business on Trellisco?</h3>
        </div>
        <div className="footer__cta-actions">
          <button type="button" className="btn btn--primary footer__cta-btn">
            Try it for free
          </button>
          <a href="#" className="footer__cta-link">
            Chat with sales
            <svg viewBox="0 0 12 8" width="10" height="8">
              <path
                d="M1 4h10M7 1l4 3-4 3"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        <span className="footer__copyright">
          © {new Date().getFullYear()} Trellisco. All rights reserved.
        </span>
        <div className="footer__legal">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
}