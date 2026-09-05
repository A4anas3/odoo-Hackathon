package com.authservice.service;

import com.authservice.config.JwtProperties;
import com.authservice.entity.RefreshToken;
import com.authservice.exception.InvalidTokenException;
import com.authservice.repository.RefreshTokenRepository;
import com.authservice.util.TokenHashUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Implements refresh-token ROTATION with reuse detection:
 *   1. Every refresh exchanges the presented token for a brand-new one and immediately
 *      revokes the old one (marking `replacedBy`).
 *   2. All rotated tokens for a login session share the same `familyId`.
 *   3. If a token is presented that is already revoked (i.e. it was already rotated away,
 *      meaning someone is replaying a stolen token), the ENTIRE family is revoked, forcing
 *      re-authentication. This limits the blast radius of a leaked refresh token.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    public record IssuedToken(String rawToken, RefreshToken entity) {}

    @Transactional
    public IssuedToken issueNewFamily(UUID userId) {
        return issueToken(userId, UUID.randomUUID());
    }

    @Transactional
    public IssuedToken rotate(String presentedRawToken) {
        String hash = TokenHashUtil.sha256(presentedRawToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token is invalid"));

        if (existing.isRevoked()) {
            // Reuse of an already-rotated (or already-revoked) token => possible theft.
            log.warn("Refresh token reuse detected for family {} — revoking entire family", existing.getFamilyId());
            refreshTokenRepository.revokeAllByFamilyId(existing.getFamilyId(), Instant.now());
            throw new InvalidTokenException("Refresh token reuse detected; all sessions revoked. Please log in again");
        }

        if (existing.isExpired()) {
            throw new InvalidTokenException("Refresh token has expired");
        }

        // Revoke the presented token and issue a new one in the same family.
        existing.setRevoked(true);
        existing.setRevokedAt(Instant.now());

        IssuedToken next = issueToken(existing.getUserId(), existing.getFamilyId());
        existing.setReplacedBy(next.entity().getId());
        refreshTokenRepository.save(existing);

        return next;
    }

    @Transactional
    public void revoke(String presentedRawToken) {
        String hash = TokenHashUtil.sha256(presentedRawToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            token.setRevoked(true);
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);
        });
    }

    @Transactional
    public void revokeAllForUser(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId, Instant.now());
    }

    public UUID resolveUserId(String presentedRawToken) {
        String hash = TokenHashUtil.sha256(presentedRawToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token is invalid"));
        if (!token.isActive()) {
            throw new InvalidTokenException("Refresh token is no longer active");
        }
        return token.getUserId();
    }

    private IssuedToken issueToken(UUID userId, UUID familyId) {
        String rawToken = TokenHashUtil.generateOpaqueToken();
        String hash = TokenHashUtil.sha256(rawToken);

        RefreshToken entity = RefreshToken.builder()
                .userId(userId)
                .tokenHash(hash)
                .familyId(familyId)
                .expiresAt(Instant.now().plus(jwtProperties.getRefreshTokenExpDays(), ChronoUnit.DAYS))
                .build();

        RefreshToken saved = refreshTokenRepository.save(entity);
        return new IssuedToken(rawToken, saved);
    }
}
