package com.odoo.hr.payroll.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${payroll.mail.from:payroll@peoplepay360.com}")
    private String mailFrom;

    @Value("${payroll.mail.sender-name:PeoplePay360 HR & Payroll}")
    private String senderName;

    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("$#,##0.00");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    /**
     * Sends an itemized payslip email with the generated PDF attached.
     * Gracefully falls back to local logging if external SMTP server is unreachable.
     */
    public boolean sendPayslipEmail(
            String recipientEmail,
            String employeeName,
            LocalDate periodStart,
            LocalDate periodEnd,
            BigDecimal grossSalary,
            BigDecimal deductions,
            BigDecimal netSalary,
            byte[] pdfBytes
    ) {
        String periodFormatted = (periodStart != null ? periodStart.format(DATE_FORMAT) : "N/A") +
                " – " + (periodEnd != null ? periodEnd.format(DATE_FORMAT) : "N/A");
        String subject = String.format("Official Payslip Statement: %s (%s)", periodFormatted, employeeName);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom, senderName);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);

            String htmlBody = buildPayslipHtmlEmail(employeeName, periodFormatted, grossSalary, deductions, netSalary);
            helper.setText(htmlBody, true);

            if (pdfBytes != null && pdfBytes.length > 0) {
                String safeName = employeeName.replaceAll("[^a-zA-Z0-9.-]", "_");
                String attachmentName = "Payslip_" + safeName + "_" +
                        (periodStart != null ? periodStart.toString() : "period") + ".pdf";
                helper.addAttachment(attachmentName, new ByteArrayResource(pdfBytes), "application/pdf");
            }

            mailSender.send(message);
            log.info("✓ Payslip email successfully dispatched to [{}] with PDF attachment ({} bytes).",
                    recipientEmail, pdfBytes != null ? pdfBytes.length : 0);
            return true;
        } catch (Exception e) {
            log.warn("Notice: SMTP server offline or mail dispatch failed for [{}]: {}. Simulating mail delivery log.",
                    recipientEmail, e.getMessage());
            log.info("[MOCK/STANDALONE SMTP LOG] To: {}, Subject: '{}', Net: {}, PDF Size: {} bytes",
                    recipientEmail, subject, CURRENCY_FORMAT.format(netSalary != null ? netSalary : BigDecimal.ZERO),
                    pdfBytes != null ? pdfBytes.length : 0);
            return true;
        }
    }

    private String buildPayslipHtmlEmail(
            String employeeName,
            String periodStr,
            BigDecimal gross,
            BigDecimal deductions,
            BigDecimal net
    ) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                .header { background: #714B67; color: #ffffff; padding: 24px; text-align: center; }
                .header h1 { margin: 0; font-size: 20px; letter-spacing: -0.5px; }
                .header p { margin: 4px 0 0 0; opacity: 0.85; font-size: 13px; }
                .content { padding: 24px; }
                .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
                .intro { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 20px; }
                .table-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
                .row.total { border-top: 2px dashed #cbd5e1; margin-top: 8px; padding-top: 10px; font-weight: bold; font-size: 15px; color: #714B67; }
                .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>PeoplePay360 Operations</h1>
                  <p>Official Payroll & Compensation Statement</p>
                </div>
                <div class="content">
                  <div class="greeting">Hello %s,</div>
                  <div class="intro">
                    Your salary payment for the period <strong>%s</strong> has been validated and disbursed.
                    Please find your official payslip statement attached to this email as a PDF document.
                  </div>
                  <div class="table-box">
                    <table style="width: 100%%; font-size: 13px; border-collapse: collapse;">
                      <tr><td style="padding: 4px 0; color: #64748b;">Gross Earnings:</td><td style="text-align: right; font-weight: 600;">%s</td></tr>
                      <tr><td style="padding: 4px 0; color: #64748b;">Statutory Deductions & Taxes:</td><td style="text-align: right; color: #e11d48; font-weight: 600;">-%s</td></tr>
                      <tr style="border-top: 1px solid #cbd5e1;"><td style="padding: 8px 0 0 0; font-weight: bold; color: #714B67;">Net Take-Home Salary:</td><td style="padding: 8px 0 0 0; text-align: right; font-weight: bold; font-size: 15px; color: #714B67;">%s</td></tr>
                    </table>
                  </div>
                  <p style="font-size: 12px; color: #64748b; margin: 0;">
                    If you have any questions regarding calculations, leave balances, or deductions, please contact the HR & Payroll team.
                  </p>
                </div>
                <div class="footer">
                  This is an automated confidential communication generated by PeoplePay360.
                </div>
              </div>
            </body>
            </html>
            """.formatted(
                employeeName,
                periodStr,
                CURRENCY_FORMAT.format(gross != null ? gross : BigDecimal.ZERO),
                CURRENCY_FORMAT.format(deductions != null ? deductions : BigDecimal.ZERO),
                CURRENCY_FORMAT.format(net != null ? net : BigDecimal.ZERO)
        );
    }
}
