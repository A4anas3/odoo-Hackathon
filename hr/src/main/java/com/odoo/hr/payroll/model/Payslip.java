package com.odoo.hr.payroll.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.contract.model.Contract;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.salary.model.SalaryStructure;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "payslips",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_payslips_employee_period", columnNames = {"employee_id", "period_start", "period_end"})
    },
    indexes = {
        @Index(name = "idx_payslips_payrun", columnList = "payrun_id"),
        @Index(name = "idx_payslips_employee", columnList = "employee_id"),
        @Index(name = "idx_payslips_contract", columnList = "contract_id"),
        @Index(name = "idx_payslips_status", columnList = "status")
    }
)
public class Payslip extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payrun_id", nullable = false, foreignKey = @ForeignKey(name = "fk_payslips_payrun"))
    private Payrun payrun;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, foreignKey = @ForeignKey(name = "fk_payslips_employee"))
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false, foreignKey = @ForeignKey(name = "fk_payslips_contract"))
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salary_structure_id", foreignKey = @ForeignKey(name = "fk_payslips_structure"))
    private SalaryStructure salaryStructure;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "gross_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossSalary;

    @Column(name = "total_deductions", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal netSalary;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, CONFIRMED, PAID, CANCELLED

    @Column(name = "pdf_reference", columnDefinition = "TEXT")
    private String pdfReference;

    @OneToMany(mappedBy = "payslip", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    @Builder.Default
    private List<PayslipLine> lines = new ArrayList<>();
}
