package com.odoo.hr.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryResponse {
    private long totalEmployees;
    private long activeEmployees;
    private long presentToday;
    private long absentToday;
    private int attendanceRate;
    private LocalDate date;
}
