package com.odoo.hr.schedule.model;

import com.odoo.hr.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
    name = "working_schedule_days",
    indexes = {
        @Index(name = "idx_schedule_days_schedule_id", columnList = "working_schedule_id")
    }
)
public class WorkingScheduleDay extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "working_schedule_id", nullable = false, foreignKey = @ForeignKey(name = "fk_schedule_days_schedule"))
    private WorkingSchedule workingSchedule;

    @Column(name = "weekday", nullable = false, length = 20)
    private String weekday;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "break_minutes")
    @Builder.Default
    private Integer breakMinutes = 60;
}
