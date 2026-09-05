package com.example.downstream.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Demonstrates how a downstream (resource) microservice enforces RBAC using ONLY
 * the roles embedded in the JWT — no call back to auth-service, no local users table.
 */
@RestController
@RequestMapping("/orders")
public class OrderController {

    // Open to any authenticated user, regardless of role.
    @GetMapping
    public Map<String, Object> listOrders(Authentication authentication) {
        return Map.of(
                "userId", authentication.getName(),
                "orders", java.util.List.of("order-1", "order-2")
        );
    }

    // Requires the ADMIN role — exactly the same annotation you'd use in a monolith.
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin-report")
    public Map<String, Object> adminReport(Authentication authentication) {
        return Map.of(
                "userId", authentication.getName(),
                "report", "confidential admin-only sales report"
        );
    }

    // Requires EITHER role — hasAnyRole works the same way as in a normal Spring Security app.
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @GetMapping("/manager-dashboard")
    public Map<String, Object> managerDashboard(Authentication authentication) {
        return Map.of(
                "userId", authentication.getName(),
                "dashboard", "manager-level metrics"
        );
    }
}
