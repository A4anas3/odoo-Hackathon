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
public class ReviewAllocationDto {

    @NotBlank(message = "Status is required (APPROVED, REFUSED)")
    private String status;

    private String rejectionReason;
}
