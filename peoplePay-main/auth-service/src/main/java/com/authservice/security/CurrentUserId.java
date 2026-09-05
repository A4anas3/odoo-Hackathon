package com.authservice.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Small helper to pull the authenticated user's id out of the SecurityContext.
 * The JwtAuthenticationFilter sets the principal to the user's UUID directly
 * (see JwtAuthenticationFilter#doFilterInternal), so no extra DB lookup is needed here.
 */
public final class CurrentUserId {

    private CurrentUserId() {
    }

    public static UUID get() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("No authenticated user in security context");
        }
        return (UUID) authentication.getPrincipal();
    }
}
