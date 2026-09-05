import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { StatCard } from './StatCard';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payslipApi } from '../../payroll/payslips/api/payslipApi';
import { timeoffApi } from '../../timeoff/api/timeoffApi';
import { attendanceApi } from '../../attendance/api/attendanceApi';
import { contractApi } from '../../contracts/api/contractApi';
import { formatCurrency } from '../../../lib/utils/formatters';
import { ROUTES } from '../../../config/routes';
import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { useToast } from '../../../hooks/useToast';
import { useMyProfile } from '../../employees/hooks/useEmployees';
import {
  CreditCard,
  Wallet,
  CalendarDays,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  Plus,
  Inbox,
  LogOut,
  LogIn,
  AlertTriangle,
} from 'lucide-react';

export function EmployeeDashboard({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Profile data for active status check
  const { data: profile } = useMyProfile();
  const isEmployeeInactive = profile?.status && profile.status !== 'ACTIVE';

  // 1. My Payslips
  const { data: myPayslips = [], isLoading: payslipsLoading } = useQuery({
    queryKey: ['payslips', 'my'],
    queryFn: () => payslipApi.getMyPayslips(),
  });

  // 2. My Time-off Requests & Allocations
  const { data: myLeaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['timeoff', 'my'],
    queryFn: () => timeoffApi.getMyRequests(),
  });

  const { data: myAllocations = [] } = useQuery({
    queryKey: ['timeoff', 'allocations', 'my'],
    queryFn: () => timeoffApi.getMyAllocations(),
  });

  // 3. My Attendance Today
  const { data: todayAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.getTodayAttendance(),
  });

  // 4. My Contracts
  const { data: myContracts = [] } = useQuery({
    queryKey: ['contracts', 'my'],
    queryFn: () => contractApi.getMyContracts(),
  });

  const toast = useToast();

  // Clock in/out mutations
  const clockInMutation = useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Successfully clocked in.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to clock in.');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Successfully clocked out.');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to clock out.');
    },
  });

  // Calculations for Personal Dashboard
  const latestPayslip = myPayslips.length > 0 ? myPayslips[0] : null;
  const activeContract = myContracts.find((c) => c.status === 'ACTIVE') || (myContracts.length > 0 ? myContracts[0] : null);

  const totalAllocatedDays = myAllocations.reduce((sum, a) => sum + Number(a.allocatedDays || a.numberOfDays || 0), 0);
  const approvedUsedDays = myLeaves
    .filter((l) => l.status === 'APPROVED')
    .reduce((sum, l) => sum + Number(l.duration || l.durationDays || 0), 0);
  const remainingLeaveDays = Math.max(0, totalAllocatedDays - approvedUsedDays);

  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const isCheckedOut = !!todayAttendance?.checkOut;

  const displayName = user?.email?.split('@')[0] || 'Employee';

  return (
    <PageContainer
      title={`Welcome, ${displayName}`}
      description="Your personal workspace: compensation details, payslips, leave balances, and daily attendance."
      actions={
        <div className="flex items-center gap-2">
          {isCheckedIn ? (
            <Button
              variant="secondary"
              size="sm"
              icon={LogOut}
              disabled={isEmployeeInactive || clockOutMutation.isPending}
              isLoading={clockOutMutation.isPending}
              onClick={() => clockOutMutation.mutate()}
            >
              Clock Out
            </Button>
          ) : (
            <Button
              variant={isEmployeeInactive ? 'secondary' : 'primary'}
              size="sm"
              icon={LogIn}
              disabled={isEmployeeInactive || isCheckedOut || clockInMutation.isPending}
              isLoading={clockInMutation.isPending}
              onClick={() => clockInMutation.mutate()}
            >
              {isEmployeeInactive ? `Account ${profile?.status || 'Inactive'}` : isCheckedOut ? 'Clocked Out Today' : 'Clock In Now'}
            </Button>
          )}

          {isEmployeeInactive ? (
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              disabled
              title="Time off requests are disabled for inactive accounts"
            >
              Account {profile?.status || 'Inactive'}
            </Button>
          ) : (
            <Link to={ROUTES.TIMEOFF}>
              <Button variant="secondary" size="sm" icon={Plus}>
                Request Leave
              </Button>
            </Link>
          )}
        </div>
      }
    >
      {/* Inactive Profile Banner */}
      {isEmployeeInactive && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-900 block text-sm">
              Employment Status: {profile?.status || 'INACTIVE'}
            </span>
            <p className="mt-0.5 text-rose-700 leading-relaxed">
              Your employment record is marked as <strong>{profile?.status}</strong>. Daily attendance punch-in, shift hours tracking, and time-off requests are strictly disabled on your account. Please contact your HR administrator if you believe this is in error.
            </p>
          </div>
        </div>
      )}

      {/* Top 5 Personal Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          title="My Net Take-Home"
          value={latestPayslip ? formatCurrency(latestPayslip.netSalary || latestPayslip.netAmount || 0) : '—'}
          subtitle={latestPayslip ? `Period: ${latestPayslip.periodStart || 'Latest'}` : 'No payslips issued'}
          icon={CreditCard}
        />
        <StatCard
          title="Base Wage"
          value={activeContract ? formatCurrency(activeContract.salary || activeContract.wage || 0) : (latestPayslip ? formatCurrency(latestPayslip.grossSalary || 0) : '—')}
          subtitle={activeContract ? `${activeContract.contractType || 'Monthly'} Contract` : 'Base compensation'}
          icon={Wallet}
        />
        <StatCard
          title="Leave Balance"
          value={totalAllocatedDays > 0 ? `${remainingLeaveDays} Days` : '—'}
          subtitle={`${approvedUsedDays} days taken`}
          icon={CalendarDays}
        />
        <StatCard
          title="Today's Attendance"
          value={isCheckedIn ? 'Checked In' : isCheckedOut ? 'Clocked Out' : 'Not Clocked In'}
          subtitle={todayAttendance?.checkIn ? `Since ${new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ready to work'}
          icon={Clock}
          trend={isCheckedIn ? 'Active' : undefined}
          trendPositive={true}
        />
        <StatCard
          title="Total Payslips"
          value={myPayslips.length}
          subtitle="Available in archive"
          icon={FileText}
        />
      </div>

      {/* Main Content Grid: Payslips History & Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Recent Payslips */}
        <Card>
          <CardHeader
            title="My Recent Payslips"
            subtitle="Your salary breakdown and earnings history"
            action={
              myPayslips.length > 0 && (
                <Link to={ROUTES.PAYSLIPS}>
                  <Button variant="ghost" size="xs">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              )
            }
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3.5">Period</th>
                    <th className="py-2.5 px-3.5 text-right">Gross</th>
                    <th className="py-2.5 px-3.5 text-right">Deductions</th>
                    <th className="py-2.5 px-3.5 text-right">Net Paid</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myPayslips.length > 0 ? (
                    myPayslips.slice(0, 5).map((slip) => (
                      <tr
                        key={slip.id}
                        onClick={() => navigate(ROUTES.PAYSLIP_DETAIL(slip.id))}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                          {slip.periodStart} – {slip.periodEnd}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-slate-500">
                          {formatCurrency(slip.grossSalary || 0)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-rose-600">
                          -{formatCurrency(slip.totalDeductions || 0)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-bold text-slate-900">
                          {formatCurrency(slip.netSalary || 0)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <StatusBadge status={slip.status || 'PAID'} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                        No payslips have been issued for your profile yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* My Time Off Requests */}
        <Card>
          <CardHeader
            title="My Time Off Requests"
            subtitle="Status of your annual, sick, or casual leave applications"
            action={
              !isEmployeeInactive ? (
                <Link to={ROUTES.TIMEOFF}>
                  <Button variant="ghost" size="xs">
                    Apply Leave <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              ) : null
            }
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {myLeaves.length > 0 ? (
                myLeaves.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {req.timeOffTypeName || req.type || 'Leave'}
                        </span>
                        <StatusBadge status={req.status || 'PENDING'} />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {req.startDate} – {req.endDate} ({req.duration || req.durationDays || 1} days)
                      </p>
                      {req.reason && (
                        <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
                          Reason: {req.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs">
                  <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                  No leave requests submitted yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract & Employment Snapshot Card */}
      {activeContract && (
        <Card className="border border-slate-200/90 shadow-2xs">
          <CardHeader
            title="My Employment Profile"
            subtitle="Contract and working schedule details"
          />
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div>
              <span className="text-slate-400 block mb-0.5">Salary Structure</span>
              <span className="font-semibold text-slate-800">{activeContract.salaryStructureName || 'Regular Full-Time'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Working Schedule</span>
              <span className="font-semibold text-slate-800">{activeContract.workingScheduleName || 'Standard 40h'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Contract Start</span>
              <span className="font-semibold text-slate-800">{activeContract.startDate || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Contract Status</span>
              <StatusBadge status={activeContract.status || 'ACTIVE'} />
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
