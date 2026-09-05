package com.odoo.hr.attendance.repository;

import com.odoo.hr.attendance.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    Optional<Attendance> findByEmployeeIdAndAttendanceDate(UUID employeeId, LocalDate attendanceDate);

    List<Attendance> findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
            UUID employeeId, LocalDate startDate, LocalDate endDate);

    List<Attendance> findByEmployeeIdOrderByAttendanceDateDesc(UUID employeeId);
}
