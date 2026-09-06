package com.odoo.hr.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceUpdateRequest {
    private OffsetDateTime checkIn;
    private OffsetDateTime checkOut;
    private String status;
    private String notes;
    private String correctionReason;
}
