package com.authservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /** classpath: or file: location of the PKCS8 RSA private key (PEM). */
    private String privateKeyPath;

    /** classpath: or file: location of the X.509 RSA public key (PEM). */
    private String publicKeyPath;

    private String issuer;

    private long accessTokenExpMinutes;

    private long refreshTokenExpDays;
}
