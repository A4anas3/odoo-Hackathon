package com.odoo.hr.attendance.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.payroll.model.Payslip;
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
    name = "attendance",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_attendance_employee_date", columnNames = {"employee_id", "attendance_date"})
    },
    indexes = {
        @Index(name = "idx_attendance_employee_id", columnList = "employee_id"),
        @Index(name = "idx_attendance_date", columnList = "attendance_date"),
        @Index(name = "idx_attendance_status", columnList = "status"),
        @Index(name = "idx_attendance_is_paid", columnList = "is_paid"),
        @Index(name = "idx_attendance_payslip_id", columnList = "payslip_id")
    }
)
public class Attendance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false, foreignKey = @ForeignKey(name = "fk_attendance_employee"))
    private Employee employee;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "check_in", nullable = false)
    private OffsetDateTime checkIn;

    @Column(name = "check_out")
    private OffsetDateTime checkOut;

    @Column(name = "scheduled_hours", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal scheduledHours = new BigDecimal("8.00");

    @Column(name = "worked_hours", precision = 5, scale = 2)
    private BigDecimal workedHours;

    @Column(name = "overtime_hours", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    @Column(name = "late_minutes")
    @Builder.Default
    private Integer lateMinutes = 0;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PRESENT";

    @Column(name = "correction_reason", columnDefinition = "TEXT")
    private String correctionReason;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corrected_by", foreignKey = @ForeignKey(name = "fk_attendance_corrected_by"))
    private Employee correctedBy;

    @Column(name = "is_paid", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isPaid = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", foreignKey = @ForeignKey(name = "fk_attendance_payslip"))
    private Payslip payslip;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;
}
