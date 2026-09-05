package com.example.downstream.config;

import com.example.downstream.security.RsaPublicKeyLoader;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.PublicKey;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtKeyConfig {

    @Bean
    public PublicKey jwtVerificationKey(JwtProperties props) {
        return RsaPublicKeyLoader.loadPublicKey(props.getPublicKeyPath());
    }
}
