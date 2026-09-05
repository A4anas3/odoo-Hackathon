import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/form/Select';
import { Input } from '../../../components/form/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { attendanceApi, DEFAULT_ATTENDANCE_LOGS } from '../api/attendanceApi';
import { useToast } from '../../../hooks/useToast';
import { Clock, LogIn, LogOut, CheckCircle2, Search, Filter } from 'lucide-react';
import { formatDate, formatTime, formatHours } from '../../../lib/utils/formatters';

export function AttendancePage() {
  const toast = useToast();
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('09:02 AM');
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState(DEFAULT_ATTENDANCE_LOGS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = async () => {
    if (!isCheckedIn) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCheckInTime(now);
      setIsCheckedIn(true);
      setCheckOutTime(null);
      toast.success(`Checked in at ${now}`);
    } else {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCheckOutTime(now);
      setIsCheckedIn(false);
      toast.success(`Checked out at ${now}`);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (search && !log.employee?.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const columns = [
    {
      header: 'Employee',
      key: 'employee',
      render: (emp) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={emp?.name} size="sm" />
          <div>
            <span className="font-semibold text-slate-800 block leading-tight">{emp?.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">{emp?.code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      key: 'date',
      render: (date) => <span className="font-medium text-slate-700">{formatDate(date)}</span>,
    },
    {
      header: 'Check In',
      key: 'checkIn',
      render: (time) => (
        <span className="font-mono text-slate-800">{time ? formatTime(time) : '—'}</span>
      ),
    },
    {
      header: 'Check Out',
      key: 'checkOut',
      render: (time) => (
        <span className="font-mono text-slate-800">{time ? formatTime(time) : '—'}</span>
      ),
    },
    {
      header: 'Worked Hours',
      key: 'workedHours',
      render: (hrs) => (
        <span className="font-medium text-slate-700">{hrs > 0 ? formatHours(hrs) : '—'}</span>
      ),
    },
    {
      header: 'Overtime',
      key: 'overtime',
      render: (ot) => (
        <span className={ot > 0 ? 'font-semibold text-purple-700' : 'text-slate-400'}>
          {ot > 0 ? `+${formatHours(ot)}` : '0h'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
  ];

  return (
    <PageContainer
      title="Attendance Management"
      description="Record daily work punches, manage punctuality, and view time logs."
    >
      {/* Live Punch Card Banner */}
      <Card className="border border-slate-200 shadow-2xs">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-14 h-14 rounded-2xl bg-[#714B67]/10 flex items-center justify-center text-[#714B67] shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Current System Time
                </span>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5 tracking-tight">
                  {currentTime}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Today: {formatDate(new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Middle: Shift Status */}
            <div className="flex items-center gap-6 bg-slate-50 px-5 py-3 rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Today's In</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {checkInTime || '—'}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Today's Out</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {checkOutTime || '—'}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                <span className="font-semibold text-emerald-700 text-xs mt-0.5 block">
                  {isCheckedIn ? 'Checked In' : 'Checked Out'}
                </span>
              </div>
            </div>

            {/* Right: Big Punch Action */}
            <div className="shrink-0">
              <Button
                variant={isCheckedIn ? 'danger' : 'primary'}
                size="md"
                className="px-6 py-2.5 text-sm shadow-xs"
                icon={isCheckedIn ? LogOut : LogIn}
                onClick={handlePunch}
              >
                {isCheckedIn ? 'Punch Out' : 'Punch In'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search employee attendance..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PRESENT', label: 'Present' },
                { value: 'LATE', label: 'Late' },
                { value: 'ABSENT', label: 'Absent' },
                { value: 'OVERTIME', label: 'Overtime' },
                { value: 'MISSING_CHECKOUT', label: 'Missing Out' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredLogs.length} records for Today
        </div>
      </div>

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        emptyTitle="No attendance records"
        emptyDescription="No attendance entries match your current search or status filter."
      />
    </PageContainer>
  );
}
