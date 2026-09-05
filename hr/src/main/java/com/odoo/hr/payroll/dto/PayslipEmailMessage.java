package com.odoo.hr.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayslipEmailMessage implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID payslipId;
    private UUID payrunId;
    private UUID employeeId;
    private String employeeName;
    private String recipientEmail;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal netSalary;
    private BigDecimal grossSalary;
    private BigDecimal totalDeductions;
    private String currency;
    private OffsetDateTime requestedAt;
}
