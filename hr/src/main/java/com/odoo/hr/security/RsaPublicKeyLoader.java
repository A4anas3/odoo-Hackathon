package com.odoo.hr.security;

import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;
import java.security.KeyFactory;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public final class RsaPublicKeyLoader {

    private static final ResourceLoader RESOURCE_LOADER = new DefaultResourceLoader();

    private RsaPublicKeyLoader() {
    }

    public static RSAPublicKey loadPublicKey(String location) {
        try {
            Resource resource = RESOURCE_LOADER.getResource(location);
            String pem;
            try (InputStream is = resource.getInputStream()) {
                pem = new String(is.readAllBytes())
                        .replaceAll("-----BEGIN (.*)-----", "")
                        .replaceAll("-----END (.*)-----", "")
                        .replaceAll("\\s", "");
            }
            byte[] decoded = Base64.getDecoder().decode(pem);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return (RSAPublicKey) keyFactory.generatePublic(keySpec);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load RSA public key from " + location, e);
        }
    }
}
