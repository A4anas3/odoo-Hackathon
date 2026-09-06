package com.odoo.hr.user.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum Role {
    EMPLOYEE("Employee"),
    HR_MANAGER("Hr Manager"),
    HR_PAYROLL_USER("Hr Payroll User"),
    HR_PAYROLL_ADMIN("Hr Payroll Admin"),
    ADMIN("Admin");

    private final String displayName;

    Role(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    public String getAuthority() {
        return "ROLE_" + name();
    }

    @JsonCreator
    public static Role fromString(String value) {
        if (value == null || value.isBlank()) {
            return EMPLOYEE;
        }
        String clean = value.trim().toUpperCase().replace(" ", "_").replace("-", "_").replace("ROLE_", "");
        for (Role role : values()) {
            if (role.name().equalsIgnoreCase(clean) || role.displayName.equalsIgnoreCase(value.trim())) {
                return role;
            }
        }
        // Fallbacks for variations like "PAYROLL_USER" or "PAYROLL_ADMIN"
        if (clean.contains("PAYROLL") && clean.contains("ADMIN")) return HR_PAYROLL_ADMIN;
        if (clean.contains("PAYROLL")) return HR_PAYROLL_USER;
        if (clean.contains("ADMIN")) return ADMIN;
        if (clean.contains("MANAGER")) return HR_MANAGER;
        return EMPLOYEE;
    }
}
