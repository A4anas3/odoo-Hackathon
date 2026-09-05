package com.odoo.hr.attendance.service;

import com.odoo.hr.attendance.dto.AttendanceResponse;
import com.odoo.hr.attendance.dto.CheckInRequest;
import com.odoo.hr.attendance.dto.CheckOutRequest;
import com.odoo.hr.attendance.model.Attendance;
import com.odoo.hr.attendance.repository.AttendanceRepository;
import com.odoo.hr.common.exception.ConflictException;
import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.security.CurrentEmployeeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final CurrentEmployeeService currentEmployeeService;

    @Transactional
    public AttendanceResponse checkIn(CheckInRequest request) {
        Employee employee = currentEmployeeService.getCurrentEmployee();
        LocalDate today = LocalDate.now();

        Optional<Attendance> existing = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today);
        if (existing.isPresent()) {
            throw new ConflictException("Employee has already checked in for today: " + today);
        }

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .attendanceDate(today)
                .checkIn(OffsetDateTime.now())
                .scheduledHours(new BigDecimal("8.00"))
                .overtimeHours(BigDecimal.ZERO)
                .lateMinutes(0)
                .status("PRESENT")
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Employee {} checked in at {}", employee.getId(), saved.getCheckIn());
        return AttendanceResponse.fromEntity(saved);
    }

    @Transactional
    public AttendanceResponse checkOut(CheckOutRequest request) {
        Employee employee = currentEmployeeService.getCurrentEmployee();
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndAttendanceDate(employee.getId(), today)
                .orElseThrow(() -> new ResourceNotFoundException("No check-in record found for today: " + today));

        if (attendance.getCheckOut() != null) {
            throw new ConflictException("Employee has already checked out for today: " + today);
        }

        OffsetDateTime checkOutTime = OffsetDateTime.now();
        attendance.setCheckOut(checkOutTime);

        long minutes = Duration.between(attendance.getCheckIn(), checkOutTime).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        attendance.setWorkedHours(hours);

        BigDecimal scheduled = attendance.getScheduledHours() != null ? attendance.getScheduledHours() : new BigDecimal("8.00");
        if (hours.compareTo(scheduled) > 0) {
            attendance.setOvertimeHours(hours.subtract(scheduled));
        }

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Employee {} checked out. Worked hours: {}", employee.getId(), hours);
        return AttendanceResponse.fromEntity(saved);
    }

    @Transactional
    public AttendanceResponse correctAttendance(UUID id, String reason, OffsetDateTime newCheckIn, OffsetDateTime newCheckOut) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found: " + id));

        Employee corrector = currentEmployeeService.getCurrentEmployee();
        attendance.setCorrectionReason(reason);
        attendance.setCorrectedBy(corrector);

        if (newCheckIn != null) attendance.setCheckIn(newCheckIn);
        if (newCheckOut != null) attendance.setCheckOut(newCheckOut);

        if (attendance.getCheckIn() != null && attendance.getCheckOut() != null) {
            long minutes = Duration.between(attendance.getCheckIn(), attendance.getCheckOut()).toMinutes();
            BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            attendance.setWorkedHours(hours);
            BigDecimal scheduled = attendance.getScheduledHours() != null ? attendance.getScheduledHours() : new BigDecimal("8.00");
            if (hours.compareTo(scheduled) > 0) {
                attendance.setOvertimeHours(hours.subtract(scheduled));
            }
        }

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Attendance {} corrected by employee: {}", id, corrector.getId());
        return AttendanceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public AttendanceResponse getTodayAttendance() {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, LocalDate.now())
                .map(AttendanceResponse::fromEntity)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendanceHistory(LocalDate start, LocalDate end) {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return getEmployeeAttendanceHistory(employeeId, start, end);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getEmployeeAttendanceHistory(UUID employeeId, LocalDate start, LocalDate end) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        if (start != null && end != null) {
            return attendanceRepository.findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(employeeId, start, end)
                    .stream()
                    .map(AttendanceResponse::fromEntity)
                    .toList();
        }

        return attendanceRepository.findByEmployeeIdOrderByAttendanceDateDesc(employeeId).stream()
                .map(AttendanceResponse::fromEntity)
                .toList();
    }
}
