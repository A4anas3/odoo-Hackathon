package com.odoo.hr.payroll.repository;

import com.odoo.hr.payroll.model.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {

    List<Payslip> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    @Query("SELECT s FROM Payslip s WHERE s.payrun.id = :payrunId ORDER BY s.createdAt DESC")
    List<Payslip> findByPayrunId(@Param("payrunId") UUID payrunId);

    @Query("SELECT s FROM Payslip s WHERE s.payrun.id = :payrunId ORDER BY s.createdAt DESC")
    List<Payslip> findByPayrunIdOrderByCreatedAtDesc(@Param("payrunId") UUID payrunId);

    @Query("SELECT s FROM Payslip s WHERE s.periodStart <= :endDate AND s.periodEnd >= :startDate ORDER BY s.createdAt DESC")
    List<Payslip> findByPeriodBetweenOrderByCreatedAtDesc(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT s FROM Payslip s WHERE s.periodStart <= :endDate AND s.periodEnd >= :startDate AND LOWER(s.employee.department.name) = LOWER(:departmentName) ORDER BY s.createdAt DESC")
    List<Payslip> findByPeriodBetweenAndDepartmentNameOrderByCreatedAtDesc(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("departmentName") String departmentName);

    Optional<Payslip> findByEmployeeIdAndPeriodStartAndPeriodEnd(UUID employeeId, LocalDate periodStart, LocalDate periodEnd);

    List<Payslip> findAllByOrderByCreatedAtDesc();

    List<Payslip> findByPeriodStartAndPeriodEndOrderByCreatedAtDesc(LocalDate periodStart, LocalDate periodEnd);

    boolean existsByEmployeeIdAndPeriodStartAndPeriodEnd(UUID employeeId, LocalDate periodStart, LocalDate periodEnd);

    @Query("SELECT s FROM Payslip s WHERE LOWER(s.employee.department.name) = LOWER(:departmentName) ORDER BY s.createdAt DESC")
    List<Payslip> findByDepartmentNameOrderByCreatedAtDesc(@Param("departmentName") String departmentName);

    @Query("SELECT s FROM Payslip s WHERE s.payrun.id = :payrunId AND LOWER(s.employee.department.name) = LOWER(:departmentName) ORDER BY s.createdAt DESC")
    List<Payslip> findByPayrunIdAndDepartmentNameOrderByCreatedAtDesc(
            @Param("payrunId") UUID payrunId,
            @Param("departmentName") String departmentName);

    @Query("""
        SELECT 
            COALESCE(d.name, 'General'),
            SUM(COALESCE(s.netSalary, s.grossSalary, 0)),
            COUNT(s.id)
        FROM Payslip s
        JOIN s.employee e
        LEFT JOIN e.department d
        WHERE UPPER(s.status) = 'PAID' OR (s.payrun IS NOT NULL AND UPPER(s.payrun.status) = 'PAID')
        GROUP BY COALESCE(d.name, 'General')
        ORDER BY SUM(COALESCE(s.netSalary, s.grossSalary, 0)) DESC
    """)
    List<Object[]> getPaidSalaryDistributionByDepartment();
}

