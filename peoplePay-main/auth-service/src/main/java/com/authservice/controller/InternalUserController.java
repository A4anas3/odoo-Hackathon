package com.authservice.controller;

import com.authservice.dto.response.UserResponse;
import com.authservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserService userService;

    @PatchMapping("/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @RequestParam String email,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) Boolean accountLocked) {
        log.info("Internal request to update user status for {}: enabled={}, accountLocked={}", email, enabled, accountLocked);
        return ResponseEntity.ok(userService.updateStatusByEmail(email, enabled, accountLocked));
    }
}
