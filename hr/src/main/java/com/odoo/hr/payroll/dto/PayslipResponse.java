package com.odoo.hr.payroll.dto;

import com.odoo.hr.payroll.model.Payslip;
import com.odoo.hr.payroll.model.PayslipLine;
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
public class PayslipResponse {
    private UUID id;
    private UUID payrunId;
    private UUID employeeId;
    private String employeeName;
    private String employeeEmail;
    private UUID contractId;
    private UUID salaryStructureId;
    private String salaryStructureName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal grossSalary;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;
    private String status;
    private String pdfReference;
    private List<PayslipLineDto> lines;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayslipLineDto {
        private UUID id;
        private String ruleCode;
        private String ruleName;
        private String category;
        private String calculationType;
        private BigDecimal amount;
        private Integer sequence;

        public static PayslipLineDto fromEntity(PayslipLine line) {
            if (line == null) return null;
            return PayslipLineDto.builder()
                    .id(line.getId())
                    .ruleCode(line.getRuleCode())
                    .ruleName(line.getRuleName())
                    .category(line.getCategory())
                    .calculationType(line.getCalculationType())
                    .amount(line.getAmount())
                    .sequence(line.getSequence())
                    .build();
        }
    }

    public static PayslipResponse fromEntity(Payslip slip) {
        if (slip == null) return null;

        List<PayslipLineDto> lineDtos = Collections.emptyList();
        if (slip.getLines() != null) {
            lineDtos = slip.getLines().stream()
                    .map(PayslipLineDto::fromEntity)
                    .toList();
        }

        return PayslipResponse.builder()
                .id(slip.getId())
                .payrunId(slip.getPayrun() != null ? slip.getPayrun().getId() : null)
                .employeeId(slip.getEmployee() != null ? slip.getEmployee().getId() : null)
                .employeeName(slip.getEmployee() != null ? slip.getEmployee().getFullName() : null)
                .employeeEmail(slip.getEmployee() != null ? slip.getEmployee().getEmail() : null)
                .contractId(slip.getContract() != null ? slip.getContract().getId() : null)
                .salaryStructureId(slip.getSalaryStructure() != null ? slip.getSalaryStructure().getId() : null)
                .salaryStructureName(slip.getSalaryStructure() != null ? slip.getSalaryStructure().getName() : null)
                .periodStart(slip.getPeriodStart())
                .periodEnd(slip.getPeriodEnd())
                .grossSalary(slip.getGrossSalary())
                .totalDeductions(slip.getTotalDeductions())
                .netSalary(slip.getNetSalary())
                .status(slip.getStatus())
                .pdfReference(slip.getPdfReference())
                .lines(lineDtos)
                .createdAt(slip.getCreatedAt())
                .updatedAt(slip.getUpdatedAt())
                .build();
    }
}
