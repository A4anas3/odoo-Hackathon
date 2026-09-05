import { apiClient } from '../../../lib/api/client';

export const dashboardApi = {
  async getDashboardSummary() {
    return {
      totalEmployees: 248,
      activeEmployees: 236,
      netSalaryPaid: 1582400,
      payslipsIssued: 236,
      pendingLeaves: 7,
      attendanceHealth: 96.4,
      payrollTrend: [
        { label: 'Apr', value: 1420000 },
        { label: 'May', value: 1480000 },
        { label: 'Jun', value: 1510000 },
        { label: 'Jul', value: 1540000 },
        { label: 'Aug', value: 1560000 },
        { label: 'Sep', value: 1582400 },
      ],
      salaryByDepartment: [
        { label: 'Engineering', value: 680000 },
        { label: 'Sales', value: 340000 },
        { label: 'Management', value: 240000 },
        { label: 'HR', value: 160000 },
        { label: 'Finance', value: 162400 },
      ],
      recentPayruns: [
        {
          id: 'pr-09-2026',
          name: 'September 2026 Regular Payrun',
          period: '01 Sep – 30 Sep 2026',
          employeesCount: 236,
          netAmount: 1582400,
          status: 'PAID',
        },
        {
          id: 'pr-08-2026',
          name: 'August 2026 Regular Payrun',
          period: '01 Aug – 31 Aug 2026',
          employeesCount: 234,
          netAmount: 1560000,
          status: 'PAID',
        },
        {
          id: 'pr-10-2026',
          name: 'October 2026 Draft Payrun',
          period: '01 Oct – 31 Oct 2026',
          employeesCount: 240,
          netAmount: 1605000,
          status: 'DRAFT',
        },
      ],
      pendingApprovals: [
        {
          id: 'leave-app-01',
          employee: 'Sarah Connor',
          department: 'Engineering',
          type: 'Annual Leave',
          dates: '12 Sep – 16 Sep (5 days)',
          submittedAt: '2 hours ago',
        },
        {
          id: 'leave-app-02',
          employee: 'Pam Beesly',
          department: 'Human Resources',
          type: 'Maternity Leave',
          dates: '01 Oct – 31 Dec (90 days)',
          submittedAt: 'Yesterday',
        },
        {
          id: 'leave-app-03',
          employee: 'Alex Vance',
          department: 'Engineering',
          type: 'Sick Leave',
          dates: '08 Sep – 09 Sep (2 days)',
          submittedAt: '3 hours ago',
        },
      ],
      warnings: [
        {
          id: 'w-1',
          title: '3 Employees Missing Bank Details',
          desc: 'Employees on draft payrun October 2026 do not have validated routing codes.',
          type: 'error',
        },
        {
          id: 'w-2',
          title: 'Unusual Overtime Spike (+18%)',
          desc: 'Engineering reported 142 hours of combined overtime during release cycle.',
          type: 'warning',
        },
      ],
    };
  },
};
