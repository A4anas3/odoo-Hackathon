package com.authservice.controller;

import com.authservice.dto.request.AssignRoleRequest;
import com.authservice.dto.request.CreateRoleRequest;
import com.authservice.dto.response.RoleResponse;
import com.authservice.dto.response.UserResponse;
import com.authservice.service.RoleService;
import com.authservice.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * All endpoints here require the ADMIN role. This is enforced in two layers,
 * defense-in-depth style:
 *   1. SecurityConfig: .requestMatchers("/admin/**").hasRole("ADMIN")
 *   2. Method-level @PreAuthorize on each handler
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final RoleService roleService;

    @PostMapping("/roles")
    public ResponseEntity<RoleResponse> createRole(@Valid @RequestBody CreateRoleRequest request) {
        RoleResponse response = roleService.createRole(request.name(), request.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/roles")
    public ResponseEntity<List<RoleResponse>> listRoles() {
        return ResponseEntity.ok(roleService.listAll());
    }

    @PostMapping("/users/{userId}/roles")
    public ResponseEntity<UserResponse> assignRole(@PathVariable UUID userId,
                                                     @Valid @RequestBody AssignRoleRequest request) {
        return ResponseEntity.ok(userService.assignRole(userId, request.roleName()));
    }

    @DeleteMapping("/users/{userId}/roles/{roleName}")
    public ResponseEntity<UserResponse> removeRole(@PathVariable UUID userId,
                                                     @PathVariable String roleName) {
        return ResponseEntity.ok(userService.removeRole(userId, roleName));
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserResponse>> listUsers(Pageable pageable) {
        return ResponseEntity.ok(userService.listUsers(pageable));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.toResponse(userService.getById(userId)));
    }
}
