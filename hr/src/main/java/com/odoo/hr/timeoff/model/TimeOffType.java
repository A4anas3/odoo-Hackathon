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

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "ACTIVE";
}
