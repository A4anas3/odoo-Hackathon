package com.authservice.config;

import com.authservice.util.RsaKeyLoader;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.PrivateKey;
import java.security.PublicKey;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtKeyConfig {

    @Bean
    public PrivateKey jwtSigningKey(JwtProperties props) {
        return RsaKeyLoader.loadPrivateKey(props.getPrivateKeyPath());
    }

    @Bean
    public PublicKey jwtVerificationKey(JwtProperties props) {
        return RsaKeyLoader.loadPublicKey(props.getPublicKeyPath());
    }
}
