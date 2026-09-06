package com.odoo.hr.contract.repository;

import com.odoo.hr.contract.model.Contract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {

    List<Contract> findByEmployeeId(UUID employeeId);

    List<Contract> findByEmployeeIdOrderByStartDateDesc(UUID employeeId);

    Optional<Contract> findFirstByEmployeeIdAndStatus(UUID employeeId, String status);

    List<Contract> findByStatus(String status);

    long countBySalaryStructureId(UUID salaryStructureId);

    List<Contract> findByStatusIn(List<String> statuses);

    @Query("SELECT c FROM Contract c WHERE c.employee.id = :employeeId " +
           "AND c.startDate <= :periodEnd " +
           "AND (c.endDate IS NULL OR c.endDate >= :periodStart) " +
           "ORDER BY CASE WHEN UPPER(c.status) = 'RUNNING' THEN 0 ELSE 1 END, c.startDate DESC")
    List<Contract> findApplicableContractsForPeriod(
            @Param("employeeId") UUID employeeId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd
    );

    @Query("""
        SELECT 
            COALESCE(d.name, 'General'),
            SUM(c.salary),
            COUNT(c.id)
        FROM Contract c
        JOIN c.employee e
        LEFT JOIN e.department d
        WHERE UPPER(c.status) IN ('RUNNING', 'ACTIVE')
        GROUP BY COALESCE(d.name, 'General')
        ORDER BY SUM(c.salary) DESC
    """)
    List<Object[]> getRawSalaryDistributionByDepartment();
}
