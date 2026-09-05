package com.odoo.hr.salary.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSalaryStructureRequest {
    @NotBlank(message = "Structure name is required")
    private String name;
    private String description;
    private String status;
}
