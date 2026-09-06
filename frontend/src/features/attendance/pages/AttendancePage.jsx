import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { DataTable } from '../../../components/table/DataTable';
import { Pagination } from '../../../components/table/Pagination';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/form/Select';
import { Input } from '../../../components/form/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { attendanceApi } from '../api/attendanceApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { useMyProfile } from '../../employees/hooks/useEmployees';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { useToast } from '../../../hooks/useToast';
import { 
  Clock, Search, Users, UserCheck, X, Info, 
  Calendar, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { formatDate, formatTime, formatHours } from '../../../lib/utils/formatters';

export function AttendancePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const isAdminOrManager = can(PERMISSIONS.CAN_MANAGE_SCHEDULES);
  const { data: profile } = useMyProfile();

  const [searchParams, setSearchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employeeId');

  // Scope: Admin/manager can view company or mine; regular employees strictly mine
  const [scope, setScope] = useState(isAdminOrManager ? 'company' : 'mine');
  const isCompanyScope = isAdminOrManager && scope === 'company';

  // Filters matching wireframe
  const [search, setSearch] = useState('');
  const [isTodayOnly, setIsTodayOnly] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employeeIdParam || 'ALL');

  // Pagination state: 200 per page from backend
  const [page, setPage] = useState(1);
  const pageSize = 200;

  // Reset page to 1 when changing scope, employee, or today filter
  useEffect(() => {
    setPage(1);
  }, [scope, selectedEmployeeId, employeeIdParam, isTodayOnly]);

  // Sync if URL param changes
  useEffect(() => {
    if (employeeIdParam) {
      setSelectedEmployeeId(employeeIdParam);
    }
  }, [employeeIdParam]);

  // Query attendance logs from backend: when isTodayOnly is active, fetch whole today from backend
  const { data: attendanceData, isLoading: isLogsLoading } = useQuery({
    queryKey: [
      'attendance',
      'history',
      employeeIdParam || (isCompanyScope ? 'company' : 'mine'),
      isTodayOnly ? 'today' : 'all',
      page,
    ],
    queryFn: () => {
      const params = isTodayOnly
        ? { todayOnly: true, unpaged: true }
        : { page: page - 1, size: pageSize };

      if (employeeIdParam) return attendanceApi.getEmployeeAttendance(employeeIdParam, params);
      return isCompanyScope ? attendanceApi.getAllAttendance(params) : attendanceApi.getMyAttendance(params);
    },
  });

  const rawLogs = useMemo(() => {
    if (Array.isArray(attendanceData)) return attendanceData;
    if (attendanceData && Array.isArray(attendanceData.content)) return attendanceData.content;
    return [];
  }, [attendanceData]);

  const totalItems = attendanceData?.totalElements ?? rawLogs.length;
  const totalPages = attendanceData?.totalPages ?? (Math.ceil(totalItems / pageSize) || 1);

  // Extract unique employees for filter dropdown
  const employeeOptions = useMemo(() => {
    const map = new Map();
    rawLogs.forEach((log) => {
      const id = log.employeeId;
      const name = log.employeeName || 'Staff';
      if (id && !map.has(id)) {
        map.set(id, name);
      }
    });

    const opts = [{ value: 'ALL', label: 'All Employees' }];
    map.forEach((name, id) => {
      opts.push({ value: id, label: name });
    });
    return opts;
  }, [rawLogs]);

  // Filter logs based on search and selected employee
  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      // Employee filter
      if (selectedEmployeeId !== 'ALL' && log.employeeId !== selectedEmployeeId) {
        return false;
      }

      // Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        const empName = (log.employeeName || '').toLowerCase();
        const empCode = (log.employeeCode || '').toLowerCase();
        const status = (log.status || '').toLowerCase();
        if (!empName.includes(query) && !empCode.includes(query) && !status.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [rawLogs, selectedEmployeeId, search]);

  const handleResetFilters = () => {
    setSearch('');
    setIsTodayOnly(false);
    setSelectedEmployeeId('ALL');
    if (employeeIdParam) {
      searchParams.delete('employeeId');
      setSearchParams(searchParams);
    }
  };

  const isAllSelected = !search && !isTodayOnly && selectedEmployeeId === 'ALL' && !employeeIdParam;

  // Table columns matching wireframe:
  // Employee, Check In, Check Out, Worked Hours, Status
  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      render: (_, row) => {
        const name = row.employeeName || 'Staff Member';
        const code = row.employeeCode || '—';
        return (
          <div className="flex items-center gap-3">
            <Avatar name={name} size="sm" />
            <div>
              <span className="font-semibold text-slate-800 block leading-tight">
                {name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{code}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Check In',
      key: 'checkIn',
      render: (time) => (
        <span className="font-mono text-slate-800 text-xs">
          {time ? formatTime(time) : '—'}
        </span>
      ),
    },
    {
      header: 'Check Out',
      key: 'checkOut',
      render: (time) => (
        <span className="font-mono text-slate-800 text-xs">
          {time ? formatTime(time) : '—'}
        </span>
      ),
    },
    {
      header: 'Worked Hours',
      key: 'workedHours',
      render: (hrs) => (
        <span className="font-mono font-medium text-slate-700 text-xs">
          {hrs != null && hrs > 0 ? Number(hrs).toFixed(2) : '0.00'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status || 'PRESENT'} />,
    },
    {
      header: 'Payroll Settlement',
      key: 'isPaid',
      render: (_, row) => {
        if (row.isPaid) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Settled & Paid
            </span>
          );
        }
        if (row.payslipId) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Linked to Payrun
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Unsettled
          </span>
        );
      },
    },
    {
      header: '',
      key: 'action',
      align: 'right',
      render: () => (
        <ChevronRight className="w-4 h-4 text-slate-400 inline" />
      ),
    },
  ];

  return (
    <PageContainer
      title="Attendance"
      description="List view of employee attendance records."
      breadcrumbs={[
        { label: 'Attendance', href: ROUTES.ATTENDANCE },
      ]}
    >
      {/* Scope Selector Tabs for Admin / Manager */}
      {isAdminOrManager && (
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 w-fit shadow-2xs mb-1">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              scope === 'company'
                ? 'bg-white text-[#714B67] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setScope('company')}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Company Attendance</span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              scope === 'mine'
                ? 'bg-white text-[#714B67] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setScope('mine')}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Attendance</span>
          </button>
        </div>
      )}

      {/* Employee Filter Banner when navigated via smart button */}
      {employeeIdParam && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>
              Filtered by Employee:{' '}
              <strong className="font-semibold">
                {filteredLogs[0]?.employeeName || 'Selected Employee'}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Filter Bar matching wireframe: [All] [Search attendance...] [Today] [Employee Select] */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* 'All' pill button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isAllSelected
                ? 'bg-[#714B67] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All
          </button>

          {/* Search attendance... input */}
          <div className="w-64 max-w-full">
            <Input
              placeholder="Search attendance..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 'Today' quick filter button */}
          <button
            type="button"
            onClick={() => setIsTodayOnly((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isTodayOnly
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {/* Employee dropdown selector (for Admin/Manager company scope) */}
          {isAdminOrManager && isCompanyScope && (
            <div className="w-52">
              <Select
                options={employeeOptions}
                value={selectedEmployeeId}
                onChange={(e) => {
                  setSelectedEmployeeId(e.target.value);
                  if (e.target.value === 'ALL') {
                    searchParams.delete('employeeId');
                    setSearchParams(searchParams);
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Attendance List Table - Clicking row opens Form View */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLogsLoading}
        onRowClick={(row) => navigate(`/attendance/${row.id}`)}
        emptyTitle="No attendance records"
        emptyDescription="No attendance records match your current filter or search criteria."
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {/* Useful Note Footer matching wireframe specification */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium leading-relaxed">
          <strong>Useful note:</strong> List view should help users review raw check-in / check-out data and identify missing punches quickly.
        </span>
      </div>
    </PageContainer>
  );
}
