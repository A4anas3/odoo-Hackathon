package com.odoo.hr.organization.model;

import com.odoo.hr.common.BaseEntity;
import com.odoo.hr.employee.model.Employee;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "departments",
    indexes = {
        @Index(name = "idx_departments_name", columnList = "name", unique = true),
        @Index(name = "idx_departments_status", columnList = "status")
    }
)
public class Department extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", foreignKey = @ForeignKey(name = "fk_departments_manager"))
    private Employee manager;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "ACTIVE";
}
