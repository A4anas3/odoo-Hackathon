package com.odoo.hr.attendance.service;

import com.odoo.hr.attendance.dto.AttendanceResponse;
import com.odoo.hr.attendance.dto.AttendanceSummaryResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        if (employee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new ConflictException("Inactive, suspended, or terminated employees cannot check in. Current employment status: " + (employee.getStatus() != null ? employee.getStatus() : "UNKNOWN"));
        }

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
                .notes("System generated from check in/out.")
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Employee {} checked in at {}", employee.getId(), saved.getCheckIn());
        return AttendanceResponse.fromEntity(saved);
    }

    @Transactional
    public AttendanceResponse checkOut(CheckOutRequest request) {
        Employee employee = currentEmployeeService.getCurrentEmployee();

        if (employee.getStatus() == null || !"ACTIVE".equalsIgnoreCase(employee.getStatus())) {
            throw new ConflictException("Inactive, suspended, or terminated employees cannot check out. Current employment status: " + (employee.getStatus() != null ? employee.getStatus() : "UNKNOWN"));
        }

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
    public List<AttendanceResponse> getTodayAllAttendance() {
        return attendanceRepository.findByAttendanceDateOrderByCheckInDesc(LocalDate.now()).stream()
                .map(AttendanceResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendanceHistory(LocalDate start, LocalDate end) {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return getEmployeeAttendanceHistory(employeeId, null, start, end);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendanceHistory(LocalDate date, LocalDate start, LocalDate end) {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return getEmployeeAttendanceHistory(employeeId, date, start, end);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> getMyAttendanceHistory(LocalDate start, LocalDate end, Pageable pageable) {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return getEmployeeAttendanceHistory(employeeId, null, start, end, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> getMyAttendanceHistory(LocalDate date, LocalDate start, LocalDate end, Pageable pageable) {
        UUID employeeId = currentEmployeeService.getCurrentEmployeeId();
        return getEmployeeAttendanceHistory(employeeId, date, start, end, pageable);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getEmployeeAttendanceHistory(UUID employeeId, LocalDate start, LocalDate end) {
        return getEmployeeAttendanceHistory(employeeId, null, start, end);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getEmployeeAttendanceHistory(UUID employeeId, LocalDate date, LocalDate start, LocalDate end) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        if (date != null) {
            return attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, date)
                    .map(AttendanceResponse::fromEntity)
                    .map(List::of)
                    .orElseGet(List::of);
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

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> getEmployeeAttendanceHistory(UUID employeeId, LocalDate start, LocalDate end, Pageable pageable) {
        return getEmployeeAttendanceHistory(employeeId, null, start, end, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> getEmployeeAttendanceHistory(UUID employeeId, LocalDate date, LocalDate start, LocalDate end, Pageable pageable) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Employee not found with id: " + employeeId);
        }

        if (date != null) {
            return attendanceRepository.findByEmployeeIdAndAttendanceDate(employeeId, date, pageable)
                    .map(AttendanceResponse::fromEntity);
        }

        if (start != null && end != null) {
            return attendanceRepository.findByEmployeeIdAndAttendanceDateBetween(employeeId, start, end, pageable)
                    .map(AttendanceResponse::fromEntity);
        }

        return attendanceRepository.findByEmployeeId(employeeId, pageable)
                .map(AttendanceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> getAllAttendance(Pageable pageable) {
        return attendanceRepository.findAll(pageable)
                .map(AttendanceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> getAllAttendance(LocalDate date, LocalDate start, LocalDate end, Pageable pageable) {
        if (date != null) {
            return attendanceRepository.findByAttendanceDate(date, pageable)
                    .map(AttendanceResponse::fromEntity);
        }
        if (start != null && end != null) {
            return attendanceRepository.findByAttendanceDateBetween(start, end, pageable)
                    .map(AttendanceResponse::fromEntity);
        }
        return attendanceRepository.findAll(pageable)
                .map(AttendanceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAllAttendance() {
        return attendanceRepository.findAll().stream()
                .sorted((a, b) -> b.getAttendanceDate().compareTo(a.getAttendanceDate()))
                .map(AttendanceResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAllAttendance(LocalDate date, LocalDate start, LocalDate end) {
        if (date != null) {
            return attendanceRepository.findByAttendanceDateOrderByCheckInDesc(date).stream()
                    .map(AttendanceResponse::fromEntity)
                    .toList();
        }
        if (start != null && end != null) {
            return attendanceRepository.findByAttendanceDateBetweenOrderByAttendanceDateDesc(start, end).stream()
                    .map(AttendanceResponse::fromEntity)
                    .toList();
        }
        return getAllAttendance();
    }

    @Transactional(readOnly = true)
    public AttendanceResponse getAttendanceById(UUID id) {
        return attendanceRepository.findById(id)
                .map(AttendanceResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id));
    }

    @Transactional
    public AttendanceResponse updateAttendance(UUID id, com.odoo.hr.attendance.dto.AttendanceUpdateRequest request) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found: " + id));

        if (request.getCheckIn() != null) attendance.setCheckIn(request.getCheckIn());
        if (request.getCheckOut() != null) attendance.setCheckOut(request.getCheckOut());
        if (request.getStatus() != null && !request.getStatus().isBlank()) attendance.setStatus(request.getStatus().toUpperCase());
        if (request.getNotes() != null) attendance.setNotes(request.getNotes());
        if (request.getCorrectionReason() != null && !request.getCorrectionReason().isBlank()) {
            attendance.setCorrectionReason(request.getCorrectionReason());
            try {
                attendance.setCorrectedBy(currentEmployeeService.getCurrentEmployee());
            } catch (Exception ignored) {}
        }

        if (attendance.getCheckIn() != null && attendance.getCheckOut() != null) {
            long minutes = Duration.between(attendance.getCheckIn(), attendance.getCheckOut()).toMinutes();
            BigDecimal hours = BigDecimal.valueOf(Math.max(0, minutes))
                    .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            attendance.setWorkedHours(hours);
            BigDecimal scheduled = attendance.getScheduledHours() != null ? attendance.getScheduledHours() : new BigDecimal("8.00");
            if (hours.compareTo(scheduled) > 0) {
                attendance.setOvertimeHours(hours.subtract(scheduled));
            } else {
                attendance.setOvertimeHours(BigDecimal.ZERO);
            }
        }

        Attendance saved = attendanceRepository.save(attendance);
        log.info("Attendance record {} updated. Worked hours: {}, Status: {}", id, saved.getWorkedHours(), saved.getStatus());
        return AttendanceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public AttendanceSummaryResponse getAttendanceSummary() {
        LocalDate today = LocalDate.now();
        long presentCount = attendanceRepository.countByAttendanceDateAndStatus(today, "PRESENT");
        LocalDate targetDate = today;

        if (presentCount == 0 && attendanceRepository.countByAttendanceDate(today) == 0) {
            LocalDate latest = attendanceRepository.findLatestAttendanceDate();
            if (latest != null) {
                targetDate = latest;
                presentCount = attendanceRepository.countByAttendanceDateAndStatus(latest, "PRESENT");
            }
        }

        long activeEmployees = employeeRepository.countByStatus("ACTIVE");
        long totalEmployees = employeeRepository.count();
        long baseCount = activeEmployees > 0 ? activeEmployees : totalEmployees;

        int rate = baseCount > 0 ? (int) Math.min(100, Math.round(((double) presentCount / baseCount) * 100.0)) : 0;
        long absent = Math.max(0, baseCount - presentCount);

        return AttendanceSummaryResponse.builder()
                .totalEmployees(totalEmployees)
                .activeEmployees(activeEmployees)
                .presentToday(presentCount)
                .absentToday(absent)
                .attendanceRate(rate)
                .date(targetDate)
                .build();
    }
}
