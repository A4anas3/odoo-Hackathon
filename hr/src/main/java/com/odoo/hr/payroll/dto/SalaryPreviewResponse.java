package com.odoo.hr.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryPreviewResponse {
    private BigDecimal baseWage;
    private BigDecimal grossSalary;
    private BigDecimal basicSalary;
    private BigDecimal totalAllowances;
    private BigDecimal totalDeductions;
    private BigDecimal netSalary;
    private BigDecimal annualGross;
    private BigDecimal annualNet;
    private UUID structureId;
    private String structureName;
    private int ruleCount;
    private List<SalaryPreviewLineDto> lines;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalaryPreviewLineDto {
        private UUID ruleId;
        private String code;
        private String name;
        private String category;
        private String calculationType;
        private BigDecimal percentage;
        private String formula;
        private BigDecimal value;
        private BigDecimal monthly;
        private BigDecimal annual;
        private boolean overridden;
    }
}
