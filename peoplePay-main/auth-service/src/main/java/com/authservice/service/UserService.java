package com.authservice.service;

import com.authservice.dto.response.UserResponse;
import com.authservice.entity.Role;
import com.authservice.entity.User;
import com.authservice.exception.EmailAlreadyExistsException;
import com.authservice.exception.RoleNotFoundException;
import com.authservice.exception.UserNotFoundException;
import com.authservice.repository.RoleRepository;
import com.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final String DEFAULT_ROLE = "USER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User createUser(String email, String username, String rawPassword) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        Role defaultRole = roleRepository.findByNameIgnoreCase(DEFAULT_ROLE)
                .orElseThrow(() -> new RoleNotFoundException(DEFAULT_ROLE));

        User user = User.builder()
                .email(email.toLowerCase())
                .username(username)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .roles(new java.util.HashSet<>(Set.of(defaultRole)))
                .build();

        return userRepository.save(user);
    }

    public User getById(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UserNotFoundException(email));
    }

    /** Non-throwing lookup — used by flows (like forgot-password) that must not reveal
     *  whether an email is registered. */
    public java.util.Optional<User> getByEmailSafe(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    @Transactional
    public void changePassword(UUID userId, String newRawPassword) {
        User user = getById(userId);
        user.setPasswordHash(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse assignRole(UUID userId, String roleName) {
        User user = getById(userId);
        Role role = roleRepository.findByNameIgnoreCase(roleName)
                .orElseThrow(() -> new RoleNotFoundException(roleName));
        user.addRole(role);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse removeRole(UUID userId, String roleName) {
        User user = getById(userId);
        Role role = roleRepository.findByNameIgnoreCase(roleName)
                .orElseThrow(() -> new RoleNotFoundException(roleName));
        user.removeRole(role);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateStatusByEmail(String email, Boolean enabled, Boolean accountLocked) {
        User user = getByEmail(email);
        if (enabled != null) {
            user.setEnabled(enabled);
        }
        if (accountLocked != null) {
            user.setAccountLocked(accountLocked);
        }
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .enabled(user.isEnabled())
                .emailVerified(user.isEmailVerified())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
