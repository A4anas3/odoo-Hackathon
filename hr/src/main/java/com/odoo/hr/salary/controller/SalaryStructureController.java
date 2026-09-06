package com.odoo.hr.salary.controller;

import com.odoo.hr.contract.repository.ContractRepository;
import com.odoo.hr.salary.dto.CreateSalaryStructureRequest;
import com.odoo.hr.salary.dto.SalaryStructureResponse;
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
@RequestMapping("/api/v1/salary/structures")
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional(readOnly = true)
public class SalaryStructureController {

    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryRuleRepository salaryRuleRepository;
    private final ContractRepository contractRepository;

    @GetMapping
    public ResponseEntity<List<SalaryStructureResponse>> getAllStructures() {
        List<SalaryStructureResponse> list = salaryStructureRepository.findAll().stream()
                .map(s -> SalaryStructureResponse.fromEntity(s, contractRepository.countBySalaryStructureId(s.getId())))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalaryStructureResponse> getStructureById(@PathVariable UUID id) {
        return salaryStructureRepository.findById(id)
                .map(s -> SalaryStructureResponse.fromEntity(s, contractRepository.countBySalaryStructureId(s.getId())))
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

        // If template structure selected to copy rules from:
        if (request.getCopyFromStructureId() != null) {
            List<SalaryRule> sourceRules = salaryRuleRepository.findBySalaryStructureIdOrderBySequenceAsc(request.getCopyFromStructureId());
            for (SalaryRule sr : sourceRules) {
                SalaryRule copyRule = SalaryRule.builder()
                        .salaryStructure(saved)
                        .name(sr.getName())
                        .code(sr.getCode())
                        .sequence(sr.getSequence())
                        .category(sr.getCategory())
                        .calculationType(sr.getCalculationType())
                        .value(sr.getValue())
                        .percentage(sr.getPercentage())
                        .formula(sr.getFormula())
                        .active(sr.getActive())
                        .build();
                salaryRuleRepository.save(copyRule);
            }
        } else if (request.getRuleIds() != null && !request.getRuleIds().isEmpty()) {
            for (UUID ruleId : request.getRuleIds()) {
                salaryRuleRepository.findById(ruleId).ifPresent(sr -> {
                    SalaryRule copyRule = SalaryRule.builder()
                            .salaryStructure(saved)
                            .name(sr.getName())
                            .code(sr.getCode())
                            .sequence(sr.getSequence())
                            .category(sr.getCategory())
                            .calculationType(sr.getCalculationType())
                            .value(sr.getValue())
                            .percentage(sr.getPercentage())
                            .formula(sr.getFormula())
                            .active(sr.getActive())
                            .build();
                    salaryRuleRepository.save(copyRule);
                });
            }
        }

        SalaryStructure reloaded = salaryStructureRepository.findById(saved.getId()).orElse(saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(SalaryStructureResponse.fromEntity(reloaded, 0L));
    }

    @PostMapping("/{id}/copy-rules")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<SalaryStructureResponse> copyRulesFrom(
            @PathVariable UUID id,
            @RequestParam UUID sourceStructureId) {
        SalaryStructure target = salaryStructureRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Structure not found: " + id));

        List<SalaryRule> sourceRules = salaryRuleRepository.findBySalaryStructureIdOrderBySequenceAsc(sourceStructureId);
        for (SalaryRule sr : sourceRules) {
            SalaryRule copyRule = SalaryRule.builder()
                    .salaryStructure(target)
                    .name(sr.getName())
                    .code(sr.getCode())
                    .sequence(sr.getSequence())
                    .category(sr.getCategory())
                    .calculationType(sr.getCalculationType())
                    .value(sr.getValue())
                    .percentage(sr.getPercentage())
                    .formula(sr.getFormula())
                    .active(sr.getActive())
                    .build();
            salaryRuleRepository.save(copyRule);
        }

        SalaryStructure reloaded = salaryStructureRepository.findById(id).orElse(target);
        return ResponseEntity.ok(SalaryStructureResponse.fromEntity(reloaded, contractRepository.countBySalaryStructureId(id)));
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
        return ResponseEntity.ok(SalaryStructureResponse.fromEntity(saved, contractRepository.countBySalaryStructureId(id)));
    }

    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> deleteStructure(@PathVariable UUID id) {
        salaryStructureRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
