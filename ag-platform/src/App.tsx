// Luxor9 Legal OS - Main App with GlobalShell, React Router v6, and Route-Level Code Splitting

import { BrowserRouter, Routes, Route, Navigate, lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ErrorBoundary } from './components/ui';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { GlobalShell } from './components/shell/GlobalShell';
import { useAuthStore } from './store/useAuthStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { TimeTracker } from './components/collaboration/TimeTracker';
import { Loader2, Building2 } from 'lucide-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@ag/api';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import config from './lib/config';

// ============================================================
// Route-Level Lazy Loading (Code Splitting)
// ============================================================

// Public / Marketing
const EditorialLanding = lazy(() => import('./components/home/EditorialLanding'));
const PrivacyPolicy = lazy(() => import('./components/privacy/PrivacyPolicy'));

// Auth
const LoginPage = lazy(() => import('./components/auth/LoginPage'));

// Command Center (Core MVP Screen)
const CommandCenter = lazy(() => import('./components/command-center/CommandCenter'));

// Matters / Cases
const MattersList = lazy(() => import('./components/matters/MattersList'));
const MatterDetail = lazy(() => import('./components/matters/MatterDetail'));

// Tasks
const TasksList = lazy(() => import('./components/tasks/TasksList'));
const TaskDetail = lazy(() => import('./components/tasks/TaskDetail'));

// Approvals
const ApprovalsList = lazy(() => import('./components/approvals/ApprovalsList'));
const ApprovalDetail = lazy(() => import('./components/approvals/ApprovalDetail'));

// Documents
const DocumentsList = lazy(() => import('./components/documents/DocumentsList'));
const DocumentDetail = lazy(() => import('./components/documents/DocumentDetail'));

// Actions
const ActionsList = lazy(() => import('./components/actions/ActionsList'));
const ActionDetail = lazy(() => import('./components/actions/ActionDetail'));

// Reports
const ReportsList = lazy(() => import('./components/reports/ReportsList'));
const ReportDetail = lazy(() => import('./components/reports/ReportDetail'));

// Admin
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/admin/AdminUsers'));
const AdminWorkflows = lazy(() => import('./components/admin/AdminWorkflows'));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings'));

// Applicant Portal
const ApplicantDashboard = lazy(() => import('./components/applicant/ApplicantDashboard'));

// Bank Portal
const BankPortal = lazy(() => import('./components/bank/BankPortal'));

// Legacy Console (Editorial Theme)
const ConsoleApp = lazy(() => import('./components/console/ConsoleApp'));

// ============================================================
// Loading & Error States
// ============================================================

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-2xl blur-xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-violet-500 to-indigo-500 text-white p-4 rounded-2xl shadow-lg">
            <Building2 size={32} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm font-medium">Loading Luxor9 Legal OS...</span>
        </div>
      </div>
    </div>
  );
}

function RouteSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {children}
    </Suspense>
  );
}

// ============================================================
// App Component
// ============================================================

function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [initializeAuth]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <GlobalShell>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<RouteSuspense><EditorialLanding /></RouteSuspense>} />
                <Route path="/privacy" element={<RouteSuspense><PrivacyPolicy /></RouteSuspense>} />
                <Route path="/login" element={<RouteSuspense><LoginPage /></RouteSuspense>} />

                {/* Protected Routes - Main App */}
                <Route element={
                  <ProtectedRoute allowedRoles={['admin', 'staff', 'applicant']}>
                    <RouteSuspense>
                      <CommandCenter />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="command-center" index />
                </Route>

                {/* Matters */}
                <Route element={
                  <ProtectedRoute allowedRoles={['admin', 'staff', 'applicant']}>
                    <RouteSuspense>
                      <MattersList />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="matters" index />
                  <Route path="matters/:id" element={<RouteSuspense><MatterDetail /></RouteSuspense>} />
                </Route>

                {/* Tasks */}
                <Route element={
                  <ProtectedRoute allowedRoles={['admin', 'staff', 'applicant']}>
                    <RouteSuspense>
                      <TasksList />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="tasks" index />
                  <Route path="tasks/:id" element={<RouteSuspense><TaskDetail /></RouteSuspense>} />
                </Route>

                {/* Approvals */}
                <Route element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <RouteSuspense>
                      <ApprovalsList />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="approvals" index />
                  <Route path="approvals/:id" element={<RouteSuspense><ApprovalDetail /></RouteSuspense>} />
                </Route>

                {/* Documents */}
                <Route element={
                  <ProtectedRoute allowedRoles={['admin', 'staff', 'applicant']}>
                    <RouteSuspense>
                      <DocumentsList />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="documents" index />
                  <Route path="documents/:id" element={<RouteSuspense><DocumentDetail /></RouteSuspense>} />
                </Route>

                {/* Actions */}
                <Route element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <RouteSuspense>
                      <ActionsList />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="actions" index />
                  <Route path="actions/:id" element={<RouteSuspense><ActionDetail /></RouteSuspense>} />
                </Route>

                {/* Reports */}
                <Route element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <RouteSuspense>
                      <ReportsList />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="reports" index />
                  <Route path="reports/:id" element={<RouteSuspense><ReportDetail /></RouteSuspense>} />
                </Route>

                {/* Admin */}
                <Route element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <RouteSuspense>
                      <AdminDashboard />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="admin" index />
                  <Route path="admin/users" element={<RouteSuspense><AdminUsers /></RouteSuspense>} />
                  <Route path="admin/workflows" element={<RouteSuspense><AdminWorkflows /></RouteSuspense>} />
                  <Route path="admin/settings" element={<RouteSuspense><AdminSettings /></RouteSuspense>} />
                </Route>

                {/* Applicant Portal */}
                <Route element={
                  <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                    <RouteSuspense>
                      <ApplicantDashboard />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="applicant/*" index />
                </Route>

                {/* Bank Portal */}
                <Route element={
                  <ProtectedRoute allowedRoles={['staff', 'admin']}>
                    <RouteSuspense>
                      <BankPortal />
                    </RouteSuspense>
                  </ProtectedRoute>
                }>
                  <Route path="bank/*" index />
                </Route>

                {/* Legacy Console (Editorial Theme) */}
                <Route path="console" element={
                  <RouteSuspense><ConsoleApp publicView /></RouteSuspense>
                } />
                <Route path="admin/console" element={
                  <ProtectedRoute allowedRoles={['admin', 'staff']}>
                    <RouteSuspense><ConsoleApp /></RouteSuspense>
                  </ProtectedRoute>
                } />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </GlobalShell>
          </BrowserRouter>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ThemeProvider>
      </QueryClientProvider>
      <TimeTracker />
    </ErrorBoundary>
  );
}

export default App;