package com.example.downstream.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /** classpath: or file: location of the auth-service's PUBLIC key (PEM, X.509). */
    private String publicKeyPath;

    private String issuer;
}
