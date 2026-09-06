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
public class PayrollTrendDto {
    private String sortKey;
    private String label;
    private String fullLabel;
    private BigDecimal value;
    private BigDecimal gross;
    private BigDecimal net;
    private int payslipsCount;
    private int payrunsCount;
}
