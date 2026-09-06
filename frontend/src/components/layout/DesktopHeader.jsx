import React from 'react';
import { useCurrentUser } from '../../hooks/auth/useCurrentUser';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { AttendanceWidget } from '../../features/attendance/components/AttendanceWidget';

export function DesktopHeader() {
  const { user, logout } = useCurrentUser();

  const primaryRole = user?.roles?.[0]?.replace(/^ROLE_/, '') || 'EMPLOYEE';

  return (
    <header className="hidden md:flex h-14 bg-white border-b border-slate-200/80 px-6 items-center justify-end shrink-0 sticky top-0 z-20">
      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Attendance Quick Widget with live status indicator dot */}
        <AttendanceWidget />

        {/* Quick link to Attendance */}
        <Link to={ROUTES.ATTENDANCE}>
          <Button variant="secondary" size="xs">
            Attendance Log
          </Button>
        </Link>

        {/* User profile & logout */}
        <div className="h-6 w-px bg-slate-200" />

        <Link
          to={ROUTES.PROFILE}
          className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-slate-50 transition-colors"
        >
          <Avatar name={user?.email || 'User'} size="sm" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.email?.split('@')[0] || 'User'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium leading-none flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
              {primaryRole}
            </span>
          </div>
        </Link>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
