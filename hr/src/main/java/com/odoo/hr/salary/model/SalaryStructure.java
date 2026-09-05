package com.odoo.hr.salary.model;

import com.odoo.hr.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "salary_structures",
    indexes = {
        @Index(name = "idx_salary_structures_name", columnList = "name", unique = true),
        @Index(name = "idx_salary_structures_status", columnList = "status")
    }
)
public class SalaryStructure extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 150)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "ACTIVE";

    @OneToMany(mappedBy = "salaryStructure", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sequence ASC")
    @Builder.Default
    private List<SalaryRule> rules = new ArrayList<>();
}
