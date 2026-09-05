import React, { useState } from 'react';
import { useCurrentUser } from '../../hooks/auth/useCurrentUser';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { LogOut, Bell, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

export function DesktopHeader() {
  const { user, logout } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');

  const primaryRole = user?.roles?.[0]?.replace(/^ROLE_/, '') || 'EMPLOYEE';

  return (
    <header className="hidden md:flex h-14 bg-white border-b border-slate-200/80 px-6 items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, payroll, contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
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
