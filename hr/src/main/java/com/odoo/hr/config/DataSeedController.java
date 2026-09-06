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
    public ResponseEntity<Map<String, Object>> triggerSeedPost(@RequestParam(name = "reset", defaultValue = "false") boolean reset) {
        Map<String, Object> result = reset ? dataInitializer.resetAndSeedAllData() : dataInitializer.seedAllData();
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> triggerSeedGet(@RequestParam(name = "reset", defaultValue = "false") boolean reset) {
        Map<String, Object> result = reset ? dataInitializer.resetAndSeedAllData() : dataInitializer.seedAllData();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> triggerResetPost() {
        Map<String, Object> result = dataInitializer.resetAndSeedAllData();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/reset")
    public ResponseEntity<Map<String, Object>> triggerResetGet() {
        Map<String, Object> result = dataInitializer.resetAndSeedAllData();
        return ResponseEntity.ok(result);
    }
}
