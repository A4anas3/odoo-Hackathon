import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DesktopHeader } from './DesktopHeader';
import { MobileHeader } from './MobileHeader';
import { useCurrentUser } from '../../hooks/auth/useCurrentUser';
import { useMyProfile } from '../../features/employees/hooks/useEmployees';
import { ROUTES } from '../../config/routes';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

export function AppShell() {
  const { isAuthenticated, logout } = useCurrentUser();
  const { data: profile } = useMyProfile();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If not logged in, redirect to login page while preserving target path
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Hard lockout if user is terminated
  if (profile?.status === 'TERMINATED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 text-rose-500 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 uppercase tracking-wider mb-3">
          Employment Terminated
        </span>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account Access Revoked</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
          Your employment profile has been marked as <strong>TERMINATED</strong>. All administrative privileges, review powers, time-off submissions, and shift actions have been revoked.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Your login credentials have also been disabled in the authentication directory.
        </p>
        <div className="mt-6">
          <Button variant="danger" size="md" icon={LogOut} onClick={() => logout()}>
            Sign Out Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden text-slate-800 antialiased">
      {/* Sidebar (Desktop + Mobile drawer) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Headers */}
        <DesktopHeader />
        <MobileHeader onOpenSidebar={() => setIsMobileOpen(true)} />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
