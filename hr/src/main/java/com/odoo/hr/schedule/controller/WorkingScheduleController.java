package com.odoo.hr.schedule.controller;

import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.schedule.dto.WorkingScheduleRequest;
import com.odoo.hr.schedule.dto.WorkingScheduleResponse;
import com.odoo.hr.schedule.model.WorkingSchedule;
import com.odoo.hr.schedule.model.WorkingScheduleDay;
import com.odoo.hr.schedule.repository.WorkingScheduleRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
public class WorkingScheduleController {

    private final WorkingScheduleRepository workingScheduleRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<WorkingScheduleResponse>> getAllSchedules() {
        List<WorkingScheduleResponse> list = workingScheduleRepository.findAll().stream()
                .map(WorkingScheduleResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<WorkingScheduleResponse> getScheduleById(@PathVariable UUID id) {
        return workingScheduleRepository.findById(id)
                .map(WorkingScheduleResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<WorkingScheduleResponse> createSchedule(@Valid @RequestBody WorkingScheduleRequest request) {
        WorkingSchedule schedule = WorkingSchedule.builder()
                .name(request.getName())
                .description(request.getDescription())
                .company(request.getCompany() != null ? request.getCompany() : "My Company")
                .calendarType(request.getCalendarType() != null ? request.getCalendarType() : "STANDARD")
                .timezone(request.getTimezone() != null ? request.getTimezone() : "Company Default")
                .status(request.getStatus() != null ? request.getStatus().toUpperCase() : "ACTIVE")
                .days(new ArrayList<>())
                .build();

        if (request.getDays() != null) {
            for (WorkingScheduleRequest.ScheduleDayRequest dayReq : request.getDays()) {
                WorkingScheduleDay day = WorkingScheduleDay.builder()
                        .workingSchedule(schedule)
                        .weekday(dayReq.getWeekday())
                        .startTime(dayReq.getStartTime())
                        .endTime(dayReq.getEndTime())
                        .breakMinutes(dayReq.getBreakMinutes() != null ? dayReq.getBreakMinutes() : 60)
                        .build();
                schedule.getDays().add(day);
            }
        }

        WorkingSchedule saved = workingScheduleRepository.save(schedule);
        return ResponseEntity.status(HttpStatus.CREATED).body(WorkingScheduleResponse.fromEntity(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<WorkingScheduleResponse> updateSchedule(
            @PathVariable UUID id,
            @Valid @RequestBody WorkingScheduleRequest request) {
        WorkingSchedule schedule = workingScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Working schedule not found with id: " + id));

        schedule.setName(request.getName());
        schedule.setDescription(request.getDescription());
        if (request.getCompany() != null) schedule.setCompany(request.getCompany());
        if (request.getCalendarType() != null) schedule.setCalendarType(request.getCalendarType());
        if (request.getTimezone() != null) schedule.setTimezone(request.getTimezone());
        if (request.getStatus() != null) schedule.setStatus(request.getStatus().toUpperCase());

        // Replace days
        schedule.getDays().clear();
        if (request.getDays() != null) {
            for (WorkingScheduleRequest.ScheduleDayRequest dayReq : request.getDays()) {
                WorkingScheduleDay day = WorkingScheduleDay.builder()
                        .workingSchedule(schedule)
                        .weekday(dayReq.getWeekday())
                        .startTime(dayReq.getStartTime())
                        .endTime(dayReq.getEndTime())
                        .breakMinutes(dayReq.getBreakMinutes() != null ? dayReq.getBreakMinutes() : 60)
                        .build();
                schedule.getDays().add(day);
            }
        }

        WorkingSchedule updated = workingScheduleRepository.save(schedule);
        return ResponseEntity.ok(WorkingScheduleResponse.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteSchedule(@PathVariable UUID id) {
        if (!workingScheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Working schedule not found with id: " + id);
        }
        workingScheduleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
