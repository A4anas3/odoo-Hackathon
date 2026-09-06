package com.odoo.hr.dashboard.service;

import com.odoo.hr.attendance.dto.AttendanceSummaryResponse;
import com.odoo.hr.attendance.service.AttendanceService;
import com.odoo.hr.contract.repository.ContractRepository;
import com.odoo.hr.dashboard.dto.*;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.payroll.model.Payrun;
import com.odoo.hr.payroll.model.Payslip;
import com.odoo.hr.payroll.repository.PayrunRepository;
import com.odoo.hr.payroll.repository.PayslipRepository;
import com.odoo.hr.timeoff.model.TimeOffRequest;
import com.odoo.hr.timeoff.repository.TimeOffRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;
    private final PayrunRepository payrunRepository;
    private final PayslipRepository payslipRepository;
    private final TimeOffRequestRepository timeOffRequestRepository;
    private final AttendanceService attendanceService;

    @Transactional(readOnly = true)
    @Cacheable(value = "dashboard", key = "'summary'")
    public DashboardSummaryResponse getDashboardSummary() {
        log.info("Computing Dashboard Summary from Database...");

        // 1. Staff counts directly from DB
        long totalEmployees = employeeRepository.count();
        long activeEmployees = employeeRepository.countByStatus("ACTIVE");

        // 2. Department Salary Distribution calculated strictly from PAID payslips
        List<Object[]> rawDeptSalaries = payslipRepository.getPaidSalaryDistributionByDepartment();
        BigDecimal totalDisbursement = BigDecimal.ZERO;

        List<DepartmentSalaryDto> salaryByDepartment = new ArrayList<>();
        for (Object[] row : rawDeptSalaries) {
            String label = row[0] != null ? row[0].toString() : "General";
            BigDecimal val = row[1] != null ? new BigDecimal(row[1].toString()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            Long count = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            totalDisbursement = totalDisbursement.add(val);

            salaryByDepartment.add(DepartmentSalaryDto.builder()
                    .label(label)
                    .value(val)
                    .count(count)
                    .percentage(0.0)
                    .build());
        }

        // Calculate real percentage for each department
        for (DepartmentSalaryDto dto : salaryByDepartment) {
            if (totalDisbursement.compareTo(BigDecimal.ZERO) > 0) {
                double pct = dto.getValue().multiply(BigDecimal.valueOf(100))
                        .divide(totalDisbursement, 1, RoundingMode.HALF_UP).doubleValue();
                dto.setPercentage(pct);
            }
        }

        // 3. Attendance Metrics calculated at DB level
        double attendanceHealth = 0.0;
        long presentAttendanceCount = 0;
        try {
            AttendanceSummaryResponse attSummary = attendanceService.getAttendanceSummary();
            if (attSummary != null) {
                attendanceHealth = attSummary.getAttendanceRate();
                presentAttendanceCount = attSummary.getPresentToday();
            }
        } catch (Exception e) {
            log.warn("Could not retrieve attendance summary: {}", e.getMessage());
        }

        // 4. Payroll Metrics directly from DB
        List<Payrun> allPayruns = payrunRepository.findAllByOrderByPeriodStartDesc();
        long payslipsIssued = payslipRepository.count();

        BigDecimal netSalaryPaid = BigDecimal.ZERO;
        for (Payrun p : allPayruns) {
            if ("PAID".equalsIgnoreCase(p.getStatus())) {
                if (p.getPayslips() != null) {
                    for (Payslip s : p.getPayslips()) {
                        if (s.getNetSalary() != null) {
                            netSalaryPaid = netSalaryPaid.add(s.getNetSalary());
                        }
                    }
                }
            }
        }

        // 5. Monthly Payroll Trend
        Map<String, PayrollTrendDto> trendMap = new TreeMap<>();
        DateTimeFormatter sortFmt = DateTimeFormatter.ofPattern("yyyy-MM");
        DateTimeFormatter labelFmt = DateTimeFormatter.ofPattern("MMM yy");
        DateTimeFormatter fullFmt = DateTimeFormatter.ofPattern("MMMM yyyy");

        for (Payrun p : allPayruns) {
            if (p.getPeriodStart() == null) continue;
            String sortKey = p.getPeriodStart().format(sortFmt);
            String shortLabel = p.getPeriodStart().format(labelFmt);
            String fullLabel = p.getPeriodStart().format(fullFmt);

            PayrollTrendDto trend = trendMap.computeIfAbsent(sortKey, k -> PayrollTrendDto.builder()
                    .sortKey(sortKey)
                    .label(shortLabel)
                    .fullLabel(fullLabel)
                    .value(BigDecimal.ZERO)
                    .gross(BigDecimal.ZERO)
                    .net(BigDecimal.ZERO)
                    .payslipsCount(0)
                    .payrunsCount(0)
                    .build());

            BigDecimal runGross = BigDecimal.ZERO;
            BigDecimal runNet = BigDecimal.ZERO;
            int slipCount = p.getPayslips() != null ? p.getPayslips().size() : 0;

            if (p.getPayslips() != null) {
                for (Payslip s : p.getPayslips()) {
                    if (s.getGrossSalary() != null) runGross = runGross.add(s.getGrossSalary());
                    if (s.getNetSalary() != null) runNet = runNet.add(s.getNetSalary());
                }
            }

            trend.setValue(trend.getValue().add(runGross));
            trend.setGross(trend.getGross().add(runGross));
            trend.setNet(trend.getNet().add(runNet));
            trend.setPayslipsCount(trend.getPayslipsCount() + slipCount);
            trend.setPayrunsCount(trend.getPayrunsCount() + 1);
        }

        List<PayrollTrendDto> payrollTrend = new ArrayList<>(trendMap.values());

        // 6. Recent Payruns (top 5)
        List<RecentPayrunDto> recentPayruns = allPayruns.stream().limit(5).map(p -> {
            int count = p.getPayslips() != null ? p.getPayslips().size() : 0;
            BigDecimal netAmt = BigDecimal.ZERO;
            if (p.getPayslips() != null) {
                for (Payslip s : p.getPayslips()) {
                    if (s.getNetSalary() != null) netAmt = netAmt.add(s.getNetSalary());
                }
            }
            return RecentPayrunDto.builder()
                    .id(p.getId())
                    .name("Payrun " + p.getPeriodStart() + " – " + p.getPeriodEnd())
                    .period(p.getPeriodStart() + " – " + p.getPeriodEnd())
                    .employeesCount(count)
                    .netAmount(netAmt)
                    .status(p.getStatus())
                    .build();
        }).toList();

        // 7. Pending Approvals (top 5)
        List<TimeOffRequest> pendingLeavesList = timeOffRequestRepository.findByStatus("PENDING");
        long pendingLeavesCount = pendingLeavesList.size();

        List<PendingApprovalDto> pendingApprovals = pendingLeavesList.stream().limit(5).map(l -> {
            String empName = l.getEmployee() != null ? l.getEmployee().getFullName() : "Employee";
            String deptName = (l.getEmployee() != null && l.getEmployee().getDepartment() != null)
                    ? l.getEmployee().getDepartment().getName() : "General";
            String typeName = l.getTimeOffType() != null ? l.getTimeOffType().getName() : "Leave";
            String dates = l.getStartDate() + " – " + l.getEndDate() + " (" + (l.getDuration() != null ? l.getDuration() : 1) + "d)";
            String submitted = l.getCreatedAt() != null ? l.getCreatedAt().toLocalDate().toString() : "Pending review";

            return PendingApprovalDto.builder()
                    .id(l.getId())
                    .employee(empName)
                    .department(deptName)
                    .type(typeName)
                    .dates(dates)
                    .submittedAt(submitted)
                    .build();
        }).toList();

        return DashboardSummaryResponse.builder()
                .totalEmployees(totalEmployees)
                .activeEmployees(activeEmployees)
                .netSalaryPaid(netSalaryPaid)
                .payslipsIssued(payslipsIssued)
                .pendingLeaves(pendingLeavesCount)
                .attendanceHealth(attendanceHealth)
                .presentAttendanceCount(presentAttendanceCount)
                .payrollTrend(payrollTrend)
                .salaryByDepartment(salaryByDepartment)
                .recentPayruns(recentPayruns)
                .pendingApprovals(pendingApprovals)
                .build();
    }

    @CacheEvict(value = "dashboard", allEntries = true)
    public void revokeDashboardCache() {
        log.info("Revoking dashboard Redis cache...");
    }
}
