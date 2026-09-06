package com.odoo.hr.payroll.dto;

import com.odoo.hr.payroll.model.Payrun;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrunResponse {
    private UUID id;
    private String name;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private UUID salaryStructureId;
    private String salaryStructureName;
    private String status;
    private String createdBy;
    private OffsetDateTime calculatedAt;
    private OffsetDateTime validatedAt;
    private OffsetDateTime paidAt;
    private int payslipCount;
    private BigDecimal totalGross;
    private BigDecimal totalDeductions;
    private BigDecimal totalNet;
    private List<PayslipResponse> payslips;
    @Builder.Default
    private List<String> warnings = new ArrayList<>();
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static PayrunResponse fromEntity(Payrun payrun, boolean includeSlips) {
        if (payrun == null) return null;

        List<PayslipResponse> slipResponses = Collections.emptyList();
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal deductions = BigDecimal.ZERO;
        BigDecimal net = BigDecimal.ZERO;
        List<String> warningsList = new ArrayList<>();

        if (payrun.getPayslips() != null) {
            Map<UUID, Integer> empSlipCount = new HashMap<>();
            for (var s : payrun.getPayslips()) {
                if (s.getEmployee() != null && s.getEmployee().getId() != null) {
                    empSlipCount.merge(s.getEmployee().getId(), 1, Integer::sum);
                }
            }

            Set<UUID> duplicateSeen = new HashSet<>();

            for (var slip : payrun.getPayslips()) {
                BigDecimal g = slip.getGrossSalary() != null ? slip.getGrossSalary() : BigDecimal.ZERO;
                BigDecimal d = slip.getTotalDeductions() != null ? slip.getTotalDeductions() : BigDecimal.ZERO;
                BigDecimal n = slip.getNetSalary() != null ? slip.getNetSalary() : g.subtract(d);

                gross = gross.add(g);
                deductions = deductions.add(d);
                net = net.add(n);

                if (slip.getEmployee() != null) {
                    var emp = slip.getEmployee();
                    String code = emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "EMP";

                    // 1. Duplicate Payslip Check
                    if (emp.getId() != null && empSlipCount.getOrDefault(emp.getId(), 0) > 1 && duplicateSeen.add(emp.getId())) {
                        warningsList.add(String.format("[Duplicate Payslip] %s (%s): %d duplicate payslips detected in this payrun.",
                                emp.getFullName(), code, empSlipCount.get(emp.getId())));
                    }

                    // 2. Missing Banking Details Check
                    boolean missingBank = emp.getBankAccountNo() == null || emp.getBankAccountNo().isBlank();
                    boolean missingIfsc = emp.getIfscCode() == null || emp.getIfscCode().isBlank();
                    if (missingBank && missingIfsc) {
                        warningsList.add(String.format("[Missing Bank Details] %s (%s): Bank account number and IFSC code are missing.",
                                emp.getFullName(), code));
                    } else if (missingBank) {
                        warningsList.add(String.format("[Missing Bank Account] %s (%s): Bank account number is missing.",
                                emp.getFullName(), code));
                    } else if (missingIfsc) {
                        warningsList.add(String.format("[Missing IFSC] %s (%s): IFSC routing code is missing.",
                                emp.getFullName(), code));
                    }

                    // 3. Contract Issue Check
                    if (slip.getContract() == null) {
                        warningsList.add(String.format("[Missing Contract] %s (%s): No employment contract linked to payslip.",
                                emp.getFullName(), code));
                    } else if ("CANCELLED".equalsIgnoreCase(slip.getContract().getStatus()) || "TERMINATED".equalsIgnoreCase(slip.getContract().getStatus())) {
                        warningsList.add(String.format("[Contract %s] %s (%s): Linked contract is %s.",
                                slip.getContract().getStatus(), emp.getFullName(), code, slip.getContract().getStatus().toLowerCase()));
                    }

                    // 4. Zero / Negative Pay Check
                    if (n.compareTo(BigDecimal.ZERO) <= 0) {
                        warningsList.add(String.format("[Zero Net Pay] %s (%s): Net pay is ₹%s (Gross: ₹%s, Deductions: ₹%s).",
                                emp.getFullName(), code, n.toPlainString(), g.toPlainString(), d.toPlainString()));
                    }
                }
            }

            if (includeSlips) {
                slipResponses = payrun.getPayslips().stream()
                        .map(PayslipResponse::fromEntity)
                        .toList();
            }
        }

        String monthName = payrun.getPeriodStart() != null
                ? (payrun.getPeriodStart().getMonth().name().charAt(0) + payrun.getPeriodStart().getMonth().name().substring(1).toLowerCase())
                : "Payrun";
        int year = payrun.getPeriodStart() != null ? payrun.getPeriodStart().getYear() : 2026;
        String periodName = monthName + " " + year;

        return PayrunResponse.builder()
                .id(payrun.getId())
                .name(periodName)
                .periodStart(payrun.getPeriodStart())
                .periodEnd(payrun.getPeriodEnd())
                .salaryStructureId(payrun.getSalaryStructure() != null ? payrun.getSalaryStructure().getId() : null)
                .salaryStructureName(payrun.getSalaryStructure() != null ? payrun.getSalaryStructure().getName() : null)
                .status(payrun.getStatus())
                .createdBy(payrun.getCreatedBy())
                .calculatedAt(payrun.getCalculatedAt())
                .validatedAt(payrun.getValidatedAt())
                .paidAt(payrun.getPaidAt())
                .payslipCount(payrun.getPayslips() != null ? payrun.getPayslips().size() : 0)
                .totalGross(gross)
                .totalDeductions(deductions)
                .totalNet(net)
                .payslips(slipResponses)
                .warnings(warningsList)
                .createdAt(payrun.getCreatedAt())
                .updatedAt(payrun.getUpdatedAt())
                .build();
    }
}
