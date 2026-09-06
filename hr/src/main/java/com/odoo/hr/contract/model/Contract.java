package com.odoo.hr.contract.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.salary.model.SalaryStructure;
import com.odoo.hr.schedule.model.WorkingSchedule;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "contracts",
    indexes = {
        @Index(name = "idx_contracts_employee_id", columnList = "employee_id"),
        @Index(name = "idx_contracts_structure_id", columnList = "salary_structure_id"),
        @Index(name = "idx_contracts_schedule_id", columnList = "working_schedule_id"),
        @Index(name = "idx_contracts_status", columnList = "status")
    }
)
public class Contract extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, foreignKey = @ForeignKey(name = "fk_contracts_employee"))
    private Employee employee;

    @Column(name = "contract_type", length = 50)
    @Builder.Default
    private String contractType = "PERMANENT";

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal salary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salary_structure_id", foreignKey = @ForeignKey(name = "fk_contracts_salary_structure"))
    private SalaryStructure salaryStructure;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "working_schedule_id", foreignKey = @ForeignKey(name = "fk_contracts_working_schedule"))
    private WorkingSchedule workingSchedule;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, RUNNING, EXPIRED, CANCELLED

    @Column(name = "wage_type", length = 30)
    @Builder.Default
    private String wageType = "MONTHLY"; // MONTHLY, HOURLY

    public String getWageType() {
        if (wageType != null && !wageType.isBlank()) {
            return wageType.trim().toUpperCase();
        }
        if (contractType != null) {
            String ct = contractType.trim().toUpperCase();
            if (ct.contains("HOUR") || ct.contains("PART_TIME") || ct.contains("CONTRACTOR")) {
                return "HOURLY";
            }
        }
        return "MONTHLY";
    }
}
