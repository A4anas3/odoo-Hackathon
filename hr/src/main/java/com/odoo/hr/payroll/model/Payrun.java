package com.odoo.hr.payroll.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.salary.model.SalaryStructure;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "payruns",
    indexes = {
        @Index(name = "idx_payruns_period", columnList = "period_start, period_end"),
        @Index(name = "idx_payruns_status", columnList = "status")
    }
)
public class Payrun extends BaseEntity {

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salary_structure_id", foreignKey = @ForeignKey(name = "fk_payruns_structure"))
    private SalaryStructure salaryStructure;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, CALCULATED, VALIDATED, PAID, CANCELLED

    @Column(name = "created_by", length = 128)
    private String createdBy; // JWT sub

    @Column(name = "calculated_at")
    private OffsetDateTime calculatedAt;

    @Column(name = "validated_at")
    private OffsetDateTime validatedAt;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @OneToMany(mappedBy = "payrun", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Payslip> payslips = new ArrayList<>();
}
