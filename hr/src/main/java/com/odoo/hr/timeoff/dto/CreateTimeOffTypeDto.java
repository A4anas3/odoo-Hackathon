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
}
