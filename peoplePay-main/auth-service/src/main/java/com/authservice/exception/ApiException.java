package com.authservice.exception;

import org.springframework.http.HttpStatus;

/** Base class for all deliberate, client-facing application exceptions. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
