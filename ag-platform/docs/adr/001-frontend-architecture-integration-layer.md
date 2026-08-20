# ADR 001: Frontend Architecture & Integration Layer

**Status**: Accepted
**Date**: 2026-08-20
**Author**: Frontend Architecture Lead

## Context

The Luxor9 Legal OS MVP requires a production-grade frontend architecture that integrates Vite + React + Express with Supabase backend. The system must support multi-tenant organizations (via `org_id`), real-time updates for Command Center, code splitting for performance, and a unified design system with theme persistence.

Existing patterns in `ag-platform`:
- Express server with Vite middleware (`server.ts`)
- React Router for SPA routing (`App.tsx`)
- Zustand for auth state (`useAuthStore.ts`)
- Supabase SSR middleware (`auth.ts`)
- ThemeProvider with CSS variable themes (`ThemeProvider.tsx`)
- Console shell with Sidebar + Topbar (`ConsoleShell.tsx`)
- Supabase Realtime for live updates (`useDashboardRealtime.ts`)

## Decision

### 1. Routing: React Router v6 with Route-Level Code Splitting

- Use `react-router-dom` v6 with `<BrowserRouter>`
- Implement route-level lazy loading via `React.lazy()` + `<Suspense>`
- Organize routes by feature: `/`, `/command-center`, `/matters`, `/tasks`, `/approvals`, `/documents`, `/actions`, `/reports`, `/admin`
- Protected routes via `<ProtectedRoute>` component with role-based access

### 2. Authentication Middleware: Supabase SSR + `requireOrgAccess`

- Extend existing `createSupabaseMiddleware()` and `requireOrgAccess()` from `src/server/auth.ts`
- All API routes under `/api/v1/*` require authentication
- `org_id` extracted from JWT/profile and attached to `req.user.orgId`
- Client-side: `useAuthStore` provides `orgId` for API client injection

### 3. API Client: TanStack Query v5 with `org_id` Injection

- Create `@ag/api` package with `queryClient` and typed hooks
- Base URL: `/api/v1` (Express API prefix)
- Automatic `X-Org-ID` header injection from auth store
- React Query DevTools in development
- Default staleTime: 30s, gcTime: 5min
- Optimistic updates for mutations (approvals, actions, tasks)

### 4. Tenant Context: `org_id` via Header

- Server: `req.user.orgId` from Supabase profile (RLS enforced)
- Client: `X-Org-ID` header on all API requests
- Middleware validates `org_id` matches authenticated user's organization
- Cross-tenant access blocked at middleware layer

### 5. Real-time: Supabase Realtime for Command Center

- Extend `useDashboardRealtime` pattern to all Command Center widgets
- Channels per resource: `cases`, `approval_requests`, `ai_runs`, `external_actions`, `deadlines`, `activity_log`
- Connection state indicator in Topbar (`ConnectionIndicator` component)
- Auto-reconnect with exponential backoff
- Event filtering by `org_id` via Supabase RLS

### 6. Code Splitting: Route-Level Lazy + Component Chunking

- Route-level: `React.lazy()` for each top-level route
- Component-level: `lazy()` for heavy components (DataGrid, Charts, PDF Viewer)
- Vite manual chunks: `vendor`, `router`, `ui`, `charts`, `pdf`
- Target JS bundle < 300KB gzipped per Lighthouse budget

### 7. Virtualized Tables: `react-window` + `@tanstack/react-table`

- `@tanstack/react-table` v8 for headless table logic (sorting, filtering, pagination)
- `react-window` `FixedSizeList` for row virtualization
- Reusable `VirtualizedDataGrid` component with column definitions
- Keyboard navigation + screen reader support (WCAG 2.2 AA)

### 8. Global Shell: Sidebar + Topbar + ThemeProvider

- **Sidebar**: Collapsible rail navigation (reuse `ConsoleShell.Rail` pattern)
- **Topbar**: Title, subtitle, connection status, user menu, theme toggle
- **ThemeProvider**: Enhanced with:
  - `localStorage` persistence (`luxor-theme`)
  - Cross-tab sync via `storage` event listener
  - System preference detection (`prefers-color-scheme`)
  - Three modes: `glass`, `editorial`, `brutalist`
  - CSS variables for all tokens (from `tokens.ts`)

### 9. Package Structure

```
ag-platform/
├── apps/web/                    # Vite + React frontend
├── packages/
│   ├── api/                     # TanStack Query client + hooks
│   ├── ui/                      # shadcn/ui + design system components
│   ├── types/                   # Shared TypeScript types
│   └── db/                      # Database types (auto-generated)
├── services/                    # Express backend services
└── server.ts                    # Express + Vite entry
```

## Consequences

### Positive
- Single source of truth for API contracts via TanStack Query
- Real-time updates without polling
- Multi-tenant isolation enforced at middleware + RLS
- Performance budget met via code splitting + virtualization
- Theme persistence survives refresh + syncs across tabs
- Reusable patterns from existing `ConsoleShell` + `useDashboardRealtime`

### Negative
- Additional package (`@tanstack/react-query`, `react-window`) increases bundle size
- Realtime requires Supabase Realtime enabled (cost at scale)
- Cross-tab sync adds complexity to ThemeProvider

### Migration Path
1. Add `@ag/api` package with queryClient + hooks
2. Update `ThemeProvider` with persistence + sync
3. Create `GlobalShell` (Sidebar + Topbar) components
4. Migrate `App.tsx` routes to lazy-loaded structure
5. Build `VirtualizedDataGrid` component
6. Extend realtime hooks for all Command Center widgets
7. Update Express routes to use `/api/v1` prefix consistently

## References
- [React Router v6 Docs](https://reactrouter.com/en/main)
- [TanStack Query v5 Docs](https://tanstack.com/query/v5)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [react-window Docs](https://react-window.vercel.app/)
- Existing patterns: `ConsoleShell.tsx`, `useDashboardRealtime.ts`, `ThemeProvider.tsx`, `server.ts`, `auth.ts`