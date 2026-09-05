package com.example.downstream.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.PublicKey;
import java.util.List;

/**
 * ============================================================================
 *  DROP-IN JWT VALIDATION FILTER FOR ANY DOWNSTREAM / RESOURCE MICROSERVICE
 * ============================================================================
 *
 * This service does NOT own users or roles. It trusts tokens minted by the
 * central auth-service, verifying them purely with RS256 + the auth-service's
 * PUBLIC key (no shared secret, no network call, no database lookup per request).
 *
 * What this filter does on every request:
 *   1. Reads the "Authorization: Bearer <token>" header.
 *   2. Verifies the RS256 signature using the public key (fails closed if invalid/expired).
 *   3. Reads "sub" (user id) and "roles" claims straight out of the verified token.
 *   4. Populates the SecurityContext so that @PreAuthorize("hasRole('ADMIN')") and friends
 *      work exactly as they would in a monolith.
 *
 * To reuse this in another microservice: copy this class + JwtKeyConfig + RsaPublicKeyLoader
 * + the auth-service's public_key.pem, wire this filter into your SecurityFilterChain
 * (see SecurityConfig in this same project), and you're done — no dependency on
 * auth-service's database or code at runtime.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtValidationFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String CLAIM_ROLES = "roles";

    private final PublicKey jwtVerificationKey;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null) {
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(jwtVerificationKey)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                String userId = claims.getSubject();

                @SuppressWarnings("unchecked")
                List<String> roles = claims.get(CLAIM_ROLES, List.class);

                List<GrantedAuthority> authorities = roles == null ? List.of() : roles.stream()
                        .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role))
                        .toList();

                var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } catch (JwtException | IllegalArgumentException e) {
                // Invalid signature, expired token, malformed token, etc. -> fail closed.
                log.debug("Rejected invalid JWT on downstream service: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTH_HEADER);
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
