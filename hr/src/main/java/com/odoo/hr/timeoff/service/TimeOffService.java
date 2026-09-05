package com.odoo.hr.timeoff.service;

import com.odoo.hr.common.exception.ConflictException;
import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.security.CurrentEmployeeService;
import com.odoo.hr.timeoff.dto.CreateTimeOffRequestDto;
import com.odoo.hr.timeoff.dto.ReviewTimeOffDto;
import com.odoo.hr.timeoff.dto.TimeOffResponse;
import com.odoo.hr.timeoff.model.TimeOffAllocation;
import com.odoo.hr.timeoff.model.TimeOffRequest;
import com.odoo.hr.timeoff.model.TimeOffType;
import com.odoo.hr.timeoff.repository.TimeOffAllocationRepository;
import com.odoo.hr.timeoff.repository.TimeOffRequestRepository;
import com.odoo.hr.timeoff.repository.TimeOffTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimeOffService {

    private final TimeOffRequestRepository timeOffRequestRepository;
    private final TimeOffTypeRepository timeOffTypeRepository;
    private final TimeOffAllocationRepository timeOffAllocationRepository;
    private final EmployeeRepository employeeRepository;
    private final CurrentEmployeeService currentEmployeeService;

    @Transactional
    public TimeOffResponse requestTimeOff(CreateTimeOffRequestDto request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }

        Employee employee = currentEmployeeService.getCurrentEmployee();

        if (employee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new ConflictException("Inactive, suspended, or terminated employees cannot apply for time off. Current employment status: " + (employee.getStatus() != null ? employee.getStatus() : "UNKNOWN"));
        }

        TimeOffType timeOffType = timeOffTypeRepository.findById(request.getTimeOffTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("TimeOffType not found: " + request.getTimeOffTypeId()));

        TimeOffRequest timeOffRequest = TimeOffRequest.builder()
                .employee(employee)
                .timeOffType(timeOffType)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .duration(request.getDuration())
                .reason(request.getReason())
                .status("PENDING")
                .build();

        TimeOffRequest saved = timeOffRequestRepository.save(timeOffRequest);
        log.info("Time off request created (id={}) for employee: {}", saved.getId(), employee.getId());
        return TimeOffResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<TimeOffResponse> getMyTimeOffRequests() {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return timeOffRequestRepository.findByEmployeeIdOrderByStartDateDesc(employeeId).stream()
                .map(TimeOffResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TimeOffResponse> getPendingTimeOffRequests() {
        return timeOffRequestRepository.findByStatus("PENDING").stream()
                .map(TimeOffResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TimeOffResponse reviewTimeOff(UUID requestId, ReviewTimeOffDto reviewDto) {
        TimeOffRequest request = timeOffRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Time off request not found: " + requestId));

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new ConflictException("Time off request is already " + request.getStatus());
        }

        Employee reviewer = currentEmployeeService.getCurrentEmployee();
        if (reviewer.getStatus() == null || !"ACTIVE".equalsIgnoreCase(reviewer.getStatus())) {
            throw new ConflictException("Terminated or inactive employees cannot review or approve time off requests.");
        }
        String newStatus = reviewDto.getStatus().trim().toUpperCase();

        request.setStatus(newStatus);
        request.setApprovedBy(reviewer);
        request.setApprovedAt(OffsetDateTime.now());

        if ("REJECTED".equalsIgnoreCase(newStatus)) {
            request.setRejectionReason(reviewDto.getRejectionReason());
        } else if ("APPROVED".equalsIgnoreCase(newStatus)) {
            // Update allocation if one exists
            Optional<TimeOffAllocation> allocationOpt = timeOffAllocationRepository
                    .findByEmployeeIdAndTimeOffTypeId(request.getEmployee().getId(), request.getTimeOffType().getId());
            if (allocationOpt.isPresent()) {
                TimeOffAllocation alloc = allocationOpt.get();
                alloc.setUsedDays(alloc.getUsedDays().add(request.getDuration()));
                alloc.setRemainingDays(alloc.getRemainingDays().subtract(request.getDuration()));
                timeOffAllocationRepository.save(alloc);
            }
        }

        TimeOffRequest updated = timeOffRequestRepository.save(request);
        log.info("TimeOff request {} reviewed by {} -> {}", requestId, reviewer.getId(), newStatus);
        return TimeOffResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<com.odoo.hr.timeoff.dto.TimeOffTypeResponse> getAllTypes() {
        return timeOffTypeRepository.findAll().stream()
                .map(com.odoo.hr.timeoff.dto.TimeOffTypeResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.odoo.hr.timeoff.dto.TimeOffAllocationResponse> getMyAllocations() {
        try {
            UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
            return timeOffAllocationRepository.findByEmployeeId(employeeId).stream()
                    .map(com.odoo.hr.timeoff.dto.TimeOffAllocationResponse::fromEntity)
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    @Transactional(readOnly = true)
    public List<TimeOffResponse> getAllRequests() {
        return timeOffRequestRepository.findAll().stream()
                .sorted((a, b) -> b.getStartDate().compareTo(a.getStartDate()))
                .map(TimeOffResponse::fromEntity)
                .toList();
    }

    @Transactional
    public com.odoo.hr.timeoff.dto.TimeOffTypeResponse createTimeOffType(com.odoo.hr.timeoff.dto.CreateTimeOffTypeDto dto) {
        if (timeOffTypeRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new ConflictException("A Time Off Type with name '" + dto.getName() + "' already exists.");
        }
        TimeOffType type = TimeOffType.builder()
                .name(dto.getName().trim())
                .description(dto.getDescription())
                .paid(dto.getPaid() != null ? dto.getPaid() : true)
                .requiresApproval(dto.getRequiresApproval() != null ? dto.getRequiresApproval() : true)
                .status("ACTIVE")
                .build();
        TimeOffType saved = timeOffTypeRepository.save(type);
        log.info("Created new TimeOffType: id={}, name={}", saved.getId(), saved.getName());
        return com.odoo.hr.timeoff.dto.TimeOffTypeResponse.fromEntity(saved);
    }

    @Transactional
    public com.odoo.hr.timeoff.dto.TimeOffAllocationResponse createAllocation(com.odoo.hr.timeoff.dto.CreateTimeOffAllocationDto dto) {
        if (dto.getPeriodEnd().isBefore(dto.getPeriodStart())) {
            throw new IllegalArgumentException("Period end date cannot be before period start date");
        }

        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + dto.getEmployeeId()));

        TimeOffType type = timeOffTypeRepository.findById(dto.getTimeOffTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("TimeOffType not found: " + dto.getTimeOffTypeId()));

        Optional<TimeOffAllocation> existingOpt = timeOffAllocationRepository
                .findByEmployeeIdAndTimeOffTypeId(employee.getId(), type.getId());

        TimeOffAllocation allocation;
        if (existingOpt.isPresent()) {
            allocation = existingOpt.get();
            allocation.setAllocatedDays(allocation.getAllocatedDays().add(dto.getAllocatedDays()));
            allocation.setRemainingDays(allocation.getRemainingDays().add(dto.getAllocatedDays()));
            allocation.setPeriodStart(dto.getPeriodStart());
            allocation.setPeriodEnd(dto.getPeriodEnd());
        } else {
            allocation = TimeOffAllocation.builder()
                    .employee(employee)
                    .timeOffType(type)
                    .periodStart(dto.getPeriodStart())
                    .periodEnd(dto.getPeriodEnd())
                    .allocatedDays(dto.getAllocatedDays())
                    .usedDays(java.math.BigDecimal.ZERO)
                    .remainingDays(dto.getAllocatedDays())
                    .build();
        }

        TimeOffAllocation saved = timeOffAllocationRepository.save(allocation);
        log.info("Created/Updated TimeOffAllocation: id={}, emp={}, days={}", saved.getId(), employee.getId(), dto.getAllocatedDays());
        return com.odoo.hr.timeoff.dto.TimeOffAllocationResponse.fromEntity(saved);
    }
}
