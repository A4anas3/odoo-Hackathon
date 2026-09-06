import React, { useState, useMemo } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Select } from '@/components/form/Select';
import { useQuery } from '@tanstack/react-query';
import { payrunApi } from '@/features/payroll/payruns/api/payrunApi';
import { payslipApi } from '@/features/payroll/payslips/api/payslipApi';
import { attendanceApi } from '@/features/attendance/api/attendanceApi';
import { timeoffApi } from '@/features/timeoff/api/timeoffApi';
import { departmentApi } from '@/features/departments/api/departmentApi';
import { employeeApi } from '@/features/employees/api/employeeApi';
import { contractApi } from '@/features/contracts/api/contractApi';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Spinner } from '@/components/loading/Spinner';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';

export function PayrollDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedContractStatus, setSelectedContractStatus] = useState('ALL');
  const companyName = 'OXP Pvt Ltd';

  // 1. Fetch live data across all integrated models (strictly real backend APIs)
  const { data: payruns = [], isLoading: isPayrunsLoading } = useQuery({
    queryKey: ['payroll', 'payruns'],
    queryFn: () => payrunApi.getAllPayruns(),
  });

  // Payslips: re-fetched from backend whenever period (month) or department filter changes
  const { data: payslips = [], isLoading: isPayslipsLoading } = useQuery({
    queryKey: ['payroll', 'payslips', selectedPeriod, selectedDept],
    queryFn: () => {
      const params = {};
      if (selectedDept && selectedDept !== 'ALL') {
        params.department = selectedDept;
      }
      if (selectedPeriod && selectedPeriod !== 'ALL') {
        if (selectedPeriod.includes('-') && selectedPeriod.length === 7) {
          params.month = selectedPeriod;
        } else {
          params.payrunId = selectedPeriod;
        }
      }
      return payslipApi.getAllPayslips(params);
    },
  });

  // Unfiltered payslips for building department options (no re-fetch on filter change)
  const { data: allPayslips = [] } = useQuery({
    queryKey: ['payroll', 'payslips', 'ALL', 'ALL'],
    queryFn: () => payslipApi.getAllPayslips({}),
    staleTime: 5 * 60 * 1000, // 5 min cache — options don't need to refresh on every filter
  });

  const { data: employees = [], isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.getEmployees(),
  });

  // Contracts: re-fetched from backend whenever contract status filter changes
  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ['contracts', selectedContractStatus],
    queryFn: () => contractApi.getContracts({ status: selectedContractStatus }),
  });

  const { data: attendanceData = [], isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => attendanceApi.getAllAttendance(),
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ['attendance', 'summary'],
    queryFn: () => attendanceApi.getAttendanceSummary(),
  });

  const { data: leaveRequests = [], isLoading: isLeaveRequestsLoading } = useQuery({
    queryKey: ['timeoff', 'requests'],
    queryFn: () => timeoffApi.getAllRequests(),
  });

  const { data: leaveTypes = [], isLoading: isLeaveTypesLoading } = useQuery({
    queryKey: ['timeoff', 'types'],
    queryFn: () => timeoffApi.getTypes(),
  });

  const { data: leaveAllocations = [], isLoading: isAllocationsLoading } = useQuery({
    queryKey: ['timeoff', 'allocations'],
    queryFn: () => timeoffApi.getAllocations(),
  });

  const { data: departments = [], isLoading: isDeptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAllDepartments(),
  });

  // Extract period options dynamically from payruns and all payslips as unique calendar months
  const periodOptions = useMemo(() => {
    const opts = [{ value: 'ALL', label: 'All Periods' }];
    const monthMap = new Map();

    allPayslips.forEach((s) => {
      const dateStr = s.periodStart || s.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthMap.set(key, { value: key, label, sortKey: key });
      }
    });

    payruns.forEach((p) => {
      const dateStr = p.periodStart || p.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) {
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthMap.set(key, { value: key, label, sortKey: key });
      }
    });

    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    return [...opts, ...sortedMonths];
  }, [allPayslips, payruns]);

  // Department options built from stable allPayslips (unfiltered) + dept master list
  const departmentOptions = useMemo(() => {
    const opts = [{ value: 'ALL', label: 'All Departments' }];
    const seen = new Set();
    departments.forEach((d) => {
      if (d.name && !seen.has(d.name)) {
        seen.add(d.name);
        opts.push({ value: d.name, label: d.name });
      }
    });
    allPayslips.forEach((s) => {
      if (s.departmentName && !seen.has(s.departmentName)) {
        seen.add(s.departmentName);
        opts.push({ value: s.departmentName, label: s.departmentName });
      }
    });
    return opts;
  }, [departments, allPayslips]);

  // payslips from backend ARE already filtered by period + department
  // contracts from backend ARE already filtered by contract status
  // These aliases make the rest of the aggregation code read naturally
  const filteredPayslips = payslips;
  const filteredContracts = contracts;


  // Aggregate Primary KPI Metrics
  const totalNetSalary = useMemo(() => {
    return filteredPayslips.reduce((acc, s) => acc + Number(s.netSalary || 0), 0);
  }, [filteredPayslips]);

  const totalNetPaid = useMemo(() => {
    return filteredPayslips
      .filter((s) => s.status === 'PAID')
      .reduce((acc, s) => acc + Number(s.netSalary || 0), 0);
  }, [filteredPayslips]);

  const totalNetPending = Math.max(0, totalNetSalary - totalNetPaid);

  const totalSlipsCount = filteredPayslips.length;
  const paidSlipsCount = filteredPayslips.filter((s) => s.status === 'PAID').length;
  const pendingSlipsCount = filteredPayslips.filter(
    (s) => s.status === 'DRAFT' || s.status === 'CONFIRMED'
  ).length;

  const avgSalaryPerEmployee = useMemo(() => {
    if (totalSlipsCount === 0) {
      if (contracts.length > 0) {
        const sum = contracts.reduce((acc, c) => acc + Number(c.salary || c.wage || 0), 0);
        return Math.round(sum / contracts.length);
      }
      return 0;
    }
    const totalAllNet = filteredPayslips.reduce((acc, s) => acc + Number(s.netSalary || 0), 0);
    return Math.round(totalAllNet / totalSlipsCount);
  }, [filteredPayslips, totalSlipsCount, contracts]);

  // Time Off Overview metrics (filtered for selected month if a specific period is selected)
  const approvedLeaves = useMemo(() => {
    return leaveRequests.filter((l) => {
      if (l.status !== 'APPROVED') return false;
      if (selectedPeriod && selectedPeriod !== 'ALL' && selectedPeriod.includes('-') && selectedPeriod.length === 7) {
        const leaveStart = (l.startDate || '').substring(0, 7);
        const leaveEnd = (l.endDate || '').substring(0, 7);
        if (leaveStart && leaveEnd) {
          return leaveStart <= selectedPeriod && leaveEnd >= selectedPeriod;
        }
        if (leaveStart) return leaveStart === selectedPeriod;
      }
      return true;
    });
  }, [leaveRequests, selectedPeriod]);

  const pendingLeaves = useMemo(() => {
    return leaveRequests.filter((l) => {
      if (l.status !== 'PENDING' && l.status !== 'TO_APPROVE') return false;
      if (selectedPeriod && selectedPeriod !== 'ALL' && selectedPeriod.includes('-') && selectedPeriod.length === 7) {
        const leaveStart = (l.startDate || '').substring(0, 7);
        const leaveEnd = (l.endDate || '').substring(0, 7);
        if (leaveStart && leaveEnd) {
          return leaveStart <= selectedPeriod && leaveEnd >= selectedPeriod;
        }
        if (leaveStart) return leaveStart === selectedPeriod;
      }
      return true;
    });
  }, [leaveRequests, selectedPeriod]);

  const approvedTimeOffDays = useMemo(() => {
    return approvedLeaves.reduce((acc, l) => acc + Number(l.duration || l.durationDays || 0), 0);
  }, [approvedLeaves]);

  // Attendance Overview metrics (factoring in the entire workforce, filtered by selected month)
  const attendanceRecords = useMemo(() => {
    const raw = Array.isArray(attendanceData?.content)
      ? attendanceData.content
      : Array.isArray(attendanceData)
      ? attendanceData
      : [];

    let periodLogs = raw;
    if (selectedPeriod && selectedPeriod !== 'ALL' && selectedPeriod.includes('-') && selectedPeriod.length === 7) {
      periodLogs = raw.filter((a) => {
        const dStr = a.attendanceDate || a.checkIn || a.date || a.createdAt;
        return dStr && String(dStr).startsWith(selectedPeriod);
      });
    }

    if (periodLogs.length === 0) return [];

    // Find the latest attendance date in this period to represent the workforce snapshot
    const dates = [...new Set(periodLogs.map((a) => a.attendanceDate || (a.checkIn ? String(a.checkIn).slice(0, 10) : '')))].filter(Boolean).sort().reverse();
    const targetDate = dates[0];

    const empMap = new Map();
    periodLogs.forEach((a) => {
      const d = a.attendanceDate || (a.checkIn ? String(a.checkIn).slice(0, 10) : '');
      if (d === targetDate && a.employeeId && !empMap.has(a.employeeId)) {
        empMap.set(a.employeeId, a);
      }
    });

    return Array.from(empMap.values());
  }, [attendanceData, selectedPeriod]);

  const totalEmployeesCount = attendanceSummary?.totalEmployees ?? (employees.length > 0 ? employees.length : 0);
  const presentAttendanceCount = attendanceSummary?.presentToday ?? attendanceRecords.filter((a) => a.status === 'PRESENT').length;
  const lateAttendanceCount = attendanceRecords.filter((a) => a.status === 'LATE').length;
  const onLeaveCount = useMemo(() => {
    const recordedAbsent = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
    return recordedAbsent > 0 ? recordedAbsent : approvedLeaves.length;
  }, [attendanceRecords, approvedLeaves]);

  // Remaining unrecorded / absent staff
  const notCheckedInCount = Math.max(
    0,
    totalEmployeesCount - presentAttendanceCount - lateAttendanceCount - onLeaveCount
  );

  const overtimeAttendanceHours = attendanceRecords.reduce(
    (acc, a) => acc + Number(a.overtimeHours || 0),
    0
  );

  // Workforce presence rate from backend summary (or calculated from present / total)
  const attendanceHealthPct = attendanceSummary?.attendanceRate != null
    ? attendanceSummary.attendanceRate
    : (totalEmployeesCount > 0 ? Math.round((presentAttendanceCount / totalEmployeesCount) * 100) : 0);

  const missingCheckoutsCount = attendanceRecords.filter((a) => a.checkIn && !a.checkOut).length;
  const manualEditsCount = attendanceRecords.filter(
    (a) => a.notes && a.notes.toLowerCase().includes('manual')
  ).length;

  // Row 2: Salary Cost by Department Bar Chart Data
  const salaryByDept = useMemo(() => {
    const map = {};
    departments.forEach((d) => {
      map[d.name] = { label: d.name, value: 0, count: 0 };
    });

    // Primary source: aggregate from filtered payslips
    filteredPayslips.forEach((s) => {
      const dept = s.departmentName || 'General';
      if (!map[dept]) map[dept] = { label: dept, value: 0, count: 0 };
      map[dept].value += Number(s.netSalary || 0);
      map[dept].count += 1;
    });

    // Fallback: use contracts when zero payslips exist in filtered selection
    const hasAnyPayslips = filteredPayslips.length > 0;
    if (!hasAnyPayslips && filteredContracts.length > 0) {
      const empDeptMap = {};
      employees.forEach((e) => {
        if (e.id) empDeptMap[e.id] = e.departmentName || 'General';
      });
      filteredContracts.forEach((c) => {
        const st = (c.status || '').toUpperCase();
        if (st === 'RUNNING' || st === 'ACTIVE' || !st) {
          const dept = (c.employeeId && empDeptMap[c.employeeId]) || c.departmentName || 'General';
          if (!map[dept]) map[dept] = { label: dept, value: 0, count: 0 };
          map[dept].value += Number(c.salary || c.wage || 0);
          map[dept].count += 1;
        }
      });
    }

    const items = Object.values(map).filter((i) => i.value > 0);
    const total = items.reduce((sum, i) => sum + i.value, 0);

    return items
      .map((item) => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPayslips, filteredContracts, departments, employees]);

  // Row 2: Dynamic Monthly Net Salary Trend from real payruns / payslips (Strictly chronological)
  const monthlySalaryTrend = useMemo(() => {
    const map = new Map();
    const trendSource = allPayslips && allPayslips.length > 0 ? allPayslips : payslips;

    // Group real payslips by period month (key: YYYY-MM)
    trendSource.forEach((s) => {
      if (!s.periodStart) return;
      const d = new Date(s.periodStart);
      if (isNaN(d.getTime())) return;
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('default', { month: 'short', year: '2-digit' });
      const fullLabel = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });

      if (!map.has(sortKey)) {
        map.set(sortKey, {
          sortKey,
          label,
          fullLabel,
          value: 0,
          gross: 0,
          net: 0,
          unit: 'net',
          payslipsCount: 0,
        });
      }
      const entry = map.get(sortKey);
      entry.value += Number(s.netSalary || 0);
      entry.net += Number(s.netSalary || 0);
      entry.gross += Number(s.grossSalary || 0);
      entry.payslipsCount += 1;
    });

    // Fallback: group payruns if slips are empty
    if (map.size === 0) {
      payruns.forEach((p) => {
        if (!p.periodStart) return;
        const d = new Date(p.periodStart);
        if (isNaN(d.getTime())) return;
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('default', { month: 'short', year: '2-digit' });
        const fullLabel = d.toLocaleDateString('default', { month: 'long', year: 'numeric' });

        if (!map.has(sortKey)) {
          map.set(sortKey, {
            sortKey,
            label,
            fullLabel,
            value: 0,
            gross: 0,
            net: 0,
            unit: 'net',
            payslipsCount: 0,
          });
        }
        const entry = map.get(sortKey);
        entry.value += Number(p.totalNet || p.netAmount || 0);
        entry.net += Number(p.totalNet || p.netAmount || 0);
        entry.gross += Number(p.totalGross || 0);
        entry.payslipsCount += Number(p.payslipCount || 0);
      });
    }

    if (map.size === 0) {
      return [
        { label: 'Current', value: totalNetPaid, fullLabel: 'Current Period' }
      ];
    }

    // Sort strictly chronologically by sortKey (Jan 26 -> Feb 26 -> Sep 26)
    return Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [allPayslips, payslips, payruns, totalNetPaid]);

  // Row 2: Real Alerts & Status Split (No static/hardcoded numbers)
  const missingBankEmployees = useMemo(() => {
    return employees.filter((e) => !e.bankAccountNo || !e.ifscCode);
  }, [employees]);

  const duplicateSlipsWarning = useMemo(() => {
    const seen = new Set();
    let dupes = 0;
    filteredPayslips.forEach((s) => {
      const key = `${s.employeeId}_${s.periodStart}_${s.periodEnd}`;
      if (seen.has(key)) dupes++;
      else seen.add(key);
    });
    return dupes;
  }, [filteredPayslips]);

  const expiringContractsCount = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    return contracts.filter((c) => {
      if (!c.endDate) return false;
      const d = new Date(c.endDate);
      return d.getFullYear() === curYear && d.getMonth() + 1 === curMonth;
    }).length;
  }, [contracts]);

  // Row 3: Time Off by Type Table (Real leave types and real allocations)
  const timeOffOverviewRows = useMemo(() => {
    if (leaveTypes.length === 0) {
      return [];
    }

    return leaveTypes.map((t) => {
      const typeApproved = approvedLeaves
        .filter(
          (l) =>
            l.timeOffTypeId === t.id ||
            (l.timeOffTypeName &&
              l.timeOffTypeName.toLowerCase() === t.name.toLowerCase())
        )
        .reduce((sum, l) => sum + Number(l.duration || l.durationDays || 0), 0);

      const typePending = pendingLeaves.filter(
        (l) =>
          l.timeOffTypeId === t.id ||
          (l.timeOffTypeName &&
            l.timeOffTypeName.toLowerCase() === t.name.toLowerCase())
      ).length;

      const relevantAllocations = leaveAllocations.filter(
        (a) =>
          a.timeOffTypeId === t.id ||
          (a.timeOffTypeName &&
            a.timeOffTypeName.toLowerCase() === t.name.toLowerCase())
      );
      const totalRemaining = relevantAllocations.reduce(
        (sum, a) => sum + Number(a.remainingDays || 0),
        0
      );

      return {
        type: t.name,
        approvedDays: typeApproved,
        pending: typePending,
        remaining: t.requiresAllocation ? `${totalRemaining} Days` : 'N/A',
      };
    });
  }, [leaveTypes, approvedLeaves, pendingLeaves, leaveAllocations]);

  // Row 3: Department Overview Table — payslip-first salary, contract fallback only when no payslips
  const departmentOverviewRows = useMemo(() => {
    const map = {};
    const deptIdToName = new Map();
    departments.forEach((d) => {
      if (d.id && d.name) deptIdToName.set(d.id, d.name);
      map[d.name] = { department: d.name, headcount: 0, monthlySalary: 0 };
    });

    // Build headcount from employees (unfiltered — headcount doesn't change with period)
    const empDeptMap = {};
    employees.forEach((e) => {
      const d = e.departmentName || (e.departmentId ? deptIdToName.get(e.departmentId) : null) || 'General';
      if (!map[d]) map[d] = { department: d, headcount: 0, monthlySalary: 0 };
      map[d].headcount += 1;
      if (e.id) empDeptMap[e.id] = d;
    });

    // Primary: sum net salary from filtered payslips
    const hasPayslips = filteredPayslips.length > 0;
    if (hasPayslips) {
      filteredPayslips.forEach((s) => {
        const d = s.departmentName || empDeptMap[s.employeeId] || 'General';
        if (!map[d]) map[d] = { department: d, headcount: 0, monthlySalary: 0 };
        map[d].monthlySalary += Number(s.netSalary || 0);
      });
    } else {
      // Fallback: use filtered contracts mapped through employee→dept
      filteredContracts.forEach((c) => {
        const st = (c.status || '').toUpperCase();
        if (st === 'RUNNING' || st === 'ACTIVE' || !st) {
          const d = (c.employeeId && empDeptMap[c.employeeId]) || c.departmentName || 'General';
          if (!map[d]) map[d] = { department: d, headcount: 0, monthlySalary: 0 };
          map[d].monthlySalary += Number(c.salary || c.wage || 0);
        }
      });
    }

    return Object.values(map)
      .filter((d) => d.headcount > 0 || d.monthlySalary > 0)
      .sort((a, b) => b.monthlySalary - a.monthlySalary);
  }, [departments, employees, filteredPayslips, filteredContracts]);

  const isLoading =
    isPayrunsLoading ||
    isPayslipsLoading ||
    isEmployeesLoading ||
    isContractsLoading ||
    isAttendanceLoading ||
    isLeaveRequestsLoading ||
    isLeaveTypesLoading ||
    isDeptsLoading;

  if (isLoading) {
    return (
      <PageContainer title="Payroll Dashboard">
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Aggregating Payroll, HR, Attendance & Contracts data...
          </p>
        </div>
      </PageContainer>
    );
  }

  // Format big currency display
  const formatLakhs = (val) => {
    if (!val || val === 0) return '₹0.00';
    return formatCurrency(val, 'INR');
  };

  return (
    <PageContainer>
      {/* Top Banner / Wireframe Title */}
      <div className="space-y-1 mb-5">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
          Payroll Dashboard
        </h1>
        <p className="text-xs text-slate-500 font-normal">
          Dashboard should help payroll/HR users understand payments, staffing impact, leave patterns, and attendance quality for the selected period.
        </p>
      </div>

      {/* Top Filter Bar (Period, Department, Contract Status, Company) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs mb-5">
        <div>
          <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Period</label>
          <Select
            options={periodOptions}
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Department</label>
          <Select
            options={departmentOptions}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Contract Status</label>
          <Select
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'EXPIRED', label: 'Expired' },
              { value: 'DRAFT', label: 'Draft' },
            ]}
            value={selectedContractStatus}
            onChange={(e) => setSelectedContractStatus(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Company</label>
          <div className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center text-xs font-semibold text-slate-700">
            {companyName}
          </div>
        </div>
      </div>

      {/* ROW 1: 5 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
        {/* Card 1: Total Net Salary */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-medium text-slate-600 block">Total Net Salary</span>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {formatLakhs(totalNetSalary)}
          </div>
          {pendingSlipsCount > 0 ? (
            <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5 truncate">
              <span className="text-emerald-600 font-semibold">{formatLakhs(totalNetPaid)} paid</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-medium">{formatLakhs(totalNetPending)} pending</span>
            </div>
          ) : (
            <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <span>100% Disbursed across period</span>
            </div>
          )}
        </div>

        {/* Card 2: Payslips Generated */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-medium text-slate-600 block">Payslips Generated</span>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {totalSlipsCount}
          </div>
          <div className="text-[10px] font-medium text-slate-500">
            {paidSlipsCount} paid, {pendingSlipsCount} pending
          </div>
        </div>

        {/* Card 3: Avg Salary / Employee */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-medium text-slate-600 block">Avg Salary / Employee</span>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(avgSalaryPerEmployee, 'INR')}
          </div>
          <div className="text-[10px] font-medium text-slate-500">
            Based on current payrun
          </div>
        </div>

        {/* Card 4: Approved Time Off Days */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-medium text-slate-600 block">Approved Time Off Days</span>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {approvedTimeOffDays} Days
          </div>
          <div className="text-[10px] font-medium text-slate-500">
            Across selected period
          </div>
        </div>

        {/* Card 5: Attendance Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5 hover:border-slate-300 transition-colors">
          <span className="text-[11px] font-medium text-slate-600 block">Attendance Rate</span>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {attendanceHealthPct}%
          </div>
          <div className="text-[10px] font-medium text-slate-500">
            {presentAttendanceCount} of {totalEmployeesCount} present today
          </div>
        </div>
      </div>

      {/* ROW 2: 3 Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Salary Cost by Department */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                Salary Cost by Department
              </h3>
              <span className="text-[10px] text-slate-400 block">
                Source: Payslips + Employee Department
              </span>
            </div>
            {salaryByDept.length > 0 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                {salaryByDept.length} Depts
              </span>
            )}
          </div>

          {/* Department Bar Chart */}
          <div className="pt-2">
            {salaryByDept.length > 0 ? (
              <BarChart data={salaryByDept} height={180} />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">
                No department salary data available
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Monthly Net Salary Trend */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                Monthly Net Salary Trend
              </h3>
              <span className="text-[10px] text-slate-400 block">
                Source: Historical Payslips / Payruns
              </span>
            </div>
            {monthlySalaryTrend.length > 0 && (
              <span className="text-[10px] font-semibold text-[#714B67] bg-[#714B67]/10 px-2 py-0.5 rounded-full">
                {monthlySalaryTrend.length} {monthlySalaryTrend.length === 1 ? 'Month' : 'Months'}
              </span>
            )}
          </div>

          {/* Dynamic Trend Visualization */}
          <div className="pt-2">
            {monthlySalaryTrend.length > 0 ? (
              <LineChart data={monthlySalaryTrend} height={180} />
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-slate-400">
                No salary trend data available
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Payslip Status & Payroll Alerts */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Payslip Status & Payroll Alerts
            </h3>
            <span className="text-[10px] text-slate-400 block mb-2">
              Source: Payrun + Payslip validation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Left: Status Split */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-slate-700 block">Status split</span>

              {/* Segmented Stacked Progress Bar */}
              <div className="w-full h-6 rounded-md overflow-hidden flex border border-slate-200 bg-slate-100">
                <div
                  style={{
                    width: `${totalSlipsCount > 0 ? (paidSlipsCount / totalSlipsCount) * 100 : 0}%`,
                  }}
                  className="bg-[#bbf7d0] transition-all"
                  title={`Paid: ${paidSlipsCount}`}
                />
                <div
                  style={{
                    width: `${totalSlipsCount > 0 ? (pendingSlipsCount / totalSlipsCount) * 100 : 0}%`,
                  }}
                  className="bg-[#fef08a] transition-all"
                  title={`Pending: ${pendingSlipsCount}`}
                />
              </div>

              {/* Status Legend */}
              <div className="space-y-1.5 text-[10px] font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#bbf7d0] border border-emerald-300 inline-block" />
                  <span>Paid ({paidSlipsCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#fef08a] border border-yellow-300 inline-block" />
                  <span>Pending / Draft ({pendingSlipsCount})</span>
                </div>
              </div>
            </div>

            {/* Right: Current Alerts */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 block">Current alerts</span>
              <ul className="space-y-2 text-[10px] text-slate-600 font-medium">
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <span className="text-rose-700">
                    {missingBankEmployees.length} employees missing bank account
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <span className="text-rose-700">
                    {duplicateSlipsWarning} duplicate payslip warning
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span className="text-amber-800">
                    {pendingSlipsCount} drafts still not validated
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                  <span className="text-slate-700">
                    {expiringContractsCount} contracts expiring this month
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Attendance Overview */}
        {/* Card 1: Attendance Overview */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">Attendance Overview</h3>
              <span className="text-[10px] text-slate-400 block">
                Total Workforce: {totalEmployeesCount} Staff
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              {attendanceHealthPct}% Present
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {/* 4 Vertical Headcount Bars across the 263 workforce */}
            <div className="flex items-end justify-between gap-2 h-24 pb-1 pt-2">
              {/* Present */}
              <div className="flex flex-col items-center flex-1 h-full justify-end group">
                <span className="text-[9px] font-bold text-emerald-700 mb-0.5">
                  {presentAttendanceCount}
                </span>
                <div
                  style={{
                    height: `${Math.max(14, Math.round((presentAttendanceCount / totalEmployeesCount) * 100))}%`,
                  }}
                  className="w-full bg-emerald-400 hover:bg-emerald-500 rounded-t transition-all border-t border-x border-emerald-500/40"
                  title={`Present: ${presentAttendanceCount} of ${totalEmployeesCount} (${((presentAttendanceCount / totalEmployeesCount) * 100).toFixed(1)}%)`}
                />
                <span className="text-[9px] font-semibold text-slate-600 mt-1">Present</span>
              </div>

              {/* Late */}
              <div className="flex flex-col items-center flex-1 h-full justify-end group">
                <span className="text-[9px] font-bold text-amber-700 mb-0.5">
                  {lateAttendanceCount}
                </span>
                <div
                  style={{
                    height: `${lateAttendanceCount > 0 ? Math.max(14, Math.round((lateAttendanceCount / totalEmployeesCount) * 100)) : 6}%`,
                  }}
                  className="w-full bg-amber-300 hover:bg-amber-400 rounded-t transition-all border-t border-x border-amber-400/40"
                  title={`Late: ${lateAttendanceCount}`}
                />
                <span className="text-[9px] font-semibold text-slate-600 mt-1">Late</span>
              </div>

              {/* On Leave */}
              <div className="flex flex-col items-center flex-1 h-full justify-end group">
                <span className="text-[9px] font-bold text-sky-700 mb-0.5">
                  {onLeaveCount}
                </span>
                <div
                  style={{
                    height: `${Math.max(14, Math.round((onLeaveCount / totalEmployeesCount) * 100))}%`,
                  }}
                  className="w-full bg-sky-300 hover:bg-sky-400 rounded-t transition-all border-t border-x border-sky-400/40"
                  title={`On Leave: ${onLeaveCount} of ${totalEmployeesCount}`}
                />
                <span className="text-[9px] font-semibold text-slate-600 mt-1">On Leave</span>
              </div>

              {/* Not Checked In / Absent */}
              <div className="flex flex-col items-center flex-1 h-full justify-end group">
                <span className="text-[9px] font-bold text-slate-600 mb-0.5">
                  {notCheckedInCount}
                </span>
                <div
                  style={{
                    height: `${Math.max(20, Math.round((notCheckedInCount / totalEmployeesCount) * 100))}%`,
                  }}
                  className="w-full bg-slate-300 hover:bg-slate-400 rounded-t transition-all border-t border-x border-slate-400/40"
                  title={`Not In / Absent: ${notCheckedInCount} of ${totalEmployeesCount} (${((notCheckedInCount / totalEmployeesCount) * 100).toFixed(1)}%)`}
                />
                <span className="text-[9px] font-semibold text-slate-600 mt-1">Not In</span>
              </div>
            </div>

            {/* Statistics */}
            <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Total Registered Staff:</span>
                <span className="font-bold text-slate-800">{totalEmployeesCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Present Today:</span>
                <span className="font-bold text-emerald-700">{presentAttendanceCount} ({attendanceHealthPct}%)</span>
              </div>
              <div className="flex justify-between">
                <span>Missing Check-outs:</span>
                <span className="font-bold text-slate-800">{missingCheckoutsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Logged:</span>
                <span className="font-bold text-slate-800">{Number(overtimeAttendanceHours).toFixed(1)} hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Time Off Overview */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Time Off Overview</h3>
            <span className="text-[10px] text-slate-400 block mb-2">
              Source: Time Off Requests + Allocations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="pb-1.5 font-semibold">Type</th>
                  <th className="pb-1.5 font-semibold text-center">Approved</th>
                  <th className="pb-1.5 font-semibold text-center">Pending</th>
                  <th className="pb-1.5 font-semibold text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {timeOffOverviewRows.length > 0 ? (
                  timeOffOverviewRows.map((row) => (
                    <tr key={row.type}>
                      <td className="py-1.5 font-medium">{row.type}</td>
                      <td className="py-1.5 text-center font-bold text-slate-900">{row.approvedDays}</td>
                      <td className="py-1.5 text-center">{row.pending}</td>
                      <td className="py-1.5 text-right font-medium text-slate-600">{row.remaining}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No leave types recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Department Overview */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">Department Overview</h3>
            <span className="text-[10px] text-slate-400 block mb-2">
              Source: Employee + Contract + Payslip totals
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="pb-1.5 font-semibold">Department</th>
                  <th className="pb-1.5 font-semibold text-center">Headcount</th>
                  <th className="pb-1.5 font-semibold text-right">Monthly Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departmentOverviewRows.slice(0, 5).map((d) => (
                  <tr key={d.department}>
                    <td className="py-1.5 font-medium">{d.department}</td>
                    <td className="py-1.5 text-center font-bold text-slate-900">{d.headcount}</td>
                    <td className="py-1.5 text-right font-bold text-slate-900">
                      {formatCurrency(d.monthlySalary, 'INR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
