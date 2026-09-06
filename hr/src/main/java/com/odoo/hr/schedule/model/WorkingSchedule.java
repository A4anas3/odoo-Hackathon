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

    @Column(name = "company", length = 100)
    @Builder.Default
    private String company = "My Company";

    @Column(name = "calendar_type", length = 50)
    @Builder.Default
    private String calendarType = "STANDARD";

    @Column(name = "timezone", length = 50)
    @Builder.Default
    private String timezone = "Company Default";

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    @OneToMany(mappedBy = "workingSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkingScheduleDay> days = new ArrayList<>();

    public int getDaysPerWeek() {
        if (days == null || days.isEmpty()) return 0;
        return (int) days.stream().map(WorkingScheduleDay::getWeekday).distinct().count();
    }

    public double getHoursPerWeek() {
        if (days == null || days.isEmpty()) return 0.0;
        return Math.round(days.stream().mapToDouble(WorkingScheduleDay::calculateHours).sum() * 10.0) / 10.0;
    }
}
