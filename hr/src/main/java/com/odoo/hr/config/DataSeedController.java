package com.odoo.hr.config;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/seed")
@RequiredArgsConstructor
public class DataSeedController {

    private final DataInitializer dataInitializer;

    @PostMapping
    public ResponseEntity<Map<String, Object>> triggerSeedPost() {
        Map<String, Object> result = dataInitializer.seedAllData();
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> triggerSeedGet() {
        Map<String, Object> result = dataInitializer.seedAllData();
        return ResponseEntity.ok(result);
    }
}
