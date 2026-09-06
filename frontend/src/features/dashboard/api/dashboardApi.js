import { apiClient } from '../../../lib/api/client';

export const dashboardApi = {
  async getDashboardSummary() {
    // 1. Fetch pre-calculated, Redis-cached summary from backend DB
    try {
      const res = await apiClient.get('/dashboard/summary');
      if (res.data && res.data.salaryByDepartment && res.data.salaryByDepartment.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('Backend /dashboard/summary not available yet, using fallback:', err.message);
    }

    // 2. Client-side fallback with unpaged employee query
    try {
      const [empRes, deptRes, contractRes, payrunsRes, pendingLeavesRes, attRes, payslipsRes, attSummaryRes] = await Promise.allSettled([
        apiClient.get('/employees', { params: { unpaged: true } }),
        apiClient.get('/departments'),
        apiClient.get('/contracts'),
        apiClient.get('/payroll/payruns'),
        apiClient.get('/time-off/requests/pending'),
        apiClient.get('/attendance'),
        apiClient.get('/payroll/payslips'),
        apiClient.get('/attendance/summary'),
      ]);

      const rawEmpData = empRes.status === 'fulfilled' ? empRes.value.data : [];
      const employees = Array.isArray(rawEmpData) ? rawEmpData : (rawEmpData?.content || []);
      const departments = deptRes.status === 'fulfilled' && Array.isArray(deptRes.value.data) ? deptRes.value.data : [];
      const contracts = contractRes.status === 'fulfilled' && Array.isArray(contractRes.value.data) ? contractRes.value.data : [];
      const payruns = payrunsRes.status === 'fulfilled' && Array.isArray(payrunsRes.value.data) ? payrunsRes.value.data : [];
      const pendingLeaves = pendingLeavesRes.status === 'fulfilled' && Array.isArray(pendingLeavesRes.value.data) ? pendingLeavesRes.value.data : [];
      const attData = attRes.status === 'fulfilled' ? attRes.value.data : [];
      const attendance = Array.isArray(attData) ? attData : (attData?.content || []);
      const attSummary = attSummaryRes.status === 'fulfilled' ? attSummaryRes.value.data : null;
      const payslips = payslipsRes.status === 'fulfilled' && Array.isArray(payslipsRes.value.data) ? payslipsRes.value.data : [];

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

      // Real department salary distribution from active/running contracts (with fallback to payslips)
      const empDeptMap = new Map();
      const deptIdToName = new Map();
      departments.forEach((d) => {
        if (d.id && d.name) deptIdToName.set(d.id, d.name);
      });

      employees.forEach((e) => {
        if (e.id) {
          const dept = e.departmentName || (e.departmentId ? deptIdToName.get(e.departmentId) : null) || 'General';
          empDeptMap.set(e.id, dept);
        }
      });

      const deptSalaryMap = new Map();
      const deptCountMap = new Map();
      departments.forEach((d) => {
        deptSalaryMap.set(d.name, 0);
        deptCountMap.set(d.name, 0);
      });

      // Real department salary distribution strictly from PAID payslips
      const paidPayrunIds = new Set(
        payruns.filter((p) => (p.status || '').toUpperCase() === 'PAID').map((p) => p.id)
      );

      const paidPayslips = payslips.filter(
        (s) => (s.status || '').toUpperCase() === 'PAID' || (s.payrunId && paidPayrunIds.has(s.payrunId))
      );

      paidPayslips.forEach((s) => {
        const deptName = s.departmentName || (s.employeeId ? empDeptMap.get(s.employeeId) : null) || 'General';
        const wage = Number(s.netSalary ?? s.grossSalary ?? 0);
        deptSalaryMap.set(deptName, (deptSalaryMap.get(deptName) || 0) + wage);
        deptCountMap.set(deptName, (deptCountMap.get(deptName) || 0) + 1);
      });

      const totalDeptDisbursement = Array.from(deptSalaryMap.values()).reduce((sum, v) => sum + v, 0);
      const salaryByDepartment = Array.from(deptSalaryMap.entries())
        .map(([label, value]) => ({
          label,
          value,
          count: deptCountMap.get(label) || 0,
          percentage: totalDeptDisbursement > 0 ? ((value / totalDeptDisbursement) * 100).toFixed(1) : 0,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value);

      // Real payroll trend grouped chronologically by month (consolidates multiple payruns per month)
      const monthMap = new Map();
      const sortedPayruns = [...payruns].sort((a, b) => (a.periodStart || '').localeCompare(b.periodStart || ''));

      sortedPayruns.forEach((p) => {
        if (!p.periodStart) return;
        const d = new Date(p.periodStart);
        if (isNaN(d.getTime())) return;

        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const shortLabel = d.toLocaleDateString('default', { month: 'short', year: '2-digit' });
        const fullLabel = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });

        const gross = Number(p.totalGross || p.totalNet || p.netAmount || 0);
        const net = Number(p.totalNet || p.netAmount || p.totalGross || 0);
        const slips = Number(p.payslipCount || (Array.isArray(p.payslips) ? p.payslips.length : 0));

        if (!monthMap.has(sortKey)) {
          monthMap.set(sortKey, {
            sortKey,
            label: shortLabel,
            fullLabel,
            value: 0,
            gross: 0,
            net: 0,
            payslipsCount: 0,
            payrunsCount: 0,
          });
        }

        const entry = monthMap.get(sortKey);
        entry.value += gross;
        entry.gross += gross;
        entry.net += net;
        entry.payslipsCount += slips;
        entry.payrunsCount += 1;
      });

      const payrollTrend = Array.from(monthMap.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

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

      // Real attendance rate directly from backend summary (or fallback calculation)
      const todayStr = new Date().toISOString().slice(0, 10);
      const dates = [...new Set(attendance.map((a) => a.attendanceDate || (a.checkIn ? String(a.checkIn).slice(0, 10) : '')))].filter(Boolean).sort().reverse();
      const targetDate = dates.includes(todayStr) ? todayStr : (dates[0] || todayStr);
      const latestDayRecords = attendance.filter((a) => {
        const d = a.attendanceDate || (a.checkIn ? String(a.checkIn).slice(0, 10) : '');
        return d === targetDate;
      });
      const presentCount = latestDayRecords.filter((a) => a.status === 'PRESENT').length;
      
      const attendanceHealth = attSummary?.attendanceRate != null
        ? attSummary.attendanceRate
        : (totalEmployees > 0 ? Math.min(100, Math.round((presentCount / totalEmployees) * 100)) : 0);

      const presentAttendanceCount = attSummary?.presentToday != null
        ? attSummary.presentToday
        : presentCount;

      return {
        totalEmployees: attSummary?.totalEmployees ?? totalEmployees,
        activeEmployees: attSummary?.activeEmployees ?? activeEmployees,
        netSalaryPaid: totalNetPaid,
        payslipsIssued: totalPayslipsIssued,
        pendingLeaves: pendingLeaves.length,
        attendanceHealth,
        presentAttendanceCount,
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
