package com.odoo.hr.organization.controller;

import com.odoo.hr.organization.dto.CreateJobPositionRequest;
import com.odoo.hr.organization.dto.JobPositionResponse;
import com.odoo.hr.organization.model.Department;
import com.odoo.hr.organization.model.JobPosition;
import com.odoo.hr.organization.repository.DepartmentRepository;
import com.odoo.hr.organization.repository.JobPositionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/job-positions")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class JobPositionController {

    private final JobPositionRepository jobPositionRepository;
    private final DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<List<JobPositionResponse>> getAllJobPositions(
            @RequestParam(required = false) UUID departmentId) {
        List<JobPosition> list = (departmentId != null)
                ? jobPositionRepository.findByDepartmentId(departmentId)
                : jobPositionRepository.findAll();

        return ResponseEntity.ok(list.stream().map(JobPositionResponse::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobPositionResponse> getJobPositionById(@PathVariable UUID id) {
        return jobPositionRepository.findById(id)
                .map(JobPositionResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<JobPositionResponse> createJobPosition(@Valid @RequestBody CreateJobPositionRequest request) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Department not found with ID: " + request.getDepartmentId()));

        JobPosition job = JobPosition.builder()
                .title(request.getTitle())
                .department(department)
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        JobPosition saved = jobPositionRepository.save(job);
        return ResponseEntity.status(HttpStatus.CREATED).body(JobPositionResponse.fromEntity(saved));
    }
}
