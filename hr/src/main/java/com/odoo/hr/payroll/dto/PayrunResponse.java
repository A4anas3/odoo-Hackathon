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
import java.util.List;
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
            for (var slip : payrun.getPayslips()) {
                BigDecimal g = slip.getGrossSalary() != null ? slip.getGrossSalary() : BigDecimal.ZERO;
                BigDecimal d = slip.getTotalDeductions() != null ? slip.getTotalDeductions() : BigDecimal.ZERO;
                BigDecimal n = slip.getNetSalary() != null ? slip.getNetSalary() : g.subtract(d);

                gross = gross.add(g);
                deductions = deductions.add(d);
                net = net.add(n);

                if (slip.getEmployee() != null) {
                    var emp = slip.getEmployee();
                    if (emp.getBankAccountNo() == null || emp.getBankAccountNo().isBlank() ||
                        emp.getIfscCode() == null || emp.getIfscCode().isBlank()) {
                        warningsList.add(String.format("Employee %s (%s) is missing verified bank account / IFSC details.",
                                emp.getFullName(), emp.getEmployeeCode() != null ? emp.getEmployeeCode() : "EMP"));
                    }
                }
            }

            if (includeSlips) {
                slipResponses = payrun.getPayslips().stream()
                        .map(PayslipResponse::fromEntity)
                        .toList();
            }
        }

        String periodName = String.format("Payrun %s (%s - %s)",
                payrun.getSalaryStructure() != null ? payrun.getSalaryStructure().getName() : "Standard",
                payrun.getPeriodStart(), payrun.getPeriodEnd());

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
