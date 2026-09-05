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
    private String slipNumber;
    private UUID payrunId;
    private UUID employeeId;
    private String employeeName;
    private String employeeCode;
    private String employeeEmail;
    private String departmentName;
    private String jobTitle;
    private String bankAccountNo;
    private String bankName;
    private String ifscCode;
    private UUID contractId;
    private UUID salaryStructureId;
    private String salaryStructureName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal basicSalary;
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
        BigDecimal basic = BigDecimal.ZERO;
        if (slip.getLines() != null) {
            lineDtos = slip.getLines().stream()
                    .map(PayslipLineDto::fromEntity)
                    .toList();
            basic = slip.getLines().stream()
                    .filter(l -> "BASIC".equalsIgnoreCase(l.getCategory()) || "BASIC".equalsIgnoreCase(l.getRuleCode()))
                    .map(PayslipLine::getAmount)
                    .findFirst()
                    .orElse(slip.getGrossSalary());
        }

        var emp = slip.getEmployee();
        String code = emp != null && emp.getEmployeeCode() != null ? emp.getEmployeeCode() : (emp != null ? "EMP-" + emp.getId().toString().substring(0, 4) : "—");
        String dept = emp != null && emp.getDepartment() != null ? emp.getDepartment().getName() : "—";
        String job = emp != null && emp.getJobPosition() != null ? emp.getJobPosition().getTitle() : "—";

        String slipNum = "SLIP-" + slip.getId().toString().substring(0, 8).toUpperCase();

        return PayslipResponse.builder()
                .id(slip.getId())
                .slipNumber(slipNum)
                .payrunId(slip.getPayrun() != null ? slip.getPayrun().getId() : null)
                .employeeId(emp != null ? emp.getId() : null)
                .employeeName(emp != null ? emp.getFullName() : null)
                .employeeCode(code)
                .employeeEmail(emp != null ? emp.getEmail() : null)
                .departmentName(dept)
                .jobTitle(job)
                .bankAccountNo(emp != null ? emp.getBankAccountNo() : null)
                .bankName(emp != null ? emp.getBankName() : null)
                .ifscCode(emp != null ? emp.getIfscCode() : null)
                .contractId(slip.getContract() != null ? slip.getContract().getId() : null)
                .salaryStructureId(slip.getSalaryStructure() != null ? slip.getSalaryStructure().getId() : null)
                .salaryStructureName(slip.getSalaryStructure() != null ? slip.getSalaryStructure().getName() : null)
                .periodStart(slip.getPeriodStart())
                .periodEnd(slip.getPeriodEnd())
                .basicSalary(basic)
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
