package com.odoo.hr.schedule.model;

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
@Table(name = "working_schedules")
public class WorkingSchedule extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "workingSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkingScheduleDay> days = new ArrayList<>();
}
