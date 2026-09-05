package com.odoo.hr.organization.model;

import com.odoo.hr.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "job_positions",
    indexes = {
        @Index(name = "idx_job_positions_dept", columnList = "department_id"),
        @Index(name = "idx_job_positions_status", columnList = "status")
    }
)
public class JobPosition extends BaseEntity {

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false, foreignKey = @ForeignKey(name = "fk_job_positions_dept"))
    private Department department;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "ACTIVE";
}
