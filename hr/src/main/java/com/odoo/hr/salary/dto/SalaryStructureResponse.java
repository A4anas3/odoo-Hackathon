package com.odoo.hr.salary.dto;

import com.odoo.hr.salary.model.SalaryStructure;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryStructureResponse {
    private UUID id;
    private String name;
    private String description;
    private String status;
    private int rulesCount;
    private long employeeCount;
    @Builder.Default
    private List<SalaryRuleResponse> rules = new ArrayList<>();

    public static SalaryStructureResponse fromEntity(SalaryStructure structure) {
        return fromEntity(structure, 0L);
    }

    public static SalaryStructureResponse fromEntity(SalaryStructure structure, long employeeCount) {
        if (structure == null) return null;
        List<SalaryRuleResponse> ruleDtos = (structure.getRules() != null)
                ? structure.getRules().stream().map(SalaryRuleResponse::fromEntity).toList()
                : new ArrayList<>();

        return SalaryStructureResponse.builder()
                .id(structure.getId())
                .name(structure.getName())
                .description(structure.getDescription())
                .status(structure.getStatus())
                .rulesCount(ruleDtos.size())
                .employeeCount(employeeCount)
                .rules(ruleDtos)
                .build();
    }
}
