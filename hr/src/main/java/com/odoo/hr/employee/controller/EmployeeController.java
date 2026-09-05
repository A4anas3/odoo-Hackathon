package com.odoo.hr.employee.controller;

import com.odoo.hr.employee.dto.CreateEmployeeRequest;
import com.odoo.hr.employee.dto.EmployeeResponse;
import com.odoo.hr.employee.dto.UpdateEmployeeRequest;
import com.odoo.hr.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    /**
     * Resolves JWT 'sub' claim -> authProviderUserId -> Employee record.
     */
    @GetMapping("/me")
    public ResponseEntity<EmployeeResponse> getCurrentEmployee() {
        return ResponseEntity.ok(employeeService.getCurrentEmployeeProfile());
    }

    /**
     * Onboards or links the authenticated user's JWT 'sub' to a new Employee profile.
     */
    @PostMapping("/me")
    public ResponseEntity<EmployeeResponse> registerCurrentEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse created = employeeService.registerCurrentEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse created = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getEmployeeById(@PathVariable UUID id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable UUID id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }
}
