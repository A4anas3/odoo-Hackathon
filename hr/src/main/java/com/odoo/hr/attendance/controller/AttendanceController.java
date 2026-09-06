package com.odoo.hr.attendance.controller;

import com.odoo.hr.attendance.dto.AttendanceResponse;
import com.odoo.hr.attendance.dto.AttendanceSummaryResponse;
import com.odoo.hr.attendance.dto.CheckInRequest;
import com.odoo.hr.attendance.dto.CheckOutRequest;
import com.odoo.hr.attendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping
    public ResponseEntity<?> getAllAttendance(
            @RequestParam(required = false, defaultValue = "false") boolean unpaged,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "false") boolean todayOnly,
            @PageableDefault(page = 0, size = 200, sort = "attendanceDate", direction = Sort.Direction.DESC) Pageable pageable) {
        LocalDate queryDate = todayOnly ? LocalDate.now() : date;
        if (unpaged) {
            return ResponseEntity.ok(attendanceService.getAllAttendance(queryDate, from, to));
        }
        return ResponseEntity.ok(attendanceService.getAllAttendance(queryDate, from, to, pageable));
    }

    @PostMapping("/check-in")
    public ResponseEntity<AttendanceResponse> checkIn(@RequestBody(required = false) CheckInRequest request) {
        AttendanceResponse response = attendanceService.checkIn(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/check-out")
    public ResponseEntity<AttendanceResponse> checkOut(@RequestBody(required = false) CheckOutRequest request) {
        AttendanceResponse response = attendanceService.checkOut(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/today")
    public ResponseEntity<AttendanceResponse> getTodayAttendance() {
        AttendanceResponse response = attendanceService.getTodayAttendance();
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/today/all")
    public ResponseEntity<List<AttendanceResponse>> getTodayAllAttendance() {
        return ResponseEntity.ok(attendanceService.getTodayAllAttendance());
    }

    @GetMapping({"/summary", "/stats"})
    public ResponseEntity<AttendanceSummaryResponse> getAttendanceSummary() {
        return ResponseEntity.ok(attendanceService.getAttendanceSummary());
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyAttendance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "false") boolean todayOnly,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = "200") Integer size) {
        LocalDate queryDate = todayOnly ? LocalDate.now() : date;
        if (page != null) {
            Pageable pageable = PageRequest.of(page, size != null ? size : 200, Sort.by(Sort.Direction.DESC, "attendanceDate"));
            return ResponseEntity.ok(attendanceService.getMyAttendanceHistory(queryDate, from, to, pageable));
        }
        return ResponseEntity.ok(attendanceService.getMyAttendanceHistory(queryDate, from, to));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getEmployeeAttendance(
            @PathVariable UUID employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "false") boolean todayOnly,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = "200") Integer size) {
        LocalDate queryDate = todayOnly ? LocalDate.now() : date;
        if (page != null) {
            Pageable pageable = PageRequest.of(page, size != null ? size : 200, Sort.by(Sort.Direction.DESC, "attendanceDate"));
            return ResponseEntity.ok(attendanceService.getEmployeeAttendanceHistory(employeeId, queryDate, from, to, pageable));
        }
        return ResponseEntity.ok(attendanceService.getEmployeeAttendanceHistory(employeeId, queryDate, from, to));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttendanceResponse> getAttendanceById(@PathVariable UUID id) {
        return ResponseEntity.ok(attendanceService.getAttendanceById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AttendanceResponse> updateAttendance(
            @PathVariable UUID id,
            @RequestBody com.odoo.hr.attendance.dto.AttendanceUpdateRequest request) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, request));
    }

    @PatchMapping("/{id}/correct")
    public ResponseEntity<AttendanceResponse> correctAttendance(
            @PathVariable UUID id,
            @jakarta.validation.Valid @RequestBody com.odoo.hr.attendance.dto.CorrectAttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.correctAttendance(
                id, request.getReason(), request.getNewCheckIn(), request.getNewCheckOut()));
    }
}
