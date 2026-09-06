import React, { useState } from 'react';
import { useCurrentUser } from '../../hooks/auth/useCurrentUser';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { LogOut, Bell, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { AttendanceWidget } from '../../features/attendance/components/AttendanceWidget';

import { ChevronDown, Briefcase, CalendarDays, FileText, Layers, Clock, Users, Coins } from 'lucide-react';

export function DesktopHeader() {
  const { user, logout } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null);

  const primaryRole = user?.roles?.[0]?.replace(/^ROLE_/, '') || 'EMPLOYEE';

  const toggleMenu = (menuKey) => {
    setOpenMenu((prev) => (prev === menuKey ? null : menuKey));
  };

  return (
    <header className="hidden md:flex h-14 bg-white border-b border-slate-200/80 px-6 items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Odoo HR Navigation Menu Bar */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Module Icon */}
        <Link
          to={ROUTES.DASHBOARD}
          className="w-8 h-8 rounded-lg bg-[#714B67] text-white flex items-center justify-center font-bold text-xs shadow-xs mr-2 hover:opacity-95 transition-opacity"
          title="HR Dashboard"
        >
          HR
        </Link>

        {/* Employees Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('employees')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              openMenu === 'employees' ? 'bg-slate-100 text-[#714B67]' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Employees</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {openMenu === 'employees' && (
            <div
              className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in"
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                to={ROUTES.EMPLOYEES}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Employees
              </Link>
              <Link
                to={ROUTES.DEPARTMENTS}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Departments
              </Link>
              <Link
                to={ROUTES.JOB_POSITIONS}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Job Positions
              </Link>
            </div>
          )}
        </div>

        {/* Contracts Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('contracts')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              openMenu === 'contracts' ? 'bg-slate-100 text-[#714B67]' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Contracts</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {openMenu === 'contracts' && (
            <div
              className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in"
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                to={ROUTES.CONTRACTS}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Contracts
              </Link>
              <Link
                to={ROUTES.SCHEDULES}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Working Schedules
              </Link>
            </div>
          )}
        </div>

        {/* Attendance Direct Link */}
        <Link
          to={ROUTES.ATTENDANCE}
          className="px-2.5 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#714B67] transition-colors"
        >
          Attendance
        </Link>

        {/* Time Off Menu Dropdown (Matches Wireframe 3 Specification) */}
        <div className="relative">
          <button
            type="button"
            id="navbar-timeoff-menu"
            onClick={() => toggleMenu('timeoff')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              openMenu === 'timeoff' ? 'bg-slate-100 text-[#714B67]' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Time Off</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {openMenu === 'timeoff' && (
            <div
              className="absolute left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95"
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                to={ROUTES.TIMEOFF}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Dashboard
              </Link>
              <Link
                to={ROUTES.TIMEOFF_REQUESTS}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Time Offs
              </Link>
              <Link
                to={ROUTES.TIMEOFF_TYPES}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Time Off Types
              </Link>
              <Link
                to={ROUTES.TIMEOFF_ALLOCATIONS}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Allocations
              </Link>
            </div>
          )}
        </div>

        {/* Payroll Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('payroll')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              openMenu === 'payroll' ? 'bg-slate-100 text-[#714B67]' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>Payroll</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {openMenu === 'payroll' && (
            <div
              className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in"
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                to={ROUTES.PAYROLL_DASHBOARD}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Dashboard
              </Link>
              <Link
                to={ROUTES.PAYRUNS}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Payruns
              </Link>
              <Link
                to={ROUTES.PAYSLIPS}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Payslips
              </Link>
              <Link
                to={ROUTES.SALARY_STRUCTURES}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Salary Structures
              </Link>
              <Link
                to={ROUTES.SALARY_RULES}
                onClick={() => setOpenMenu(null)}
                className="block px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-[#714B67] font-medium"
              >
                Salary Rules
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Center Search Input */}
      <div className="flex items-center gap-3 w-72 lg:w-80">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all"
          />
        </div>
      </div>

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
