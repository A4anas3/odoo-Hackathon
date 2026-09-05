package com.odoo.hr.payroll.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.odoo.hr.payroll.model.Payslip;
import com.odoo.hr.payroll.model.PayslipLine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class PayslipPdfService {

    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("$#,##0.00");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private static final Color COLOR_PRIMARY = new Color(113, 75, 103);
    private static final Color COLOR_DARK = new Color(30, 41, 59);
    private static final Color COLOR_MUTED = new Color(100, 116, 139);
    private static final Color COLOR_LIGHT_BG = new Color(248, 250, 252);
    private static final Color COLOR_BORDER = new Color(226, 232, 240);
    private static final Color COLOR_SUCCESS_BG = new Color(240, 253, 244);
    private static final Color COLOR_SUCCESS_TEXT = new Color(22, 101, 52);
    private static final Color COLOR_DEDUCTION = new Color(225, 29, 72);

    public byte[] generatePayslipPdf(Payslip payslip) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // 1. Header Banner
            addHeader(document, payslip);

            // 2. Metadata Grid (Employee Info & Payroll Period)
            addMetadataSection(document, payslip);

            // 3. Itemized Earnings & Deductions Breakdown
            addEarningsAndDeductionsTable(document, payslip);

            // 4. Net Salary Summary Card
            addSummarySection(document, payslip);

            // 5. Confidentiality & Verification Footer
            addFooter(document);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate payslip PDF for id={}", payslip.getId(), e);
            throw new RuntimeException("Could not generate payslip PDF: " + e.getMessage(), e);
        }
    }

    private void addHeader(Document document, Payslip payslip) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{65f, 35f});

        // Left Header: Brand & Title
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.setPadding(0);

        Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, COLOR_PRIMARY);
        Paragraph brand = new Paragraph("PeoplePay360", brandFont);
        brand.setSpacingAfter(2);
        leftCell.addElement(brand);

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_DARK);
        Paragraph title = new Paragraph("EMPLOYEE SALARY PAYSLIP", titleFont);
        title.setSpacingAfter(2);
        leftCell.addElement(title);

        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_MUTED);
        Paragraph subtitle = new Paragraph("HR & Payroll Operations Platform • Official Compensation Statement", subFont);
        leftCell.addElement(subtitle);

        // Right Header: Slip Ref & Status Badge
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(Rectangle.NO_BORDER);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightCell.setPadding(0);

        String slipNumber = "SLIP-" + payslip.getId().toString().substring(0, 8).toUpperCase();
        Font refFont = FontFactory.getFont(FontFactory.COURIER_BOLD, 11, COLOR_DARK);
        Paragraph refPara = new Paragraph(slipNumber, refFont);
        refPara.setAlignment(Element.ALIGN_RIGHT);
        refPara.setSpacingAfter(4);
        rightCell.addElement(refPara);

        String status = payslip.getStatus() != null ? payslip.getStatus() : "CONFIRMED";
        Font statusFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_PRIMARY);
        Paragraph statusPara = new Paragraph("STATUS: " + status, statusFont);
        statusPara.setAlignment(Element.ALIGN_RIGHT);
        rightCell.addElement(statusPara);

        headerTable.addCell(leftCell);
        headerTable.addCell(rightCell);
        document.add(headerTable);

        // Separator line
        Paragraph divider = new Paragraph();
        divider.setSpacingBefore(10);
        divider.setSpacingAfter(12);
        LineSeparator line = new LineSeparator(1f, 100, COLOR_BORDER, Element.ALIGN_CENTER, -2);
        divider.add(line);
        document.add(divider);
    }

    private void addMetadataSection(Document document, Payslip payslip) throws DocumentException {
        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setWidths(new float[]{50f, 50f});
        metaTable.setSpacingAfter(14);

        // Left Panel: Employee Details
        PdfPCell empCell = new PdfPCell();
        empCell.setBackgroundColor(COLOR_LIGHT_BG);
        empCell.setBorderColor(COLOR_BORDER);
        empCell.setPadding(10);

        Font sectionHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_PRIMARY);
        Paragraph empHeader = new Paragraph("EMPLOYEE INFORMATION", sectionHeaderFont);
        empHeader.setSpacingAfter(6);
        empCell.addElement(empHeader);

        String employeeName = payslip.getEmployee() != null ? payslip.getEmployee().getFullName() : "Employee";
        String employeeCode = payslip.getEmployee() != null && payslip.getEmployee().getEmployeeCode() != null
                ? payslip.getEmployee().getEmployeeCode() : "—";
        String deptName = payslip.getEmployee() != null && payslip.getEmployee().getDepartment() != null
                ? payslip.getEmployee().getDepartment().getName() : "Operations";
        String jobTitle = (payslip.getEmployee() != null && payslip.getEmployee().getJobPosition() != null)
                ? payslip.getEmployee().getJobPosition().getTitle() : "Staff";

        addLabelValue(empCell, "Full Name:", employeeName, true);
        addLabelValue(empCell, "Employee Code:", employeeCode, false);
        addLabelValue(empCell, "Department:", deptName, false);
        addLabelValue(empCell, "Designation:", jobTitle, false);

        // Right Panel: Pay Period & Contract
        PdfPCell periodCell = new PdfPCell();
        periodCell.setBackgroundColor(COLOR_LIGHT_BG);
        periodCell.setBorderColor(COLOR_BORDER);
        periodCell.setPadding(10);

        Paragraph periodHeader = new Paragraph("PAYROLL & CONTRACT PERIOD", sectionHeaderFont);
        periodHeader.setSpacingAfter(6);
        periodCell.addElement(periodHeader);

        String periodStr = formatDate(payslip.getPeriodStart()) + " – " + formatDate(payslip.getPeriodEnd());
        String structureName = payslip.getSalaryStructure() != null ? payslip.getSalaryStructure().getName() : "Regular Salary";
        String contractRef = payslip.getContract() != null ? "Contract #" + payslip.getContract().getId().toString().substring(0, 8) : "Active Contract";

        addLabelValue(periodCell, "Pay Period:", periodStr, true);
        addLabelValue(periodCell, "Salary Structure:", structureName, false);
        addLabelValue(periodCell, "Contract Ref:", contractRef, false);
        addLabelValue(periodCell, "Payment Method:", "Direct Deposit / Wire", false);

        metaTable.addCell(empCell);
        metaTable.addCell(periodCell);
        document.add(metaTable);
    }

    private void addLabelValue(PdfPCell cell, String label, String value, boolean boldValue) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_MUTED);
        Font valFont = FontFactory.getFont(boldValue ? FontFactory.HELVETICA_BOLD : FontFactory.HELVETICA, 8, COLOR_DARK);

        Paragraph p = new Paragraph();
        p.setLeading(12);
        p.add(new Chunk(label + " ", labelFont));
        p.add(new Chunk(value != null ? value : "—", valFont));
        cell.addElement(p);
    }

    private void addEarningsAndDeductionsTable(Document document, Payslip payslip) throws DocumentException {
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{8f, 22f, 35f, 15f, 20f});
        table.setSpacingAfter(14);

        // Table Header
        String[] headers = {"#", "RULE CODE", "COMPONENT / DESCRIPTION", "CATEGORY", "AMOUNT"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE)));
            cell.setBackgroundColor(COLOR_PRIMARY);
            cell.setBorderColor(COLOR_PRIMARY);
            cell.setPadding(6);
            if (h.equals("AMOUNT")) {
                cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            }
            table.addCell(cell);
        }

        // Table Rows
        int count = 1;
        if (payslip.getLines() != null && !payslip.getLines().isEmpty()) {
            for (PayslipLine line : payslip.getLines()) {
                boolean isDeduction = "DED".equalsIgnoreCase(line.getCategory()) || "TAX".equalsIgnoreCase(line.getCategory());
                Color rowBg = (count % 2 == 0) ? COLOR_LIGHT_BG : Color.WHITE;

                // 1. Seq
                table.addCell(createBodyCell(String.valueOf(line.getSequence() != null ? line.getSequence() : count), rowBg, Element.ALIGN_CENTER, false, null));

                // 2. Rule Code
                table.addCell(createBodyCell(line.getRuleCode() != null ? line.getRuleCode() : "BASIC", rowBg, Element.ALIGN_LEFT, true, null));

                // 3. Name
                table.addCell(createBodyCell(line.getRuleName() != null ? line.getRuleName() : "Salary Component", rowBg, Element.ALIGN_LEFT, false, null));

                // 4. Category
                table.addCell(createBodyCell(line.getCategory() != null ? line.getCategory() : "BASIC", rowBg, Element.ALIGN_CENTER, false, null));

                // 5. Amount
                String amountStr = CURRENCY_FORMAT.format(line.getAmount() != null ? line.getAmount() : BigDecimal.ZERO);
                if (isDeduction) {
                    amountStr = "-" + amountStr;
                }
                Color amtColor = isDeduction ? COLOR_DEDUCTION : COLOR_DARK;
                table.addCell(createBodyCell(amountStr, rowBg, Element.ALIGN_RIGHT, true, amtColor));

                count++;
            }
        } else {
            // Fallback row if lines empty
            Color rowBg = Color.WHITE;
            table.addCell(createBodyCell("1", rowBg, Element.ALIGN_CENTER, false, null));
            table.addCell(createBodyCell("BASIC", rowBg, Element.ALIGN_LEFT, true, null));
            table.addCell(createBodyCell("Basic Monthly Salary", rowBg, Element.ALIGN_LEFT, false, null));
            table.addCell(createBodyCell("BASIC", rowBg, Element.ALIGN_CENTER, false, null));
            table.addCell(createBodyCell(CURRENCY_FORMAT.format(payslip.getGrossSalary()), rowBg, Element.ALIGN_RIGHT, true, COLOR_DARK));
        }

        document.add(table);
    }

    private PdfPCell createBodyCell(String text, Color bg, int align, boolean bold, Color textColor) {
        Color c = textColor != null ? textColor : COLOR_DARK;
        Font font = FontFactory.getFont(bold ? FontFactory.HELVETICA_BOLD : FontFactory.HELVETICA, 8, c);
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setBorderColor(COLOR_BORDER);
        cell.setPadding(6);
        cell.setHorizontalAlignment(align);
        return cell;
    }

    private void addSummarySection(Document document, Payslip payslip) throws DocumentException {
        PdfPTable summaryTable = new PdfPTable(2);
        summaryTable.setWidthPercentage(100);
        summaryTable.setWidths(new float[]{55f, 45f});
        summaryTable.setSpacingAfter(20);

        // Left note cell
        PdfPCell noteCell = new PdfPCell();
        noteCell.setBorder(Rectangle.NO_BORDER);
        noteCell.setPadding(6);

        Font noteHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_PRIMARY);
        noteCell.addElement(new Paragraph("IMPORTANT NOTICE", noteHeader));
        Font noteFont = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, COLOR_MUTED);
        Paragraph noteText = new Paragraph(
                "This document is an official and confidential payroll statement. " +
                "Any discrepancy in worked hours, allocations, or deductions must be reported to the HR & Payroll department within 7 business days.",
                noteFont
        );
        noteText.setSpacingBefore(3);
        noteCell.addElement(noteText);

        // Right totals cell
        PdfPCell totalsCell = new PdfPCell();
        totalsCell.setBackgroundColor(COLOR_SUCCESS_BG);
        totalsCell.setBorderColor(new Color(187, 247, 208));
        totalsCell.setPadding(10);

        BigDecimal gross = payslip.getGrossSalary() != null ? payslip.getGrossSalary() : BigDecimal.ZERO;
        BigDecimal deductions = payslip.getTotalDeductions() != null ? payslip.getTotalDeductions() : BigDecimal.ZERO;
        BigDecimal net = payslip.getNetSalary() != null ? payslip.getNetSalary() : gross.subtract(deductions);

        totalsCell.addElement(createSummaryRow("Total Gross Earnings:", CURRENCY_FORMAT.format(gross), false));
        totalsCell.addElement(createSummaryRow("Total Deductions & Taxes:", "-" + CURRENCY_FORMAT.format(deductions), false));

        Paragraph sep = new Paragraph();
        sep.setSpacingBefore(4);
        sep.setSpacingAfter(4);
        sep.add(new LineSeparator(1f, 100, new Color(187, 247, 208), Element.ALIGN_CENTER, -1));
        totalsCell.addElement(sep);

        Font netLabelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_SUCCESS_TEXT);
        Font netValFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, COLOR_SUCCESS_TEXT);
        Paragraph netRow = new Paragraph();
        netRow.add(new Chunk("NET TAKE-HOME SALARY:  ", netLabelFont));
        netRow.add(new Chunk(CURRENCY_FORMAT.format(net), netValFont));
        totalsCell.addElement(netRow);

        summaryTable.addCell(noteCell);
        summaryTable.addCell(totalsCell);
        document.add(summaryTable);
    }

    private Paragraph createSummaryRow(String label, String value, boolean bold) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_DARK);
        Font valFont = FontFactory.getFont(bold ? FontFactory.HELVETICA_BOLD : FontFactory.HELVETICA, 8, COLOR_DARK);

        Paragraph p = new Paragraph();
        p.setLeading(11);
        p.add(new Chunk(label + " ", labelFont));
        p.add(new Chunk(value, valFont));
        return p;
    }

    private void addFooter(Document document) throws DocumentException {
        Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 7, COLOR_MUTED);
        Paragraph footer = new Paragraph(
                "Generated by PeoplePay360 Operations Platform • Electronically Signed and Secured • Confidential Document",
                footerFont
        );
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingBefore(10);
        document.add(footer);
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.format(DATE_FORMAT) : "—";
    }
}
