package com.odoo.hr.organization.dto;

import com.odoo.hr.organization.model.Department;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID managerId;
    private String managerName;
    private String status;
    private long employeeCount;

    public static DepartmentResponse fromEntity(Department dept, long empCount) {
        if (dept == null) return null;
        return DepartmentResponse.builder()
                .id(dept.getId())
                .name(dept.getName())
                .description(dept.getDescription())
                .managerId(dept.getManager() != null ? dept.getManager().getId() : null)
                .managerName(dept.getManager() != null ? dept.getManager().getFullName() : null)
                .status(dept.getStatus())
                .employeeCount(empCount)
                .build();
    }
}
