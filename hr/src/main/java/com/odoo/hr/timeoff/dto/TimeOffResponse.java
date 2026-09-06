package com.odoo.hr.timeoff.dto;

import com.odoo.hr.timeoff.model.TimeOffRequest;
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
public class TimeOffResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID timeOffTypeId;
    private String timeOffTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal duration;
    private String reason;
    private String status;
    private UUID approvedById;
    private String approvedByName;
    private OffsetDateTime approvedAt;
    private String rejectionReason;
    private String allocationUsedName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static TimeOffResponse fromEntity(TimeOffRequest req) {
        if (req == null) return null;
        String allocName = req.getAllocationUsedName();
        if (allocName == null && req.getTimeOffType() != null) {
            allocName = req.getTimeOffType().getName() + " " + (req.getStartDate() != null ? req.getStartDate().getYear() : 2026);
        }
        return TimeOffResponse.builder()
                .id(req.getId())
                .employeeId(req.getEmployee() != null ? req.getEmployee().getId() : null)
                .employeeName(req.getEmployee() != null ? req.getEmployee().getFullName() : null)
                .timeOffTypeId(req.getTimeOffType() != null ? req.getTimeOffType().getId() : null)
                .timeOffTypeName(req.getTimeOffType() != null ? req.getTimeOffType().getName() : null)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .duration(req.getDuration())
                .reason(req.getReason())
                .status(req.getStatus())
                .approvedById(req.getApprovedBy() != null ? req.getApprovedBy().getId() : null)
                .approvedByName(req.getApprovedBy() != null ? req.getApprovedBy().getFullName() : null)
                .approvedAt(req.getApprovedAt())
                .rejectionReason(req.getRejectionReason())
                .allocationUsedName(allocName)
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}
