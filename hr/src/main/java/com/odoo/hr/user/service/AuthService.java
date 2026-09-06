package com.odoo.hr.user.service;

import com.odoo.hr.common.exception.ConflictException;
import com.odoo.hr.common.exception.ResourceNotFoundException;
import com.odoo.hr.security.JwtTokenProvider;
import com.odoo.hr.user.dto.AuthResponse;
import com.odoo.hr.user.dto.LoginRequest;
import com.odoo.hr.user.dto.UserDto;
import com.odoo.hr.user.model.User;
import com.odoo.hr.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new ConflictException("User account is inactive or locked. Please contact your administrator.");
        }

        String token = jwtTokenProvider.generateToken(user);
        log.info("User {} successfully authenticated with roles {}", user.getEmail(), user.getRoles());

        return AuthResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .user(UserDto.fromEntity(user))
            .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        if (email == null || email.isBlank()) {
            throw new ResourceNotFoundException("Unauthenticated user session");
        }
        User user = userRepository.findByEmailIgnoreCase(email.trim())
            .orElseThrow(() -> new ResourceNotFoundException("User profile not found for email: " + email));
        return UserDto.fromEntity(user);
    }
}
