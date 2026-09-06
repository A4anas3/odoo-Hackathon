package com.odoo.hr.contract.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class ContractRequest {

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    private String contractType;
    private String wageType;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    @NotNull(message = "Salary is required")
    @DecimalMin(value = "0.01", message = "Salary must be greater than zero")
    private BigDecimal salary;

    private UUID salaryStructureId;

    private UUID workingScheduleId;

    private String status;

    private Boolean preserveHistory;
}
