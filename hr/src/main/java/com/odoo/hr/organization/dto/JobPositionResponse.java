package com.odoo.hr.organization.dto;

import com.odoo.hr.organization.model.JobPosition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPositionResponse {
    private UUID id;
    private String title;
    private UUID departmentId;
    private String departmentName;
    private String description;
    private String status;
    private Long currentStaff;

    public static JobPositionResponse fromEntity(JobPosition job) {
        if (job == null) return null;
        return JobPositionResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .departmentId(job.getDepartment() != null ? job.getDepartment().getId() : null)
                .departmentName(job.getDepartment() != null ? job.getDepartment().getName() : null)
                .description(job.getDescription())
                .status(job.getStatus())
                .build();
    }
}
