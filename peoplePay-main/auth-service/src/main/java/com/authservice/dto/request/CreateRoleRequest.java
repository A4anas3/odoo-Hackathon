package com.authservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateRoleRequest(

        @NotBlank(message = "Role name is required")
        @Size(max = 50)
        String name,

        @Size(max = 255)
        String description
) {
}
