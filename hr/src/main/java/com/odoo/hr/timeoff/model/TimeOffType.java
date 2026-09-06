package com.odoo.hr.timeoff.model;

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
    name = "time_off_types",
    indexes = {
        @Index(name = "idx_time_off_types_name", columnList = "name", unique = true)
    }
)
public class TimeOffType extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "paid", nullable = false)
    @Builder.Default
    private Boolean paid = true;

    @Column(name = "requires_approval", nullable = false)
    @Builder.Default
    private Boolean requiresApproval = true;

    @Column(name = "unit", length = 20)
    @Builder.Default
    private String unit = "Days"; // Days, Hours

    @Column(name = "requires_allocation")
    @Builder.Default
    private Boolean requiresAllocation = true;

    @Column(name = "approval_type", length = 50)
    @Builder.Default
    private String approvalType = "Manager"; // Manager, Officer, No Validation

    @Column(name = "payroll_work_entry", length = 100)
    @Builder.Default
    private String payrollWorkEntry = "Leave Work Entry";

    @Column(name = "display_color", length = 50)
    @Builder.Default
    private String displayColor = "Blue";

    @Column(name = "configuration_notes", columnDefinition = "TEXT")
    private String configurationNotes;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "ACTIVE";
}
