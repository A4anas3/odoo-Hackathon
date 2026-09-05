package com.odoo.hr.payroll.dto;

import com.odoo.hr.payroll.model.Payrun;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrunResponse {
    private UUID id;
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
    private BigDecimal totalNet;
    private List<PayslipResponse> payslips;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static PayrunResponse fromEntity(Payrun payrun, boolean includeSlips) {
        if (payrun == null) return null;

        List<PayslipResponse> slipResponses = Collections.emptyList();
        BigDecimal gross = BigDecimal.ZERO;
        BigDecimal net = BigDecimal.ZERO;

        if (payrun.getPayslips() != null) {
            for (var slip : payrun.getPayslips()) {
                gross = gross.add(slip.getGrossSalary() != null ? slip.getGrossSalary() : BigDecimal.ZERO);
                net = net.add(slip.getNetSalary() != null ? slip.getNetSalary() : BigDecimal.ZERO);
            }
            if (includeSlips) {
                slipResponses = payrun.getPayslips().stream()
                        .map(PayslipResponse::fromEntity)
                        .toList();
            }
        }

        return PayrunResponse.builder()
                .id(payrun.getId())
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
                .totalNet(net)
                .payslips(slipResponses)
                .createdAt(payrun.getCreatedAt())
                .updatedAt(payrun.getUpdatedAt())
                .build();
    }
}
