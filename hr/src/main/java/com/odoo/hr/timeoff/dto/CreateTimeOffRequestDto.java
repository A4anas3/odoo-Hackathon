package com.odoo.hr.timeoff.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTimeOffRequestDto {

    @NotNull(message = "Time off type ID is required")
    private UUID timeOffTypeId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Duration is required")
    @DecimalMin(value = "0.5", message = "Minimum duration is 0.5 days")
    private BigDecimal duration;

    private String reason;
}
