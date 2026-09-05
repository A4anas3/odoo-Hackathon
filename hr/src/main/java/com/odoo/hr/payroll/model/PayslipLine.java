package com.odoo.hr.payroll.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.salary.model.SalaryRule;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "payslip_lines",
    indexes = {
        @Index(name = "idx_payslip_lines_slip", columnList = "payslip_id"),
        @Index(name = "idx_payslip_lines_rule", columnList = "salary_rule_id")
    }
)
public class PayslipLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payslip_id", nullable = false, foreignKey = @ForeignKey(name = "fk_payslip_lines_slip"))
    private Payslip payslip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salary_rule_id", foreignKey = @ForeignKey(name = "fk_payslip_lines_rule"))
    private SalaryRule salaryRule;

    @Column(name = "rule_code", nullable = false, length = 50)
    private String ruleCode;

    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "calculation_type", length = 50)
    private String calculationType;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private Integer sequence = 1;
}
