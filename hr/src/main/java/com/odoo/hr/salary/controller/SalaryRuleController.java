package com.odoo.hr.salary.controller;

import com.odoo.hr.salary.dto.CreateSalaryRuleRequest;
import com.odoo.hr.salary.dto.SalaryRuleResponse;
import com.odoo.hr.salary.model.SalaryRule;
import com.odoo.hr.salary.model.SalaryStructure;
import com.odoo.hr.salary.repository.SalaryRuleRepository;
import com.odoo.hr.salary.repository.SalaryStructureRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/salary/rules")
@RequiredArgsConstructor
public class SalaryRuleController {

    private final SalaryRuleRepository salaryRuleRepository;
    private final SalaryStructureRepository salaryStructureRepository;

    @GetMapping
    public ResponseEntity<List<SalaryRuleResponse>> getAllRules(
            @RequestParam(required = false) UUID structureId) {
        List<SalaryRule> list = (structureId != null)
                ? salaryRuleRepository.findBySalaryStructureIdOrderBySequenceAsc(structureId)
                : salaryRuleRepository.findAll();

        return ResponseEntity.ok(list.stream().map(SalaryRuleResponse::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryRuleResponse> getRuleById(@PathVariable UUID id) {
        return salaryRuleRepository.findById(id)
                .map(SalaryRuleResponse::fromEntity)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SalaryRuleResponse> createRule(@Valid @RequestBody CreateSalaryRuleRequest request) {
        SalaryStructure structure;
        if (request.getSalaryStructureId() != null) {
            structure = salaryStructureRepository.findById(request.getSalaryStructureId())
                    .orElseThrow(() -> new IllegalArgumentException("Structure not found: " + request.getSalaryStructureId()));
        } else {
            structure = salaryStructureRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("No salary structure exists to attach rule to"));
        }

        SalaryRule rule = SalaryRule.builder()
                .salaryStructure(structure)
                .name(request.getName())
                .code(request.getCode())
                .sequence(request.getSequence() != null ? request.getSequence() : 1)
                .category(request.getCategory() != null ? request.getCategory() : "BASIC")
                .calculationType(request.getCalculationType() != null ? request.getCalculationType() : "FIXED")
                .value(request.getValue())
                .percentage(request.getPercentage())
                .formula(request.getFormula())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        SalaryRule saved = salaryRuleRepository.save(rule);
        return ResponseEntity.status(HttpStatus.CREATED).body(SalaryRuleResponse.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalaryRuleResponse> updateRule(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSalaryRuleRequest request) {
        SalaryRule rule = salaryRuleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found: " + id));

        if (request.getName() != null) rule.setName(request.getName());
        if (request.getCode() != null) rule.setCode(request.getCode());
        if (request.getSequence() != null) rule.setSequence(request.getSequence());
        if (request.getCategory() != null) rule.setCategory(request.getCategory());
        if (request.getCalculationType() != null) rule.setCalculationType(request.getCalculationType());
        if (request.getValue() != null) rule.setValue(request.getValue());
        if (request.getPercentage() != null) rule.setPercentage(request.getPercentage());
        if (request.getFormula() != null) rule.setFormula(request.getFormula());
        if (request.getActive() != null) rule.setActive(request.getActive());

        SalaryRule updated = salaryRuleRepository.save(rule);
        return ResponseEntity.ok(SalaryRuleResponse.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable UUID id) {
        salaryRuleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
