package com.odoo.hr.timeoff.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.employee.model.Employee;
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
    name = "time_off_allocations",
    indexes = {
        @Index(name = "idx_allocations_employee", columnList = "employee_id"),
        @Index(name = "idx_allocations_type", columnList = "time_off_type_id")
    }
)
public class TimeOffAllocation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, foreignKey = @ForeignKey(name = "fk_allocations_employee"))
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "time_off_type_id", nullable = false, foreignKey = @ForeignKey(name = "fk_allocations_type"))
    private TimeOffType timeOffType;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "allocated_days", nullable = false, precision = 5, scale = 2)
    private BigDecimal allocatedDays;

    @Column(name = "used_days", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal usedDays = BigDecimal.ZERO;

    @Column(name = "remaining_days", nullable = false, precision = 5, scale = 2)
    private BigDecimal remainingDays;
}
