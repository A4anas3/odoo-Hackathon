package com.odoo.hr.timeoff.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTimeOffTypeDto {

    @NotBlank(message = "Leave type name is required")
    private String name;

    private String description;

    @Builder.Default
    private Boolean paid = true;

    @Builder.Default
    private Boolean requiresApproval = true;

    @Builder.Default
    private String unit = "Days";

    @Builder.Default
    private Boolean requiresAllocation = true;

    @Builder.Default
    private String approvalType = "Manager";

    @Builder.Default
    private String payrollWorkEntry = "Leave Work Entry";

    @Builder.Default
    private String displayColor = "Blue";

    private String configurationNotes;

    @Builder.Default
    private String status = "ACTIVE";
}
