package com.odoo.hr.organization.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobPositionRequest {
    @NotBlank(message = "Job title is required")
    private String title;

    @NotNull(message = "Department ID is required")
    private UUID departmentId;

    private String description;
    private String status;
}
