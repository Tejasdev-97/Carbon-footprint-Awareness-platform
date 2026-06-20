# 🌍 Prithvi — Carbon Footprint Awareness Platform

> **Know Your Impact. Heal the Earth.**

Prithvi is a production-quality, offline-first carbon footprint awareness platform built for Indian users. It helps individuals track, understand, and reduce their daily environmental impact through an engaging 3D city simulation, AI-powered insights, multilingual support, and gamification.

Built for the **Google PromptWars Hackathon** using Next.js 16, React, TailwindCSS, Dexie (IndexedDB), and Firebase.

---

## 📖 Table of Contents

- [Features](#features)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Configuration](#configuration)
  - [Gemini API Key](#gemini-api-key-optional-but-recommended)
  - [Firebase Setup](#firebase-setup-optional)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [Security](#security)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌆 **3D City Simulation** | Watch your city transform from smog-orange to clear blue skies as your daily score improves |
| 📊 **Daily Activity Tracking** | Log commute, food, energy use, cooking, and waste in under 60 seconds |
| 🗣️ **Daily Life Analyzer** | Describe your day in plain language (text or voice) — keyword engine maps it to CO₂ instantly |
| 🤖 **AI Eco Insights** | Gemini-powered personalised suggestions with full offline fallback |
| 🏆 **Gamification** | XP, coins, level-up, streaks, and badges like "Metro Warrior" and "Veggie Week" |
| 👥 **Community Pledge Wall** | Make public eco-pledges; support others; view your city's leaderboard |
| 📈 **Monthly Reports** | Trend charts, best/worst day, top CO₂ sources, PDF/PNG/JSON export |
| 🌐 **9 Indian Languages** | English, Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, Malayalam |
| ♿ **Full Accessibility** | WCAG 2.1 AA, keyboard nav, screen reader, colour blind modes, font size, reduced motion |
| 📴 **Offline First** | Everything stored in IndexedDB via Dexie; Firebase sync when online |

---

## 🔗 Live Demo

> Coming soon — deploy instructions below.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | React / TypeScript / JavaScript |
| **Styling** | [TailwindCSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **3D Graphics** | [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) |
| **Globe** | [react-globe.gl](https://github.com/vasturiano/react-globe.gl) |
| **Local Storage** | [Dexie.js](https://dexie.org/) (IndexedDB wrapper) |
| **Community Sync** | [Firebase Firestore](https://firebase.google.com/) + Anonymous Auth |
| **AI** | [Google Gemini API](https://ai.google.dev/) (user-provided key, frontend-only) |
| **i18n** | [i18next](https://www.i18next.com/) + react-i18next |
| **Animations** | tw-animate-css + Tailwind transitions |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │ Next.js  │  │  Dexie   │  │  Web Speech API    │ │
│  │ App      │  │ IndexedDB│  │  (Voice Input)     │ │
│  │ Router   │  │ (Local)  │  └────────────────────┘ │
│  └────┬─────┘  └────┬─────┘                         │
│       │              │                               │
│  ┌────▼──────────────▼───────────────────────────┐  │
│  │           State Management Layer              │  │
│  │  useCarbon  useOfflineSync  AccessibilityCtx  │  │
│  └────────────────────┬──────────────────────────┘  │
└───────────────────────│─────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   ┌────────────┐ ┌──────────┐ ┌──────────────┐
   │  Firebase  │ │  Gemini  │ │  Carbon      │
   │  Firestore │ │  API     │ │  Engine      │
   │(Community) │ │(AI tips) │ │(Local calc.) │
   └────────────┘ └──────────┘ └──────────────┘
```

**Key principles:**
- **Offline first**: All writes go to Dexie first; Firebase sync happens when online
- **Privacy first**: Gemini API key stored only in IndexedDB, never transmitted to any Prithvi server
- **Anonymous auth**: Firebase uses anonymous auth — no email/password or PII collected

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (comes with Node.js) or [pnpm](https://pnpm.io/)
- A modern browser (Chrome, Edge, Firefox, or Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/Tejasdev-97/Carbon-footprint-Awareness-platform.git
cd Carbon-footprint-Awareness-platform

# Install dependencies
npm install
# or
pnpm install
```

### Environment Variables

Copy the example file and fill in your Firebase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Firebase (only needed for Community features — pledge wall & leaderboard)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

> **Note:** The Gemini API key is **never** stored here. It is entered by the user in the app's Settings page and stored locally in their browser's IndexedDB.

### Running Locally

```bash
# Start the development server
npm run dev

# Open in browser
# http://localhost:3000
```

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## ⚙️ Configuration

### Gemini API Key (Optional but Recommended)

Prithvi is a 100% frontend application. To protect your privacy, there is **no backend server**. The Gemini API is called directly from your browser using your own key.

**How to get a free key:**
1. Visit [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Get API key → Create API key in new project**
4. Copy the key (starts with `AIza…`)

**How to add it to Prithvi:**
- Open the app → click the chat bubble (bottom-right) → paste your key
- Or: go to **Dashboard → Settings → AI Configuration**

Your key is stored only in your browser's IndexedDB. It is never sent to any Prithvi server — only directly to Google's API.

### Firebase Setup (Optional)

Firebase powers the **Community** features (pledge wall and leaderboard). The app works fully without it, falling back to offline/demo data.

**To enable community features:**
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Enable **Firestore Database** and **Authentication** (Anonymous sign-in)
3. Set your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pledges/{pledgeId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.action.size() <= 280
        && request.resource.data.displayName.size() <= 40;
      allow update: if request.auth != null
        && request.resource.data.keys().hasOnly(['supportCount']);
    }
    match /leaderboard/{entryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
4. Copy your config values to `.env.local`

---

## 📁 Project Structure

```
/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout (fonts, metadata, providers)
│   ├── globals.css           # Design tokens + global styles
│   ├── onboarding/
│   │   └── page.js           # 4-step onboarding wizard
│   └── dashboard/
│       ├── layout.js         # Dashboard shell (sidebar, mobile nav)
│       ├── page.js           # Overview + Daily Life Analyzer
│       ├── city/page.js      # 3D city simulation
│       ├── track/page.js     # Activity logging
│       ├── badges/page.js    # Badge collection + gamification
│       ├── community/page.js # Pledge wall + leaderboard
│       ├── reports/page.js   # Monthly charts + export
│       └── settings/page.js  # User preferences + API key
│
├── components/
│   ├── CityScene.jsx         # Three.js 3D environmental simulation
│   ├── OnboardingFlow.jsx    # Onboarding step wizard
│   ├── DailyAnalyzer.jsx     # "Tell Me About Your Day" (voice + text)
│   ├── ChatBubble.jsx        # Floating AI chat assistant
│   ├── LandingNav.jsx        # Landing page navigation
│   ├── ProfileMenu.jsx       # User profile dropdown
│   ├── HeroGlobe.jsx         # Interactive 3D globe (landing)
│   ├── AccessibilityPanel.jsx# Accessibility FAB
│   ├── AccessibilityContext.jsx # Accessibility state provider
│   ├── ScoreRing.jsx         # Animated SVG score ring
│   ├── GamePanel.jsx         # XP / badges / streak panel
│   ├── TrackingCard.jsx      # Per-category activity log card
│   ├── SwapSuggestionCard.jsx# AI suggestion card
│   ├── DayCard.jsx           # Daily summary card
│   ├── SettingsPanel.jsx     # Settings panel component
│   └── Providers.jsx         # i18n + accessibility providers
│
├── lib/
│   ├── db.js                 # Dexie IndexedDB schema + helpers
│   ├── carbonEngine.js       # CO₂ calculation logic
│   ├── dayAnalyzer.js        # Keyword → CO₂ engine (no AI)
│   ├── firebase.js           # Firebase auth + Firestore helpers
│   ├── gemini.js             # Gemini API client + offline fallback
│   ├── i18n.js               # i18next config + VOICE_CODES
│   └── utils.ts              # Shared utilities (cn, etc.)
│
├── hooks/
│   ├── useCarbon.js          # Carbon score + CO₂ calculations
│   └── useOfflineSync.js     # Online/offline sync orchestration
│
├── locales/
│   ├── en.json               # English translations
│   ├── hi.json               # Hindi translations
│   ├── ta.json               # Tamil translations
│   ├── te.json               # Telugu translations
│   ├── kn.json               # Kannada translations
│   ├── mr.json               # Marathi translations
│   ├── bn.json               # Bengali translations
│   ├── gu.json               # Gujarati translations
│   └── ml.json               # Malayalam translations
│
├── public/
│   ├── manifest.json         # PWA manifest
│   └── icons/                # App icons
│
├── tests/                    # Vitest unit tests
├── .env.local.example        # Environment variable template
└── next.config.mjs           # Next.js configuration (PWA, Turbopack)
```

---

## 🔧 Core Modules

### `lib/db.js` — Local Storage (Dexie)
All user data is stored locally in IndexedDB. Key tables:
- **`logs`** — Activity entries (date, category, value, co2Impact)
- **`badges`** — Unlocked badge IDs
- **`settings`** — Key-value store (name, city, language, geminiApiKey, etc.)
- **`syncQueue`** — Pending Firebase sync operations

### `lib/carbonEngine.js` — CO₂ Calculation
Deterministic calculation engine. Emission factors sourced from:
- India-specific transport emission factors (ICCT 2023)
- IPCC food lifecycle data
- Bureau of Energy Efficiency (BEE) appliance ratings

### `lib/dayAnalyzer.js` — Daily Life Analyzer
60+ keyword → CO₂ mapping for natural language day descriptions. Covers:
- Transport: walk, cycle, metro, bus, auto, car, cab, Ola/Uber, flight
- Food: vegan, vegetarian, chicken, mutton, beef, fish
- Energy: AC, geyser, fan, solar
- Cooking: LPG, induction, wood fire
- Waste: recycling, composting, plastic, Swiggy/Zomato, Amazon/Flipkart

### `lib/gemini.js` — AI Insights
Calls Google Gemini API using the user's own key. Provides personalised eco-suggestions. Falls back gracefully to offline curated content when:
- No API key is provided
- Network is unavailable
- API quota is exceeded

---

## 🔒 Security

| Practice | Implementation |
|---|---|
| **No secrets in code** | Firebase config via env vars; Gemini key in IndexedDB only |
| **No PII collected** | Firebase uses anonymous auth; no email, phone, or real name required |
| **Input sanitisation** | Pledge text truncated to 280 chars; display names to 40 chars |
| **Rate limiting** | One pledge per user per day (enforced via Dexie key) |
| **CSP-ready** | No unsafe-eval or unsafe-inline |
| **Env var validation** | Firebase config checked at runtime; graceful degradation if absent |

---

## ♿ Accessibility

Prithvi targets **WCAG 2.1 Level AA** compliance:

- ✅ Full keyboard navigation with visible focus rings
- ✅ ARIA roles, labels, and live regions throughout
- ✅ Skip-to-content link
- ✅ Colour blind simulation (deuteranopia, protanopia, monochrome)
- ✅ Adjustable font size (14px – 22px)
- ✅ High contrast mode
- ✅ Reduced motion support (`prefers-reduced-motion`)
- ✅ Screen reader tested (NVDA + Chrome)
- ✅ Semantic HTML5 structure

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage
```

Tests use [Vitest](https://vitest.dev/) and are located in `/tests/`.

Key areas tested:
- `carbonEngine.js` — CO₂ calculation correctness
- `dayAnalyzer.js` — Keyword detection and scoring
- `db.js` — Dexie read/write operations

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please follow the existing code style (JSDoc comments on all public functions, descriptive ARIA labels, offline-first writes).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- Indian emission factor data: [ICCT](https://theicct.org/), [BEE India](https://beeindia.gov.in/), [IPCC](https://www.ipcc.ch/)
- UI inspiration: shadcn/ui design system
- 3D earth texture: [three-globe](https://github.com/vasturiano/three-globe)
- Fonts: [Cabinet Grotesk](https://www.fontshare.com/fonts/cabinet-grotesk) & [Satoshi](https://www.fontshare.com/fonts/satoshi) via Fontshare

---

<div align="center">
  Made with 💚 for a greener India<br>
  <strong>Prithvi — पृथ्वी (Earth)</strong>
</div>
