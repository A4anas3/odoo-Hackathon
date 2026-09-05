package com.odoo.hr.schedule.controller;

import com.odoo.hr.schedule.dto.WorkingScheduleResponse;
import com.odoo.hr.schedule.model.WorkingSchedule;
import com.odoo.hr.schedule.repository.WorkingScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class WorkingScheduleController {

    private final WorkingScheduleRepository workingScheduleRepository;

    @GetMapping
    public ResponseEntity<List<WorkingScheduleResponse>> getAllSchedules() {
        List<WorkingScheduleResponse> list = workingScheduleRepository.findAll().stream()
                .map(WorkingScheduleResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkingScheduleResponse> getScheduleById(@PathVariable UUID id) {
        return workingScheduleRepository.findById(id)
                .map(WorkingScheduleResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
