import React from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { LineChart } from '../../../components/charts/LineChart';
import { BarChart } from '../../../components/charts/BarChart';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { timeoffApi } from '../../timeoff/api/timeoffApi';
import { formatCurrency } from '../../../lib/utils/formatters';
import { ROUTES } from '../../../config/routes';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CreditCard,
  Receipt,
  CalendarDays,
  Activity,
  Plus,
  ArrowRight,
  Inbox,
} from 'lucide-react';

import { useCurrentUser } from '../../../hooks/auth/useCurrentUser';
import { EmployeeDashboard } from '../components/EmployeeDashboard';

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();

  // Mode toggle for Admins/Managers: 'executive' | 'personal'
  const [viewMode, setViewMode] = React.useState('executive');

  // Check if current user has Admin or HR Manager permissions
  const isAdminOrManager = (user?.roles || []).some((r) => {
    const role = (r || '').replace(/^ROLE_/, '').toUpperCase();
    return ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'MANAGER'].includes(role);
  });

  const { data: summary = {}, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getDashboardSummary(),
    enabled: isAdminOrManager && viewMode === 'executive',
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }) => timeoffApi.reviewRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });

  // Regular employees ONLY see their personal earnings and workspace
  if (!isAdminOrManager || viewMode === 'personal') {
    return (
      <div className="relative">
        {isAdminOrManager && (
          <div className="bg-white border-b border-slate-200/80 px-6 py-2 flex items-center justify-end">
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setViewMode('executive')}
                className="px-3 py-1 rounded text-slate-600 hover:text-slate-900 transition"
              >
                Executive Overview
              </button>
              <button
                onClick={() => setViewMode('personal')}
                className="px-3 py-1 rounded bg-white text-[#714B67] shadow-2xs font-bold transition"
              >
                My Earnings & Self-Service
              </button>
            </div>
          </div>
        )}
        <EmployeeDashboard user={user} />
      </div>
    );
  }

  return (
    <PageContainer
      title="HR & Payroll Executive Dashboard"
      description="Real-time operational metrics, live payroll status, attendance rate, and pending approvals."
      actions={
        <div className="flex items-center gap-2">
          {isAdminOrManager && (
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold mr-2">
              <button
                onClick={() => setViewMode('executive')}
                className="px-2.5 py-1 rounded bg-white text-[#714B67] shadow-2xs font-bold transition"
              >
                Executive View
              </button>
              <button
                onClick={() => setViewMode('personal')}
                className="px-2.5 py-1 rounded text-slate-600 hover:text-slate-900 transition"
              >
                My Personal Earnings
              </button>
            </div>
          )}
          <Link to={ROUTES.PAYRUN_NEW}>
            <Button variant="primary" size="sm" icon={Plus}>
              Process Payrun
            </Button>
          </Link>
        </div>
      }
    >
      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Staff"
          value={isLoading ? '—' : summary.totalEmployees ?? 0}
          subtitle="Registered staff"
          icon={Users}
        />
        <StatCard
          title="Active Staff"
          value={isLoading ? '—' : summary.activeEmployees ?? 0}
          subtitle={`${summary.activeEmployees ?? 0} active employees`}
          icon={UserCheck}
        />
        <StatCard
          title="Net Salary Paid"
          value={isLoading ? '—' : formatCurrency(summary.netSalaryPaid || 0)}
          subtitle="Closed payruns total"
          icon={CreditCard}
        />
        <StatCard
          title="Payslips Issued"
          value={isLoading ? '—' : summary.payslipsIssued ?? 0}
          subtitle="Generated payslips"
          icon={Receipt}
        />
        <StatCard
          title="Pending Leaves"
          value={isLoading ? '—' : summary.pendingLeaves ?? 0}
          subtitle="Awaiting review"
          icon={CalendarDays}
          trend={summary.pendingLeaves > 0 ? 'Needs action' : undefined}
          trendPositive={false}
        />
        <StatCard
          title="Attendance"
          value={isLoading ? '—' : `${summary.attendanceHealth ?? 0}%`}
          subtitle={summary.presentAttendanceCount != null ? `${summary.presentAttendanceCount} present today` : 'Present today'}
          icon={Activity}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payroll Trend */}
        <Card className="shadow-2xs hover:shadow-sm transition-shadow">
          <CardHeader
            title="Monthly Payroll Trend"
            subtitle="Gross wage disbursement over fiscal payruns"
            action={
              summary.payrollTrend && summary.payrollTrend.length > 0 ? (
                <span className="text-[11px] font-semibold text-[#714B67] bg-[#714B67]/10 px-2.5 py-0.5 rounded-full">
                  {summary.payrollTrend.length} {summary.payrollTrend.length === 1 ? 'Month' : 'Months'}
                </span>
              ) : null
            }
          />
          <CardContent className="pt-2">
            {summary.payrollTrend && summary.payrollTrend.length > 0 ? (
              <LineChart data={summary.payrollTrend} height={210} />
            ) : (
              <div className="h-[210px] flex flex-col items-center justify-center text-slate-400 text-xs">
                <Inbox className="w-8 h-8 text-slate-300 mb-1 stroke-1" />
                <p>No payrun history recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Salary Distribution */}
        <Card className="shadow-2xs hover:shadow-sm transition-shadow">
          <CardHeader
            title="Salary Distribution by Department"
            subtitle="Paid salary disbursement breakdown"
            action={
              summary.salaryByDepartment && summary.salaryByDepartment.length > 0 ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                  {summary.salaryByDepartment.length} Depts Paid
                </span>
              ) : null
            }
          />
          <CardContent className="pt-2">
            {summary.salaryByDepartment && summary.salaryByDepartment.length > 0 ? (
              <BarChart data={summary.salaryByDepartment} height={210} />
            ) : (
              <div className="h-[210px] flex flex-col items-center justify-center text-slate-400 text-xs">
                <Inbox className="w-8 h-8 text-slate-300 mb-1 stroke-1" />
                <p>No paid department salary disbursements found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Section: Recent Payruns & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payruns */}
        <Card>
          <CardHeader
            title="Recent Payruns"
            subtitle="Live status of active and processed payroll runs"
            action={
              <Link to={ROUTES.PAYRUNS}>
                <Button variant="ghost" size="xs">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            }
          />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3.5">Payrun</th>
                    <th className="py-2.5 px-3.5">Period</th>
                    <th className="py-2.5 px-3.5 text-right">Net Amount</th>
                    <th className="py-2.5 px-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.recentPayruns && summary.recentPayruns.length > 0 ? (
                    summary.recentPayruns.map((payrun) => (
                      <tr
                        key={payrun.id}
                        onClick={() => navigate(ROUTES.PAYRUN_DETAIL(payrun.id))}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3.5 font-semibold text-slate-800">
                          {payrun.name}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500">{payrun.period}</td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-slate-900">
                          {formatCurrency(payrun.netAmount)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <StatusBadge status={payrun.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No payruns processed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader
            title="Pending Leave Approvals"
            subtitle="Time-off applications requiring supervisor or HR action"
            action={
              <Link to={ROUTES.TIMEOFF_REQUESTS}>
                <Button variant="ghost" size="xs">
                  All Requests <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            }
          />
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {summary.pendingApprovals && summary.pendingApprovals.length > 0 ? (
                summary.pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {approval.employee}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          {approval.department}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        <span className="font-medium text-[#714B67]">{approval.type}</span> • {approval.dates}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{approval.submittedAt}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="success"
                        size="xs"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: approval.id, status: 'APPROVED' })}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate({ id: approval.id, status: 'REJECTED' })}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No pending leave approvals.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
