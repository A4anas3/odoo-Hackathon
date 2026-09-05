package com.odoo.hr.payroll.repository;

import com.odoo.hr.payroll.model.PayslipLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayslipLineRepository extends JpaRepository<PayslipLine, UUID> {
    List<PayslipLine> findByPayslipIdOrderBySequenceAsc(UUID payslipId);
}
