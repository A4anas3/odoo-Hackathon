package com.authservice.dto.response;

import lombok.Builder;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

@Builder
public record UserResponse(
        UUID id,
        String email,
        String username,
        boolean enabled,
        boolean emailVerified,
        Set<String> roles,
        Instant createdAt,
        Instant updatedAt
) {
}
