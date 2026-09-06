package com.odoo.hr.timeoff.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.employee.model.Employee;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "time_off_requests",
    indexes = {
        @Index(name = "idx_time_off_requests_employee", columnList = "employee_id"),
        @Index(name = "idx_time_off_requests_type", columnList = "time_off_type_id"),
        @Index(name = "idx_time_off_requests_status", columnList = "status"),
        @Index(name = "idx_time_off_requests_dates", columnList = "start_date, end_date")
    }
)
public class TimeOffRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, foreignKey = @ForeignKey(name = "fk_time_off_employee"))
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "time_off_type_id", nullable = false, foreignKey = @ForeignKey(name = "fk_time_off_type"))
    private TimeOffType timeOffType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "duration", nullable = false, precision = 4, scale = 1)
    private BigDecimal duration;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by", foreignKey = @ForeignKey(name = "fk_time_off_approved_by"))
    private Employee approvedBy;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "allocation_used_name", length = 100)
    private String allocationUsedName;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
}
