package com.odoo.hr.attendance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CorrectAttendanceRequest {

    @NotBlank(message = "Correction reason is mandatory for audit logging")
    private String reason;

    private OffsetDateTime newCheckIn;

    private OffsetDateTime newCheckOut;
}
