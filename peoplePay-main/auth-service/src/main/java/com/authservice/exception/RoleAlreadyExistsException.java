package com.authservice.exception;

import org.springframework.http.HttpStatus;

public class RoleAlreadyExistsException extends ApiException {
    public RoleAlreadyExistsException(String roleName) {
        super(HttpStatus.CONFLICT, "Role '" + roleName + "' already exists");
    }
}
