package com.odoo.hr.user.controller;

import com.odoo.hr.user.dto.CreateUserRequest;
import com.odoo.hr.user.dto.UpdateUserRequest;
import com.odoo.hr.user.dto.UserDto;
import com.odoo.hr.user.model.Role;
import com.odoo.hr.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/admin/users", "/admin/users"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDto>> listUsers(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Role role,
        @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(userService.listUsers(search, role, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDto created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateUserRequest request
    ) {
        UserDto updated = userService.updateUser(id, request);
        return ResponseEntity.ok(updated);
    }
}
