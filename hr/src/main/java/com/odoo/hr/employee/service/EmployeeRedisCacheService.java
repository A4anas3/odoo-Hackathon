package com.odoo.hr.employee.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.odoo.hr.common.dto.PagedResponse;
import com.odoo.hr.employee.dto.EmployeeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Set;

@Slf4j
@Service
public class EmployeeRedisCacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String KEY_PREFIX = "employee:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);

    public EmployeeRedisCacheService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    private String buildCacheKey(int page, int size, String sort, String search, String department, String status, String type) {
        return String.format("%spage:%d:%d:%s:%s:%s:%s:%s",
                KEY_PREFIX,
                page,
                size,
                sort != null ? sort.replaceAll("\\s+", "_") : "default",
                search != null ? search.trim().toLowerCase() : "",
                department != null ? department.trim().toLowerCase() : "",
                status != null ? status.trim().toUpperCase() : "",
                type != null ? type.trim().toUpperCase() : "");
    }

    /**
     * Retrieve cached paginated employees from Redis
     */
    public PagedResponse<EmployeeResponse> getCachedPage(
            int page, int size, String sort, String search, String department, String status, String type) {
        try {
            String key = buildCacheKey(page, size, sort, search, department, status, type);
            String json = redisTemplate.opsForValue().get(key);
            if (json != null && !json.isBlank()) {
                log.info("Redis cache HIT for key: {}", key);
                return objectMapper.readValue(json, new TypeReference<PagedResponse<EmployeeResponse>>() {});
            }
            log.info("Redis cache MISS for key: {}", key);
        } catch (Exception e) {
            log.warn("Redis error reading cache for page={}: {}. Falling back to DB.", page, e.getMessage());
        }
        return null;
    }

    /**
     * Store paginated employees in Redis with TTL
     */
    public void putCachedPage(
            int page, int size, String sort, String search, String department, String status, String type, PagedResponse<EmployeeResponse> response) {
        try {
            String key = buildCacheKey(page, size, sort, search, department, status, type);
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(key, json, CACHE_TTL);
            log.info("Redis cache SAVED for key: {} (expires in {} min)", key, CACHE_TTL.toMinutes());
        } catch (Exception e) {
            log.warn("Redis error storing cache for page={}: {}", page, e.getMessage());
        }
    }

    /**
     * Revoke all employee Redis cache keys (on employee create, update, or delete)
     */
    public void revokeAll() {
        try {
            Set<String> keys = redisTemplate.keys(KEY_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.info("Redis: REVOKED ALL employee cache keys (count={})", keys.size());
            } else {
                log.info("Redis: Revoke all requested - no active employee keys found.");
            }
        } catch (Exception e) {
            log.warn("Redis error during revokeAll: {}", e.getMessage());
        }
    }
}
