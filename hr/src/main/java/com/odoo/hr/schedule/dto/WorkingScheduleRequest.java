package com.odoo.hr.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkingScheduleRequest {

    @NotBlank(message = "Schedule name is required")
    private String name;

    private String description;

    @Builder.Default
    private String company = "My Company";

    @Builder.Default
    private String calendarType = "STANDARD";

    @Builder.Default
    private String timezone = "Company Default";

    @Builder.Default
    private String status = "ACTIVE";

    @Builder.Default
    private List<ScheduleDayRequest> days = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScheduleDayRequest {
        private String weekday;
        private LocalTime startTime;
        private LocalTime endTime;
        private Integer breakMinutes;
    }
}
