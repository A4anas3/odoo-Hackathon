package com.odoo.hr.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentPayrunDto {
    private UUID id;
    private String name;
    private String period;
    private int employeesCount;
    private BigDecimal netAmount;
    private String status;
}
