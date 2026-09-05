package com.odoo.hr.payroll.service;

import com.odoo.hr.payroll.config.RabbitMqPayrollConfig;
import com.odoo.hr.payroll.dto.PayslipEmailMessage;
import com.odoo.hr.payroll.model.Payslip;
import com.odoo.hr.payroll.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayslipEmailConsumer {

    private final PayslipRepository payslipRepository;
    private final PayslipPdfService payslipPdfService;
    private final EmailService emailService;

    @RabbitListener(queues = RabbitMqPayrollConfig.PAYSLIP_EMAIL_QUEUE)
    @Transactional(readOnly = true)
    public void processPayslipEmail(PayslipEmailMessage message) {
        log.info("Received RabbitMQ payslip email message for payslipId={} to recipient={}",
                message.getPayslipId(), message.getRecipientEmail());

        try {
            Payslip payslip = payslipRepository.findById(message.getPayslipId()).orElse(null);
            if (payslip == null) {
                log.warn("Payslip not found in database for id={}, skipping email delivery.", message.getPayslipId());
                return;
            }

            byte[] pdfBytes = payslipPdfService.generatePayslipPdf(payslip);

            String email = message.getRecipientEmail();
            if ((email == null || email.isBlank()) && payslip.getEmployee() != null) {
                email = payslip.getEmployee().getEmail();
            }

            if (email == null || email.isBlank()) {
                log.warn("No valid email address for employee {}, skipping email dispatch.",
                        payslip.getEmployee() != null ? payslip.getEmployee().getFullName() : "Unknown");
                return;
            }

            String employeeName = payslip.getEmployee() != null ? payslip.getEmployee().getFullName() : message.getEmployeeName();

            emailService.sendPayslipEmail(
                    email,
                    employeeName != null ? employeeName : "Employee",
                    payslip.getPeriodStart(),
                    payslip.getPeriodEnd(),
                    payslip.getGrossSalary(),
                    payslip.getTotalDeductions(),
                    payslip.getNetSalary(),
                    pdfBytes
            );

            log.info("Successfully delivered payslip statement for employee {} via RabbitMQ async worker.", employeeName);
        } catch (Exception e) {
            log.error("Failed to process payslip email message for id={}: {}", message.getPayslipId(), e.getMessage(), e);
        }
    }
}
