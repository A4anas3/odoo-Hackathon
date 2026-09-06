package com.odoo.hr.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingApprovalDto {
    private UUID id;
    private String employee;
    private String department;
    private String type;
    private String dates;
    private String submittedAt;
}
