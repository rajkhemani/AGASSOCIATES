# Current UX State Audit & Evidence Pack
**Luxor9 Legal OS MVP — Task t1**

*Generated: 2026-01-15 | Agent: ux-research (Attempt 2)*

---

## Executive Summary

Three independent frontend codebases exist under `AGASSOCIATES/`, each with divergent design systems, routing paradigms, and component libraries. No shared design tokens, no unified component library, and no cross-frontend consistency. The **ag-platform/apps/web** (Vite/React) is the primary collaboration platform; **apps/web** (Next.js 15) is the marketing site; **ag-associates-ai/frontend** (Next.js 15) is the AI ops dashboard. Each has merits but operates in isolation.

---

## 1. Frontend Inventory & Architecture

| Property | `ag-platform/apps/web` | `apps/web` (Marketing) | `ag-associates-ai/frontend` |
|----------|------------------------|------------------------|-----------------------------|
| **Stack** | Vite 6 + React 18 + Express | Next.js 15 (static export) | Next.js 15 (client + server) |
| **Styling** | Tailwind 3 + CSS Modules + custom CSS | Tailwind 4 (`@theme`) + CSS vars | Tailwind 3 + custom CSS + CSS vars |
| **Fonts** | IBM Plex Sans/Mono + Fraunces | Geist Sans/Mono + Instrument Serif | Playfair Display + Inter + JetBrains Mono |
| **Theme** | Glassmorphism (dark) + Editorial (light) | Dark ink/paper + gold/emerald accents | Dark bg + gold accent |
| **Routing** | React Router v6 (client-side) | Next.js App Router (static) | Next.js App Router (client) |
| **State** | Zustand + React Query (hooks) | None (static) | React hooks + polling |
| **Build** | `npm run build` (Vite) | `npm run build` (Next export) | `npm run build` (Next) |
| **Deploy** | Docker → GHCR → VPS | GitHub Pages (CNAME) | Docker → GHCR → VPS (separate container) |

---

## 2. Design System Maturity Assessment

### 2.1 ag-platform/apps/web — Dual Theme System

**Files:** `src/styles/glass-theme.css` (551 lines), `src/styles/ag-editorial.css` (201 lines), `src/styles/tokens.ts` (145 lines)

| Aspect | Glass Theme (Dark) | Editorial Theme (Light) |
|--------|-------------------|------------------------|
| **Color Palette** | Violet/indigo primary (#7c3aed), cyan accent (#06b6d4) | Warm cream bg (#f5f1e8), deep gold accent (#9a6b1e) |
| **Typography** | Inter (sans), Playfair Display (serif), JetBrains Mono | IBM Plex Sans, Fraunces (serif), IBM Plex Mono |
| **Components** | 20+ glass utilities (.glass-card, .glass-button, .glass-input, .glass-modal, .glass-nav, .glass-tab, .glass-badge, .glass-panel) | Editorial primitives (Eyebrow, Pill, AgLogo, LiveDot), manual inline styles |
| **Animations** | 15+ keyframes (float, pulse-glow, shimmer, slide-up, scale-in, liquid-border) | 5 keyframes (ag-rise, ag-rise-lg, ag-fade, ag-pulse-dot, ag-draw-line) |
| **Responsive** | Single breakpoint (768px) | 3 breakpoints (480, 768, 1280) |
| **Dark Mode** | Native (default) | `data-theme="blueprint"` + `data-theme="brutalist"` variants |
| **Accessibility** | Basic focus styles, `prefers-reduced-motion` | `prefers-reduced-motion`, semantic HTML, ARIA labels |
| **Tokenization** | Partial (tokens.ts exports `glassTokens`, `editorialTokens`, `baseTokens`) | None (CSS vars only in globals.css) |

**Strengths:**
- Comprehensive glassmorphism system with blur, borders, shadows, gradients
- Advanced effects: gradient borders, inner/outer glow, liquid border animation, noise texture
- Status indicators with semantic colors (pending/active/completed/error)
- CSS custom properties for all values — themeable at runtime

**Gaps:**
- **Two completely separate themes** with no shared tokens — `glassTokens` vs `editorialTokens` have different scales, radii, transitions
- Editorial theme uses **inline styles exclusively** — no Tailwind integration, no component abstraction
- Token file (`tokens.ts`) is **documentation-only** — not consumed by CSS or Tailwind
- No design token pipeline (Style Dictionary, Figma sync, etc.)
- Glass theme `glass-card` duplicated in `index.css` with Tailwind `@apply` — divergence risk
- No component library package — components live in app, not shared

### 2.2 apps/web (Marketing) — Tailwind 4 + CSS 3D Depth System

**Files:** `src/app/globals.css` (273 lines), `tailwind.config.ts` (minimal)

| Aspect | Implementation |
|--------|----------------|
| **Color Palette** | Ink (#0a0f14), Paper (#f7f7f5), Gold (#c9a227), Emerald (#0e7c5a), Mist (#6b7785) |
| **Typography** | Instrument Serif (display, single weight 400), Geist Sans, Geist Mono |
| **Layout** | CSS 3D "depth rig" — `.rig` perspective (1400px/900px), `.plate` transform-style, `.engrave` grid textures |
| **Motion** | Scroll-reveal via `[data-reveal]` CSS (perspective + rotateX), Lenis smooth scroll |
| **Responsive** | Viewport-based `--depth` (1.0 desktop, 0.55 mobile), `prefers-reduced-motion` zeros depth |
| **Focus** | Gold outline (2px, offset 3px) — WCAG AA compliant |
| **Dark Mode** | Single theme (dark bg, light content) — no toggle |

**Strengths:**
- Cohesive, opinionated design language (Terminal Industries-inspired)
- CSS-first approach — no JS animation library needed for scroll reveals
- Performance: gradients/noise via CSS, single font file (Instrument Serif 400 only)
- Accessibility: `prefers-reduced-motion` fully supported, focus-visible, semantic HTML

**Gaps:**
- **Zero token sharing** with ag-platform — different colors, fonts, spacing, radii
- Tailwind 4 `@theme` not leveraged for component variants
- No component library — all components hand-rolled per section
- 3D depth system is bespoke — not portable to other frontends

### 2.3 ag-associates-ai/frontend — Dark Gold Theme

**Files:** `app/globals.css` (277 lines), `tailwind.config.js` (default)

| Aspect | Implementation |
|--------|----------------|
| **Color Palette** | Dark bg (#0a0a18), Gold accent (#D4AF37), semantic status colors |
| **Typography** | Playfair Display (headings), Inter (body), JetBrains Mono |
| **Components** | Utility classes: `.glass-gold`, `.card-premium`, `.btn-primary`, `.btn-secondary`, `.badge-success`, `.divider-gold` |
| **Animations** | `pulse-gold`, Framer Motion for dashboard/NOI pages |
| **Responsive** | Basic breakpoint overrides (768px) |
| **Mobile** | Dedicated `/noi-mobile` page with bottom tab bar, camera scanner, offline queue |

**Strengths:**
- Mobile-first NOI page (`/noi-mobile`) with PWA patterns (offline banner, safe-area insets, camera scanner)
- 3-tier escalation matrix visualization
- Real-time dashboard with 3s polling, workflow simulation
- Framer Motion for polished transitions

**Gaps:**
- **Third color system** — gold (#D4AF37) differs from marketing gold (#c9a227) and platform accent (#06b6d4)
- Utility classes defined in globals.css — not reusable, not typed
- No design token file — values hardcoded in CSS
- Dashboard uses mock data + simulated workflow — not connected to real API

---

## 3. Route & Screen Inventory

### 3.1 ag-platform/apps/web (18 routes)

| Route | Component | Theme | Auth | Persona |
|-------|-----------|-------|------|---------|
| `/` | EditorialLanding | Editorial | Public | All |
| `/console` | ConsoleApp (public) | Editorial | Public | All |
| `/admin/console` | ConsoleApp (protected) | Editorial | Admin/Staff | Advocate/Ops |
| `/login` | LoginPage | Glass | Public | All |
| `/privacy` | PrivacyPolicy | Glass | Public | All |
| `/applicant/*` | ApplicantDashboard | Glass (light) | Applicant/Admin | Borrower |
| `/admin` | AdvisorCockpit | Glass (light) | Admin | Advocate/Ops |
| `/admin/workforce` | WorkforceControl | Glass | Admin | Advocate/Ops |
| `/admin/dashboard` | WorkflowDashboard | Glass | Admin | Advocate/Ops |
| `/admin/noi-cases` | NoiPipeline | Glass | Admin | Advocate/Ops |
| `/bank/*` | BankPortal | Glass (light) | Staff/Admin | Bank Team |

**Observations:**
- **Theme switching by route**: Editorial for landing/console, Glass for authenticated screens
- **No consistent layout shell** — each screen builds its own chrome
- `/applicant` and `/bank` use light Glass theme on dark app background — visual clash
- Console has left rail + top bar; AdvisorCockpit uses full-width Kanban; BankPortal uses table

### 3.2 apps/web (Marketing) — Single-page sections

| Section | Component | Anchor |
|---------|-----------|--------|
| Hero | Hero | — |
| Practice Areas | Practice | — |
| Process Explorer | ProcessExplorer | — |
| Firm Profile | Firm | — |
| Technology | Technology | — |
| Coverage | Coverage | — |
| FAQ | Faq | — |
| Empanelment | Empanelment | — |

### 3.3 ag-associates-ai/frontend (5 routes)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home (Hero + Manifesto + Agents + Workflow + Tech + Exceptions + Flywheel + Contact) | Marketing/landing |
| `/dashboard` | Dashboard | Real-time agent monitoring |
| `/noi-cases` | NoiCasesPage | Desktop NOI pipeline (Kanban + detail) |
| `/noi-mobile` | NoiMobilePage | Mobile PWA for field executives |
| `/api/*` | Next.js API routes | Proxy to FastAPI backend |

---

## 4. Component Library Analysis

### 4.1 ag-platform/apps/web — Component Count: ~60

| Category | Components | Reusability |
|----------|------------|-------------|
| **UI Primitives** | Skeleton, LoadingState, ErrorState, EmptyState, ErrorBoundary | High (generic) |
| **Auth** | LoginPage, ProtectedRoute | Medium |
| **Console** | ConsoleApp, ConsoleShell (Rail, TopBar), ConnectionIndicator, LiveDashboard, screens (CasesScreen, CaseDetail, ClientPortal, DeedPreview, AgentsScreen) | Low (console-specific) |
| **Admin** | AdvisorCockpit, WorkforceControl, WorkflowDashboard, NoiPipeline, BrainstormHub, VyasaVoiceControl | Low |
| **Applicant** | ApplicantDashboard | Low |
| **Bank** | BankPortal | Low |
| **Collaboration** | ActivityFeed, CommentThread, LivePresence, NotificationBell, TaskBoard, TaskCard, TimeTracker | Medium |
| **Storage** | FilePreviewer, FileUploader, VersionHistory | Medium |
| **Theme** | ThemeProvider | High |
| **AG Primitives** | Eyebrow, LiveDot, Pill, AgLogo | Medium |

**Issues:**
- No Storybook or component documentation
- Inline styles in Editorial components vs Tailwind in Glass components
- `AdvisorCockpit` embeds `CaseCard` inline — not extracted
- `ConsoleShell` uses inline styles — not themable

### 4.2 apps/web — Component Count: ~20

All sections are page-specific, no reuse. Primitives: `TiltCard`, `Reveal`, `SmoothScroll`, `ScrollRail`, `MotionProvider`.

### 4.3 ag-associates-ai/frontend — Component Count: ~15

Landing sections + dashboard widgets + NOI components. No shared primitives across routes.

---

## 5. API Contracts & Data Flow

### 5.1 ag-platform REST API (Express)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/cases` | GET | Org-scoped | List cases |
| `/api/cases/stats` | GET | Org-scoped | Dashboard stats |
| `/api/cases/:id` | GET | Org-scoped | Case detail |
| `/api/cases/:id/timeline` | GET | Org-scoped | Case timeline |
| `/api/cases` | POST | Org-scoped | Create case |
| `/api/cases/:id/status` | PUT | Org-scoped | Update status (triggers AI) |
| `/api/cases/:id` | PATCH | Org-scoped | Update case (AdvisorCockpit) |
| `/api/workforce/agents/status` | GET | Admin | Agent cluster status |
| `/api/command-center/*` | GET | Org-scoped | 7 dashboard widgets |
| `/api/cases/:caseId/documents/*` | GET/POST/DELETE | Org-scoped | Document CRUD + signed URLs |

**Validation:** Zod schemas in `src/server/validation.ts`
**Auth:** Supabase JWT → `org_id` via `app_metadata` → RLS policies
**AI Integration:** Status `IN_PROGRESS` → POST to `AI_BACKEND_URL` (default `http://127.0.0.1:8001`)

### 5.2 Database Schema (Supabase Migrations 0002–0010 equivalent)

**Core Tables (20260514000000_core_schema.sql):**
- `organizations` (id, name, created_at)
- `cases` (id, org_id, bank_name::bank_partner, case_type::case_type_enum, status::case_status, created_at, updated_at)
- Enums: `bank_partner` (5 values), `case_type_enum` (13 values), `case_status` (5 values)

**Extended Tables (later migrations):**
- `noi_cases`, `noi_tasks`, `challans` (NOI pipeline)
- `workflow_definitions`, `workflow_instances`, `deadlines`, `approval_requests`, `ai_runs`, `external_actions` (command center)
- `documents` (file storage metadata)
- `banks`, `invoices`, `timesheets`, `voice_command_logs`, `workforce` tables

**RLS:** All tables use `get_app_org_id()` from JWT `app_metadata.app_org_id`

**Schema Drift:** Two migrations define `bank_partner` differently (core vs init) — 20260807 migration adds 7 values idempotently.

---

## 6. Cross-Frontend Inconsistency Matrix

| Dimension | ag-platform/web | apps/web (Marketing) | ag-associates-ai/frontend |
|-----------|-----------------|---------------------|---------------------------|
| **Primary Color** | Violet #7c3aed / Cyan #06b6d4 | Gold #c9a227 / Emerald #0e7c5a | Gold #D4AF37 |
| **Background** | Dark gradient (#0f0f23 → #1a1a2e) | Light paper (#f7f7f5) on dark ink | Dark (#0a0a18) |
| **Heading Font** | Playfair Display / Fraunces | Instrument Serif (400 only) | Playfair Display |
| **Body Font** | Inter / IBM Plex Sans | Geist Sans | Inter |
| **Mono Font** | JetBrains Mono | Geist Mono | JetBrains Mono |
| **Border Radius** | 0.5rem–2rem (glass), 4–12px (editorial) | Not systematized | 0.5rem–1.5rem |
| **Spacing Scale** | 0.25rem–3rem (tokens.ts) | Not systematized | Tailwind defaults |
| **Shadow System** | 3 glass shadows + glow variants | `.rimlight` (single) | `.card-premium` hover only |
| **Focus Style** | Violet ring (glass), none (editorial) | Gold 2px outline | Gold outline |
| **Button Variants** | .glass-button (one style) | None (inline) | .btn-primary, .btn-secondary |
| **Input Variants** | .glass-input (one style) | None (inline) | None |
| **Status Colors** | Tokenized (pending/active/completed/error) | Not systematized | .badge-success/.badge-warning |
| **Animation Library** | CSS keyframes + Framer Motion | CSS-only (data-reveal) | Framer Motion + CSS |
| **Mobile Breakpoint** | 768px only | 480/768/1280 | 768px |
| **Dark Mode** | Default (glass), 3 variants (editorial) | Single dark theme | Single dark theme |
| **Icon Library** | Lucide React | Lucide React | Lucide React |
| **Date Formatting** | date-fns | Native Intl | Native Intl |
| **Auth** | Supabase + Zustand | None | None (dev mode) |
| **API Layer** | Direct fetch to `/api/*` | None | Direct fetch to FastAPI |

---

## 7. Accessibility Baseline

| WCAG 2.2 AA Criterion | ag-platform/web | apps/web | ag-associates-ai/frontend |
|----------------------|-----------------|----------|---------------------------|
| **1.1.1 Non-text Content** | ⚠️ Icons decorative (aria-hidden), no alt on images | ✅ Semantic SVG, alt text | ⚠️ Icons decorative |
| **1.3.1 Info & Relationships** | ✅ Semantic HTML, headings | ✅ Excellent heading hierarchy | ✅ Semantic HTML |
| **1.4.3 Contrast (Min)** | ⚠️ Glass theme: white on rgba(255,255,255,0.03) — **FAIL** | ✅ High contrast ink/paper | ⚠️ Gold on dark — borderline |
| **1.4.4 Resize Text** | ✅ rem units | ✅ rem/clamp | ✅ rem |
| **1.4.10 Reflow** | ✅ Responsive at 768px | ✅ 3 breakpoints | ✅ 768px + mobile page |
| **1.4.11 Non-text Contrast** | ⚠️ Glass borders 0.08 opacity — **FAIL** | ✅ Focus visible gold | ⚠️ Borders low contrast |
| **2.1.1 Keyboard** | ✅ Native elements | ✅ Native elements | ✅ Native elements |
| **2.1.2 No Keyboard Trap** | ✅ | ✅ | ✅ |
| **2.4.3 Focus Order** | ✅ Logical | ✅ Logical | ✅ Logical |
| **2.4.7 Focus Visible** | ⚠️ Glass: ring present; Editorial: none | ✅ Gold outline | ✅ Gold outline |
| **2.5.3 Label in Name** | ✅ aria-label on icon buttons | ✅ | ⚠️ Some icon-only buttons |
| **3.2.1 On Focus** | ✅ No unexpected changes | ✅ | ✅ |
| **3.3.2 Labels/Instructions** | ⚠️ Placeholders only, no labels | ✅ | ⚠️ Placeholders only |
| **Reduced Motion** | ✅ `prefers-reduced-motion` in both themes | ✅ Depth=0, instant transitions | ❌ Not implemented |

**Critical Failures:**
- **Glass theme**: Text on semi-transparent dark backgrounds fails 4.5:1 contrast
- **Glass borders**: `rgba(255,255,255,0.08)` invisible on dark bg
- **Editorial theme**: No focus-visible styles on custom buttons
- **ag-associates-ai**: No `prefers-reduced-motion` support

---

## 8. Performance Baseline

| Metric | ag-platform/web | apps/web | ag-associates-ai/frontend |
|--------|-----------------|----------|---------------------------|
| **Bundle Analysis** | Not configured | Not configured | Not configured |
| **Code Splitting** | React.lazy on 4 screens | Next.js automatic | Next.js automatic |
| **Fonts** | 3 Google Fonts (blocking) | 3 Google Fonts (display=swap) | 3 Google Fonts (blocking) |
| **Images** | No optimization | No optimization | No optimization |
| **CSS** | 3 CSS files + Tailwind | 1 CSS + Tailwind 4 | 1 CSS + Tailwind 3 |
| **JS Framework** | React 18 + Framer Motion | React 18 + Framer Motion + Lenis | React 18 + Framer Motion |
| **Hydration** | Client-only (Vite) | Static HTML (no hydration) | Client components ('use client') |
| **API Latency** | Express same-origin | N/A | Cross-origin (FastAPI :8001) |
| **Real-time** | WebSocket hooks (useDashboardRealtime) | None | 3s polling (setInterval) |

**Observations:**
- No performance budgets, no Lighthouse CI
- Google Fonts load blocking — no `preconnect` or self-hosting
- Framer Motion on all three — heavy for marketing site
- ag-platform imports `@ag/ui`, `@ag/ai`, `@ag/db`, `@ag/types` — internal packages not published

---

## 9. Technical Debt Inventory

### 9.1 Design System Debt
1. **Three design systems** — zero shared tokens, components, or patterns
2. **Token file unused** — `tokens.ts` is dead documentation
3. **Inline styles in Editorial theme** — 200+ lines of inline styles in ConsoleApp, EditorialLanding
4. **Duplicate glass-card** — defined in glass-theme.css AND index.css with Tailwind `@apply`
5. **No component packaging** — `@ag/ui` declared in package.json but not implemented
6. **No Storybook/visual regression** — no component testing

### 9.2 Component Debt
1. **AdvisorCockpit** — 305 lines, embeds CaseCard, inline Kanban logic
2. **EditorialLanding** — 754 lines, 7 sections in one component
3. **NoiCasesPage** — 650 lines, mock data, inline styles
4. **NoiMobilePage** — 716 lines, 4 tabs in one file
5. **ConsoleApp** — mixes public/private views via prop

### 9.3 Architecture Debt
1. **Two case models** — `domain.ts` CaseStatus (13 states) vs DB `case_status` enum (5 states) vs NOI `check_noi_case_status` (8 states)
2. **Two bank enums** — `bank_partner` defined twice differently
3. **AI backend URL hardcoded** — `process.env.AI_BACKEND_URL || 'http://127.0.0.1:8001'`
4. **No API client layer** — raw `fetch` everywhere
5. **Supabase client in components** — `src/lib/supabase.ts` imported in LoginPage

### 9.4 Accessibility Debt
1. Glass theme contrast failures (text, borders)
2. Missing focus styles on Editorial custom buttons
3. No reduced motion in ag-associates-ai
4. Placeholder-only inputs (no `<label>`)

### 9.5 Performance Debt
1. No bundle analysis, no budgets
2. Blocking Google Fonts
3. Framer Motion on static marketing site
4. No image optimization

---

## 10. Strengths Summary

| Frontend | Key Strengths |
|----------|---------------|
| **ag-platform/web** | Comprehensive glassmorphism system; dual-theme support; real-time hooks; RBAC-integrated routing; Supabase RLS alignment; command-center API with 7 widgets; document signed URLs |
| **apps/web** | Cohesive editorial design language; CSS 3D depth system; performance-conscious (single font weight, CSS gradients); excellent accessibility foundation; static export → zero server cost |
| **ag-associates-ai/frontend** | Mobile-first NOI PWA (offline, camera, safe-area); 3-tier escalation visualization; real-time dashboard simulation; Framer Motion polish; dedicated mobile route |

---

## 11. Recommendations (Priority Order)

### P0 — Foundation (Do First)
1. **Consolidate design tokens** — Single source of truth (Style Dictionary → CSS vars + Tailwind config + TypeScript)
2. **Choose one theme system** — Glass OR Editorial, not both. Recommend: Glass for app, Editorial for marketing
3. **Extract `@ag/ui` package** — Shared primitives (Button, Input, Card, Badge, Modal, Table, Tabs)
4. **Fix contrast failures** — Glass theme text/borders must meet 4.5:1

### P1 — Architecture
5. **Unify CaseStatus enum** — Align domain.ts, DB, NOI pipeline
6. **Create API client layer** — Typed fetch wrapper with error handling, retry, auth
7. **Single bank_partner enum** — Resolve migration conflict
8. **Shared component library** — Storybook + Chromatic for visual regression

### P2 — Polish
9. **Accessibility audit fix** — Focus styles, labels, reduced motion everywhere
10. **Performance budgets** — Lighthouse CI, bundle analysis, self-host fonts
11. **Mobile parity** — Responsive tables, touch targets, PWA manifest
12. **Design token pipeline** — Figma → tokens → code (automated)

---

## 12. Evidence Appendix

### 12.1 File References
- Glass theme: `ag-platform/apps/web/src/styles/glass-theme.css`
- Editorial theme: `ag-platform/apps/web/src/styles/ag-editorial.css`
- Tokens: `ag-platform/apps/web/src/styles/tokens.ts`
- Marketing globals: `apps/web/src/app/globals.css`
- AI dashboard globals: `ag-associates-ai/frontend/app/globals.css`
- Routes: `ag-platform/apps/web/src/App.tsx`
- API: `ag-platform/src/server/routes/cases.ts`, `command-center.ts`, `documents.ts`
- DB: `ag-platform/supabase/migrations/20260514000000_core_schema.sql`, `20260527000000_noi_pipeline.sql`, `20260807000000_bank_partner_panel_codes.sql`
- Types: `ag-platform/apps/web/src/types/domain.ts`

### 12.2 Component Screenshots Needed
- [ ] Glass theme component gallery
- [ ] Editorial theme component gallery
- [ ] Marketing page sections
- [ ] Dashboard widgets
- [ ] NOI desktop pipeline
- [ ] NOI mobile tabs
- [ ] Console shell (rail + topbar)

---

*End of Audit. Next: Task t2 — Persona & Journey Map Definition*