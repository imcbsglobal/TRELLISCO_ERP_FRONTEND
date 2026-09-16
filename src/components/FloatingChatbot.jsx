import { useState, useRef, useEffect } from 'react'
import ChatbotImg from '../assets/ChatGPT Image Aug 20, 2026, 01_07_33 PM.png'
import './FloatingChatbot.scss'

/* ─────────────────────────────────────────────
   KNOWLEDGE BASE — Trellisco covers everything:
   Gym, HRMS, Property, Restaurant management
───────────────────────────────────────────── */
const QUICK_QUESTIONS = [
  'What is Trellisco?',
  'What features do you offer?',
  'How much does it cost?',
  'How do I book a demo?',
  'How do I contact support?',
]

const KB = [
  {
    keywords: ['what is trellisco', 'about trellisco', 'trellisco?'],
    answer:
      "Trellisco is an all-in-one business management platform built for modern teams. One system covers Gym Management, HRMS, Property Management, and Restaurant Management — so you don't need five different tools.",
  },
  {
    keywords: ['feature', 'offer', 'what can you do', 'services'],
    answer:
      'Trellisco covers GPS-based attendance & check-in, automated payroll runs, shift scheduling, leave & waitlist management, recruitment pipelines, performance scoring, and real-time analytics dashboards.',
  },
  {
    keywords: ['gym'],
    answer:
      'Our Gym Management module handles memberships, trainer schedules, class bookings, check-ins, and billing — all from one dashboard.',
  },
  {
    keywords: ['hrms', 'hr', 'payroll', 'employee', 'attendance', 'leave'],
    answer:
      'Trellisco HRMS covers recruitment, attendance, payroll, leave, and performance tracking — replacing spreadsheets with one connected system.',
  },
  {
    keywords: ['property', 'tenant', 'rent', 'real estate', 'maintenance'],
    answer:
      'Trellisco Property Management lets you track units, tenants, rent collection, and maintenance requests across your whole portfolio.',
  },
  {
    keywords: ['restaurant', 'hospitality', 'menu', 'order', 'inventory'],
    answer:
      'Trellisco for Restaurants keeps orders, inventory, staff scheduling, and reports moving in real time — right from the floor.',
  },
  {
    keywords: ['cost', 'price', 'pricing', 'how much'],
    answer:
      'Pricing depends on your team size and the modules you need. Book a quick demo and our team will walk you through a plan that fits your HR setup.',
  },
  {
    keywords: ['demo', 'book', 'trial', 'try it'],
    answer:
      "You can book a free demo by clicking 'Try it for free' on the homepage, or I can have someone from our team reach out — just share your email.",
  },
  {
    keywords: ['support', 'contact', 'help', 'reach'],
    answer:
      'You can reach our support team anytime at support@trellisco.com, or use the "Chat with sales" button on the homepage for a faster response.',
  },
]

const FALLBACK =
  "I didn't quite catch that — I can help with Trellisco's Gym, HRMS, Property, or Restaurant management modules, pricing, demos, or support. Could you rephrase?"

function getReply(text) {
  const lower = text.toLowerCase()
  const match = KB.find((entry) => entry.keywords.some((k) => lower.includes(k)))
  return match ? match.answer : FALLBACK
}

function FloatingChatbot() {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: "Hi there 👋 I'm the Trellisco assistant. Ask me anything, or pick a question below to get started.",
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [askedQuestions, setAskedQuestions] = useState([])
  const bodyRef = useRef(null)

  // Hide the launcher while the hero/banner section is in view.
  // Pages without a .hero-banner (e.g. Blog) simply keep it visible.
  useEffect(() => {
    const banner = document.querySelector('.hero-banner')
    if (!banner) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting
        setVisible(!inView)
        if (inView) setOpen(false) // close the panel too if it was open
      },
      { threshold: 0.15 }
    )

    observer.observe(banner)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages, typing])

  const sendMessage = (text, isQuickQuestion = false) => {
    const trimmed = text.trim()
    if (!trimmed) return

    if (isQuickQuestion) {
      setAskedQuestions((prev) => [...prev, trimmed])
    }

    setMessages((prev) => [...prev, { from: 'user', text: trimmed }])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'bot', text: getReply(trimmed) }])
      setTyping(false)
    }, 650 + Math.random() * 500)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  if (!visible) return null

  const remainingQuestions = QUICK_QUESTIONS.filter((q) => !askedQuestions.includes(q))

  return (
    <div className="floating-chatbot">
      {open && (
        <div className="floating-chatbot__panel">
          <div className="floating-chatbot__header">
            <img src={ChatbotImg} alt="Assistant" className="floating-chatbot__avatar-sm" />
            <div className="floating-chatbot__header-text">
              <span className="floating-chatbot__title">Trellisco Assistant</span>
              <span className="floating-chatbot__status">
                <span className="floating-chatbot__dot" /> Online
              </span>
            </div>
            <button
              type="button"
              className="floating-chatbot__close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          <div className="floating-chatbot__body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`floating-chatbot__bubble floating-chatbot__bubble--${m.from}`}
              >
                {m.text.split('\n').map((line, j) => (
                  <span key={j} className="floating-chatbot__line">
                    {line}
                  </span>
                ))}
              </div>
            ))}

            {typing && (
              <div className="floating-chatbot__bubble floating-chatbot__bubble--bot floating-chatbot__bubble--typing">
                <span className="floating-chatbot__typing-dot" />
                <span className="floating-chatbot__typing-dot" />
                <span className="floating-chatbot__typing-dot" />
              </div>
            )}

            {!typing && (
              <div className="floating-chatbot__quick">
                {remainingQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="floating-chatbot__quick-btn"
                    onClick={() => sendMessage(q, true)}
                  >
                    {q}
                  </button>
                ))}

                {askedQuestions.length > 0 && (
                  <button
                    type="button"
                    className="floating-chatbot__quick-btn floating-chatbot__quick-btn--reset"
                    onClick={() => setAskedQuestions([])}
                  >
                    ↺ Show all questions
                  </button>
                )}
              </div>
            )}
          </div>

          <form className="floating-chatbot__input" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>

          <div className="floating-chatbot__footer">Powered by Trellisco · Instant answers</div>
        </div>
      )}

      <button
        type="button"
        className="floating-chatbot__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle chat"
      >
        <img src={ChatbotImg} alt="Chat" className="floating-chatbot__avatar" />
      </button>
    </div>
  )
}

export default FloatingChatbot