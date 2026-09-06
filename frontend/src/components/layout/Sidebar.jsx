import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  Clock,
  CalendarCheck,
  CalendarDays,
  Coins,
  Layers,
  Calculator,
  Receipt,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { ROUTES } from '../../config/routes';
import { useCurrentUser } from '../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../config/permissions';
import { cn } from '../../lib/utils/cn';

export function Sidebar({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { can } = useCurrentUser();

  // State for expanded collapsible groups
  const [expandedSections, setExpandedSections] = useState({
    employees: true,
    attendance: true,
    timeoff: true,
    payroll: true,
  });

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const menuSections = [
    {
      title: 'Core',
      items: [
        {
          label: 'Dashboard',
          path: ROUTES.DASHBOARD,
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Employees',
      key: 'employees',
      icon: Users,
      permission: PERMISSIONS.CAN_MANAGE_EMPLOYEES,
      items: [
        { label: 'Employees', path: ROUTES.EMPLOYEES, icon: Users },
        { label: 'Departments', path: ROUTES.DEPARTMENTS, icon: Building2 },
        { label: 'Job Positions', path: ROUTES.JOB_POSITIONS, icon: Briefcase },
        { label: 'Contracts', path: ROUTES.CONTRACTS, icon: FileText },
      ],
    },
    {
      title: 'Attendance',
      key: 'attendance',
      icon: Clock,
      items: [
        { label: 'Attendance', path: ROUTES.ATTENDANCE, icon: Clock },
        { label: 'Working Schedules', path: ROUTES.SCHEDULES, icon: CalendarCheck, permission: PERMISSIONS.CAN_MANAGE_SCHEDULES },
      ],
    },
    {
      title: 'Time Off',
      key: 'timeoff',
      icon: CalendarDays,
      items: [
        { label: 'Dashboard', path: ROUTES.TIMEOFF, icon: CalendarDays },
        { label: 'Time Offs', path: ROUTES.TIMEOFF_REQUESTS, icon: FileText },
        { label: 'Time Off Types', path: ROUTES.TIMEOFF_TYPES, icon: CalendarCheck, permission: PERMISSIONS.CAN_APPROVE_LEAVE },
        { label: 'Allocations', path: ROUTES.TIMEOFF_ALLOCATIONS, icon: Layers, permission: PERMISSIONS.CAN_APPROVE_LEAVE },
      ],
    },
    {
      title: 'Payroll',
      key: 'payroll',
      icon: Coins,
      permission: PERMISSIONS.CAN_RUN_PAYROLL,
      items: [
        { label: 'Dashboard', path: ROUTES.PAYROLL_DASHBOARD, icon: LayoutDashboard },
        { label: 'Payruns', path: ROUTES.PAYRUNS, icon: Coins },
        { label: 'Payslips', path: ROUTES.PAYSLIPS, icon: Receipt },
        { label: 'Salary Structures', path: ROUTES.SALARY_STRUCTURES, icon: Layers, permission: PERMISSIONS.CAN_MANAGE_SALARY_STRUCTURES },
        { label: 'Salary Rules', path: ROUTES.SALARY_RULES, icon: Calculator, permission: PERMISSIONS.CAN_MANAGE_SALARY_STRUCTURES },
      ],
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200/80 shrink-0">
        <NavLink to={ROUTES.DASHBOARD} className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#714B67] flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
            O
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-sm tracking-tight leading-none">
                Odoo HRMS
              </span>
              <span className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                Enterprise Suite
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop collapse button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {menuSections.map((section, idx) => {
          if (section.permission && !can(section.permission)) return null;

          if (!section.key) {
            // Standalone top level items (like Dashboard)
            return (
              <div key={idx} className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all group relative',
                        isActive
                          ? 'bg-[#714B67] text-white shadow-2xs font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700')} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          // Collapsible group
          const isExpanded = expandedSections[section.key];
          const hasActiveChild = section.items.some((it) => location.pathname.startsWith(it.path));

          return (
            <div key={section.key} className="space-y-1">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-700 tracking-wider uppercase transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200 text-slate-400',
                      isExpanded ? 'transform rotate-0' : 'transform -rotate-90'
                    )}
                  />
                </button>
              ) : (
                <div className="h-px bg-slate-200 my-2" />
              )}

              {(isExpanded || isCollapsed) && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    if (item.permission && !can(item.permission)) return null;
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onCloseMobile}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all group relative',
                          isActive
                            ? 'bg-[#714B67]/10 text-[#714B67] font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon
                          className={cn(
                            'w-4 h-4 shrink-0',
                            isActive ? 'text-[#714B67]' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User Quick Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
          <NavLink
            to={ROUTES.PROFILE}
            className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#714B67] text-white flex items-center justify-center text-xs font-bold shrink-0">
              ME
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate leading-none">My Profile</p>
              <p className="text-[10px] text-slate-400 truncate mt-1">View personal records</p>
            </div>
          </NavLink>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-300 h-screen sticky top-0 z-30',
          isCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-2xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white transition-transform duration-300 transform md:hidden shadow-xl',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {content}
      </div>
    </>
  );
}
