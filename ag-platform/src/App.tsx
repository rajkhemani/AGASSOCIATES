import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ApplicantDashboard } from './components/applicant/ApplicantDashboard';
import { AdvisorCockpit } from './components/admin/AdvisorCockpit';
import { BankPortal } from './components/bank/BankPortal';
import { LoginPage } from './components/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { WorkforceControl } from './components/admin/WorkforceControl';
import { PrivacyPolicy } from './components/privacy/PrivacyPolicy';
import { ErrorBoundary } from './components/ui';
import { useAuthStore } from './store/useAuthStore';
import { Building2, UserCircle2, Briefcase, Landmark, LogOut, Loader2 } from 'lucide-react';
import { TimeTracker } from './components/collaboration/TimeTracker';
import config from './lib/config';

// Editorial-theme screens from the claude.ai/design handoff — lazy-loaded so the
// design system (fonts, large page components) stays out of the main chunk.
const EditorialLanding = lazy(() => import('./components/home/EditorialLanding'));
const ConsoleApp = lazy(() => import('./components/console/ConsoleApp'));

// Routes that ship their own full-page chrome (nav, footer, background).
function useChromeless() {
  const { pathname } = useLocation();
  return pathname === '/' || pathname.startsWith('/console');
}

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
          <span className="text-sm font-medium">Loading AG Associates...</span>
        </div>
      </div>
    </div>
  );
}

function Navigation() {
  const location = useLocation();
  const chromeless = useChromeless();
  const { user, signOut } = useAuthStore();

  const getLinkStyle = (path: string) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
      isActive
        ? 'glass-nav-link active text-white'
        : 'glass-nav-link text-white/70 hover:text-white hover:bg-white/10'
    }`;
  };

  if (location.pathname === '/login' || chromeless) return null;

  return (
    <header className="glass-nav px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-xl blur-lg" />
          <div className="relative bg-gradient-to-br from-violet-500 to-indigo-500 text-white p-2 rounded-xl shadow-lg">
            <Building2 size={22} />
          </div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-serif font-bold text-white leading-none">{config.app.name}</h1>
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">{config.app.description}</span>
        </div>
      </div>
      <nav className="flex items-center space-x-1 p-1 rounded-xl glass-card">
        <Link to="/" className={getLinkStyle('/')}> 🌐 Marketing </Link>
        <Link to="/applicant" className={getLinkStyle('/applicant')}>
          <UserCircle2 size={16} /> Applicant
        </Link>
        <Link to="/admin" className={getLinkStyle('/admin')}>
          <Briefcase size={16} /> Advisor
        </Link>
        <Link to="/bank" className={getLinkStyle('/bank')}>
          <Landmark size={16} /> Bank Portal
        </Link>
        {user ? (
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
          >
            <LogOut size={16} /> Logout
          </button>
        ) : (
          <Link to="/login" className={getLinkStyle('/login')}>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}

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
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function AppShell() {
  const chromeless = useChromeless();

  return (
    <div className={`min-h-screen flex flex-col font-sans relative overflow-x-hidden ${chromeless ? '' : 'text-white'}`}>
      {/* Background Mesh Gradient — hidden on editorial-theme routes */}
      {!chromeless && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-mesh" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
      )}

      <Navigation />
      <main className="flex-1 flex flex-col w-full relative z-10">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<EditorialLanding />} />
            <Route path="/console" element={<ConsoleApp />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            <Route path="/applicant/*" element={
              <ProtectedRoute allowedRoles={['applicant', 'admin']}>
                <ApplicantDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Routes>
                  <Route index element={<AdvisorCockpit />} />
                  <Route path="workforce" element={<WorkforceControl />} />
                </Routes>
              </ProtectedRoute>
            } />

            <Route path="/bank/*" element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <BankPortal />
              </ProtectedRoute>
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {!chromeless && (
        <footer className="glass-card mx-6 mb-4 py-4 px-6 text-center text-xs text-white/50">
          <p>© 2024 {config.app.name}. All rights reserved.</p>
          <Link to="/privacy" className="hover:text-violet-300 hover:underline transition-all duration-300 mt-1 inline-block">
            Privacy Policy
          </Link>
        </footer>
      )}

      {/* Global Floating Time Tracker for Advocates */}
      <TimeTracker />
    </div>
  );
}

export default App;
