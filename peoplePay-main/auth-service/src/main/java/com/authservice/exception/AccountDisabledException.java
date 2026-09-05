package com.authservice.exception;

import org.springframework.http.HttpStatus;

public class AccountDisabledException extends ApiException {
    public AccountDisabledException() {
        super(HttpStatus.FORBIDDEN, "This account has been disabled");
    }
}
