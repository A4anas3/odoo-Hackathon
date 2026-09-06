package com.odoo.hr.attendance.repository;

import com.odoo.hr.attendance.model.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    Optional<Attendance> findByEmployeeIdAndAttendanceDate(UUID employeeId, LocalDate attendanceDate);

    @EntityGraph(attributePaths = {"employee", "employee.workingSchedule", "correctedBy"})
    Page<Attendance> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"employee", "employee.workingSchedule", "correctedBy"})
    Page<Attendance> findByAttendanceDate(LocalDate attendanceDate, Pageable pageable);

    @EntityGraph(attributePaths = {"employee", "employee.workingSchedule", "correctedBy"})
    List<Attendance> findByAttendanceDateOrderByCheckInDesc(LocalDate attendanceDate);

    @EntityGraph(attributePaths = {"employee", "employee.workingSchedule", "correctedBy"})
    Page<Attendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    @EntityGraph(attributePaths = {"employee", "employee.workingSchedule", "correctedBy"})
    List<Attendance> findByAttendanceDateBetweenOrderByAttendanceDateDesc(LocalDate startDate, LocalDate endDate);

    @EntityGraph(attributePaths = {"employee", "employee.workingSchedule", "correctedBy"})
    Page<Attendance> findByEmployeeId(UUID employeeId, Pageable pageable);

    @EntityGraph(attributePaths = {"employee", "employee.workingSchedule", "correctedBy"})
    Page<Attendance> findByEmployeeIdAndAttendanceDate(UUID employeeId, LocalDate attendanceDate, Pageable pageable);

    @EntityGraph(attributePaths = {"employee", "employee.workingSchedule", "correctedBy"})
    Page<Attendance> findByEmployeeIdAndAttendanceDateBetween(
            UUID employeeId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    List<Attendance> findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
            UUID employeeId, LocalDate startDate, LocalDate endDate);

    List<Attendance> findByEmployeeIdOrderByAttendanceDateDesc(UUID employeeId);

    long countByAttendanceDateAndStatus(LocalDate attendanceDate, String status);

    long countByAttendanceDate(LocalDate attendanceDate);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(a.attendanceDate) FROM Attendance a")
    LocalDate findLatestAttendanceDate();

    @org.springframework.data.jpa.repository.Query("""
        SELECT a FROM Attendance a
        WHERE a.employee.id = :employeeId
          AND a.attendanceDate >= :startDate
          AND a.attendanceDate <= :endDate
          AND (a.payslip IS NULL OR a.payslip.id = :payslipId)
          AND (a.isPaid IS NULL OR a.isPaid = false)
        ORDER BY a.attendanceDate ASC
    """)
    List<Attendance> findUnpaidOrCurrentPayslipAttendances(
            @org.springframework.data.repository.query.Param("employeeId") UUID employeeId,
            @org.springframework.data.repository.query.Param("payslipId") UUID payslipId,
            @org.springframework.data.repository.query.Param("startDate") LocalDate startDate,
            @org.springframework.data.repository.query.Param("endDate") LocalDate endDate);

    List<Attendance> findByPayslipId(UUID payslipId);
}
