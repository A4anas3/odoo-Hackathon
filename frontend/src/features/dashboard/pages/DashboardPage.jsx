import React from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { StatCard } from '../components/StatCard';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { LineChart } from '../../../components/charts/LineChart';
import { BarChart } from '../../../components/charts/BarChart';
import { StatusBadge } from '../../../components/badge/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
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
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: summary = {} } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getDashboardSummary(),
  });

  return (
    <PageContainer
      title="HR & Payroll Executive Dashboard"
      description="Enterprise operational metrics, payroll status, attendance health, and pending approvals."
      actions={
        <div className="flex items-center gap-2">
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
          value={summary.totalEmployees || '—'}
          subtitle="Registered staff"
          icon={Users}
          trend="+4 this mo"
        />
        <StatCard
          title="Active Staff"
          value={summary.activeEmployees || '—'}
          subtitle="95.1% active rate"
          icon={UserCheck}
        />
        <StatCard
          title="Net Salary Paid"
          value={formatCurrency(summary.netSalaryPaid || 0)}
          subtitle="Last closed payrun"
          icon={CreditCard}
        />
        <StatCard
          title="Payslips Issued"
          value={summary.payslipsIssued || '—'}
          subtitle="100% delivered"
          icon={Receipt}
        />
        <StatCard
          title="Pending Leaves"
          value={summary.pendingLeaves || '—'}
          subtitle="Awaiting review"
          icon={CalendarDays}
          trend="Needs action"
          trendPositive={false}
        />
        <StatCard
          title="Attendance"
          value={`${summary.attendanceHealth || 0}%`}
          subtitle="Punctuality index"
          icon={Activity}
          trend="+0.8%"
        />
      </div>

      {/* Warnings & Alerts Banner */}
      {summary.warnings && summary.warnings.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-amber-900">Payroll & Compliance Notice: </span>
            <span className="text-amber-800">
              {summary.warnings[0].title} — {summary.warnings[0].desc}
            </span>
          </div>
          <Link
            to={ROUTES.PAYRUNS}
            className="text-amber-900 font-semibold hover:underline shrink-0 text-xs"
          >
            Review Payruns →
          </Link>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payroll Trend */}
        <Card>
          <CardHeader
            title="Monthly Payroll Trend (6 Months)"
            subtitle="Gross wage disbursement over preceding fiscal periods"
          />
          <CardContent className="pt-2">
            <LineChart data={summary.payrollTrend || []} height={190} />
          </CardContent>
        </Card>

        {/* Department Salary Distribution */}
        <Card>
          <CardHeader
            title="Salary Distribution by Department"
            subtitle="Current allocation of personnel expenditure"
          />
          <CardContent className="pt-2">
            <BarChart data={summary.salaryByDepartment || []} height={190} />
          </CardContent>
        </Card>
      </div>

      {/* Tables Section: Recent Payruns & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payruns */}
        <Card>
          <CardHeader
            title="Recent Payruns"
            subtitle="Status of active and processed payroll runs"
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
                  {(summary.recentPayruns || []).map((payrun) => (
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
                  ))}
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
              {(summary.pendingApprovals || []).map((approval) => (
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
                    <Button variant="success" size="xs">
                      Approve
                    </Button>
                    <Button variant="ghost" size="xs">
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
