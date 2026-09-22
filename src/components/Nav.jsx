import React, { useState } from "react";
import { Link } from "react-router-dom";
import TrelliscoLogo from "../assets/Trellisco logo 2.png";
import HrImg from "../assets/Hr.png";
import CrmImg from "../assets/ChatGPT Image Sep 16, 2026, 10_40_36 AM.png";
import AssetImg from "../assets/ChatGPT Image Sep 16, 2026, 10_44_40 AM.png";
import ClaudesImg from "../assets/ChatGPT Image Sep 14, 2026, 10_23_27 AM.png";
import MeloneLiteImg from "../assets/ChatGPT Image Sep 16, 2026, 11_09_30 AM.png";
import VenukartImg from "../assets/ChatGPT Image Sep 14, 2026, 10_39_24 AM.png";
import MeloneLogo from "../assets/MELONE PNG (1) (1).png";
import ClaudesLogo from "../assets/cluadius icon W-01 (1).png";
import VenukartLogo from "../assets/image.png";
import "./Nav.scss";

const PRODUCTS = [
  {
    key: "hrms",
    name: "Trellisco HRMS",
    eyebrow: "Trellisco Suite",
    desc: "Manage employee records, payroll, attendance, leave, and performance reviews from one connected HR platform.",
    accent: "#2f6fed",
    link: "https://trellisco.in/",
    badge: {
      text: "Built for Growing Teams",
      color: "#2a8d5c",
    },
    features: [
      {
        icon: "people",
        color: "#2f6fed",
        title: "Employee Records",
        desc: "Centralize profiles, documents, and employment history.",
      },
      {
        icon: "clock",
        color: "#e0424a",
        title: "Attendance Tracking",
        desc: "Log check-ins, shifts, and time-off automatically.",
      },
      {
        icon: "wallet",
        color: "#2a8d5c",
        title: "Payroll Management",
        desc: "Run accurate, on-time payroll every cycle.",
      },
      {
        icon: "people-two",
        color: "#1f9c8a",
        title: "Performance Reviews",
        desc: "Set goals and run structured review cycles.",
      },
      {
        icon: "calendar",
        color: "#7b5cff",
        title: "Leave Management",
        desc: "Request, approve, and track leave in one place.",
      },
      {
        icon: "settings",
        color: "#e0a700",
        title: "Self-Service Portal",
        desc: "Let employees manage their own info and requests.",
      },
    ],
    previewStats: [
      { label: "Employees", value: "248", variant: "blue" },
      { label: "On Leave", value: "12", variant: "green" },
      { label: "Present Today", value: "236", variant: "purple" },
      { label: "Pending Requests", value: "8", variant: "orange" },
    ],
    previewChartLabel: "Attendance Overview",
  },
  {
    key: "crm",
    name: "Trellisco CRM",
    eyebrow: "Trellisco Suite",
    desc: "Track leads, deals, and customer relationships in one pipeline built for fast-moving sales teams.",
    accent: "#1a5690",
    link: "https://trellisco.in/",
    badge: {
      text: "Built for Sales Teams",
      color: "#1a5690",
    },
    features: [
      {
        icon: "people",
        color: "#1a5690",
        title: "Lead Management",
        desc: "Capture, qualify, and organize leads in one pipeline.",
      },
      {
        icon: "call",
        color: "#e0424a",
        title: "Automatic Calling",
        desc: "Dial, log, and record calls straight from the lead record.",
      },
      {
        icon: "wallet",
        color: "#2a8d5c",
        title: "Deal Pipeline",
        desc: "Track every deal through each stage until it closes.",
      },
      {
        icon: "clock",
        color: "#e0a700",
        title: "Follow-up Automation",
        desc: "Auto-schedule reminders so no lead ever goes cold.",
      },
      {
        icon: "people-two",
        color: "#7b5cff",
        title: "Team Collaboration",
        desc: "Assign leads and work deals together as a team.",
      },
      {
        icon: "chart",
        color: "#1f9c8a",
        title: "Reports & Analytics",
        desc: "See conversion, call activity, and pipeline health at a glance.",
      },
    ],
    previewStats: [
      { label: "Open Leads", value: "184", variant: "blue" },
      { label: "Calls Today", value: "42", variant: "green" },
      { label: "Deals Won", value: "16", variant: "purple" },
      { label: "Follow-ups Due", value: "9", variant: "orange" },
    ],
    previewChartLabel: "Call Activity Overview",
  },
  {
    key: "asset",
    name: "Trellis Asset",
    eyebrow: "Trellisco Suite",
    desc: "Track, assign, and maintain every piece of company equipment, software license, and inventory item from one place.",
    accent: "#1f9c8a",
    link: "https://trellisco.in/",
    badge: {
      text: "Built for Asset-Heavy Teams",
      color: "#1f9c8a",
    },
    features: [
      {
        icon: "box",
        color: "#1f9c8a",
        title: "Asset Inventory",
        desc: "Keep a single, searchable registry of every asset you own.",
      },
      {
        icon: "people",
        color: "#2f6fed",
        title: "Assignment Tracking",
        desc: "Assign assets to employees or teams and track ownership.",
      },
      {
        icon: "settings",
        color: "#e0a700",
        title: "Maintenance Scheduling",
        desc: "Plan, log, and get reminded of servicing and repairs.",
      },
      {
        icon: "swap",
        color: "#e0424a",
        title: "Check-in / Check-out",
        desc: "Hand out or return laptops, chairs, and gear with a log.",
      },
      {
        icon: "trend-down",
        color: "#7b5cff",
        title: "Depreciation Tracking",
        desc: "See the current value of every asset as it ages.",
      },
      {
        icon: "chart",
        color: "#2a8d5c",
        title: "Reports & Analytics",
        desc: "Track utilization, depreciation, and asset health at a glance.",
      },
    ],
    previewStats: [
      { label: "Total Assets", value: "612", variant: "blue" },
      { label: "Checked Out", value: "487", variant: "green" },
      { label: "Under Maintenance", value: "14", variant: "purple" },
      { label: "Due for Replacement", value: "9", variant: "orange" },
    ],
    previewChartLabel: "Asset Condition Overview",
  },
  {
    key: "late",
    name: "Melone Lite",
    eyebrow: "Melone Suite",
    desc: "A lightweight, mobile-first point of sale for small-scale businesses — full billing and management, right from your phone.",
    accent: "#e0a700",
    link: "https://melone.in/",
    badge: {
      text: "Built for Small Businesses",
      color: "#2a8d5c",
    },
    features: [
      {
        icon: "call",
        color: "#e0a700",
        title: "Mobile-First Billing",
        desc: "Bill customers straight from your phone, no extra hardware.",
      },
      {
        icon: "box",
        color: "#2f6fed",
        title: "Simple Inventory",
        desc: "Track stock without a complex setup.",
      },
      {
        icon: "wallet",
        color: "#2a8d5c",
        title: "Quick Checkout",
        desc: "A fast, single-screen checkout flow.",
      },
      {
        icon: "settings",
        color: "#7b5cff",
        title: "Easy Setup",
        desc: "Get started in minutes, no training required.",
      },
      {
        icon: "chart",
        color: "#1f9c8a",
        title: "Daily Sales Reports",
        desc: "See how your business is doing at a glance.",
      },
      {
        icon: "people",
        color: "#e0424a",
        title: "Customer Records",
        desc: "Keep a simple log of regular customers and their orders.",
      },
    ],
  },
  {
    key: "pose",
    name: "Melone POS",
    eyebrow: "Melone Suite",
    desc: "A hybrid, cloud-based point of sale for large-scale operations — works online or offline, and syncs the moment you're back online.",
    accent: "#7b5cff",
    link: "https://melone.in/",
    badge: {
      text: "Built for Large Operations",
      color: "#7b5cff",
    },
    features: [
      {
        icon: "swap",
        color: "#7b5cff",
        title: "Online + Offline Billing",
        desc: "Keep billing uninterrupted even when the internet drops.",
      },
      {
        icon: "settings",
        color: "#2f6fed",
        title: "Cloud Sync",
        desc: "Data and operations sync automatically once you're online.",
      },
      {
        icon: "people-two",
        color: "#1f9c8a",
        title: "Multi-Outlet Management",
        desc: "Run and monitor several branches from one dashboard.",
      },
      {
        icon: "box",
        color: "#e0a700",
        title: "Inventory & Stock",
        desc: "Track stock levels across every outlet in real time.",
      },
      {
        icon: "chart",
        color: "#2a8d5c",
        title: "Centralized Reports",
        desc: "See sales and performance across all locations at once.",
      },
      {
        icon: "people",
        color: "#e0424a",
        title: "Staff & Role Access",
        desc: "Control what each staff member can see and do.",
      },
    ],
  },
  {
    key: "stay",
    name: "Melone Stay",
    eyebrow: "Melone Suite",
    desc: "Booking, room, and guest management built for hotels, lodges, resorts, and homestays.",
    accent: "#2a8d5c",
    link: "https://melone.in/",
    badge: {
      text: "Built for Stay Businesses",
      color: "#2a8d5c",
    },
    features: [
      {
        icon: "calendar",
        color: "#2a8d5c",
        title: "Room & Booking Management",
        desc: "Manage reservations and room availability in one place.",
      },
      {
        icon: "swap",
        color: "#e0424a",
        title: "Guest Check-in / Check-out",
        desc: "Handle arrivals and departures with a simple log.",
      },
      {
        icon: "wallet",
        color: "#e0a700",
        title: "Rates & Availability",
        desc: "Set room rates and keep availability up to date.",
      },
      {
        icon: "settings",
        color: "#7b5cff",
        title: "Housekeeping Tracking",
        desc: "Track room status and turnaround between guests.",
      },
      {
        icon: "people-two",
        color: "#1f9c8a",
        title: "Multi-Property Support",
        desc: "Manage more than one property from a single account.",
      },
      {
        icon: "chart",
        color: "#2f6fed",
        title: "Booking Reports",
        desc: "See occupancy and revenue trends at a glance.",
      },
    ],
  },
  {
    key: "claudes",
    name: "Cluadius",
    eyebrow: "Trellisco Suite",
    desc: "An AI assistant that drafts replies, summarizes tickets, manages gym memberships and schedules, and automates busywork.",
    accent: "#e07b39",
    link: "#",
    badge: {
      text: "Built for Gyms & Fitness Studios",
      color: "#e07b39",
    },
    features: [
      {
        icon: "settings",
        color: "#e07b39",
        title: "Gym Management",
        desc: "Manage gym operations, schedules, and equipment from one dashboard.",
      },
      {
        icon: "people",
        color: "#2f6fed",
        title: "Membership Management",
        desc: "Track memberships, renewals, and member records with ease.",
      },
      {
        icon: "wallet",
        color: "#2a8d5c",
        title: "Automated Fee Identification",
        desc: "Automatically detect and flag pending or overdue membership fees.",
      },
      {
        icon: "call",
        color: "#7b5cff",
        title: "Automated Messaging",
        desc: "Send automated reminders and updates to members and staff.",
      },
    ],
  },
  {
    key: "cart",
    name: "Venukart",
    eyebrow: "Trellisco Suite",
    desc: "A multi-vendor marketplace platform for running online stores, vendor operations, and property listings from one dashboard.",
    accent: "#e0424a",
    link: "https://www.venuekart.co.in/",
    badge: {
      text: "Built for Marketplaces",
      color: "#e0424a",
    },
    features: [
      {
        icon: "people",
        color: "#e0424a",
        title: "Vendor Onboarding",
        desc: "Bring vendors on board and manage their storefronts.",
      },
      {
        icon: "box",
        color: "#2f6fed",
        title: "Product Catalog",
        desc: "Organize listings, categories, and variants with ease.",
      },
      {
        icon: "wallet",
        color: "#2a8d5c",
        title: "Order Management",
        desc: "Track orders from checkout through fulfillment.",
      },
      {
        icon: "building",
        color: "#e0a700",
        title: "Property Management",
        desc: "List, manage, and track rental or sale properties alongside products.",
      },
      {
        icon: "swap",
        color: "#7b5cff",
        title: "Payments & Payouts",
        desc: "Handle checkout, commissions, and vendor payouts.",
      },
      {
        icon: "chart",
        color: "#1f9c8a",
        title: "Reports & Analytics",
        desc: "Monitor sales, vendor performance, and marketplace health.",
      },
    ],
    previewStats: [
      { label: "Active Vendors", value: "76", variant: "blue" },
      { label: "Listings", value: "1,240", variant: "green" },
      { label: "Properties Listed", value: "58", variant: "purple" },
      { label: "Orders Today", value: "312", variant: "orange" },
    ],
    previewChartLabel: "Marketplace Overview",
  },
];

const GROUPS = [
  {
    key: "trellisco",
    label: "Trellisco",
    tagline: "Integrated suite for modern businesses",
    logo: TrelliscoLogo,
    items: ["hrms", "crm", "asset"],
  },
  {
    key: "melone",
    label: "Melone",
    tagline: "Suite for logistics, media & hospitality",
    logo: MeloneLogo,
    items: ["late", "pose", "stay"],
  },
  {
    key: "claudes",
    label: "Cluadius",
    tagline: "AI assistant for support & ops",
    logo: ClaudesLogo,
    items: ["claudes"],
  },
  {
    key: "cart",
    label: "Venukart",
    tagline: "Multi-vendor commerce platform",
    logo: VenukartLogo,
    items: ["cart"],
  },
];

const getProduct = (key) =>
  PRODUCTS.find((p) => p.key === key) || PRODUCTS[0];

const getGroup = (key) =>
  GROUPS.find((g) => g.key === key) || GROUPS[0];

const IMAGE_ONLY_PANELS = {};

const PREVIEW_IMAGES = {
  hrms: HrImg,
  crm: CrmImg,
  asset: AssetImg,
  late: MeloneLiteImg,
  pose: MeloneLiteImg,
  stay: MeloneLiteImg,
  cart: VenukartImg,
  claudes: ClaudesImg,
};

const NAV_LINKS = [
  { label: "Home", key: "home", path: "/" },
  { label: "Products", key: "products", hasMega: true },
  { label: "Blog", key: "blog", path: "/blog" },
  { label: "Partners", key: "partners" },
  { label: "Resources", key: "resources" },
];

function ChevronRight({ className, width = 10, height = 8 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 8"
      width={width}
      height={height}
    >
      <path
        d="M1 4h10M7 1l4 3-4 3"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BadgeCheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6.5 10.2l2.3 2.3 4.7-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpMascotIcon() {
  return (
    <svg viewBox="0 0 40 40" width="22" height="22" fill="none">
      <path
        d="M20 4c1.2 0 2.1.9 2.1 2.1 0 .8-.4 1.5-1 1.9v2.3h1.4a8.5 8.5 0 018.5 8.5v9.6a3.6 3.6 0 01-3.6 3.6H12.6a3.6 3.6 0 01-3.6-3.6v-9.6a8.5 8.5 0 018.5-8.5h1.4V8c-.6-.4-1-1.1-1-1.9C17.9 4.9 18.8 4 20 4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16.2" cy="21" r="1.8" fill="currentColor" />
      <circle cx="23.8" cy="21" r="1.8" fill="currentColor" />
      <path
        d="M15.5 26.5c1.2.9 2.8 1.4 4.5 1.4s3.3-.5 4.5-1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProductIcon({ type }) {
  switch (type) {
    case "hrms":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <circle
            cx="20"
            cy="20"
            r="15"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <circle
            cx="20"
            cy="20"
            r="6"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <circle cx="20" cy="20" r="1.6" fill="currentColor" />
        </svg>
      );

    case "crm":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <rect
            x="6"
            y="9"
            width="28"
            height="22"
            rx="3"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path d="M6 15h28" stroke="currentColor" strokeWidth="2.3" />
          <circle cx="14" cy="22" r="2.4" fill="currentColor" />
          <path
            d="M20 22h8"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      );

    case "cart":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <path
            d="M6 8h4l3 18h18l3-13H12"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="17" cy="32" r="2" fill="currentColor" />
          <circle cx="29" cy="32" r="2" fill="currentColor" />
        </svg>
      );

    case "stay":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <path
            d="M6 30V13M6 22h28a3 3 0 013 3v5"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="10"
            y="15"
            width="9"
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M22 22v-4a3 3 0 013-3h6"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      );

    case "late":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <rect
            x="11"
            y="4"
            width="18"
            height="32"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path
            d="M11 9h18M11 30h18"
            stroke="currentColor"
            strokeWidth="2.1"
          />
          <circle cx="20" cy="33" r="1.4" fill="currentColor" />
        </svg>
      );

    case "pose":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <rect
            x="5"
            y="12"
            width="30"
            height="20"
            rx="3"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <circle
            cx="20"
            cy="22"
            r="6"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path
            d="M14 12l2.5-4h7l2.5 4"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "claudes":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <path
            d="M8 10h24a3 3 0 013 3v11a3 3 0 01-3 3H17l-7 6v-6h-2a3 3 0 01-3-3V13a3 3 0 013-3z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M14 18.5h12M14 23h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case "asset":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <rect
            x="6"
            y="14"
            width="28"
            height="18"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path
            d="M6 14l3-6h22l3 6"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M16 20h8"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

function CategoryLogo({ src, name }) {
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${name} logo`}
      className="mega__group-logo"
    />
  );
}

function FeatureIcon({ type }) {
  switch (type) {
    case "people":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <circle
            cx="15"
            cy="14"
            r="6"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path
            d="M5 33c0-6 4.5-10 10-10s10 4 10 10"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M25 12a5.5 5.5 0 010 11"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M27 23c4.2.7 7 4 7 10"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      );

    case "people-two":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <circle
            cx="14"
            cy="15"
            r="6"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path
            d="M4 33c0-6 4.5-10 10-10s10 4 10 10"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <circle
            cx="27"
            cy="13"
            r="4.5"
            stroke="currentColor"
            strokeWidth="2.1"
          />
          <path
            d="M22 24c3.6.3 6.5 3 7.5 6.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      );

    case "clock":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <circle
            cx="20"
            cy="21"
            r="14"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path
            d="M20 12v9l6 4"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 5h8"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      );

    case "wallet":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <rect
            x="5"
            y="11"
            width="30"
            height="20"
            rx="3"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path d="M5 17h30" stroke="currentColor" strokeWidth="2.3" />
          <circle cx="27" cy="24" r="2" fill="currentColor" />
        </svg>
      );

    case "calendar":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <rect
            x="6"
            y="9"
            width="28"
            height="24"
            rx="3"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path d="M6 16h28" stroke="currentColor" strokeWidth="2.3" />
          <path
            d="M13 5v7M27 5v7"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M13 23l3 3 7-7"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "settings":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <circle
            cx="20"
            cy="20"
            r="6"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path
            d="M20 6v4M20 30v4M34 20h-4M10 20H6M29.6 10.4l-2.8 2.8M13.2 26.8l-2.8 2.8M29.6 29.6l-2.8-2.8M13.2 13.2l-2.8-2.8"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      );

    case "call":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <path
            d="M9 6c1.6 0 3.9 3.9 3.9 5.4 0 1.3-2.2 2.4-2.2 3.5 0 2.3 5.1 7.4 7.4 7.4 1.1 0 2.2-2.2 3.5-2.2 1.5 0 5.4 2.3 5.4 3.9 0 2.3-2.2 4.5-4.4 4.5C15.9 28.5 11.5 24.1 4.5 17.4 4.5 15.2 6.7 6 9 6z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "chart":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <path
            d="M6 34V6"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            d="M6 34h28"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <rect x="11" y="20" width="5" height="10" rx="1.2" fill="currentColor" />
          <rect x="19" y="14" width="5" height="16" rx="1.2" fill="currentColor" />
          <rect x="27" y="9" width="5" height="21" rx="1.2" fill="currentColor" />
        </svg>
      );

    case "box":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <path
            d="M20 5l14 7v16l-14 7-14-7V12l14-7z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M6 12l14 7 14-7M20 19v16"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "swap":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <path
            d="M8 14h20l-5-5M32 26H12l5 5"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "trend-down":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <path
            d="M6 12l10 10 6-6 12 12"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M26 28h8v-8"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "building":
      return (
        <svg viewBox="0 0 40 40" width="20" height="20" fill="none">
          <rect
            x="9"
            y="6"
            width="16"
            height="28"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="2.3"
          />
          <path
            d="M25 34V16l8 4v14"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M13 12h3M18 12h3M13 18h3M18 18h3M13 24h3M18 24h3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <rect
            x="14"
            y="29"
            width="6"
            height="5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );

    default:
      return null;
  }
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Nav() {
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].key);
  const [activeKey, setActiveKey] = useState(GROUPS[0].items[0]);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleMenu = (key) => {
    setActiveMenu((current) =>
      current === key ? null : key
    );
  };

  const closeMenu = () => setActiveMenu(null);

  const toggleMobileNav = () => {
    setMobileNavOpen((open) => !open);
    closeMenu();
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  const selectGroup = (groupKey) => {
    const nextGroup = getGroup(groupKey);

    setActiveGroup(nextGroup.key);
    setActiveKey(nextGroup.items[0]);
  };

  const group = getGroup(activeGroup);
  const active = getProduct(activeKey);
  const imageOnlySrc = IMAGE_ONLY_PANELS[active.key];
  const isImageOnly = Boolean(imageOnlySrc);

  return (
  <header className="nav">
    {bannerOpen && (
      <div className="nav__banner">
        <span className="nav__banner-icon" aria-hidden="true">
          ✨
        </span>

        <span className="nav__banner-text">
  Meet <strong>Trellisco HRMS</strong> — your smarter way to manage employees,
  attendance, payroll, and more!
  <span className="nav__banner-emoji"> 🚀</span>{" "}
  <strong>Explore HRMS</strong>
  <span className="nav__banner-emoji"> ✨</span>
</span>

          <button
            type="button"
            className="nav__banner-close"
            aria-label="Dismiss banner"
            onClick={() => setBannerOpen(false)}
          >
            <svg
              viewBox="0 0 20 20"
              width="14"
              height="14"
              fill="none"
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="nav__bar">
        <button
          type="button"
          className="nav__hamburger"
          aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileNavOpen}
          onClick={toggleMobileNav}
        >
          {mobileNavOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <a className="nav__logo" href="/">
          <img
            src={TrelliscoLogo}
            alt="Trellisco"
            className="nav__logo-img"
          />
        </a>

        <nav className="nav__links">
          {NAV_LINKS.map((link) => (
            <div
              key={link.key}
              className="nav__item"
            >
              {link.path ? (
                <Link
                  to={link.path}
                  className="nav__link"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  className={`nav__link${
                    activeMenu === link.key ? " is-active" : ""
                  }`}
                  onClick={() =>
                    link.hasMega
                      ? toggleMenu(link.key)
                      : closeMenu()
                  }
                >
                  {link.label}

                  {link.hasMega && (
                    <svg
                      className="nav__chevron"
                      viewBox="0 0 12 8"
                      width="10"
                      height="7"
                    >
                      <path
                        d="M1 1l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </nav>

        <div className="nav__right">
          <Link className="nav__contact" to="/contact">
            Contact Us

            <svg
              viewBox="0 0 12 8"
              width="12"
              height="8"
            >
              <path
                d="M1 4h10M7 1l4 3-4 3"
                stroke="currentColor"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="nav__mobile-panel">
          <ul className="nav__mobile-list">
            {NAV_LINKS.map((link) => (
              <li key={link.key} className="nav__mobile-item">
                {link.path ? (
                  <Link
                    to={link.path}
                    className="nav__mobile-link"
                    onClick={closeMobileNav}
                  >
                    {link.label}
                  </Link>
                ) : link.hasMega ? (
                  <button
                    type="button"
                    className={`nav__mobile-link${
                      activeMenu === link.key ? " is-active" : ""
                    }`}
                    onClick={() => {
                      toggleMenu(link.key);
                      closeMobileNav();
                    }}
                  >
                    {link.label}

                    <svg
                      className="nav__chevron"
                      viewBox="0 0 12 8"
                      width="10"
                      height="7"
                    >
                      <path
                        d="M1 1l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="nav__mobile-link"
                    onClick={closeMobileNav}
                  >
                    {link.label}
                  </button>
                )}
              </li>
            ))}

            <li className="nav__mobile-item nav__mobile-item--contact">
              <Link
                className="nav__mobile-contact"
                to="/contact"
                onClick={closeMobileNav}
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      )}

      {activeMenu === "products" && (
        <div className="mega">
          <button
            type="button"
            className="mega__close"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="mega__body">
            {/* Column 1 — groups */}
            <aside className="mega__groups">
              <span className="mega__col-label">
                Brands
              </span>
              <span className="mega__col-sub">
                Our products for every business
              </span>

              <ul className="mega__group-list">
                {GROUPS.map((g) => (
                  <li key={g.key}>
                    <button
                      type="button"
                      className={`mega__group${
                        activeGroup === g.key
                          ? " is-active"
                          : ""
                      }`}
                      onClick={() => selectGroup(g.key)}
                    >
                      <span className="mega__group-icon">
                        <CategoryLogo
                          src={g.logo}
                          name={g.label}
                        />
                      </span>

                      <span className="mega__group-label">
                        {g.label}
                      </span>

                      <ChevronRight className="mega__group-chevron" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mega__help">
                <span className="mega__help-icon">
                  <HelpMascotIcon />
                </span>

                <div className="mega__help-text">
                  <strong>Need help?</strong>
                  <span>
                    Find the right product for your business.
                  </span>

                  <a className="mega__help-link" href="#">
                    Talk to our team
                    <ChevronRight width={9} height={7} />
                  </a>
                </div>
              </div>
            </aside>

            {/* Column 2 — products */}
            <aside className="mega__products">
              <span className="mega__col-label">
                {group.label}
              </span>
              <span className="mega__col-sub">
                {group.tagline}
              </span>

              <ul className="mega__subitems">
                {group.items.map((itemKey) => {
                  const product = getProduct(itemKey);

                  return (
                    <li key={itemKey}>
                      <button
                        type="button"
                        className={`mega__subitem${
                          activeKey === itemKey
                            ? " is-active"
                            : ""
                        }`}
                        style={{
                          "--accent": product.accent,
                        }}
                        onClick={() =>
                          setActiveKey(itemKey)
                        }
                      >
                        <span className="mega__subitem-icon">
                          <ProductIcon type={itemKey} />
                        </span>

                        <span className="mega__subitem-label">
                          {product.name}
                        </span>

                        <ChevronRight className="mega__subitem-chevron" width={9} height={7} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Column 3 — product panel */}
            <div
              className={`mega__panel${
                active.features
                  ? " mega__panel--wide"
                  : ""
              }${
                isImageOnly
                  ? " mega__panel--image-only"
                  : ""
              }`}
            >
              {isImageOnly ? (
                <div className="mega__image-only">
                  <img
                    src={imageOnlySrc}
                    alt={active.name}
                    className="mega__image-only-img"
                  />
                </div>
              ) : (
                <div className="mega__feature">
                  <div className="mega__feature-tags">
                    <span className="mega__feature-eyebrow">
                      {active.eyebrow}
                    </span>

                    {active.badge && (
                      <span
                        className="mega__feature-badge"
                        style={{
                          "--badge-color": active.badge.color,
                        }}
                      >
                        <BadgeCheckIcon />
                        {active.badge.text}
                      </span>
                    )}
                  </div>

                  <h3 className="mega__feature-title">
                    {active.name}
                  </h3>

                  <p className="mega__feature-desc">
                    {active.desc}
                  </p>

                  {active.features ? (
                    <>
                      <div className="mega__grid">
                        {active.features.map((f, i) => (
                          <a
                            className="mega__grid-item"
                            href="#"
                            key={i}
                          >
                            <span
                              className="mega__grid-icon"
                              style={{
                                "--accent": f.color,
                              }}
                            >
                              <FeatureIcon type={f.icon} />
                            </span>

                            <span className="mega__grid-text">
                              <span className="mega__grid-title">
                                {f.title}
                              </span>

                              <span className="mega__grid-desc">
                                {f.desc}
                              </span>
                            </span>

                            <svg
                              className="mega__grid-chevron"
                              viewBox="0 0 12 8"
                              width="10"
                              height="8"
                            >
                              <path
                                d="M1 4h10M7 1l4 3-4 3"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        ))}
                      </div>

                      <div className="mega__actions">
                        <a
                          className="mega__feature-cta"
                          href={active.link || "#"}
                          target={
                            active.link &&
                            active.link !== "#"
                              ? "_blank"
                              : undefined
                          }
                          rel={
                            active.link &&
                            active.link !== "#"
                              ? "noopener noreferrer"
                              : undefined
                          }
                          style={{
                            "--accent": active.accent,
                          }}
                        >
                          Try {active.name}

                          <svg
                            viewBox="0 0 12 8"
                            width="10"
                            height="8"
                          >
                            <path
                              d="M1 4h10M7 1l4 3-4 3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>

                        <a
                          className="mega__learn-more"
                          href={active.link || "#"}
                          target={
                            active.link &&
                            active.link !== "#"
                              ? "_blank"
                              : undefined
                          }
                          rel={
                            active.link &&
                            active.link !== "#"
                              ? "noopener noreferrer"
                              : undefined
                          }
                          style={{
                            "--accent": active.accent,
                          }}
                        >
                          Learn more
                          <ChevronRight />
                        </a>
                      </div>
                    </>
                  ) : (
                    <a
                      className="mega__feature-cta"
                      href={active.link || "#"}
                      target={
                        active.link &&
                        active.link !== "#"
                          ? "_blank"
                          : undefined
                      }
                      rel={
                        active.link &&
                        active.link !== "#"
                          ? "noopener noreferrer"
                          : undefined
                      }
                      style={{
                        "--accent": active.accent,
                      }}
                    >
                      Try Now

                      <svg
                        viewBox="0 0 12 8"
                        width="10"
                        height="8"
                      >
                        <path
                          d="M1 4h10M7 1l4 3-4 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              )}

              {active.features && PREVIEW_IMAGES[active.key] && (
                <div
                  className="mega__preview"
                  aria-hidden="true"
                >
                  <div className="mega__preview-shell">
                    <div className="mega__preview-body">
                      <div className="mega__preview-image-wrap">
                        <img
                          src={PREVIEW_IMAGES[active.key]}
                          alt={`${active.name} preview`}
                          className="mega__preview-image"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeMenu === "products" && (
        <div
          className="mega__backdrop"
          onClick={closeMenu}
        />
      )}
    </header>
  );
}