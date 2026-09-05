package com.odoo.hr.salary.controller;

import com.odoo.hr.salary.dto.CreateSalaryStructureRequest;
import com.odoo.hr.salary.dto.SalaryStructureResponse;
import com.odoo.hr.salary.model.SalaryStructure;
import com.odoo.hr.salary.repository.SalaryStructureRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/salary/structures")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class SalaryStructureController {

    private final SalaryStructureRepository salaryStructureRepository;

    @GetMapping
    public ResponseEntity<List<SalaryStructureResponse>> getAllStructures() {
        List<SalaryStructureResponse> list = salaryStructureRepository.findAll().stream()
                .map(SalaryStructureResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryStructureResponse> getStructureById(@PathVariable UUID id) {
        return salaryStructureRepository.findById(id)
                .map(SalaryStructureResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<SalaryStructureResponse> createStructure(@Valid @RequestBody CreateSalaryStructureRequest request) {
        SalaryStructure structure = SalaryStructure.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        SalaryStructure saved = salaryStructureRepository.save(structure);
        return ResponseEntity.status(HttpStatus.CREATED).body(SalaryStructureResponse.fromEntity(saved));
    }

    @PutMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<SalaryStructureResponse> updateStructure(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSalaryStructureRequest request) {
        SalaryStructure structure = salaryStructureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Structure not found with id: " + id));

        if (request.getName() != null) structure.setName(request.getName());
        if (request.getDescription() != null) structure.setDescription(request.getDescription());
        if (request.getStatus() != null) structure.setStatus(request.getStatus());

        SalaryStructure saved = salaryStructureRepository.save(structure);
        return ResponseEntity.ok(SalaryStructureResponse.fromEntity(saved));
    }

    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> deleteStructure(@PathVariable UUID id) {
        salaryStructureRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
