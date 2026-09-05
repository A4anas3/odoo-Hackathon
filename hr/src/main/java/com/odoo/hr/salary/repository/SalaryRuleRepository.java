package com.odoo.hr.salary.repository;

import com.odoo.hr.salary.model.SalaryRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SalaryRuleRepository extends JpaRepository<SalaryRule, UUID> {
    List<SalaryRule> findBySalaryStructureIdOrderBySequenceAsc(UUID salaryStructureId);
}
