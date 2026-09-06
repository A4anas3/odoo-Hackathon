package com.odoo.hr.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryPreviewRequest {
    private BigDecimal wage;
    private UUID salaryStructureId;
    private String contractType;
    private String calculationMode; // "GROSS_LOCK" or "RAW_FORMULA"
    private LocalDate startDate;
    private LocalDate endDate;
    private Map<String, BigDecimal> ruleOverrides;
}
