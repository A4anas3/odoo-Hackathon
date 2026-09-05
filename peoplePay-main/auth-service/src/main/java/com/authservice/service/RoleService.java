package com.authservice.service;

import com.authservice.dto.response.RoleResponse;
import com.authservice.entity.Role;
import com.authservice.exception.RoleAlreadyExistsException;
import com.authservice.exception.RoleNotFoundException;
import com.authservice.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    @Transactional
    public RoleResponse createRole(String name, String description) {
        String normalizedName = name.trim().toUpperCase();
        if (roleRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new RoleAlreadyExistsException(normalizedName);
        }
        Role role = Role.builder()
                .name(normalizedName)
                .description(description)
                .build();
        Role saved = roleRepository.save(role);
        return toResponse(saved);
    }

    public Role getByName(String name) {
        return roleRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new RoleNotFoundException(name));
    }

    public List<RoleResponse> listAll() {
        return roleRepository.findAll().stream().map(this::toResponse).toList();
    }

    private RoleResponse toResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .build();
    }
}
