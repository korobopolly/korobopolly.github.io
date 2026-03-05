---
title: "암호화 기초 - AES, RSA, 디지털 서명, 패스워드 해싱, 하이브리드 암호화"
date: 2026-02-16T13:25:00+09:00
draft: false
tags: ["보안", "암호화", "RSA", "AES"]
categories: ["보안"]
series: "보안"
description: "대칭키(AES)와 비대칭키(RSA) 암호화, 디지털 서명의 원리와 Java 구현을 알아봅니다"
---

## 들어가며

현대 소프트웨어 시스템에서 데이터 보안은 선택이 아닌 필수입니다. 사용자 비밀번호, 개인정보, 금융 데이터 등 민감한 정보를 안전하게 보호하려면 암호화 기술을 올바르게 이해하고 적용해야 합니다.

이 글에서는 대칭키 암호화(AES), 비대칭키 암호화(RSA), 디지털 서명의 원리와 Java 구현을 실전 예제와 함께 다룹니다.

## 암호화가 필요한 이유

### 보호해야 할 데이터

1. **저장 데이터(Data at Rest)**: 데이터베이스의 비밀번호, 개인정보
2. **전송 데이터(Data in Transit)**: HTTPS 통신, API 요청/응답
3. **처리 데이터(Data in Use)**: 메모리 상의 민감 정보

### 암호화 없이 발생하는 문제

```java
// 위험한 예: 평문 저장
String password = "user1234";
db.save("INSERT INTO users (password) VALUES ('" + password + "')");
// DB 유출 시 모든 비밀번호 노출

// 위험한 예: 평문 전송
HttpClient.get("http://api.example.com/user?apiKey=secret123");
// 중간자 공격(MITM)으로 API 키 탈취 가능
```

### 암호화 적용 후

```java
// 안전한 예: 암호화 저장
String encrypted = AESUtil.encrypt(password, secretKey);
db.save("INSERT INTO users (password) VALUES ('" + encrypted + "')");
// DB 유출되어도 암호화된 상태

// 안전한 예: HTTPS 사용
HttpClient.get("https://api.example.com/user?apiKey=secret123");
// TLS/SSL로 암호화된 통신
```

## 대칭키 암호화 (AES)

같은 키로 암호화와 복호화를 수행하는 방식입니다. 빠르고 효율적이지만 키 공유 문제가 있습니다.

### AES-256 GCM 모드

**AES (Advanced Encryption Standard):**
- 미국 표준 암호화 알고리즘
- 키 길이: 128, 192, 256비트 (256비트 권장)

**GCM (Galois/Counter Mode):**
- 인증 암호화(Authenticated Encryption) 지원
- 암호화 + 무결성 검증을 동시에 제공
- 병렬 처리 가능하여 성능 우수

### Java에서 AES 암호화/복호화

```java
package com.example.security;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

public class AESUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 96비트
    private static final int GCM_TAG_LENGTH = 128; // 128비트

    /**
     * AES-256 비밀키 생성
     */
    public static SecretKey generateKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256, new SecureRandom());
        return keyGen.generateKey();
    }

    /**
     * Base64 문자열을 SecretKey로 변환
     */
    public static SecretKey keyFromString(String keyString) {
        byte[] decodedKey = Base64.getDecoder().decode(keyString);
        return new SecretKeySpec(decodedKey, "AES");
    }

    /**
     * SecretKey를 Base64 문자열로 변환
     */
    public static String keyToString(SecretKey key) {
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    /**
     * 암호화
     * @return Base64 인코딩된 "IV + 암호문" 문자열
     */
    public static String encrypt(String plaintext, SecretKey key) throws Exception {
        // IV(Initialization Vector) 생성
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);

        // 암호화
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);

        byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

        // IV + 암호문 결합
        ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
        byteBuffer.put(iv);
        byteBuffer.put(ciphertext);

        return Base64.getEncoder().encodeToString(byteBuffer.array());
    }

    /**
     * 복호화
     * @param ciphertext Base64 인코딩된 "IV + 암호문" 문자열
     */
    public static String decrypt(String ciphertext, SecretKey key) throws Exception {
        byte[] decoded = Base64.getDecoder().decode(ciphertext);

        // IV와 암호문 분리
        ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
        byte[] iv = new byte[GCM_IV_LENGTH];
        byteBuffer.get(iv);

        byte[] encrypted = new byte[byteBuffer.remaining()];
        byteBuffer.get(encrypted);

        // 복호화
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

        byte[] plaintext = cipher.doFinal(encrypted);
        return new String(plaintext, StandardCharsets.UTF_8);
    }
}
```

### 사용 예제

```java
public class AESExample {
    public static void main(String[] args) throws Exception {
        // 1. 비밀키 생성
        SecretKey secretKey = AESUtil.generateKey();
        System.out.println("Generated Key: " + AESUtil.keyToString(secretKey));

        // 2. 암호화
        String plaintext = "Hello, AES-256-GCM!";
        String encrypted = AESUtil.encrypt(plaintext, secretKey);
        System.out.println("Encrypted: " + encrypted);

        // 3. 복호화
        String decrypted = AESUtil.decrypt(encrypted, secretKey);
        System.out.println("Decrypted: " + decrypted);

        // 출력:
        // Generated Key: 5K9j2F8mL3pQ7sT1vW6xZ0bC4eG8hI2k...
        // Encrypted: xJ2mP5sV8zC1fH4kL7nQ0rT3uW6yB9eD...
        // Decrypted: Hello, AES-256-GCM!
    }
}
```

### SecretKey 생성과 관리

```java
// 방법 1: 랜덤 생성 (최초 1회)
SecretKey key = AESUtil.generateKey();
String keyString = AESUtil.keyToString(key);
// DB 또는 환경 변수에 저장: "5K9j2F8mL3pQ7sT1vW6xZ0bC4eG8hI2k..."

// 방법 2: 저장된 키 로드
String savedKey = System.getenv("AES_SECRET_KEY");
SecretKey key = AESUtil.keyFromString(savedKey);

// 방법 3: 비밀번호 기반 키 생성 (PBKDF2)
public static SecretKey keyFromPassword(String password, byte[] salt) throws Exception {
    SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
    KeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 65536, 256);
    SecretKey tmp = factory.generateSecret(spec);
    return new SecretKeySpec(tmp.getEncoded(), "AES");
}
```

## 비대칭키 암호화 (RSA)

공개키와 개인키 쌍을 사용하는 방식입니다. 공개키로 암호화하면 개인키로만 복호화 가능합니다.

### 공개키/개인키 원리

```text
[발신자]                          [수신자]
평문 ──> 수신자 공개키로 암호화 ──> 암호문 ──> 개인키로 복호화 ──> 평문
```

**특징:**
- 키 배포 문제 해결 (공개키는 공개, 개인키는 비밀)
- 암호화 속도가 느림 (대용량 데이터에 부적합)
- 주로 키 교환 또는 소량 데이터 암호화에 사용

### RSA-2048 키페어 생성

```java
package com.example.security;

import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class RSAUtil {

    private static final String ALGORITHM = "RSA";
    private static final int KEY_SIZE = 2048;

    /**
     * RSA 키페어 생성
     */
    public static KeyPair generateKeyPair() throws Exception {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance(ALGORITHM);
        keyGen.initialize(KEY_SIZE, new SecureRandom());
        return keyGen.generateKeyPair();
    }

    /**
     * 공개키를 Base64 문자열로 변환
     */
    public static String publicKeyToString(PublicKey publicKey) {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    /**
     * 개인키를 Base64 문자열로 변환
     */
    public static String privateKeyToString(PrivateKey privateKey) {
        return Base64.getEncoder().encodeToString(privateKey.getEncoded());
    }

    /**
     * Base64 문자열을 공개키로 변환
     */
    public static PublicKey publicKeyFromString(String keyString) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(keyString);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(ALGORITHM);
        return keyFactory.generatePublic(spec);
    }

    /**
     * Base64 문자열을 개인키로 변환
     */
    public static PrivateKey privateKeyFromString(String keyString) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(keyString);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance(ALGORITHM);
        return keyFactory.generatePrivate(spec);
    }
}
```

### Java에서 RSA 암호화/복호화

```java
package com.example.security;

import javax.crypto.Cipher;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;

public class RSAEncryption {

    private static final String TRANSFORMATION = "RSA/ECB/OAEPWITHSHA-256ANDMGF1PADDING";

    /**
     * 공개키로 암호화
     */
    public static String encrypt(String plaintext, PublicKey publicKey) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);

        byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encrypted);
    }

    /**
     * 개인키로 복호화
     */
    public static String decrypt(String ciphertext, PrivateKey privateKey) throws Exception {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, privateKey);

        byte[] decoded = Base64.getDecoder().decode(ciphertext);
        byte[] decrypted = cipher.doFinal(decoded);
        return new String(decrypted, StandardCharsets.UTF_8);
    }
}
```

### 사용 예제

```java
public class RSAExample {
    public static void main(String[] args) throws Exception {
        // 1. 키페어 생성
        KeyPair keyPair = RSAUtil.generateKeyPair();
        PublicKey publicKey = keyPair.getPublic();
        PrivateKey privateKey = keyPair.getPrivate();

        System.out.println("Public Key: " + RSAUtil.publicKeyToString(publicKey));
        System.out.println("Private Key: " + RSAUtil.privateKeyToString(privateKey));

        // 2. 공개키로 암호화
        String plaintext = "Hello, RSA!";
        String encrypted = RSAEncryption.encrypt(plaintext, publicKey);
        System.out.println("Encrypted: " + encrypted);

        // 3. 개인키로 복호화
        String decrypted = RSAEncryption.decrypt(encrypted, privateKey);
        System.out.println("Decrypted: " + decrypted);

        // 출력:
        // Public Key: MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
        // Private Key: MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
        // Encrypted: gK3mP7sW9zD2fI5kM8nR1rU4uX7yC0eF...
        // Decrypted: Hello, RSA!
    }
}
```

### PKCS8 키 포맷

RSA 개인키는 PKCS#8 형식으로 저장됩니다.

```text
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
(Base64 인코딩된 키)
...
-----END PRIVATE KEY-----
```

공개키는 X.509 형식입니다.

```text
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
(Base64 인코딩된 키)
...
-----END PUBLIC KEY-----
```

## 디지털 서명

메시지의 무결성과 송신자의 신원을 보장하는 기술입니다.

### 서명 원리

```text
[서명 생성]
원본 데이터 ──> SHA-256 해시 ──> 개인키로 서명 ──> 서명값

[서명 검증]
원본 데이터 ──> SHA-256 해시 ──┐
서명값 ──> 공개키로 복호화 ──────┴──> 비교 (일치하면 검증 성공)
```

**암호화와의 차이:**
- **암호화**: 데이터 기밀성 (공개키로 암호화 → 개인키로 복호화)
- **서명**: 데이터 무결성 + 인증 (개인키로 서명 → 공개키로 검증)

### SHA256withRSA 서명/검증

```java
package com.example.security;

import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.util.Base64;

public class DigitalSignature {

    private static final String ALGORITHM = "SHA256withRSA";

    /**
     * 개인키로 서명 생성
     */
    public static String sign(String data, PrivateKey privateKey) throws Exception {
        Signature signature = Signature.getInstance(ALGORITHM);
        signature.initSign(privateKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));

        byte[] signatureBytes = signature.sign();
        return Base64.getEncoder().encodeToString(signatureBytes);
    }

    /**
     * 공개키로 서명 검증
     */
    public static boolean verify(String data, String signatureStr, PublicKey publicKey) throws Exception {
        Signature signature = Signature.getInstance(ALGORITHM);
        signature.initVerify(publicKey);
        signature.update(data.getBytes(StandardCharsets.UTF_8));

        byte[] signatureBytes = Base64.getDecoder().decode(signatureStr);
        return signature.verify(signatureBytes);
    }
}
```

### 사용 예제

```java
public class SignatureExample {
    public static void main(String[] args) throws Exception {
        // 1. 키페어 생성
        KeyPair keyPair = RSAUtil.generateKeyPair();
        PrivateKey privateKey = keyPair.getPrivate();
        PublicKey publicKey = keyPair.getPublic();

        // 2. 서명 생성
        String data = "Important message";
        String signature = DigitalSignature.sign(data, privateKey);
        System.out.println("Signature: " + signature);

        // 3. 서명 검증
        boolean isValid = DigitalSignature.verify(data, signature, publicKey);
        System.out.println("Valid: " + isValid); // true

        // 4. 데이터 위변조 시도
        String tamperedData = "Important message!";
        boolean isTamperedValid = DigitalSignature.verify(tamperedData, signature, publicKey);
        System.out.println("Tampered Valid: " + isTamperedValid); // false

        // 출력:
        // Signature: gK3mP7sW9zD2fI5kM8nR1rU4uX7yC0eF...
        // Valid: true
        // Tampered Valid: false
    }
}
```

### 서명 vs 암호화 차이

| 구분 | 암호화 | 서명 |
|------|--------|------|
| 목적 | 데이터 기밀성 | 데이터 무결성 + 인증 |
| 사용 키 | 공개키로 암호화 | 개인키로 서명 |
| 복호화/검증 | 개인키로 복호화 | 공개키로 검증 |
| 데이터 크기 | 원본과 같거나 큼 | 고정 크기 (256바이트 등) |

## Base64 인코딩

바이너리 데이터를 텍스트로 변환하는 인코딩 방식입니다.

### URL-safe Base64

```java
public class Base64Example {
    public static void main(String[] args) {
        String data = "Hello, World!";
        byte[] bytes = data.getBytes(StandardCharsets.UTF_8);

        // 표준 Base64
        String standard = Base64.getEncoder().encodeToString(bytes);
        System.out.println("Standard: " + standard);
        // SGVsbG8sIFdvcmxkIQ==

        // URL-safe Base64 (+ → -, / → _, padding 유지)
        String urlSafe = Base64.getUrlEncoder().encodeToString(bytes);
        System.out.println("URL-safe: " + urlSafe);
        // SGVsbG8sIFdvcmxkIQ==

        // Padding 없는 URL-safe Base64
        String noPadding = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        System.out.println("No padding: " + noPadding);
        // SGVsbG8sIFdvcmxkIQ
    }
}
```

**사용 사례:**
- JWT 토큰 (Header.Payload.Signature)
- URL 쿼리 파라미터
- 파일 첨부 (이메일, JSON)

## 실전 예시 1: 패스워드 저장 (올바른 방법)

**⚠️ 중요:** 패스워드는 절대 AES 같은 양방향 암호화로 저장하면 안 됩니다. 복호화가 가능하기 때문에 DB 유출 시 모든 패스워드가 노출됩니다.

### 올바른 방법: BCrypt 단방향 해시

```java
package com.example.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * 패스워드 해시화 (단방향)
     */
    public String hashPassword(String plainPassword) {
        return encoder.encode(plainPassword);
    }

    /**
     * 패스워드 검증
     */
    public boolean verifyPassword(String plainPassword, String hashedPassword) {
        return encoder.matches(plainPassword, hashedPassword);
    }
}
```

### UserService

```java
@Service
public class UserService {

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private UserRepository userRepository;

    /**
     * 사용자 등록
     */
    public void registerUser(String username, String password) {
        String hashedPassword = passwordService.hashPassword(password);

        User user = new User();
        user.setUsername(username);
        user.setPassword(hashedPassword);

        userRepository.save(user);
    }

    /**
     * 로그인
     */
    public boolean login(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user == null) return false;

        return passwordService.verifyPassword(password, user.getPassword());
    }
}
```

**왜 BCrypt를 사용하는가?**
- **단방향 해시:** 해시값에서 원본 패스워드를 복원할 수 없음
- **Salt 자동 생성:** 같은 패스워드도 다른 해시값 생성 (레인보우 테이블 공격 방어)
- **느린 연산:** 브루트포스 공격을 어렵게 만듦
- **검증된 알고리즘:** 보안 업계 표준

**대안:**
- **Argon2:** 2015년 Password Hashing Competition 우승, 가장 안전
- **scrypt:** 메모리 집약적 설계로 GPU 공격 방어
- **PBKDF2:** NIST 표준, 레거시 시스템과 호환성 좋음

## 실전 예시 2: 라이선스 키 생성

소프트웨어 라이선스 키를 RSA 서명으로 생성하고 검증합니다.

### LicenseGenerator

```java
package com.example.license;

import com.example.security.DigitalSignature;
import com.example.security.RSAUtil;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;
import java.util.Map;

public class LicenseGenerator {

    private final PrivateKey privateKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LicenseGenerator(PrivateKey privateKey) {
        this.privateKey = privateKey;
    }

    /**
     * 라이선스 키 생성
     * 형식: Base64(JSON Payload) + "." + Base64(Signature)
     */
    public String generateLicense(String productId, String customerId, long expiresAt) throws Exception {
        // 1. Payload 생성 (JSON)
        Map<String, Object> payload = Map.of(
            "productId", productId,
            "customerId", customerId,
            "issuedAt", System.currentTimeMillis(),
            "expiresAt", expiresAt
        );

        String jsonPayload = objectMapper.writeValueAsString(payload);
        String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(jsonPayload.getBytes());

        // 2. 서명 생성
        String signature = DigitalSignature.sign(jsonPayload, privateKey);
        String encodedSignature = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(signature.getBytes());

        // 3. Payload + Signature 결합
        return encodedPayload + "." + encodedSignature;
    }
}
```

### LicenseValidator

```java
package com.example.license;

import com.example.security.DigitalSignature;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.security.PublicKey;
import java.util.Base64;
import java.util.Map;

public class LicenseValidator {

    private final PublicKey publicKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LicenseValidator(PublicKey publicKey) {
        this.publicKey = publicKey;
    }

    /**
     * 라이선스 키 검증
     */
    public boolean validateLicense(String licenseKey) {
        try {
            String[] parts = licenseKey.split("\\.");
            if (parts.length != 2) return false;

            // 1. Payload와 Signature 분리
            String encodedPayload = parts[0];
            String encodedSignature = parts[1];

            byte[] payloadBytes = Base64.getUrlDecoder().decode(encodedPayload);
            String jsonPayload = new String(payloadBytes);

            String signature = new String(Base64.getUrlDecoder().decode(encodedSignature));

            // 2. 서명 검증
            if (!DigitalSignature.verify(jsonPayload, signature, publicKey)) {
                return false;
            }

            // 3. 만료 시간 확인
            Map<String, Object> payload = objectMapper.readValue(jsonPayload, Map.class);
            long expiresAt = ((Number) payload.get("expiresAt")).longValue();

            return System.currentTimeMillis() < expiresAt;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 라이선스 정보 추출
     */
    public Map<String, Object> extractLicenseInfo(String licenseKey) throws Exception {
        String[] parts = licenseKey.split("\\.");
        byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[0]);
        String jsonPayload = new String(payloadBytes);
        return objectMapper.readValue(jsonPayload, Map.class);
    }
}
```

### 사용 예제

```java
public class LicenseExample {
    public static void main(String[] args) throws Exception {
        // 1. 키페어 생성 (서버)
        KeyPair keyPair = RSAUtil.generateKeyPair();
        PrivateKey privateKey = keyPair.getPrivate();
        PublicKey publicKey = keyPair.getPublic();

        // 공개키는 클라이언트 애플리케이션에 배포
        System.out.println("Public Key (embed in client):");
        System.out.println(RSAUtil.publicKeyToString(publicKey));

        // 2. 라이선스 키 생성 (서버)
        LicenseGenerator generator = new LicenseGenerator(privateKey);
        long expiresAt = System.currentTimeMillis() + 365L * 24 * 60 * 60 * 1000; // 1년 후
        String licenseKey = generator.generateLicense("PROD-001", "CUSTOMER-123", expiresAt);

        System.out.println("\nGenerated License Key:");
        System.out.println(licenseKey);

        // 3. 라이선스 키 검증 (클라이언트)
        LicenseValidator validator = new LicenseValidator(publicKey);
        boolean isValid = validator.validateLicense(licenseKey);
        System.out.println("\nLicense Valid: " + isValid);

        // 4. 라이선스 정보 추출
        Map<String, Object> info = validator.extractLicenseInfo(licenseKey);
        System.out.println("License Info: " + info);

        // 5. 위변조 시도
        String tamperedKey = licenseKey.replace("PROD-001", "PROD-999");
        boolean isTamperedValid = validator.validateLicense(tamperedKey);
        System.out.println("\nTampered License Valid: " + isTamperedValid); // false

        // 출력:
        // Public Key (embed in client):
        // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
        //
        // Generated License Key:
        // eyJwcm9kdWN0SWQiOiJQUk9ELTAwMSIsImN1c3RvbWVySWQiOiJDVVNUT01FUi0xMjMiLCJpc3N1ZWRBdCI6MTcwODA1NjAwMCwiZXhwaXJlc0F0IjoxNzM5NTkyMDAwfQ.gK3mP7sW9zD2fI5kM8nR1rU4uX7yC0eF...
        //
        // License Valid: true
        // License Info: {productId=PROD-001, customerId=CUSTOMER-123, issuedAt=1708056000, expiresAt=1739592000}
        //
        // Tampered License Valid: false
    }
}
```

### 라이선스 키 구조

```text
[Payload: Base64 URL-safe].[Signature: Base64 URL-safe]

Payload (JSON):
{
  "productId": "PROD-001",
  "customerId": "CUSTOMER-123",
  "issuedAt": 1708056000,
  "expiresAt": 1739592000
}

Signature:
RSA 개인키로 Payload를 서명한 값
```

**보안 특징:**
- 공개키만으로는 라이선스 키를 생성할 수 없음 (개인키 필요)
- Payload 위변조 시 서명 검증 실패
- 만료 시간 포함으로 시간 제한 가능

## 하이브리드 암호화 (RSA + AES)

RSA는 느리고 큰 데이터를 암호화할 수 없으므로, AES와 조합하여 사용합니다.

### 동작 원리

```text
1. 송신자가 랜덤 AES 키 생성
2. AES 키로 대용량 데이터 암호화 (빠름)
3. RSA 공개키로 AES 키 암호화 (작은 데이터)
4. 암호화된 데이터 + 암호화된 AES 키 전송
5. 수신자가 RSA 개인키로 AES 키 복호화
6. 복호화된 AES 키로 데이터 복호화
```

### 구현

```java
package com.example.security;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;

public class HybridEncryption {

    /**
     * 하이브리드 암호화
     * @return "암호화된 데이터,암호화된 AES 키"
     */
    public static String encrypt(String plaintext, PublicKey publicKey) throws Exception {
        // 1. 랜덤 AES 키 생성
        SecretKey aesKey = AESUtil.generateKey();

        // 2. AES로 데이터 암호화
        String encryptedData = AESUtil.encrypt(plaintext, aesKey);

        // 3. RSA로 AES 키 암호화
        String aesKeyString = AESUtil.keyToString(aesKey);
        String encryptedKey = RSAEncryption.encrypt(aesKeyString, publicKey);

        // 4. 결합
        return encryptedData + "," + encryptedKey;
    }

    /**
     * 하이브리드 복호화
     */
    public static String decrypt(String ciphertext, PrivateKey privateKey) throws Exception {
        String[] parts = ciphertext.split(",");
        String encryptedData = parts[0];
        String encryptedKey = parts[1];

        // 1. RSA로 AES 키 복호화
        String aesKeyString = RSAEncryption.decrypt(encryptedKey, privateKey);
        SecretKey aesKey = AESUtil.keyFromString(aesKeyString);

        // 2. AES로 데이터 복호화
        return AESUtil.decrypt(encryptedData, aesKey);
    }
}
```

### 사용 예제

```java
public class HybridExample {
    public static void main(String[] args) throws Exception {
        KeyPair keyPair = RSAUtil.generateKeyPair();
        PublicKey publicKey = keyPair.getPublic();
        PrivateKey privateKey = keyPair.getPrivate();

        // 대용량 데이터
        String largeData = "This is a very large document...".repeat(1000);

        // 암호화
        String encrypted = HybridEncryption.encrypt(largeData, publicKey);
        System.out.println("Encrypted (first 100 chars): " + encrypted.substring(0, 100));

        // 복호화
        String decrypted = HybridEncryption.decrypt(encrypted, privateKey);
        System.out.println("Decrypted matches: " + largeData.equals(decrypted)); // true
    }
}
```

**장점:**
- RSA의 키 배포 용이성 + AES의 빠른 속도
- HTTPS/TLS가 이 방식을 사용

## 마무리

암호화는 현대 소프트웨어 보안의 핵심입니다. 대칭키(AES)는 빠르지만 키 공유 문제가 있고, 비대칭키(RSA)는 키 배포가 쉽지만 느립니다. 디지털 서명은 무결성과 인증을 보장합니다.

**핵심 요약:**
- **AES-256 GCM**: 빠른 대칭키 암호화, 비밀키 관리 필수
- **RSA-2048**: 공개키/개인키 쌍, 소량 데이터 또는 키 교환
- **디지털 서명**: 개인키로 서명 → 공개키로 검증 (무결성 + 인증)
- **하이브리드 암호화**: RSA + AES 조합으로 장점 결합
- **실전 적용**: 패스워드는 BCrypt, 라이선스는 RSA 서명, 대용량은 하이브리드

다음 글에서는 OAuth2와 소셜 로그인 구현을 다루며 Google, GitHub 인증 연동을 알아보겠습니다.
