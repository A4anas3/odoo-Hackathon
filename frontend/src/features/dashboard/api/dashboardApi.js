import { apiClient } from '../../../lib/api/client';

export const dashboardApi = {
  async getDashboardSummary() {
    try {
      const [empRes, deptRes, contractRes, payrunsRes, pendingLeavesRes, attRes] = await Promise.allSettled([
        apiClient.get('/employees'),
        apiClient.get('/departments'),
        apiClient.get('/contracts'),
        apiClient.get('/payroll/payruns'),
        apiClient.get('/time-off/requests/pending'),
        apiClient.get('/attendance'),
      ]);

      const employees = empRes.status === 'fulfilled' && Array.isArray(empRes.value.data) ? empRes.value.data : [];
      const departments = deptRes.status === 'fulfilled' && Array.isArray(deptRes.value.data) ? deptRes.value.data : [];
      const contracts = contractRes.status === 'fulfilled' && Array.isArray(contractRes.value.data) ? contractRes.value.data : [];
      const payruns = payrunsRes.status === 'fulfilled' && Array.isArray(payrunsRes.value.data) ? payrunsRes.value.data : [];
      const pendingLeaves = pendingLeavesRes.status === 'fulfilled' && Array.isArray(pendingLeavesRes.value.data) ? pendingLeavesRes.value.data : [];
      const attendance = attRes.status === 'fulfilled' && Array.isArray(attRes.value.data) ? attRes.value.data : [];

      const totalEmployees = employees.length;
      const activeEmployees = employees.filter((e) => e.status === 'ACTIVE').length;

      // Real net salary paid from actual closed/paid payruns
      const paidPayruns = payruns.filter((p) => p.status === 'PAID');
      const targetPayruns = paidPayruns.length > 0 ? paidPayruns : payruns;
      const totalNetPaid = targetPayruns.reduce((sum, p) => sum + Number(p.totalNet || p.netAmount || 0), 0);

      // Real payslips count across all payruns
      const totalPayslipsIssued = payruns.reduce(
        (sum, p) => sum + Number(p.payslipCount || (Array.isArray(p.payslips) ? p.payslips.length : 0)),
        0
      );

      // Real department salary distribution from active contracts
      const empDeptMap = new Map();
      employees.forEach((e) => {
        if (e.id) {
          empDeptMap.set(e.id, e.departmentName || 'General');
        }
      });

      const deptSalaryMap = new Map();
      departments.forEach((d) => deptSalaryMap.set(d.name, 0));

      contracts.forEach((c) => {
        if (c.status === 'ACTIVE' || !c.status) {
          const deptName = empDeptMap.get(c.employeeId) || 'General';
          const current = deptSalaryMap.get(deptName) || 0;
          deptSalaryMap.set(deptName, current + Number(c.salary || c.wage || 0));
        }
      });

      const salaryByDepartment = Array.from(deptSalaryMap.entries())
        .map(([label, value]) => ({ label, value }))
        .filter((item) => item.value > 0);

      // Real payroll trend from payruns sorted by periodStart
      const sortedPayruns = [...payruns].sort((a, b) => (a.periodStart || '').localeCompare(b.periodStart || ''));
      const payrollTrend = sortedPayruns.map((p) => {
        let label = p.name || 'Period';
        if (p.periodStart) {
          const d = new Date(p.periodStart);
          if (!isNaN(d.getTime())) {
            label = d.toLocaleDateString('default', { month: 'short', year: '2-digit' });
          }
        }
        return {
          label,
          value: Number(p.totalGross || p.totalNet || 0),
        };
      });

      // Real recent payruns
      const recentPayrunsMapped = payruns.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name || `Payrun ${p.periodStart || ''} – ${p.periodEnd || ''}`,
        period: `${p.periodStart || ''} – ${p.periodEnd || ''}`,
        employeesCount: p.payslipCount || (Array.isArray(p.payslips) ? p.payslips.length : 0),
        netAmount: Number(p.totalNet || p.netAmount || 0),
        status: p.status || 'DRAFT',
      }));

      // Real pending approvals
      const pendingApprovalsMapped = pendingLeaves.slice(0, 5).map((l) => ({
        id: l.id,
        employee: l.employeeName || (l.employee ? `${l.employee.firstName || ''} ${l.employee.lastName || ''}`.trim() : 'Employee'),
        department: l.departmentName || (l.employee ? l.employee.departmentName : '') || 'General',
        type: l.timeOffTypeName || (l.timeOffType ? l.timeOffType.name : 'Leave'),
        dates: `${l.startDate || ''} – ${l.endDate || ''} (${l.duration || l.durationDays || 1}d)`,
        submittedAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Pending review',
      }));

      // Real attendance rate
      const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
      const attendanceHealth = totalEmployees > 0 && attendance.length > 0
        ? Math.min(100, Math.round((presentCount / totalEmployees) * 100))
        : 0;

      return {
        totalEmployees,
        activeEmployees,
        netSalaryPaid: totalNetPaid,
        payslipsIssued: totalPayslipsIssued,
        pendingLeaves: pendingLeaves.length,
        attendanceHealth,
        payrollTrend,
        salaryByDepartment,
        recentPayruns: recentPayrunsMapped,
        pendingApprovals: pendingApprovalsMapped,
        warnings: [],
      };
    } catch {
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        netSalaryPaid: 0,
        payslipsIssued: 0,
        pendingLeaves: 0,
        attendanceHealth: 0,
        payrollTrend: [],
        salaryByDepartment: [],
        recentPayruns: [],
        pendingApprovals: [],
        warnings: [],
      };
    }
  },
};
