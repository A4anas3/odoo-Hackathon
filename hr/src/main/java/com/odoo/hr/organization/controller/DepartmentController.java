package com.odoo.hr.organization.controller;

import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.organization.dto.CreateDepartmentRequest;
import com.odoo.hr.organization.dto.DepartmentResponse;
import com.odoo.hr.organization.model.Department;
import com.odoo.hr.organization.repository.DepartmentRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments() {
        List<DepartmentResponse> list = departmentRepository.findAll().stream()
                .map(d -> DepartmentResponse.fromEntity(d, employeeRepository.countByDepartmentId(d.getId())))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> getDepartmentById(@PathVariable UUID id) {
        return departmentRepository.findById(id)
                .map(d -> DepartmentResponse.fromEntity(d, employeeRepository.countByDepartmentId(d.getId())))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<DepartmentResponse> createDepartment(@Valid @RequestBody CreateDepartmentRequest request) {
        Employee manager = null;
        if (request.getManagerId() != null) {
            manager = employeeRepository.findById(request.getManagerId()).orElse(null);
        }

        Department dept = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .manager(manager)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        Department saved = departmentRepository.save(dept);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(DepartmentResponse.fromEntity(saved, 0));
    }
}
