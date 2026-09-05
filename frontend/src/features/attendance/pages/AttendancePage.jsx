import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { DataTable } from '../../../components/table/DataTable';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/form/Select';
import { Input } from '../../../components/form/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { attendanceApi } from '../api/attendanceApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { useMyProfile } from '../../employees/hooks/useEmployees';
import { PERMISSIONS } from '../../../config/permissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../hooks/useToast';
import { Modal } from '../../../components/modal/Modal';
import { FormField } from '../../../components/form/FormField';
import { Clock, LogIn, LogOut, Search, AlertTriangle, Users, UserCheck, Edit3 } from 'lucide-react';
import { formatDate, formatTime, formatHours } from '../../../lib/utils/formatters';

export function AttendancePage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, can } = useCurrentUser();
  const isAdminOrManager = can(PERMISSIONS.CAN_MANAGE_SCHEDULES);
  const { data: profile } = useMyProfile();
  const isEmployeeInactive = profile?.status && profile.status !== 'ACTIVE';

  const [scope, setScope] = useState(isAdminOrManager ? 'company' : 'mine');
  const isCompanyScope = isAdminOrManager && scope === 'company';

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's attendance for current user
  const { data: todayAttendance, isLoading: isTodayLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.getTodayAttendance(),
  });

  // Attendance logs: Company-wide or personal depending on scope
  const { data: logs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ['attendance', 'history', isCompanyScope],
    queryFn: () => (isCompanyScope ? attendanceApi.getAllAttendance() : attendanceApi.getMyAttendance()),
  });

  // Punch mutations
  const checkInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Successfully clocked in.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to check in.');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Successfully clocked out.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to check out.');
    },
  });

  // Regularization / Correction state & mutation
  const [correctingLog, setCorrectingLog] = useState(null);
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [newCheckInTime, setNewCheckInTime] = useState('');
  const [newCheckOutTime, setNewCheckOutTime] = useState('');

  const correctMutation = useMutation({
    mutationFn: ({ id, data }) => attendanceApi.correctAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance record successfully corrected and recalculated.');
      setIsCorrectModalOpen(false);
      setCorrectingLog(null);
      setCorrectionReason('');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to correct attendance record.');
    },
  });

  const handleOpenCorrectModal = (log) => {
    setCorrectingLog(log);
    setCorrectionReason(log.correctionReason || '');
    setNewCheckInTime(log.checkIn ? new Date(log.checkIn).toISOString().slice(0, 16) : '');
    setNewCheckOutTime(log.checkOut ? new Date(log.checkOut).toISOString().slice(0, 16) : '');
    setIsCorrectModalOpen(true);
  };

  const handleSaveCorrection = () => {
    if (!correctionReason.trim()) {
      toast.error('Please enter an audit reason for the attendance correction.');
      return;
    }
    correctMutation.mutate({
      id: correctingLog.id,
      data: {
        reason: correctionReason.trim(),
        newCheckIn: newCheckInTime ? new Date(newCheckInTime).toISOString() : null,
        newCheckOut: newCheckOutTime ? new Date(newCheckOutTime).toISOString() : null,
      },
    });
  };

  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const isCheckedOut = !!todayAttendance?.checkOut;

  const handlePunch = () => {
    if (isCheckedIn) {
      checkOutMutation.mutate();
    } else {
      checkInMutation.mutate();
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (search) {
      const empName = (log.employeeName || log.employee?.name || log.employee?.firstName || '').toLowerCase();
      const code = (log.employeeCode || log.employee?.code || '').toLowerCase();
      if (!empName.includes(search.toLowerCase()) && !code.includes(search.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const columns = [
    ...(isCompanyScope
      ? [
          {
            header: 'Employee',
            key: 'employee',
            render: (_, row) => {
              const name = row.employeeName || row.employee?.name || (row.employee?.firstName ? `${row.employee.firstName} ${row.employee.lastName || ''}`.trim() : 'Staff');
              const code = row.employeeCode || row.employee?.code || row.employee?.employeeCode || '—';
              return (
                <div className="flex items-center gap-2.5">
                  <Avatar name={name} size="sm" />
                  <div>
                    <span className="font-semibold text-slate-800 block leading-tight">{name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{code}</span>
                  </div>
                </div>
              );
            },
          },
        ]
      : []),
    {
      header: 'Date',
      key: 'attendanceDate',
      render: (date, row) => <span className="font-medium text-slate-700">{formatDate(date || row.date)}</span>,
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
      key: 'overtimeHours',
      render: (ot, row) => {
        const val = ot || row.overtime || 0;
        return (
          <span className={val > 0 ? 'font-semibold text-purple-700' : 'text-slate-400'}>
            {val > 0 ? `+${formatHours(val)}` : '0h'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      render: (status) => <StatusBadge status={status || 'PRESENT'} />,
    },
    ...(isAdminOrManager
      ? [
          {
            header: 'Actions',
            key: 'actions',
            render: (_, row) => (
              <Button
                variant="ghost"
                size="xs"
                icon={Edit3}
                onClick={() => handleOpenCorrectModal(row)}
              >
                Correct
              </Button>
            ),
          },
        ]
      : []),
  ];

  const todayInDisplay = todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '—';
  const todayOutDisplay = todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : '—';

  return (
    <PageContainer
      title={isAdminOrManager ? 'Attendance Management' : 'My Attendance'}
      description={
        isAdminOrManager
          ? 'Monitor organization-wide punctuality and daily check-in logs.'
          : 'Record your daily work punches and view your personal attendance history.'
      }
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

            {/* Shift Status */}
            <div className="flex items-center gap-6 bg-slate-50 px-5 py-3 rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Today's In</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {todayInDisplay}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Today's Out</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {todayOutDisplay}
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                <span className={`font-semibold text-xs mt-0.5 block ${isCheckedIn ? 'text-emerald-700' : isCheckedOut ? 'text-slate-600' : 'text-amber-600'}`}>
                  {isCheckedIn ? 'Checked In' : isCheckedOut ? 'Clocked Out' : 'Not Clocked In'}
                </span>
              </div>
            </div>

            {/* Punch Action */}
            <div className="shrink-0">
              <Button
                variant={isCheckedIn ? 'danger' : isEmployeeInactive ? 'secondary' : 'primary'}
                size="md"
                className="px-6 py-2.5 text-sm shadow-xs"
                icon={isCheckedIn ? LogOut : LogIn}
                disabled={isEmployeeInactive || isCheckedOut || checkInMutation.isPending || checkOutMutation.isPending}
                isLoading={checkInMutation.isPending || checkOutMutation.isPending}
                onClick={handlePunch}
              >
                {isEmployeeInactive ? `Account ${profile?.status || 'Inactive'}` : isCheckedIn ? 'Punch Out' : isCheckedOut ? 'Completed Today' : 'Punch In'}
              </Button>
            </div>
          </div>

          {isEmployeeInactive && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Your employment profile is currently marked as <strong>{profile?.status}</strong>. Daily attendance punch in and work shifts are strictly disabled.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scope Selector Tabs for Admin / Manager */}
      {isAdminOrManager && (
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80 w-fit shadow-2xs">
          <button
            type="button"
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${
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
            className={`flex items-center gap-2 px-4 py-1.5 text-xs rounded-lg font-medium transition-all ${
              scope === 'mine'
                ? 'bg-white text-[#714B67] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setScope('mine')}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Attendance (Mine)</span>
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
          {isAdminOrManager && (
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search employee attendance..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
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
          Showing {filteredLogs.length} record{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Logs Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLogsLoading}
        emptyTitle="No attendance records"
        emptyDescription={
          isAdminOrManager
            ? 'No attendance records match your current search or status filter.'
            : 'You have not logged any attendance records yet. Use the Punch In button above to record your shift.'
        }
      />

      {/* Attendance Regularization / Correction Modal */}
      <Modal
        isOpen={isCorrectModalOpen}
        onClose={() => setIsCorrectModalOpen(false)}
        title="Correct Attendance Record"
        description={`Audit correction for ${correctingLog?.employeeName || 'staff'} on ${formatDate(correctingLog?.attendanceDate)}`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCorrectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={correctMutation.isPending}
              onClick={handleSaveCorrection}
            >
              Save Correction
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-relaxed">
            <strong>Audit Notice:</strong> Any modification to clock-in/out timestamps will automatically recalculate worked hours and overtime, and will record your manager ID as the corrector.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Adjusted Check In">
              <Input
                type="datetime-local"
                value={newCheckInTime}
                onChange={(e) => setNewCheckInTime(e.target.value)}
              />
            </FormField>

            <FormField label="Adjusted Check Out">
              <Input
                type="datetime-local"
                value={newCheckOutTime}
                onChange={(e) => setNewCheckOutTime(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Mandatory Correction Reason" required>
            <Input
              placeholder="e.g. Employee forgot to punch out due to offsite client visit"
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </PageContainer>
  );
}
