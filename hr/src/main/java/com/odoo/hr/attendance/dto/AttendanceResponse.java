package com.odoo.hr.attendance.dto;

import com.odoo.hr.attendance.model.Attendance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private LocalDate attendanceDate;
    private OffsetDateTime checkIn;
    private OffsetDateTime checkOut;
    private BigDecimal scheduledHours;
    private BigDecimal workedHours;
    private BigDecimal overtimeHours;
    private Integer lateMinutes;
    private String status;
    private String correctionReason;
    private UUID correctedById;
    private String correctedByName;
    private Long version;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static AttendanceResponse fromEntity(Attendance att) {
        if (att == null) return null;
        return AttendanceResponse.builder()
                .id(att.getId())
                .employeeId(att.getEmployee() != null ? att.getEmployee().getId() : null)
                .employeeName(att.getEmployee() != null ? att.getEmployee().getFullName() : null)
                .attendanceDate(att.getAttendanceDate())
                .checkIn(att.getCheckIn())
                .checkOut(att.getCheckOut())
                .scheduledHours(att.getScheduledHours())
                .workedHours(att.getWorkedHours())
                .overtimeHours(att.getOvertimeHours())
                .lateMinutes(att.getLateMinutes())
                .status(att.getStatus())
                .correctionReason(att.getCorrectionReason())
                .correctedById(att.getCorrectedBy() != null ? att.getCorrectedBy().getId() : null)
                .correctedByName(att.getCorrectedBy() != null ? att.getCorrectedBy().getFullName() : null)
                .version(att.getVersion())
                .createdAt(att.getCreatedAt())
                .updatedAt(att.getUpdatedAt())
                .build();
    }
}
