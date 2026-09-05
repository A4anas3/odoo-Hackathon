import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DesktopHeader } from './DesktopHeader';
import { MobileHeader } from './MobileHeader';
import { useCurrentUser } from '../../hooks/auth/useCurrentUser';
import { ROUTES } from '../../config/routes';

export function AppShell() {
  const { isAuthenticated } = useCurrentUser();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // If not logged in, redirect to login page while preserving target path
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
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
