package com.odoo.hr.salary.model;

import com.odoo.hr.common.BaseEntity;
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
    name = "salary_rules",
    indexes = {
        @Index(name = "idx_salary_rules_structure", columnList = "salary_structure_id"),
        @Index(name = "idx_salary_rules_code", columnList = "code")
    }
)
public class SalaryRule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "salary_structure_id", nullable = false, foreignKey = @ForeignKey(name = "fk_salary_rules_structure"))
    private SalaryStructure salaryStructure;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private Integer sequence = 1;

    @Column(name = "category", nullable = false, length = 50)
    private String category; // BASIC, ALW, DED, GROSS, NET

    @Column(name = "calculation_type", nullable = false, length = 50)
    private String calculationType; // FIXED, PERCENTAGE, FORMULA

    @Column(name = "\"value\"", precision = 12, scale = 2)
    private BigDecimal value;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Column(name = "formula", columnDefinition = "TEXT")
    private String formula;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;
}
