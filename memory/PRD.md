# MarocSphere - Product Requirements Document

## Original Problem Statement
Build MarocSphere — a comprehensive Morocco travel platform with AI-powered travel planning, interactive maps, real-time safety dashboard, and chat functionality. Full UI/UX specification provided with Moroccan theme (terracotta, midnight blue, saffron gold).

## Architecture
- **Frontend**: React (CRA) + Tailwind CSS + Shadcn UI + Leaflet
- **Backend**: FastAPI (modular routers) + Motor (MongoDB async) + OpenAI SDK + Stripe SDK
- **Database**: MongoDB (hybrid PostgreSQL planned for Phase 2)
- **AI**: Claude Sonnet 4-6 via Emergent Universal Key (emergentintegrations library)

## Backend Architecture (v2.0 — Modular Routers)
```
backend/
├── server.py             # Slim entry point — mounts routers, CORS, shutdown
├── config.py             # All env vars (MONGO_URL, STRIPE, OPENAI, proxy detection)
├── database.py           # MongoDB client singleton
├── auth.py               # Auth helpers (hash, verify, token create/decode)
├── models.py             # All Pydantic request/response models
├── subscriptions.py      # Plan definitions, limits, PlanAccessChecker
├── routes/
│   ├── auth.py           # /api/auth/* (register, login, me, profile, forgot-password, reset-password)
│   ├── chat.py           # /api/chat/* (send, messages)
│   ├── itinerary.py      # /api/itineraries/* (generate, list, get, delete)
│   ├── landmarks.py      # /api/landmarks/* (list, get, filter)
│   ├── safety.py         # /api/safety/* (report, emergency)
│   ├── destinations.py   # /api/destinations (list)
│   ├── subscriptions.py  # /api/subscription/*, /api/webhook/*, /api/usage/*
│   ├── partners.py       # /api/partners/* (register, me, list, get, stats, bookings, accept/decline)
│   ├── admin.py          # /api/admin/* (stats, partner verify with email notifications, flags, activity)
│   └── reviews.py        # /api/reviews/* (create, list, delete, flag, helpful)
```

## What's Been Implemented

### Phase 0+1: Backend Refactoring (March 2026)
- [x] Removed `emergentintegrations` library dependency
- [x] Replaced all Emergent proxy URLs with direct OpenAI/Stripe SDKs
- [x] Split monolithic server.py into 10 modular routers

### Admin Back-office (March 2026)
- [x] Real-time platform stats, partner verification, content moderation
- [x] Admin activity log, role-based access control

### Reviews & Ratings System (March 2026)
- [x] Create/list/delete reviews, flag inappropriate, mark helpful
- [x] Reusable ReviewSection component, Schema.org JSON-LD

### User Dashboard (March 2026)
- [x] Dashboard with welcome header, usage stats, quick actions, recent trips
- [x] Auto-redirect to /dashboard after sign in/up, navbar dropdown

### User Profile (March 2026)
- [x] Edit name, phone, bio, language, avatar color, travel style, interests

### Subscription System
- [x] Traveler plans (Explorer free, Voyager 99 MAD, Nomade 249 MAD)
- [x] Partner plans (Free Listing, Partner 490 MAD, Partner Pro 1490 MAD)
- [x] Stripe Checkout, usage tracking, feature gating

### Forgot Password Flow (April 2026)
- [x] POST /api/auth/forgot-password — generates reset token, logs notification
- [x] POST /api/auth/reset-password — validates token (1hr expiry), resets password
- [x] ForgotPasswordPage.js — email form, success state with demo reset link
- [x] ResetPasswordPage.js — new password form, success confirmation
- [x] "Forgot your password?" link on SignInPage
- [x] Routes: /auth/forgot-password, /auth/reset-password

### Partner Dashboard Enhancements (April 2026)
- [x] GET /api/partners/stats — real booking/revenue/rating stats from MongoDB
- [x] GET /api/partners/bookings — real booking list
- [x] POST /api/partners/bookings/{id}/accept and /decline
- [x] Frontend: Overview, Bookings, Analytics, Reviews tabs fetch real API data
- [x] Removed all MOCK_STATS/MOCK_BOOKINGS/MOCK_REVIEWS hardcoded data
- [x] Non-partner users redirected to /partner/register

### Destinations Page with Reviews (April 2026)
- [x] /destinations page with hero banner and 6 destination cards
- [x] Each card: image, safety badge, rating, landmarks count, best time
- [x] Expandable ReviewSection per destination
- [x] "View on Map" and "Plan Trip" action buttons
- [x] SEO: Helmet title/description, JSON-LD ItemList/TouristDestination schema
- [x] Navbar Destinations link updated to /destinations

### Email Notifications for Partner Verification (April 2026)
- [x] MOCKED — logged to db.email_notifications and server logs
- [x] Partner approve: logs approval email with congratulations message
- [x] Partner reject: logs rejection email with contact support message
- [x] Both endpoints now return email_sent_to in response

### SEO & i18n
- [x] Comprehensive SEO Meta Tags, JSON-LD, full i18n (EN/FR/AR), Google Analytics

### Pages (15+ total)
- [x] Landing, AI Concierge, Map, Chat, Safety, My Trips, Sign In, Register
- [x] Subscription, Blog, Partner Register, Partner Dashboard, Admin Dashboard
- [x] Dashboard, Profile, Forgot Password, Reset Password, Destinations

### Cornerstone SEO Articles (April 2026)
- [x] EN: "Morocco Travel 2026: Complete Guide" — 22 min read, 6 H2 sections (safety, solo female, 10-day itinerary, scams, budget, best app)
- [x] FR: "Voyage Maroc 2026: Guide Complet" — 25 min read, 10 H2 sections (securite, femme seule, itineraire, Marrakech hors sentiers, Fes medina, Taghazout luxe, riad, famille, budget, app)
- [x] AR: "السفر إلى المغرب 2026: الدليل الشامل" — 20 min read, 6 H2 sections with full RTL support (amaan, nassb, siyaha asila, magharbet al-alam, mizaniya, tatbiq)
- [x] All 3 articles cross-linked via hreflang in sitemap (priority 1.0)
- [x] Article JSON-LD schema, OG tags, keyword meta per article
- [x] Separate data module `/app/frontend/src/data/cornerstoneArticles.js`
- [x] RTL dir="rtl" support for Arabic article rendering

### Blog Articles & Sitemap (April 2026)
- [x] 9 new long-form SEO articles targeting Tier 1+2 keywords with full content
- [x] Article slugs: is-morocco-safe-tourists-2026, 10-day-morocco-itinerary-2026, best-ai-travel-app-morocco-2026, authentic-morocco-experience, morocco-luxury-tour-2026, marrakech-hidden-gems, taghazout-travel-guide, morocco-family-travel-kids-guide, marocsphere-app-review
- [x] Article detail page with hero image, author, tags, CTA, related articles
- [x] Each article has Article JSON-LD schema for Google rich snippets
- [x] Sitemap updated with all new blog URLs + destinations page
- [x] 8 additional Tier 2 FAQs added to FAQPage JSON-LD (30 total FAQs)

### SEO Keyword Mega-Injection (April 2026)
- [x] 22 FAQPage JSON-LD entries targeting all Tier 1+2 keywords in EN/FR/AR for LLM ranking
- [x] Meta keywords expanded with full trilingual keyword set (EN+FR+AR)
- [x] OG/Twitter meta updated with target keywords
- [x] Noscript content massively expanded with trilingual keyword-rich crawlable text
- [x] New "Travel Guide" section on LandingPage with 6 keyword-targeted content cards
- [x] TravelAgency schema serviceType expanded with all target keywords
- [x] Organization description updated with trilingual keywords
- [x] BreadcrumbList updated with Destinations page
- [x] Destinations page meta title/description updated with Tier 2 keywords

### AI Integration Switch (April 2026)
- [x] Switched from OpenAI GPT-4o to Anthropic Claude Sonnet 4-6
- [x] Using Emergent Universal Key (free, no user billing required)
- [x] emergentintegrations library for LLM calls (chat.py, itinerary.py)
- [x] Multi-turn chat with session history preserved
- [x] Fallback responses when AI is unavailable

### Gmail SMTP Password Reset (April 2026)
- [x] Fixed SMTP authentication failure — typo in email username (`marocsphere` vs `morocsphere`)
- [x] Gmail App Password validated and working for password reset emails
- [x] Full forgot-password email flow operational: user submits email -> receives branded HTML reset email

### Markdown (.md) Versions of All Pages (April 2026)
- [x] 38 static `.md` files created in `/app/frontend/public/` mirroring all HTML routes
- [x] Core pages: /, /concierge, /map, /safety, /chat, /subscription, /destinations, /itineraries
- [x] Auth pages: /auth/signin, /auth/register, /auth/forgot-password, /auth/reset-password
- [x] Partner pages: /partner/register, /partner/dashboard
- [x] Dashboard/Profile/Admin pages
- [x] Blog listing + 20 individual blog article .md files (including 3 cornerstone EN/FR/AR)
- [x] All accessible at `{page-path}/index.md` (e.g., `/destinations/index.md`)
- [x] All 38 endpoints tested and returning 200 OK

### llms.txt & llms-full.txt for LLM Crawlers (April 2026)
- [x] `/llms.txt` (7KB) — curated index with H1 title, blockquote summary, H2 sections, 20+ annotated blog links, feature descriptions, pricing, FAQ references
- [x] `/llms-full.txt` (12KB) — comprehensive version with full destination details, safety data, emergency numbers, scam guide, budget breakdowns, all blog content summaries, pricing tables, 10 FAQs with answers
- [x] `robots.txt` updated with `Sitemap: https://marocsphere.com/llms.txt` directive
- [x] Both files follow llmstxt.org specification: Markdown format, H1/H2 structure, annotated links

### UI/UX Redesign Phase A — Tourist Dashboard + Auth (April 2026)
- [x] Split-screen auth pages (SignIn, Register, ForgotPassword) — Moroccan image left, clean form right
- [x] Tourist Dashboard with Madina sidebar (Explorer, Reservations, Guides, Favoris, Messages)
- [x] Hero AI Itinerary card with glassmorphism badge
- [x] 2x2 stat grid (guides, trip countdown, saved activities, avg rating)
- [x] Dual panels: Guides pres de toi + Itineraire recommande
- [x] Profile page redesign with Manrope/Playfair Display typography
- [x] Framer Motion animations, @phosphor-icons/react, cream (#F5F3EE) bg
- [x] Testing: Iteration 8 — 100% pass (10/10 features)

## Prioritized Backlog

### P1 (Next)
- [ ] Phase 2: Hybrid DB — Prisma + PostgreSQL for auth/wallets/transactions (deferred)

### P2 (Future)
- [ ] CMI/PayZone Moroccan payment gateway
- [ ] Blockchain Passport of Good (Polygon L2)
- [ ] National Dashboard (ONMT/CRT)
- [ ] WebSocket real-time chat
- [ ] Dark mode, PDF export, offline mode
- [ ] BerberEye AR

## Test Reports
- `/app/test_reports/iteration_3.json` - Backend modular router refactoring (97% pass)
- `/app/test_reports/iteration_4.json` - Admin + Reviews features (100% pass)
- `/app/test_reports/iteration_5.json` - SEO fixes (100% pass)
- `/app/test_reports/iteration_6.json` - User Dashboard + Profile (100% pass)
- `/app/test_reports/iteration_7.json` - Forgot Password + Partner Enhancements + Destinations + Email Notifications (100% pass)

## Test Credentials
- Admin user: `phase1test@example.com` / `password123` (role: admin)
