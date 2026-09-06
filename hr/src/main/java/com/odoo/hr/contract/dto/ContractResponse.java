package com.odoo.hr.contract.dto;

import com.odoo.hr.contract.model.Contract;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String contractType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal salary;
    private UUID salaryStructureId;
    private String salaryStructureName;
    private UUID workingScheduleId;
    private String workingScheduleName;
    private String status;
    private String wageType;
    private Long version;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static ContractResponse fromEntity(Contract contract) {
        if (contract == null) return null;
        return ContractResponse.builder()
                .id(contract.getId())
                .employeeId(contract.getEmployee() != null ? contract.getEmployee().getId() : null)
                .employeeName(contract.getEmployee() != null ? contract.getEmployee().getFullName() : null)
                .contractType(contract.getContractType())
                .wageType(contract.getWageType())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .salary(contract.getSalary())
                .salaryStructureId(contract.getSalaryStructure() != null ? contract.getSalaryStructure().getId() : null)
                .salaryStructureName(contract.getSalaryStructure() != null ? contract.getSalaryStructure().getName() : null)
                .workingScheduleId(contract.getWorkingSchedule() != null ? contract.getWorkingSchedule().getId() : null)
                .workingScheduleName(contract.getWorkingSchedule() != null ? contract.getWorkingSchedule().getName() : null)
                .status(contract.getStatus())
                .version(contract.getVersion())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }
}
