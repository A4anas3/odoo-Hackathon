package com.odoo.hr.schedule.dto;

import com.odoo.hr.schedule.model.WorkingSchedule;
import com.odoo.hr.schedule.model.WorkingScheduleDay;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkingScheduleResponse {
    private UUID id;
    private String name;
    private String description;
    private String company;
    private String calendarType;
    private String timezone;
    private String status;
    private Integer daysPerWeek;
    private Double hoursPerWeek;
    @Builder.Default
    private List<ScheduleDayDto> days = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleDayDto {
        private UUID id;
        private String weekday;
        private LocalTime startTime;
        private LocalTime endTime;
        private Integer breakMinutes;
        private Double hours;

        public static ScheduleDayDto fromEntity(WorkingScheduleDay day) {
            if (day == null) return null;
            return ScheduleDayDto.builder()
                    .id(day.getId())
                    .weekday(day.getWeekday())
                    .startTime(day.getStartTime())
                    .endTime(day.getEndTime())
                    .breakMinutes(day.getBreakMinutes())
                    .hours(day.calculateHours())
                    .build();
        }
    }

    public static WorkingScheduleResponse fromEntity(WorkingSchedule schedule) {
        if (schedule == null) return null;
        List<ScheduleDayDto> dayDtos = (schedule.getDays() != null)
                ? schedule.getDays().stream().map(ScheduleDayDto::fromEntity).toList()
                : new ArrayList<>();

        return WorkingScheduleResponse.builder()
                .id(schedule.getId())
                .name(schedule.getName())
                .description(schedule.getDescription())
                .company(schedule.getCompany())
                .calendarType(schedule.getCalendarType())
                .timezone(schedule.getTimezone())
                .status(schedule.getStatus())
                .daysPerWeek(schedule.getDaysPerWeek())
                .hoursPerWeek(schedule.getHoursPerWeek())
                .days(dayDtos)
                .build();
    }
}
