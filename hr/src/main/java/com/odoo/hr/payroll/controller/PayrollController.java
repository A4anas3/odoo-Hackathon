package com.odoo.hr.payroll.controller;

import com.odoo.hr.payroll.dto.GeneratePayrunRequest;
import com.odoo.hr.payroll.dto.PayrunResponse;
import com.odoo.hr.payroll.dto.PayslipResponse;
import com.odoo.hr.payroll.dto.SalaryPreviewRequest;
import com.odoo.hr.payroll.dto.SalaryPreviewResponse;
import com.odoo.hr.payroll.service.PayrollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
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

    @PostMapping("/payruns/{id}/compute")
    public ResponseEntity<PayrunResponse> computePayrun(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.computePayrun(id));
    }

    @GetMapping("/payslips")
    public ResponseEntity<List<PayslipResponse>> getAllPayslips(
            @RequestParam(required = false) UUID payrunId,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(payrollService.getAllPayslips(payrunId, department, month, year, search, status));
    }

    /**
     * Resolves JWT 'sub' claim -> authProviderUserId -> Employee -> Employee.id -> payslips
     */
    @GetMapping("/payslips/my")
    public ResponseEntity<List<PayslipResponse>> getMyPayslips(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(payrollService.getMyPayslips(month, year, search, status));
    }

    @GetMapping("/payslips/{id}")
    public ResponseEntity<PayslipResponse> getPayslipById(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.getPayslipById(id));
    }

    @PostMapping("/payslips/{id}/compute")
    public ResponseEntity<PayslipResponse> computePayslip(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.computePayslip(id));
    }

    @PatchMapping("/payslips/{id}/pay")
    public ResponseEntity<PayslipResponse> payPayslip(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.markPayslipPaid(id));
    }

    @PostMapping("/payruns/{id}/send-payslips")
    public ResponseEntity<java.util.Map<String, Object>> sendPayslipsForPayrun(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.sendPayslipsForPayrun(id));
    }

    @PostMapping("/payslips/{id}/send-email")
    public ResponseEntity<java.util.Map<String, Object>> sendSinglePayslipEmail(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollService.sendSinglePayslipEmail(id));
    }

    @GetMapping("/payslips/{id}/pdf")
    public ResponseEntity<byte[]> getPayslipPdf(@PathVariable UUID id) {
        byte[] pdfBytes = payrollService.generatePayslipPdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment().filename("payslip-" + id.toString().substring(0, 8) + ".pdf").build());
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @PostMapping("/salary-preview")
    public ResponseEntity<SalaryPreviewResponse> calculateSalaryPreview(@RequestBody SalaryPreviewRequest request) {
        log.info("🚀 [PAYROLL BACKEND ENGINE] Incoming /api/v1/payroll/salary-preview request: wage={}, structureId={}, contractType={}, mode={}",
                request.getWage(), request.getSalaryStructureId(), request.getContractType(), request.getCalculationMode());
        SalaryPreviewResponse response = payrollService.calculateSalaryPreview(request);
        log.info("✅ [PAYROLL BACKEND ENGINE] Successfully calculated preview: gross={}, basic={}, deductions={}, net={}, rulesEvaluated={}",
                response.getGrossSalary(), response.getBasicSalary(), response.getTotalDeductions(), response.getNetSalary(), response.getRuleCount());
        return ResponseEntity.ok(response);
    }
}
