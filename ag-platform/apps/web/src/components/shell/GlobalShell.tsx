// GlobalShell - Main layout component with Sidebar + Topbar
// Replaces the Navigation + AppShell pattern in App.tsx

'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Links, NavLink, useLocation, Outlet } from 'react-router-dom';
import { Building2, UserCircle2, Briefcase, Landmark, LogOut, Loader2, Menu, X, Activity, FileText, Settings, Bell, ChevronLeft, ChevronRight, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../../store/useAuthStore';
import config from '../../lib/config';
import { AnimatePresence, motion } from 'framer-motion';

interface GlobalShellProps {
  children?: ReactNode;
}

export function GlobalShell({ children }: GlobalShellProps) {
  const location = useLocation();
  const { user, signOut, role } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Activity, roles: ['admin', 'staff', 'applicant'] },
    { path: '/command-center', label: 'Command Center', icon: Activity, roles: ['admin', 'staff'] },
    { path: '/matters', label: 'Matters', icon: Briefcase, roles: ['admin', 'staff', 'applicant'] },
    { path: '/tasks', label: 'Tasks', icon: FileText, roles: ['admin', 'staff', 'applicant'] },
    { path: '/approvals', label: 'Approvals', icon: FileText, roles: ['admin', 'staff'] },
    { path: '/documents', label: 'Documents', icon: FileText, roles: ['admin', 'staff', 'applicant'] },
    { path: '/actions', label: 'Actions', icon: Briefcase, roles: ['admin', 'staff'] },
    { path: '/reports', label: 'Reports', icon: Activity, roles: ['admin', 'staff'] },
    { path: '/admin', label: 'Admin', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(role || '')
  );

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSignOut = () => {
    signOut();
    setMobileSidebarOpen(false);
  };

  const toggleTheme = () => {
    const themes: ThemeMode[] = ['glass', 'editorial', 'brutalist'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
        <Loader2 size={48} className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f23] text-white">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        <motion.aside
          className={`fixed top-0 left-0 z-50 h-full glass-card border-r border-white/10 transition-all duration-300 lg:relative lg:z-auto ${sidebarCollapsed ? 'w-20' : 'w-72'} ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
          initial={{ x: mobileSidebarOpen ? 0 : -300 }}
          animate={{ x: mobileSidebarOpen ? 0 : (sidebarCollapsed ? 0 : 0) }}
          exit={{ x: -300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className={`flex items-center gap-3 p-4 border-b border-white/10 ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 rounded-xl blur-lg" />
                <div className="relative bg-gradient-to-br from-violet-500 to-indigo-500 text-white p-2 rounded-xl shadow-lg">
                  <Building2 size={22} />
                </div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <h1 className="text-lg font-serif font-bold text-white leading-none">{config.app.name}</h1>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/50">{config.app.description}</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Main navigation">
              {filteredNavItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive: isActiveRouter }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${isActiveRouter
                        ? 'bg-white/10 text-white border-l-2 border-violet-500'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                      }
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={sidebarCollapsed ? item.label : undefined}
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <Icon size={20} className="flex-shrink-0" aria-hidden="true" />
                    {!sidebarCollapsed && <span className="font-medium truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>

            {/* Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-3 border-t border-white/10 transition-all duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!sidebarCollapsed}
            >
              <ChevronLeft size={20} className="text-white/70 hover:text-white transition-colors" />
            </button>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Topbar */}
        <header className="glass-nav px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30 lg:ml-0">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label={mobileSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileSidebarOpen}
          >
            {mobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Page Title */}
          <div className="flex-1 lg:flex-none">
            <h1 className="text-xl font-semibold text-white truncate">
              {filteredNavItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Right Section - Theme Toggle, Notifications, User Menu */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
              aria-label={`Current theme: ${resolvedTheme}. Click to cycle.`}
              title={`Theme: ${resolvedTheme}`}
            >
              {resolvedTheme === 'glass' && <Monitor size={20} />}
              {resolvedTheme === 'editorial' && <Sun size={20} />}
              {resolvedTheme === 'brutalist' && <Moon size={20} />}
            </button>

            {/* Notifications */}
            <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 relative" aria-label="Notifications">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                {!sidebarCollapsed && (
                  <span className="hidden sm:block font-medium">{user?.email || 'User'}</span>
                )}
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative z-10">
          {children || <Outlet />}
        </main>

        {/* Footer */}
        <footer className="glass-card mx-4 md:mx-6 mb-4 py-3 px-4 text-center text-xs text-white/50 border-t border-white/10">
          <p>© 2024 {config.app.name}. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

type ThemeMode = 'glass' | 'editorial' | 'brutalist';