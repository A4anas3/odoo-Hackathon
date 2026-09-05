package com.odoo.hr.timeoff.dto;

import com.odoo.hr.timeoff.model.TimeOffAllocation;
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
public class TimeOffAllocationResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID timeOffTypeId;
    private String timeOffTypeName;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal allocatedDays;
    private BigDecimal usedDays;
    private BigDecimal remainingDays;

    public static TimeOffAllocationResponse fromEntity(TimeOffAllocation alloc) {
        if (alloc == null) return null;
        return TimeOffAllocationResponse.builder()
                .id(alloc.getId())
                .employeeId(alloc.getEmployee() != null ? alloc.getEmployee().getId() : null)
                .employeeName(alloc.getEmployee() != null ? alloc.getEmployee().getFullName() : null)
                .timeOffTypeId(alloc.getTimeOffType() != null ? alloc.getTimeOffType().getId() : null)
                .timeOffTypeName(alloc.getTimeOffType() != null ? alloc.getTimeOffType().getName() : null)
                .periodStart(alloc.getPeriodStart())
                .periodEnd(alloc.getPeriodEnd())
                .allocatedDays(alloc.getAllocatedDays())
                .usedDays(alloc.getUsedDays())
                .remainingDays(alloc.getRemainingDays())
                .build();
    }
}
