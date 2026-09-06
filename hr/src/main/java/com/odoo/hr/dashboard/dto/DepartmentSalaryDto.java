package com.odoo.hr.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentSalaryDto {
    private String label;
    private BigDecimal value;
    private Long count;
    private Double percentage;
}
