import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useCurrentUser } from '../../hooks/auth/useCurrentUser';
import { Avatar } from '../ui/Avatar';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { AttendanceWidget } from '../../features/attendance/components/AttendanceWidget';

export function MobileHeader({ onOpenSidebar }) {
  const { user, logout } = useCurrentUser();

  return (
    <header className="flex md:hidden h-14 bg-white border-b border-slate-200 px-4 items-center justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#714B67] text-white flex items-center justify-center font-bold text-xs">
            O
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-tight">Odoo HRMS</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <AttendanceWidget />
        <Link to={ROUTES.PROFILE}>
          <Avatar name={user?.email || 'User'} size="sm" />
        </Link>
        <button
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
