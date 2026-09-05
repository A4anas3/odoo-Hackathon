package com.odoo.hr.timeoff.controller;

import com.odoo.hr.timeoff.dto.CreateTimeOffRequestDto;
import com.odoo.hr.timeoff.dto.ReviewTimeOffDto;
import com.odoo.hr.timeoff.dto.TimeOffResponse;
import com.odoo.hr.timeoff.service.TimeOffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/time-off")
@RequiredArgsConstructor
public class TimeOffController {

    private final TimeOffService timeOffService;

    @PostMapping("/requests")
    public ResponseEntity<TimeOffResponse> requestTimeOff(@Valid @RequestBody CreateTimeOffRequestDto request) {
        TimeOffResponse created = timeOffService.requestTimeOff(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/requests/my")
    public ResponseEntity<List<TimeOffResponse>> getMyTimeOffRequests() {
        return ResponseEntity.ok(timeOffService.getMyTimeOffRequests());
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<TimeOffResponse>> getPendingTimeOffRequests() {
        return ResponseEntity.ok(timeOffService.getPendingTimeOffRequests());
    }

    @GetMapping("/requests")
    public ResponseEntity<List<TimeOffResponse>> getAllTimeOffRequests() {
        return ResponseEntity.ok(timeOffService.getAllRequests());
    }

    @GetMapping("/types")
    public ResponseEntity<List<com.odoo.hr.timeoff.dto.TimeOffTypeResponse>> getAllTypes() {
        return ResponseEntity.ok(timeOffService.getAllTypes());
    }

    @PostMapping("/types")
    public ResponseEntity<com.odoo.hr.timeoff.dto.TimeOffTypeResponse> createType(
            @Valid @RequestBody com.odoo.hr.timeoff.dto.CreateTimeOffTypeDto request) {
        com.odoo.hr.timeoff.dto.TimeOffTypeResponse created = timeOffService.createTimeOffType(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/allocations/my")
    public ResponseEntity<List<com.odoo.hr.timeoff.dto.TimeOffAllocationResponse>> getMyAllocations() {
        return ResponseEntity.ok(timeOffService.getMyAllocations());
    }

    @PostMapping("/allocations")
    public ResponseEntity<com.odoo.hr.timeoff.dto.TimeOffAllocationResponse> createAllocation(
            @Valid @RequestBody com.odoo.hr.timeoff.dto.CreateTimeOffAllocationDto request) {
        com.odoo.hr.timeoff.dto.TimeOffAllocationResponse created = timeOffService.createAllocation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/requests/{id}/review")
    public ResponseEntity<TimeOffResponse> reviewTimeOff(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewTimeOffDto reviewDto) {
        return ResponseEntity.ok(timeOffService.reviewTimeOff(id, reviewDto));
    }
}
