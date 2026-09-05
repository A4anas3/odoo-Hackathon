package com.odoo.hr.job.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.payroll.model.Payslip;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "email_jobs",
    indexes = {
        @Index(name = "idx_email_jobs_status", columnList = "status"),
        @Index(name = "idx_email_jobs_employee", columnList = "employee_id"),
        @Index(name = "idx_email_jobs_payslip", columnList = "payslip_id")
    }
)
public class EmailJob extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", foreignKey = @ForeignKey(name = "fk_email_jobs_employee"))
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", foreignKey = @ForeignKey(name = "fk_email_jobs_payslip"))
    private Payslip payslip;

    @Column(name = "recipient_email", nullable = false, length = 150)
    private String recipientEmail;

    @Column(name = "subject", nullable = false, length = 200)
    private String subject;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PROCESSING, SENT, FAILED

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "processing_at")
    private OffsetDateTime processingAt;

    @Column(name = "sent_at")
    private OffsetDateTime sentAt;
}
