package com.odoo.hr.payroll.repository;

import com.odoo.hr.payroll.model.Payrun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayrunRepository extends JpaRepository<Payrun, UUID> {
    List<Payrun> findByStatus(String status);
    List<Payrun> findAllByOrderByPeriodStartDesc();
}
