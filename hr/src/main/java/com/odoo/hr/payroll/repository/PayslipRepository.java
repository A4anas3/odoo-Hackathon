package com.odoo.hr.payroll.repository;

import com.odoo.hr.payroll.model.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {

    List<Payslip> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    List<Payslip> findByPayrunId(UUID payrunId);

    Optional<Payslip> findByEmployeeIdAndPeriodStartAndPeriodEnd(UUID employeeId, LocalDate periodStart, LocalDate periodEnd);

    boolean existsByEmployeeIdAndPeriodStartAndPeriodEnd(UUID employeeId, LocalDate periodStart, LocalDate periodEnd);
}
