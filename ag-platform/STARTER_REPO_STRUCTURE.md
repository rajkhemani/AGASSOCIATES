# Luxor9 Legal OS MVP - Starter Repo Structure

This document describes the complete frontend architecture structure for the Luxor9 Legal OS MVP, implementing Vite + React + Express integration with all required features.

## Repository Structure

```
ag-platform/
├── apps/web/                          # Vite + React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── shell/                 # GlobalShell (Sidebar + Topbar)
│   │   │   │   └── GlobalShell.tsx
│   │   │   ├── theme/
│   │   │   │   └── ThemeProvider.tsx  # Enhanced with localStorage + cross-tab sync
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── command-center/        # Command Center MVP screens
│   │   │   │   └── CommandCenter.tsx
│   │   │   ├── matters/
│   │   │   │   ├── MattersList.tsx
│   │   │   │   └── MatterDetail.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── TasksList.tsx
│   │   │   │   └── TaskDetail.tsx
│   │   │   ├── approvals/
│   │   │   │   ├── ApprovalsList.tsx
│   │   │   │   └── ApprovalDetail.tsx
│   │   │   ├── documents/
│   │   │   │   ├── DocumentsList.tsx
│   │   │   │   └── DocumentDetail.tsx
│   │   │   ├── actions/
│   │   │   │   ├── ActionsList.tsx
│   │   │   │   └── ActionDetail.tsx
│   │   │   ├── reports/
│   │   │   │   ├── ReportsList.tsx
│   │   │   │   └── ReportDetail.tsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AdminUsers.tsx
│   │   │   │   ├── AdminWorkflows.tsx
│   │   │   │   └── AdminSettings.tsx
│   │   │   ├── applicant/
│   │   │   │   └── ApplicantDashboard.tsx
│   │   │   ├── bank/
│   │   │   │   └── BankPortal.tsx
│   │   │   ├── console/               # Legacy Console (Editorial Theme)
│   │   │   │   ├── ConsoleApp.tsx
│   │   │   │   ├── ConsoleShell.tsx
│   │   │   │   ├── LiveDashboard.tsx
│   │   │   │   └── screens/
│   │   │   ├── collaboration/
│   │   │   ├── ui/                    # Base UI components
│   │   │   └── ag/                    # Design primitives
│   │   ├── hooks/
│   │   │   ├── useDashboardRealtime.ts    # Supabase Realtime for Command Center
│   │   │   └── useAuthStore.ts            # Zustand auth store
│   │   ├── lib/
│   │   │   ├── supabase.ts              # Supabase client
│   │   │   └── config.ts                # App configuration
│   │   ├── store/
│   │   │   └── useAuthStore.ts
│   │   ├── styles/
│   │   │   ├── tokens.ts                # Design tokens
│   │   │   ├── glass-theme.css
│   │   │   ├── ag-editorial.css
│   │   │   └── index.css
│   │   ├── App.tsx                      # Main app with React Router v6
│   │   ├── main.tsx                     # Entry point
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── packages/
│   ├── api/                             # TanStack Query API client
│   │   ├── src/
│   │   │   ├── client/
│   │   │   │   └── index.ts             # API client with org_id injection
│   │   │   ├── hooks/
│   │   │   │   └── index.ts             # Typed query hooks
│   │   │   └── index.ts                 # Main exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                              # Design system component library
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── VirtualizedDataGrid.tsx  # react-window + @tanstack/react-table
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Skeleton.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── ErrorState.tsx
│   │   │   │   └── LoadingState.tsx
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                           # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── api.ts                   # API response types
│   │   │   ├── domain.ts                # Domain types (cases, workflows, etc.)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── db/                              # Database types (auto-generated from Supabase)
│       ├── package.json
│       └── tsconfig.json
│
├── services/                            # Express backend services
│   ├── intake-api/                      # Fastify gateway for bank intake webhooks
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   └── webhook.ts
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── coordinator/                     # Hono + Telegraf Telegram bot
│       ├── src/
│       │   └── server.ts
│       ├── package.json
│       └── tsconfig.json
│
├── src/                                 # Express backend (server.ts entry)
│   ├── server/
│   │   ├── routes/
│   │   │   ├── auth.ts                  # Auth routes
│   │   │   ├── cases.ts                 # Cases CRUD + state machine
│   │   │   ├── command-center.ts        # Command Center API
│   │   │   ├── documents.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── invoices.ts
│   │   │   ├── timesheets.ts
│   │   │   ├── nesl.ts
│   │   │   └── bankPortal.ts
│   │   ├── auth.ts                      # Supabase middleware + requireOrgAccess
│   │   ├── db.ts                        # PostgreSQL pool
│   │   ├── logger.ts                    # Structured logging
│   │   ├── metrics.ts                   # Prometheus metrics
│   │   ├── openapi.ts                   # OpenAPI spec
│   │   ├── jobQueue.ts                  # BullMQ job queues
│   │   ├── sentry.ts                    # Sentry error tracking
│   │   ├── aiRouter.ts                  # AI endpoints (Gemini)
│   │   ├── tenantContext.ts             # org_id context
│   │   └── validation.ts                # Zod validation
│   └── index.ts
│
├── server.ts                            # Express + Vite entry point
├── package.json                         # Root package.json (Turborepo)
├── turbo.json                           # Turborepo config
├── vite.config.ts                       # Vite config
├── tsconfig.json                        # TypeScript config
├── tailwind.config.js                   # Tailwind config
├── postcss.config.js                    # PostCSS config
├── .env.example                         # Environment variables template
├── docker-compose.yml                   # Local development
├── docker-compose.prod.yml              # Production deployment
├── Caddyfile                            # Reverse proxy
├── docs/
│   └── adr/
│       └── 001-frontend-architecture-integration-layer.md  # This ADR
└── README.md
```

## Key Implementation Details

### 1. React Router v6 with Lazy Loading (`apps/web/src/App.tsx`)
- All 18 target screens implemented as lazy-loaded routes
- Route groups with role-based protection via `<ProtectedRoute>`
- Nested routes for detail views (`/matters/:id`, `/approvals/:id`, etc.)
- Catch-all redirect to home

### 2. Supabase Middleware + requireOrgAccess (`src/server/auth.ts`)
- `createSupabaseMiddleware()` - JWT validation + profile fetch
- `requireOrgAccess()` - Ensures `org_id` exists on request
- `requireRole(...)` - Role-based authorization
- All API routes under `/api/v1/*` require authentication

### 3. TanStack Query v5 with org_id Injection (`packages/api/src/client/index.ts`)
- Singleton `queryClient` with optimized defaults
- Automatic `X-Org-ID` header injection from auth store
- `ApiError` class for typed error handling
- Query key factory for consistent caching
- Invalidation helpers for mutations

### 4. Typed Query Hooks (`packages/api/src/hooks/index.ts`)
- Command Center hooks: `useActiveMatters`, `useSLARisks`, `usePendingApprovals`, `useAITasks`, `useUpcomingDeadlines`, `useExternalActions`, `useInstitutionActivity`, `useSystemHealth`
- Mutation hooks: `useApproveApproval`, `useRejectApproval`, `useCreateMatter`, etc.
- All hooks consume `orgId` from Zustand auth store

### 5. Supabase Realtime for Command Center (`apps/web/src/hooks/useDashboardRealtime.ts`)
- Real-time subscriptions for: `cases`, `approval_requests`, `ai_runs`, `external_actions`, `deadlines`, `activity_log`
- Connection state indicator (`isConnected`)
- Auto-reconnect with exponential backoff
- Event filtering by `org_id` via Supabase RLS

### 6. Code Splitting Strategy
- Route-level: `React.lazy()` for each top-level screen
- Component-level: Heavy components (DataGrid, Charts, PDF) lazy-loaded
- Vite manual chunks: `vendor`, `router`, `ui`, `charts`, `pdf`
- Target: < 300KB gzipped JS bundle

### 7. Virtualized Tables (`packages/ui/src/components/VirtualizedDataGrid.tsx`)
- `@tanstack/react-table` v8 for headless table logic
- `react-window` `FixedSizeList` for row virtualization
- Supports sorting, filtering, pagination, row expansion
- Keyboard navigation + screen reader support (WCAG 2.2 AA)
- Global filter + per-column filtering

### 8. Global Shell (`apps/web/src/components/shell/GlobalShell.tsx`)
- **Sidebar**: Collapsible rail navigation with icons + labels
- **Topbar**: Page title, theme toggle, notifications, user menu, logout
- **Responsive**: Mobile slide-in drawer, desktop persistent
- **Accessible**: ARIA labels, keyboard navigation, focus management

### 9. ThemeProvider with Persistence (`apps/web/src/components/theme/ThemeProvider.tsx`)
- Three modes: `glass`, `editorial`, `brutalist`
- `localStorage` persistence (`luxor-theme` key)
- Cross-tab sync via `storage` event listener
- System preference detection (`prefers-color-scheme`)
- CSS variable injection for all tokens
- Hydration-safe with mounted state

### 10. Tenant Context (org_id via Header)
- Server: `req.user.orgId` from Supabase profile (RLS enforced)
- Client: `X-Org-ID` header on all API requests
- Middleware validates `org_id` matches authenticated user's organization
- Cross-tenant access blocked at middleware layer

## Required Dependencies

### New Dependencies to Add

**Root `package.json`:**
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.60.0",
    "@tanstack/react-query-devtools": "^5.60.0",
    "@tanstack/react-table": "^8.16.0",
    "react-window": "^1.8.10"
  },
  "devDependencies": {
    "@types/react-window": "^1.8.8"
  }
}
```

**apps/web/package.json:**
```json
{
  "dependencies": {
    "@ag/api": "*",
    "@ag/ui": "*",
    "@ag/types": "*",
    "@tanstack/react-query": "^5.60.0",
    "@tanstack/react-query-devtools": "^5.60.0",
    "react-router-dom": "^6.22.3"
  }
}
```

### Existing Dependencies (Already Present)
- `react-router-dom` ✓
- `zustand` ✓
- `@supabase/supabase-js` ✓
- `@supabase/ssr` ✓
- `framer-motion` ✓
- `lucide-react` ✓
- `clsx`, `tailwind-merge` ✓

## Vite Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ag/api': path.resolve(__dirname, '../packages/api/src'),
      '@ag/ui': path.resolve(__dirname, '../packages/ui/src'),
      '@ag/types': path.resolve(__dirname, '../packages/types/src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          router: ['react-router-dom'],
          ui: ['@ag/ui', 'lucide-react', 'framer-motion'],
          query: ['@tanstack/react-query', '@tanstack/react-table'],
          window: ['react-window'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
```

## Environment Variables (`.env.example`)

```bash
# App
VITE_APP_URL=http://localhost:3001
VITE_DEV_MODE=true

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# AI Backend
VITE_AI_BACKEND_URL=http://localhost:8000
VITE_AI_ADMIN_KEY=your-admin-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://luxor9-legalos.vercel.app

# Optional
SENTRY_DSN=
RESEND_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=
```

## Migration Checklist

1. ✅ Create ADR 001
2. ✅ Create `@ag/api` package with TanStack Query client + hooks
3. ✅ Create `@ag/ui` package with VirtualizedDataGrid
4. ✅ Enhance `ThemeProvider` with localStorage + cross-tab sync
5. ✅ Create `GlobalShell` (Sidebar + Topbar)
6. ✅ Update `App.tsx` with lazy-loaded routes + GlobalShell
7. ⏳ Create placeholder screen components (CommandCenter, MattersList, etc.)
8. ⏳ Update Express routes to use `/api/v1` prefix consistently
9. ⏳ Add Supabase Realtime channels for all Command Center widgets
10. ⏳ Configure Vite manual chunks
11. ⏳ Run `npm install` and verify build
12. ⏳ Test multi-tenant isolation with multiple orgs

## Performance Targets (Lighthouse)

| Metric | Target |
|--------|--------|
| LCP | < 2.0s |
| TBT | < 200ms |
| CLS | < 0.05 |
| JS Bundle | < 300KB gzipped |
| First Paint | < 1.0s |
| TTI | < 3.0s |

## Accessibility (WCAG 2.2 AA)

- Semantic HTML structure
- Visible focus styles (`:focus-visible`)
- Keyboard navigation for all interactive elements
- ARIA labels and roles
- Screen reader announcements for live regions
- Contrast ≥ 4.5:1
- No color-only status indicators
- Logical heading hierarchy
- Dialog focus management
- Reduced motion respect (`prefers-reduced-motion`)