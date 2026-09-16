import React, { useState } from "react";
import Nav from "../components/Nav";
import "./Contact.scss";

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M5 4c1 0 2.4 2.4 2.4 3.3 0 .8-1.4 1.5-1.4 2.2 0 1.4 3.1 4.5 4.5 4.5.7 0 1.4-1.4 2.2-1.4.9 0 3.3 1.4 3.3 2.4 0 1.4-1.4 2.7-2.7 2.7C9.4 17.7 6.3 14.6 3.3 9.7 3.3 8.4 4.6 4 5 4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M12 21s7-6.6 7-11.5A7 7 0 105 9.5C5 14.4 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.4 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.4-3.6-8.5S9.6 5.9 12 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M12 3.5a8.4 8.4 0 00-7.2 12.7L3.5 20.5l4.4-1.3A8.4 8.4 0 1012 3.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.7 8.3c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.4.2.5.7 1.6.7 1.7.1.1.1.3 0 .4-.1.2-.1.3-.3.4-.1.2-.3.3-.4.5-.1.1-.3.3-.1.6.2.3.8 1.2 1.7 2 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.2.1.9-.2 1.6-.3.8-1.6 1.5-2.2 1.6-.6.1-1.2.2-4-1-3.4-1.4-5.5-4.8-5.6-5-.2-.2-1.3-1.8-1.3-3.4s.8-2.4 1.1-2.7z"
        stroke="currentColor"
        strokeWidth="0.4"
        fill="currentColor"
      />
    </svg>
  );
}

const OFFICES = [
  {
    title: "Head Office",
    address: [
      "No. 4/461, 2nd Floor, Valamkottil Towers, Judgemukku,",
      "Kakkanad, Kochi, Kerala–682021",
    ],
    phones: [
      { value: "+91 7591 907 003", wa: "917591907003" },
      { value: "+91 7594 820 733", wa: "917594820733" },
    ],
    branchesLabel: "Branches",
    branches: "Wayanad, Calicut, Thrissur, Kottayam, Kannur",
  },
  {
    title: "International Office",
    address: ["Cyber Vibe Technologies", "Business Tower, Sharjah Corniche, UAE"],
    phones: [{ value: "+971 50 707 9358", wa: "971507079358" }],
    reach: [
      { icon: GlobeIcon, value: "trellisco.in", href: "https://trellisco.in" },
      { icon: MailIcon, value: "enquiry@trellisco.in", href: "mailto:enquiry@trellisco.in" },
    ],
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("sending");
    // TODO: wire this up to your actual form endpoint / API.
    setTimeout(() => {
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 700);
  };

  return (
    <>
      <Nav />

      <main className="contact">
        <section className="contact__hero">
          <span className="contact__kicker">Contact</span>
          <h1 className="contact__title">Let's talk about your business</h1>
          <p className="contact__subtitle">
            Have a question about Trellisco HRMS, CRM, Melone, Cluadius, or Venukart? Send us a
            message and our team will get back to you shortly.
          </p>
        </section>

        <section className="contact__grid">
          <div className="contact__timeline">
            {OFFICES.map((office) => (
              <div className="tl-office" key={office.title}>
                <h3 className="tl-office__title">{office.title}</h3>

                <div className="tl-row">
                  <span className="tl-row__dot">
                    <PinIcon />
                  </span>
                  <div className="tl-row__text">
                    {office.address.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                </div>

                <div className="tl-row">
                  <span className="tl-row__dot">
                    <PhoneIcon />
                  </span>
                  <div className="tl-row__text">
                    {office.phones.map((phone) => (
                      <a
                        key={phone.value}
                        href={`https://wa.me/${phone.wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tl-row__link"
                      >
                        {phone.value}
                      </a>
                    ))}
                  </div>
                </div>

                {office.branches && (
                  <div className="tl-row">
                    <span className="tl-row__dot">
                      <PinIcon />
                    </span>
                    <div className="tl-row__text">
                      <span className="tl-row__label">{office.branchesLabel}</span>
                      <span>{office.branches}</span>
                    </div>
                  </div>
                )}

                {office.reach && (
                  <>
                    {office.reach.map(({ icon: Icon, value, href }) => (
                      <div className="tl-row" key={value}>
                        <span className="tl-row__dot">
                          <Icon />
                        </span>
                        <div className="tl-row__text">
                          <a href={href} className="tl-row__link">
                            {value}
                          </a>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>

          <form className="contact__form" onSubmit={handleSubmit}>
            <div className="contact__form-row">
              <label className="contact__field">
                <span>Name</span>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </label>

              <label className="contact__field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                />
              </label>
            </div>

            <label className="contact__field">
              <span>Subject</span>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="What's this about?"
              />
            </label>

            <label className="contact__field">
              <span>Message</span>
              <textarea
                name="message"
                required
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us a bit about what you need..."
              />
            </label>

            <button type="submit" className="contact__submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending..." : status === "sent" ? "Message sent ✓" : "Send message"}
            </button>

            {status === "sent" && (
              <p className="contact__success">Thanks! We'll get back to you soon.</p>
            )}
          </form>
        </section>

       
      </main>
    </>
  );
}