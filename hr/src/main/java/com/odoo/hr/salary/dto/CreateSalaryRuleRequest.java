package com.odoo.hr.salary.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSalaryRuleRequest {
    private UUID salaryStructureId;

    @NotBlank(message = "Rule name is required")
    private String name;

    @NotBlank(message = "Rule code is required")
    private String code;

    private Integer sequence;
    private String category;
    private String calculationType;
    private BigDecimal value;
    private BigDecimal percentage;
    private String formula;
    private Boolean active;
}
