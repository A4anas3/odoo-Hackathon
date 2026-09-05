package com.example.downstream.security;

import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.IOException;
import java.io.InputStream;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Loads ONLY the RSA public key. Downstream/resource services never need, and should
 * never possess, the private signing key — that stays exclusively in the auth-service.
 */
public final class RsaPublicKeyLoader {

    private static final ResourceLoader RESOURCE_LOADER = new DefaultResourceLoader();

    private RsaPublicKeyLoader() {
    }

    public static PublicKey loadPublicKey(String location) {
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
            return keyFactory.generatePublic(keySpec);
        } catch (IOException | NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Failed to load RSA public key from " + location, e);
        }
    }
}
