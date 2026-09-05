import React, { useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Tabs } from '../../../components/ui/Tabs';
import { BarChart } from '../../../components/charts/BarChart';
import { LineChart } from '../../../components/charts/LineChart';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/form/Select';
import { formatCurrency } from '../../../lib/utils/formatters';
import { BarChart3, Clock, CalendarDays, Download, Filter } from 'lucide-react';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('payroll');
  const [department, setDepartment] = useState('ALL');

  const tabs = [
    { id: 'payroll', label: 'Payroll Expenditure', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance & Punctuality', icon: Clock },
    { id: 'leave', label: 'Leave Utilization', icon: CalendarDays },
  ];

  const payrollDeptData = [
    { label: 'Engineering', value: 680000 },
    { label: 'Sales', value: 340000 },
    { label: 'Management', value: 240000 },
    { label: 'Finance', value: 162400 },
    { label: 'HR', value: 160000 },
  ];

  const attendanceMonthlyTrend = [
    { label: 'Apr', value: 95.2 },
    { label: 'May', value: 96.0 },
    { label: 'Jun', value: 94.8 },
    { label: 'Jul', value: 95.6 },
    { label: 'Aug', value: 96.1 },
    { label: 'Sep', value: 96.4 },
  ];

  const leaveDeptData = [
    { label: 'Engineering', value: 42 },
    { label: 'Sales', value: 31 },
    { label: 'Management', value: 8 },
    { label: 'Finance', value: 14 },
    { label: 'HR', value: 11 },
  ];

  return (
    <PageContainer
      title="HR Analytics & Executive Reports"
      description="Cross-department operational reporting, salary trends, and compliance metrics."
      actions={
        <Button variant="secondary" size="sm" icon={Download}>
          Export PDF Report
        </Button>
      }
    >
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader
                title="Payroll Cost by Department"
                subtitle="Aggregated gross compensation per division"
              />
              <CardContent className="pt-2">
                <BarChart data={payrollDeptData} height={200} isCurrency={true} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Historical Monthly Spend"
                subtitle="6-month trend of net salary disbursements"
              />
              <CardContent className="pt-2">
                <LineChart
                  data={[
                    { label: 'Apr', value: 1420000 },
                    { label: 'May', value: 1480000 },
                    { label: 'Jun', value: 1510000 },
                    { label: 'Jul', value: 1540000 },
                    { label: 'Aug', value: 1560000 },
                    { label: 'Sep', value: 1582400 },
                  ]}
                  height={200}
                  isCurrency={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader
            title="Monthly Attendance & Punctuality Index (%)"
            subtitle="Percentage of shifts completed on schedule without unexcused tardiness"
          />
          <CardContent className="pt-2">
            <LineChart data={attendanceMonthlyTrend} height={220} isCurrency={false} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'leave' && (
        <Card>
          <CardHeader
            title="Leave Days Taken by Department (YTD)"
            subtitle="Total approved vacation, sick, and personal days"
          />
          <CardContent className="pt-2">
            <BarChart data={leaveDeptData} height={220} isCurrency={false} />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
