package com.authservice.service;

import com.authservice.config.JwtProperties;
import com.authservice.dto.request.*;
import com.authservice.dto.response.TokenResponse;
import com.authservice.dto.response.UserResponse;
import com.authservice.entity.PasswordResetToken;
import com.authservice.entity.Role;
import com.authservice.entity.User;
import com.authservice.exception.AccountDisabledException;
import com.authservice.exception.InvalidCredentialsException;
import com.authservice.exception.InvalidTokenException;
import com.authservice.repository.PasswordResetTokenRepository;
import com.authservice.security.JwtTokenProvider;
import com.authservice.util.TokenHashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtProperties jwtProperties;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        User user = userService.createUser(request.email(), request.username(), request.password());
        log.info("Registered new user: {}", user.getId());
        return userService.toResponse(user);
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException();
        }

        User user = userService.getByEmail(request.email());
        if (!user.isEnabled()) {
            throw new AccountDisabledException();
        }

        return issueTokenPair(user);
    }

    @Transactional
    public TokenResponse refresh(RefreshTokenRequest request) {
        RefreshTokenService.IssuedToken rotated = refreshTokenService.rotate(request.refreshToken());
        User user = userService.getById(rotated.entity().getUserId());

        List<String> roles = user.getRoles().stream().map(Role::getName).toList();
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roles);

        return TokenResponse.of(accessToken, rotated.rawToken(), jwtTokenProvider.getAccessTokenExpirySeconds());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenService.revoke(rawRefreshToken);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userService.getById(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        userService.changePassword(userId, request.newPassword());
        // Invalidate all existing sessions after a password change.
        refreshTokenService.revokeAllForUser(userId);
        log.info("Password changed for user: {}", userId);
    }

    /**
     * Always returns silently whether or not the email exists, to avoid leaking which
     * emails are registered. In a real deployment the raw token would be emailed to the
     * user via a separate notification service — never returned in the API response.
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        return userService.getByEmailSafe(request.email())
                .map(user -> {
                    String rawToken = TokenHashUtil.generateOpaqueToken();
                    PasswordResetToken resetToken = PasswordResetToken.builder()
                            .userId(user.getId())
                            .tokenHash(TokenHashUtil.sha256(rawToken))
                            .expiresAt(Instant.now().plus(30, ChronoUnit.MINUTES))
                            .build();
                    passwordResetTokenRepository.save(resetToken);
                    log.info("Password reset requested for user: {}", user.getId());
                    return rawToken; // demo only — send via email in production, don't return over API
                })
                .orElse(null);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String hash = TokenHashUtil.sha256(request.token());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Password reset token is invalid"));

        if (!resetToken.isValid()) {
            throw new InvalidTokenException("Password reset token has expired or was already used");
        }

        userService.changePassword(resetToken.getUserId(), request.newPassword());
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);
        refreshTokenService.revokeAllForUser(resetToken.getUserId());
    }

    public UserResponse getCurrentUser(UUID userId) {
        return userService.toResponse(userService.getById(userId));
    }

    private TokenResponse issueTokenPair(User user) {
        List<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toList());
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roles);
        RefreshTokenService.IssuedToken refreshToken = refreshTokenService.issueNewFamily(user.getId());
        return TokenResponse.of(accessToken, refreshToken.rawToken(), jwtTokenProvider.getAccessTokenExpirySeconds());
    }
}
