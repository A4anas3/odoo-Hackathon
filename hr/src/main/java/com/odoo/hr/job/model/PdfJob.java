package com.odoo.hr.job.model;

import com.odoo.hr.common.BaseEntity;
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
    name = "pdf_jobs",
    indexes = {
        @Index(name = "idx_pdf_jobs_status", columnList = "status"),
        @Index(name = "idx_pdf_jobs_payslip", columnList = "payslip_id")
    }
)
public class PdfJob extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payslip_id", nullable = false, foreignKey = @ForeignKey(name = "fk_pdf_jobs_payslip"))
    private Payslip payslip;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PROCESSING, COMPLETED, FAILED

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    @Column(name = "pdf_reference", columnDefinition = "TEXT")
    private String pdfReference;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}
