package com.odoo.hr.payroll.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.odoo.hr.payroll.dto.PayslipResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class PayslipRedisCacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String KEY_PREFIX = "payslip:filter:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);

    public PayslipRedisCacheService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    private String buildCacheKey(String scope, UUID payrunId, String department, String month, Integer year, String search, String status) {
        return String.format("%s%s:%s:%s:%s:%s:%s:%s",
                KEY_PREFIX,
                scope != null ? scope : "all",
                payrunId != null ? payrunId.toString() : "none",
                department != null ? department.trim().toLowerCase() : "none",
                month != null ? month.trim().toLowerCase() : "none",
                year != null ? year.toString() : "none",
                search != null ? search.trim().toLowerCase() : "none",
                status != null ? status.trim().toUpperCase() : "none");
    }

    /**
     * Retrieve cached filtered payslips from Redis
     */
    public List<PayslipResponse> getCachedPayslips(
            String scope, UUID payrunId, String department, String month, Integer year, String search, String status) {
        try {
            String key = buildCacheKey(scope, payrunId, department, month, year, search, status);
            String json = redisTemplate.opsForValue().get(key);
            if (json != null && !json.isBlank()) {
                log.info("Redis cache HIT for key: {}", key);
                return objectMapper.readValue(json, new TypeReference<List<PayslipResponse>>() {});
            }
            log.info("Redis cache MISS for key: {}", key);
        } catch (Exception e) {
            log.warn("Redis error reading cache for payslips: {}. Falling back to DB.", e.getMessage());
        }
        return null;
    }

    /**
     * Store filtered payslips in Redis with TTL
     */
    public void putCachedPayslips(
            String scope, UUID payrunId, String department, String month, Integer year, String search, String status, List<PayslipResponse> response) {
        try {
            String key = buildCacheKey(scope, payrunId, department, month, year, search, status);
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, json, CACHE_TTL);
            log.info("Redis cache SAVED for key: {} (expires in {} min, count={})", key, CACHE_TTL.toMinutes(), response != null ? response.size() : 0);
        } catch (Exception e) {
            log.warn("Redis error storing cache for payslips: {}", e.getMessage());
        }
    }

    /**
     * Revoke all payslip Redis cache keys (on payrun/payslip creation, modification, or payment)
     */
    public void revokeAll() {
        try {
            Set<String> keys = redisTemplate.keys(KEY_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Redis: REVOKED ALL payslip cache keys (count={})", keys.size());
            } else {
                log.info("Redis: Revoke all requested - no active payslip keys found.");
            }
        } catch (Exception e) {
            log.warn("Redis error during revokeAll payslip cache: {}", e.getMessage());
        }
    }
}
