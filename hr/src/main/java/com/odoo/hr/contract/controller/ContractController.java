package com.odoo.hr.contract.controller;

import com.odoo.hr.contract.dto.ContractRequest;
import com.odoo.hr.contract.dto.ContractResponse;
import com.odoo.hr.contract.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @GetMapping("/my")
    public ResponseEntity<List<ContractResponse>> getMyContracts() {
        return ResponseEntity.ok(contractService.getMyContracts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractResponse> getContractById(@PathVariable UUID id) {
        return ResponseEntity.ok(contractService.getContractById(id));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<ContractResponse>> getContractsByEmployeeId(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(contractService.getContractsByEmployeeId(employeeId));
    }

    @PostMapping
    public ResponseEntity<ContractResponse> createContract(@Valid @RequestBody ContractRequest request) {
        ContractResponse created = contractService.createContract(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ContractResponse> updateStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        return ResponseEntity.ok(contractService.updateContractStatus(id, status));
    }
}
