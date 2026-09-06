package com.odoo.hr.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long totalEmployees;
    private long activeEmployees;
    private BigDecimal netSalaryPaid;
    private long payslipsIssued;
    private long pendingLeaves;
    private double attendanceHealth;
    private long presentAttendanceCount;
    private List<PayrollTrendDto> payrollTrend;
    private List<DepartmentSalaryDto> salaryByDepartment;
    private List<RecentPayrunDto> recentPayruns;
    private List<PendingApprovalDto> pendingApprovals;
}
