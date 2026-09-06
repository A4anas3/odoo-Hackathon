package com.odoo.hr.timeoff.dto;

import com.odoo.hr.timeoff.model.TimeOffType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeOffTypeResponse {
    private UUID id;
    private String name;
    private String description;
    private Boolean paid;
    private Boolean requiresApproval;
    private String unit;
    private Boolean requiresAllocation;
    private String approvalType;
    private String payrollWorkEntry;
    private String displayColor;
    private String configurationNotes;
    private String status;

    public static TimeOffTypeResponse fromEntity(TimeOffType type) {
        if (type == null) return null;
        return TimeOffTypeResponse.builder()
                .id(type.getId())
                .name(type.getName())
                .description(type.getDescription())
                .paid(type.getPaid())
                .requiresApproval(type.getRequiresApproval())
                .unit(type.getUnit() != null ? type.getUnit() : "Days")
                .requiresAllocation(type.getRequiresAllocation() != null ? type.getRequiresAllocation() : true)
                .approvalType(type.getApprovalType() != null ? type.getApprovalType() : "Manager")
                .payrollWorkEntry(type.getPayrollWorkEntry() != null ? type.getPayrollWorkEntry() : "Leave Work Entry")
                .displayColor(type.getDisplayColor() != null ? type.getDisplayColor() : "Blue")
                .configurationNotes(type.getConfigurationNotes())
                .status(type.getStatus())
                .build();
    }
}
