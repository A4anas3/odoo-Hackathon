import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import { useToast } from '../../../hooks/useToast';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/form/Input';
import { Select } from '../../../components/form/Select';
import { FormField } from '../../../components/form/FormField';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Avatar } from '../../../components/ui/Avatar';
import { formatDate, formatTime, formatHours } from '../../../lib/utils/formatters';
import { 
  Clock, ArrowLeft, Edit3, Save, X, Info, 
  Calendar, CheckCircle, AlertCircle, ShieldAlert, Sparkles 
} from 'lucide-react';

export function AttendanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { can } = useCurrentUser();
  const isAdminOrManager = can(PERMISSIONS.CAN_MANAGE_SCHEDULES);

  const [isEditing, setIsEditing] = useState(false);

  // Fetch single attendance record from real backend API
  const { data: record, isLoading, isError, error } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () => attendanceApi.getAttendanceById(id),
    enabled: !!id,
  });

  // Edit form state
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    notes: '',
    correctionReason: '',
  });

  useEffect(() => {
    if (record) {
      setFormData({
        checkIn: record.checkIn ? new Date(record.checkIn).toISOString().slice(0, 16) : '',
        checkOut: record.checkOut ? new Date(record.checkOut).toISOString().slice(0, 16) : '',
        status: record.status || 'PRESENT',
        notes: record.notes || '',
        correctionReason: record.correctionReason || '',
      });
    }
  }, [record]);

  // Mutation to update/correct attendance
  const updateMutation = useMutation({
    mutationFn: (payload) => attendanceApi.updateAttendance(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance record successfully updated and hours recalculated.');
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to update attendance record.');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      checkIn: formData.checkIn ? new Date(formData.checkIn).toISOString() : null,
      checkOut: formData.checkOut ? new Date(formData.checkOut).toISOString() : null,
      status: formData.status,
      notes: formData.notes,
      correctionReason: formData.correctionReason || 'Manual update via Form view',
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Attendance Record" description="Loading attendance details...">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Clock className="w-8 h-8 text-[#714B67] animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading attendance record...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !record) {
    return (
      <PageContainer title="Attendance Record" description="Error loading attendance details">
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Attendance Record Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {error?.response?.data?.message || 'The requested attendance log does not exist or has been removed.'}
          </p>
          <div className="mt-6">
            <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(ROUTES.ATTENDANCE)}>
              Back to Attendance List
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const employeeName = record.employeeName || 'Employee';
  const attendanceDateFormatted = record.attendanceDate ? formatDate(record.attendanceDate) : '—';
  const headerBreadcrumb = `Attendance / ${employeeName} / ${attendanceDateFormatted}`;

  const checkInFormatted = record.checkIn
    ? `${formatDate(record.checkIn)} ${formatTime(record.checkIn)}`
    : '—';
  const checkOutFormatted = record.checkOut
    ? `${formatDate(record.checkOut)} ${formatTime(record.checkOut)}`
    : '—';

  return (
    <PageContainer
      title={headerBreadcrumb}
      description="Form view of one attendance record"
      breadcrumbs={[
        { label: 'Attendance', href: ROUTES.ATTENDANCE },
        { label: employeeName, href: record.employeeId ? `/employees/${record.employeeId}` : ROUTES.ATTENDANCE },
        { label: attendanceDateFormatted },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.ATTENDANCE)}
          >
            Back
          </Button>

          {isAdminOrManager && (
            isEditing ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={X}
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  isLoading={updateMutation.isPending}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Edit3}
                onClick={() => setIsEditing(true)}
              >
                EDIT
              </Button>
            )
          )}
        </div>
      }
    >
      {/* Main Attendance Form Card */}
      <Card className="border border-slate-200 shadow-sm max-w-5xl mx-auto">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Top Form Header Tag */}
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={employeeName} size="md" />
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {employeeName}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
                  <span>{record.employeeCode || 'EMP-REC'}</span>
                  <span>•</span>
                  <span>{attendanceDateFormatted}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <StatusBadge status={record.status || 'PRESENT'} />
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Employee Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Employee
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between">
                  <span>{employeeName}</span>
                  {record.employeeId && (
                    <Link
                      to={`/employees/${record.employeeId}`}
                      className="text-[#714B67] hover:underline font-semibold text-[11px]"
                    >
                      View Profile
                    </Link>
                  )}
                </div>
              </div>

              {/* Check In Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Check In
                </label>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800">
                    {checkInFormatted}
                  </div>
                )}
              </div>

              {/* Check Out Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Check Out
                </label>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-800">
                    {checkOutFormatted}
                  </div>
                )}
              </div>

              {/* Worked Hours Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Worked Hours
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900">
                  {record.workedHours != null && record.workedHours > 0
                    ? `${Number(record.workedHours).toFixed(2)} hrs`
                    : '0.00 hrs'}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Schedule Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Schedule
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                  {record.workingScheduleName || 'Standard 40 Hours / Week'}
                </div>
              </div>

              {/* Status Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                {isEditing ? (
                  <Select
                    options={[
                      { value: 'PRESENT', label: 'Present' },
                      { value: 'LATE', label: 'Late' },
                      { value: 'ABSENT', label: 'Absent' },
                      { value: 'OVERTIME', label: 'Overtime' },
                      { value: 'MISSING_CHECKOUT', label: 'Missing Out' },
                    ]}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  />
                ) : (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                    <StatusBadge status={record.status || 'PRESENT'} />
                  </div>
                )}
              </div>

              {/* Overtime Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Overtime
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-purple-700">
                  {record.overtimeHours != null && record.overtimeHours > 0
                    ? `+${Number(record.overtimeHours).toFixed(2)} hrs`
                    : '0.00 hrs'}
                </div>
              </div>

              {/* Scheduled Hours Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Scheduled Hours
                </label>
                <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-600">
                  {record.scheduledHours != null ? `${Number(record.scheduledHours).toFixed(2)} hrs` : '8.00 hrs'}
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Notes Field */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="System generated from check in/out or manually corrected by an authorized user."
                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67]"
              />
            ) : (
              <div className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed min-h-[50px]">
                {record.notes || 'System generated from check in/out or manually corrected by an authorized user.'}
              </div>
            )}
          </div>

          {/* Payroll Settlement Tracking */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Payroll & Settlement Tracking
            </label>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {record.isPaid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Settled & Paid
                  </span>
                ) : record.payslipId ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Linked to Payrun (Pending Payout)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Unsettled (Available for next payroll run)
                  </span>
                )}
                {record.paidAt && (
                  <span className="text-xs text-slate-500 font-mono">
                    Disbursed: {new Date(record.paidAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {record.payslipId && (
                <Link
                  to={`/payroll/payslips/${record.payslipId}`}
                  className="text-xs font-semibold text-[#714B67] hover:underline flex items-center gap-1"
                >
                  View Associated Payslip &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Edit Mode Audit Reason */}
          {isEditing && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-amber-900">
                Audit Correction Reason (Mandatory)
              </label>
              <Input
                placeholder="e.g. Corrected punch timestamp per manager approval"
                value={formData.correctionReason}
                onChange={(e) => setFormData({ ...formData, correctionReason: e.target.value })}
              />
              <p className="text-[11px] text-amber-700">
                Any modifications to punch in/out timestamps will automatically recalculate worked hours and overtime.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Useful Note Footer matching wireframe specification */}
      <div className="max-w-5xl mx-auto mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-medium leading-relaxed">
          <strong>Useful note:</strong> worked hours and overtime should be easy to read because they can later influence payroll or reporting.
        </span>
      </div>
    </PageContainer>
  );
}
