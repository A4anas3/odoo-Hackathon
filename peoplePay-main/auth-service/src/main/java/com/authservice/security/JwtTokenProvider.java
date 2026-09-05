package com.authservice.security;

import com.authservice.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.SignatureException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.PrivateKey;
import java.security.PublicKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Responsible ONLY for encoding/decoding + signature verification of access tokens.
 * This is the class that downstream (resource) services replicate on their side
 * using only the PUBLIC key (see downstream-service-example).
 */
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_TOKEN_TYPE = "type";
    private static final String TOKEN_TYPE_ACCESS = "access";

    private final PrivateKey jwtSigningKey;
    private final PublicKey jwtVerificationKey;
    private final JwtProperties jwtProperties;

    /**
     * Builds a short-lived RS256 access token carrying the user's id (sub), email and roles.
     * Example payload: { "sub": "user123", "email": "user@example.com", "roles": ["ADMIN","USER"] }
     */
    public String generateAccessToken(UUID userId, String email, List<String> roles) {
        Instant now = Instant.now();
        Instant expiry = now.plus(jwtProperties.getAccessTokenExpMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_EMAIL, email)
                .claim(CLAIM_ROLES, roles)
                .claim(CLAIM_TOKEN_TYPE, TOKEN_TYPE_ACCESS)
                .issuer(jwtProperties.getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .id(UUID.randomUUID().toString())
                .signWith(jwtSigningKey, Jwts.SIG.RS256)
                .compact();
    }

    public long getAccessTokenExpirySeconds() {
        return jwtProperties.getAccessTokenExpMinutes() * 60;
    }

    /** Parses and verifies signature/expiry; throws JwtException subtype on any failure. */
    public Claims parseAndValidate(String token) {
        return Jwts.parser()
                .verifyWith(jwtVerificationKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseAndValidate(token);
            return true;
        } catch (ExpiredJwtException | SignatureException | JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseAndValidate(token).getSubject());
    }

    public String extractEmail(String token) {
        return parseAndValidate(token).get(CLAIM_EMAIL, String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Claims claims = parseAndValidate(token);
        return claims.get(CLAIM_ROLES, List.class);
    }
}
