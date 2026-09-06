import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Tabs } from '../../../components/ui/Tabs';
import { BarChart } from '../../../components/charts/BarChart';
import { LineChart } from '../../../components/charts/LineChart';
import { Button } from '../../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { contractApi } from '../../contracts/api/contractApi';
import { departmentApi } from '../../departments/api/departmentApi';
import { payrunApi } from '../../payroll/payruns/api/payrunApi';
import { attendanceApi } from '../../attendance/api/attendanceApi';
import { timeoffApi } from '../../timeoff/api/timeoffApi';
import { formatCurrency } from '../../../lib/utils/formatters';
import { BarChart3, Clock, CalendarDays, Download, Inbox } from 'lucide-react';
import { Spinner } from '../../../components/loading/Spinner';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('payroll');

  const tabs = [
    { id: 'payroll', label: 'Payroll Expenditure', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance & Punctuality', icon: Clock },
    { id: 'leave', label: 'Leave Utilization', icon: CalendarDays },
  ];

  // 1. Contracts & Departments for Payroll Cost by Department
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['contracts', 'reports'],
    queryFn: () => contractApi.getContracts(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', 'reports'],
    queryFn: () => departmentApi.getAllDepartments(),
  });

  // 2. Payruns for Monthly Spend Trend
  const { data: payruns = [], isLoading: payrunsLoading } = useQuery({
    queryKey: ['payruns', 'reports'],
    queryFn: () => payrunApi.getAllPayruns(),
  });

  // 3. Attendance for punctuality / attendance health
  const { data: attendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'reports'],
    queryFn: () => attendanceApi.getAllAttendance(),
  });

  // 4. Time Off requests for leave utilization by department
  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: ['timeoff', 'reports'],
    queryFn: () => timeoffApi.getAllRequests(),
  });

  // Calculate Real Payroll by Department
  const deptCostMap = new Map();
  departments.forEach((d) => deptCostMap.set(d.name, 0));

  contracts.forEach((c) => {
    const st = (c.status || '').toUpperCase();
    if (st === 'RUNNING' || st === 'ACTIVE' || !st) {
      const dept = c.departmentName || c.employee?.departmentName || 'General';
      const wage = Number(c.salary || c.wage || 0);
      deptCostMap.set(dept, (deptCostMap.get(dept) || 0) + wage);
    }
  });

  const payrollDeptData = Array.from(deptCostMap.entries())
    .map(([label, value]) => ({ label, value }))
    .filter((item) => item.value > 0);

  // Calculate Real Monthly Spend Trend from Payruns (grouped by month)
  const monthMap = new Map();
  const sortedPayruns = [...payruns].sort((a, b) => (a.periodStart || '').localeCompare(b.periodStart || ''));
  sortedPayruns.forEach((p) => {
    if (!p.periodStart) return;
    const d = new Date(p.periodStart);
    if (isNaN(d.getTime())) return;
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('default', { month: 'short', year: '2-digit' });
    const fullLabel = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    const gross = Number(p.totalGross || p.totalNet || p.netAmount || 0);

    if (!monthMap.has(sortKey)) {
      monthMap.set(sortKey, { sortKey, label, fullLabel, value: 0 });
    }
    monthMap.get(sortKey).value += gross;
  });
  const monthlySpendTrend = Array.from(monthMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  // Calculate Real Leave Count by Department
  const leaveDeptMap = new Map();
  leaves.forEach((l) => {
    const dept = l.departmentName || l.employee?.departmentName || 'General';
    const count = Number(l.duration || l.durationDays || 1);
    leaveDeptMap.set(dept, (leaveDeptMap.get(dept) || 0) + count);
  });

  const leaveDeptData = Array.from(leaveDeptMap.entries())
    .map(([label, value]) => ({ label, value }))
    .filter((item) => item.value > 0);

  // Calculate Attendance Punctuality Trend
  const attMonthMap = new Map();
  attendance.forEach((a) => {
    const dateStr = a.attendanceDate || a.date;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const monthKey = d.toLocaleDateString('default', { month: 'short' });
        if (!attMonthMap.has(monthKey)) {
          attMonthMap.set(monthKey, { present: 0, total: 0 });
        }
        const curr = attMonthMap.get(monthKey);
        curr.total += 1;
        if (a.status === 'PRESENT' || a.status === 'OVERTIME') {
          curr.present += 1;
        }
      }
    }
  });

  const attendanceMonthlyTrend = Array.from(attMonthMap.entries()).map(([label, val]) => ({
    label,
    value: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0,
  }));

  const isLoading = contractsLoading || payrunsLoading || attendanceLoading || leavesLoading;

  return (
    <PageContainer
      title="HR Analytics & Executive Reports"
      description="Cross-department operational reporting, salary trends, and compliance metrics."
      actions={
        <Button variant="secondary" size="sm" icon={Download} onClick={() => window.print()}>
          Export Report
        </Button>
      }
    >
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {isLoading && (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader
                title="Payroll Cost by Department"
                subtitle="Aggregated active contract gross compensation per division"
              />
              <CardContent className="pt-2">
                {payrollDeptData.length > 0 ? (
                  <BarChart data={payrollDeptData} height={200} isCurrency={true} />
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                    No active contract salary data recorded for departments.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Historical Monthly Spend"
                subtitle="Trend of net salary disbursements across finalized payruns"
              />
              <CardContent className="pt-2">
                {monthlySpendTrend.length > 0 ? (
                  <LineChart data={monthlySpendTrend} height={200} isCurrency={true} />
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                    No historical payrun disbursement cycles recorded.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!isLoading && activeTab === 'attendance' && (
        <Card>
          <CardHeader
            title="Monthly Attendance & Punctuality Index (%)"
            subtitle="Percentage of shifts completed on schedule without unexcused tardiness"
          />
          <CardContent className="pt-2">
            {attendanceMonthlyTrend.length > 0 ? (
              <LineChart data={attendanceMonthlyTrend} height={240} />
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                No attendance punch logs available to calculate punctuality index.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && activeTab === 'leave' && (
        <Card>
          <CardHeader
            title="Days Taken by Department"
            subtitle="Cumulative time off days consumed by department staff"
          />
          <CardContent className="pt-2">
            {leaveDeptData.length > 0 ? (
              <BarChart data={leaveDeptData} height={240} />
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1 stroke-1" />
                No approved leave request records found.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
