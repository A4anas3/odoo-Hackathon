package com.odoo.hr.salary.dto;

import com.odoo.hr.salary.model.SalaryRule;
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
public class SalaryRuleResponse {
    private UUID id;
    private UUID salaryStructureId;
    private String salaryStructureName;
    private String name;
    private String code;
    private Integer sequence;
    private String category;
    private String calculationType;
    private BigDecimal value;
    private BigDecimal percentage;
    private String formula;
    private Boolean active;

    public static SalaryRuleResponse fromEntity(SalaryRule rule) {
        if (rule == null) return null;
        return SalaryRuleResponse.builder()
                .id(rule.getId())
                .salaryStructureId(rule.getSalaryStructure() != null ? rule.getSalaryStructure().getId() : null)
                .salaryStructureName(rule.getSalaryStructure() != null ? rule.getSalaryStructure().getName() : null)
                .name(rule.getName())
                .code(rule.getCode())
                .sequence(rule.getSequence())
                .category(rule.getCategory())
                .calculationType(rule.getCalculationType())
                .value(rule.getValue())
                .percentage(rule.getPercentage())
                .formula(rule.getFormula())
                .active(rule.getActive())
                .build();
    }
}
