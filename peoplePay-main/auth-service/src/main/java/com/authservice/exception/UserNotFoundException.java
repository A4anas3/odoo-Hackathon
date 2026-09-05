package com.authservice.exception;

import org.springframework.http.HttpStatus;

import java.util.UUID;

public class UserNotFoundException extends ApiException {
    public UserNotFoundException(UUID userId) {
        super(HttpStatus.NOT_FOUND, "User with id '" + userId + "' not found");
    }
    public UserNotFoundException(String identifier) {
        super(HttpStatus.NOT_FOUND, "User '" + identifier + "' not found");
    }
}
