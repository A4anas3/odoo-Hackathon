package com.odoo.hr.payroll.controller;

import com.odoo.hr.payroll.dto.GeneratePayrunRequest;
import com.odoo.hr.payroll.dto.PayrunResponse;
import com.odoo.hr.payroll.dto.PayslipResponse;
import com.odoo.hr.payroll.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @PostMapping("/payruns")
    public ResponseEntity<PayrunResponse> generatePayrun(@Valid @RequestBody GeneratePayrunRequest request) {
        PayrunResponse payrun = payrollService.generatePayrun(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(payrun);
    }

    @GetMapping("/payruns")
    public ResponseEntity<List<PayrunResponse>> getAllPayruns() {
        return ResponseEntity.ok(payrollService.getAllPayruns());
    }

    @GetMapping("/payruns/{id}")
    public ResponseEntity<PayrunResponse> getPayrunById(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.getPayrunById(id));
    }

    @PatchMapping("/payruns/{id}/validate")
    public ResponseEntity<PayrunResponse> validatePayrun(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.validatePayrun(id));
    }

    @PatchMapping("/payruns/{id}/pay")
    public ResponseEntity<PayrunResponse> payPayrun(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.payPayrun(id));
    }

    /**
     * Resolves JWT 'sub' claim -> authProviderUserId -> Employee -> Employee.id -> payslips
     */
    @GetMapping("/payslips/my")
    public ResponseEntity<List<PayslipResponse>> getMyPayslips() {
        return ResponseEntity.ok(payrollService.getMyPayslips());
    }

    @GetMapping("/payslips/{id}")
    public ResponseEntity<PayslipResponse> getPayslipById(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.getPayslipById(id));
    }

    @GetMapping("/payslips/{id}/pdf")
    public ResponseEntity<byte[]> getPayslipPdf(@PathVariable UUID id) {
        byte[] pdfBytes = payrollService.generatePayslipPdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("payslip-" + id.toString().substring(0, 8) + ".pdf").build());
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
