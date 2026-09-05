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
    private String status;

    public static TimeOffTypeResponse fromEntity(TimeOffType type) {
        if (type == null) return null;
        return TimeOffTypeResponse.builder()
                .id(type.getId())
                .name(type.getName())
                .description(type.getDescription())
                .paid(type.getPaid())
                .requiresApproval(type.getRequiresApproval())
                .status(type.getStatus())
                .build();
    }
}
