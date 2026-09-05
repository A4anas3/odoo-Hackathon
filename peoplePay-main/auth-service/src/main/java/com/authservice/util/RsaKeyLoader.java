package com.authservice.util;

import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.IOException;
import java.io.InputStream;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

/**
 * Loads an RSA key pair from PEM files (PKCS8 private key / X.509 public key) for use
 * signing and verifying RS256 JWTs.
 */
public final class RsaKeyLoader {

    private static final ResourceLoader RESOURCE_LOADER = new DefaultResourceLoader();

    private RsaKeyLoader() {
    }

    public static PrivateKey loadPrivateKey(String location) {
        try {
            String pem = readPem(location);
            byte[] decoded = Base64.getDecoder().decode(pem);
            PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(decoded);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return keyFactory.generatePrivate(keySpec);
        } catch (IOException | NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Failed to load RSA private key from " + location, e);
        }
    }

    public static PublicKey loadPublicKey(String location) {
        try {
            String pem = readPem(location);
            byte[] decoded = Base64.getDecoder().decode(pem);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            return keyFactory.generatePublic(keySpec);
        } catch (IOException | NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new IllegalStateException("Failed to load RSA public key from " + location, e);
        }
    }

    private static String readPem(String location) throws IOException {
        Resource resource = RESOURCE_LOADER.getResource(location);
        try (InputStream is = resource.getInputStream()) {
            String content = new String(is.readAllBytes());
            return content
                    .replaceAll("-----BEGIN (.*)-----", "")
                    .replaceAll("-----END (.*)-----", "")
                    .replaceAll("\\s", "");
        }
    }
}
