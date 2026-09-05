package com.authservice.exception;

import org.springframework.http.HttpStatus;

public class RoleNotFoundException extends ApiException {
    public RoleNotFoundException(String roleName) {
        super(HttpStatus.NOT_FOUND, "Role '" + roleName + "' not found");
    }
}
