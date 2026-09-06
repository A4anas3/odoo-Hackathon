package com.odoo.hr.security;

import com.odoo.hr.user.model.Role;
import com.odoo.hr.user.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long expirationMs;
    private final long refreshExpirationMs;

    public JwtTokenProvider(
        @Value("${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}") String secret,
        @Value("${app.jwt.expiration-ms:86400000}") long expirationMs,
        @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    /**
     * Generates a completely stateless JWT access token containing user identities and roles.
     * No token is stored in the database.
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        List<String> authorities = user.getRoles() != null
            ? user.getRoles().stream().map(Role::getAuthority).collect(Collectors.toList())
            : List.of("ROLE_EMPLOYEE");

        var builder = Jwts.builder()
            .subject(user.getEmail())
            .claim("userId", user.getId().toString())
            .claim("email", user.getEmail())
            .claim("roles", authorities)
            .claim("status", user.getStatus())
            .claim("tokenType", "ACCESS")
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key);

        if (user.getEmployee() != null) {
            builder.claim("employeeId", user.getEmployee().getId().toString());
            if (user.getEmployee().getEmployeeCode() != null) {
                builder.claim("employeeCode", user.getEmployee().getEmployeeCode());
            }
        }

        return builder.compact();
    }

    /**
     * Generates a stateless Refresh Token without storing anything in database tables.
     * Valid for 7 days by default.
     */
    public String generateRefreshToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshExpirationMs);

        return Jwts.builder()
            .subject(user.getEmail())
            .claim("userId", user.getId().toString())
            .claim("tokenType", "REFRESH")
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(key)
            .compact();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            String tokenType = claims.get("tokenType", String.class);
            if ("REFRESH".equalsIgnoreCase(tokenType)) {
                log.warn("Refresh token used as access token for subject: {}", claims.getSubject());
                return false;
            }
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.warn("Expired JWT token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            String tokenType = claims.get("tokenType", String.class);
            return "REFRESH".equalsIgnoreCase(tokenType);
        } catch (SecurityException | MalformedJwtException e) {
            log.warn("Invalid refresh token signature: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.warn("Expired refresh token: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("Unsupported refresh token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Refresh token claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String getEmailFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public Authentication getAuthentication(String token) {
        Claims claims = getClaims(token);

        List<?> rolesRaw = claims.get("roles", List.class);
        Collection<? extends GrantedAuthority> authorities;

        if (rolesRaw != null) {
            authorities = rolesRaw.stream()
                .map(r -> new SimpleGrantedAuthority(r.toString()))
                .collect(Collectors.toList());
        } else {
            authorities = List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"));
        }

        org.springframework.security.core.userdetails.User principal =
            new org.springframework.security.core.userdetails.User(
                claims.getSubject(),
                "",
                authorities
            );

        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }
}
