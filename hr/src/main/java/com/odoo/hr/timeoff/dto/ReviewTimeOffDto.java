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
public class ReviewTimeOffDto {

    @NotBlank(message = "Status must be APPROVED or REJECTED")
    private String status;

    private String rejectionReason;
}
