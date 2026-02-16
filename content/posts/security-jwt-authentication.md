---
title: "JWT 인증 시스템 - 토큰 기반 인증의 모든 것"
date: 2026-02-16T13:24:00+09:00
draft: false
tags: ["보안", "JWT", "인증", "Spring Security"]
categories: ["보안"]
series: "보안"
description: "JWT를 활용한 토큰 기반 인증 시스템의 원리와 Spring Boot 구현 방법을 알아봅니다"
---

## 들어가며

웹 애플리케이션에서 사용자 인증은 가장 기본적이면서도 중요한 기능입니다. 전통적인 세션 기반 인증 방식은 서버에 상태를 저장하기 때문에 확장성과 분산 환경에서 한계가 있습니다. JWT(JSON Web Token)는 이러한 문제를 해결하는 토큰 기반 인증 방식으로, 최근 REST API와 마이크로서비스 환경에서 널리 사용되고 있습니다.

이 글에서는 JWT의 원리부터 Spring Boot와 프론트엔드에서의 실전 구현까지 다룹니다.

## 세션 기반 vs 토큰 기반 인증

### 세션 기반 인증

전통적인 방식으로, 서버가 세션 정보를 메모리나 DB에 저장합니다.

```
1. 사용자 로그인 → 서버가 세션 ID 생성 → 메모리/DB 저장
2. 클라이언트에 세션 ID 쿠키 전송
3. 이후 요청마다 쿠키로 세션 ID 전송 → 서버가 세션 저장소 조회
```

**장점:**
- 서버에서 언제든 세션 무효화 가능
- 구현이 간단하고 검증된 방식

**단점:**
- 서버가 상태를 유지해야 함 (메모리 사용)
- 여러 서버 환경에서 세션 동기화 필요 (Redis 등)
- CORS 환경에서 쿠키 처리 복잡

### 토큰 기반 인증 (JWT)

서버가 상태를 저장하지 않는 무상태(stateless) 방식입니다.

```
1. 사용자 로그인 → 서버가 JWT 토큰 생성 및 서명
2. 클라이언트에 토큰 전송 (JSON 응답)
3. 이후 요청마다 Authorization 헤더에 토큰 포함
4. 서버는 서명 검증만으로 인증 (저장소 조회 불필요)
```

**장점:**
- 서버가 상태를 저장하지 않아 확장성 우수
- 마이크로서비스 간 인증 정보 공유 용이
- 모바일 앱과 SPA에 적합

**단점:**
- 토큰 탈취 시 만료 전까지 무효화 어려움
- 토큰 크기가 쿠키보다 큼

## JWT 구조

JWT는 `.`으로 구분된 세 부분으로 구성됩니다.

```
Header.Payload.Signature
```

### Header

토큰 타입과 서명 알고리즘을 명시합니다.

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

Base64 URL 인코딩: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### Payload

실제 전달할 데이터(Claims)를 담습니다.

```json
{
  "sub": "user@example.com",
  "name": "홍길동",
  "role": "ADMIN",
  "iat": 1708056000,
  "exp": 1708059600
}
```

**표준 클레임:**
- `sub`: 토큰 주체 (사용자 ID)
- `iat`: 발급 시각 (issued at)
- `exp`: 만료 시각 (expiration)
- `iss`: 발급자 (issuer)

**커스텀 클레임:**
- 사용자 역할, 권한, 이름 등 필요한 정보

Base64 URL 인코딩 후 중간 부분이 됩니다.

### Signature

Header와 Payload를 비밀키로 서명합니다.

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret  # 최소 256비트(32바이트) 무작위 키
)
```

이 서명으로 토큰 위변조를 검증합니다. 비밀키는 반드시 충분한 길이(256비트 이상)와 무작위성을 가져야 하며, 환경 변수로 안전하게 관리해야 합니다.

## JWT 동작 원리

### 1. 토큰 발급

```java
// 사용자 로그인 성공 시
String username = "user@example.com";
String token = jwtUtil.generateToken(username);
// 반환: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA4MDU2MDAwLCJleHAiOjE3MDgwNTk2MDB9.abc123...
```

### 2. 토큰 전송

클라이언트는 HTTP 요청 헤더에 토큰을 포함합니다.

```
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA4MDU2MDAwLCJleHAiOjE3MDgwNTk2MDB9.abc123...
```

### 3. 토큰 검증

서버는 서명을 검증하고 만료 시간을 확인합니다.

```java
if (jwtUtil.validateToken(token)) {
    String username = jwtUtil.extractUsername(token);
    // 사용자 인증 완료
}
```

## Spring Security + JWT 통합

### JwtUtil 클래스

토큰 생성, 검증, Claims 추출을 담당합니다.

```java
package com.example.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration; // 밀리초 (예: 3600000 = 1시간)

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // 토큰에서 username 추출
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 토큰에서 만료 시간 추출
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // 특정 클레임 추출
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // 모든 클레임 추출
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 토큰 만료 여부 확인
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // 토큰 생성
    public String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, username);
    }

    // 추가 클레임과 함께 토큰 생성
    public String generateToken(String username, Map<String, Object> extraClaims) {
        return createToken(extraClaims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰 검증
    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }
}
```

**application.yml 설정:**

```yaml
jwt:
  secret: ${JWT_SECRET}  # 환경 변수로 관리 (절대 하드코딩 금지!)
  expiration: 3600000 # 1시간 (밀리초)
```

**⚠️ 보안 경고:**
- JWT 비밀키는 최소 256비트(32바이트)의 무작위 값이어야 합니다
- 절대 코드에 하드코딩하지 말고 환경 변수로 관리하세요
- 키 생성 예시: `openssl rand -base64 32`

### JwtAuthenticationFilter

모든 요청에서 JWT 토큰을 검증하는 필터입니다.

```java
package com.example.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // Authorization 헤더 검증
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 토큰 추출
        jwt = authHeader.substring(7);
        username = jwtUtil.extractUsername(jwt);

        // 사용자 인증 처리
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails.getUsername())) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );
                authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

### SecurityConfig 설정

Stateless 세션 정책과 JWT 필터를 등록합니다.

```java
package com.example.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

### 로그인 컨트롤러

```java
package com.example.controller;

import com.example.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        // 사용자 인증
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
            )
        );

        // JWT 토큰 생성
        String token = jwtUtil.generateToken(request.getUsername());

        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("type", "Bearer");

        return response;
    }
}

class LoginRequest {
    private String username;
    private String password;

    // getters, setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
```

## 프론트엔드 JWT 처리

**💡 참고:** React 애플리케이션에서 JWT를 Context와 함께 사용하는 완전한 예제는 [React 상태 관리](../react-state-management) 포스트의 "실전 예시: 인증 상태 관리" 섹션을 참고하세요.

### Axios 인터셉터로 토큰 자동 주입

모든 요청에 Authorization 헤더를 자동으로 추가합니다.

```javascript
// src/api/axios.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000
});

// 요청 인터셉터: 토큰 자동 주입
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 처리
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 토큰 만료 또는 인증 실패
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
```

### 로그인 처리

```javascript
// src/services/authService.js
import axios from '../api/axios';

export const login = async (username, password) => {
  const response = await axios.post('/auth/login', {
    username,
    password
  });

  const { token } = response.data;
  localStorage.setItem('token', token);

  return token;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  // JWT 만료 시간 확인
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch (e) {
    return false;
  }
};
```

### 토큰 만료 감지와 자동 갱신

```javascript
// src/utils/tokenRefresh.js
import axios from '../api/axios';

let refreshTimer = null;

// 토큰 만료 5분 전에 갱신
export const startTokenRefresh = () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = payload.exp * 1000 - Date.now();
    const refreshTime = expiresIn - 5 * 60 * 1000; // 5분 전

    if (refreshTime > 0) {
      refreshTimer = setTimeout(async () => {
        try {
          const response = await axios.post('/auth/refresh');
          localStorage.setItem('token', response.data.token);
          startTokenRefresh(); // 재귀 호출
        } catch (error) {
          console.error('Token refresh failed:', error);
          logout();
        }
      }, refreshTime);
    }
  } catch (e) {
    console.error('Invalid token:', e);
  }
};

export const stopTokenRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};
```

### 세션 만료 경고 다이얼로그

```javascript
// src/components/SessionWarning.jsx
import React, { useEffect, useState } from 'react';

const SessionWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);

  useEffect(() => {
    const checkExpiration = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresIn = Math.floor((payload.exp * 1000 - Date.now()) / 1000);

        if (expiresIn <= 60 && expiresIn > 0) {
          setShowWarning(true);
          setRemainingTime(expiresIn);
        } else {
          setShowWarning(false);
        }
      } catch (e) {
        console.error('Token parse error:', e);
      }
    };

    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExtend = async () => {
    try {
      const response = await axios.post('/auth/refresh');
      localStorage.setItem('token', response.data.token);
      setShowWarning(false);
    } catch (error) {
      console.error('Session extension failed:', error);
    }
  };

  if (!showWarning) return null;

  return (
    <div className="session-warning-modal">
      <div className="modal-content">
        <h3>세션 만료 경고</h3>
        <p>{remainingTime}초 후 세션이 만료됩니다.</p>
        <button onClick={handleExtend}>연장하기</button>
      </div>
    </div>
  );
};

export default SessionWarning;
```

## Refresh Token 전략

Access Token의 만료 시간을 짧게 하고, Refresh Token으로 재발급받는 방식입니다.

**⚠️ 보안 권장사항:**
- Refresh Token은 반드시 **HttpOnly 쿠키**로 저장 (XSS 방어)
- Access Token은 메모리 또는 localStorage 저장 가능
- Refresh Token은 긴 만료 시간 (7일~30일), Access Token은 짧게 (15분~1시간)

### 서버 구현

```java
@PostMapping("/refresh")
public Map<String, String> refresh(@RequestBody RefreshRequest request) {
    String refreshToken = request.getRefreshToken();

    // Refresh Token 검증
    if (jwtUtil.validateToken(refreshToken, jwtUtil.extractUsername(refreshToken))) {
        String username = jwtUtil.extractUsername(refreshToken);

        // 새로운 Access Token 발급
        String newAccessToken = jwtUtil.generateToken(username);

        Map<String, String> response = new HashMap<>();
        response.put("token", newAccessToken);
        return response;
    }

    throw new RuntimeException("Invalid refresh token");
}
```

### 클라이언트 구현

```javascript
// 올바른 방법: Refresh Token은 HttpOnly 쿠키, Access Token은 localStorage
export const loginWithRefresh = async (username, password) => {
  const response = await axios.post('/auth/login', {
    username,
    password
  }, {
    withCredentials: true  // 쿠키 전송 활성화
  });

  const { accessToken } = response.data;
  // refreshToken은 서버가 HttpOnly 쿠키로 자동 설정 (Set-Cookie 헤더)
  localStorage.setItem('token', accessToken);

  return accessToken;
};

// Access Token 만료 시 자동 갱신
instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post('/auth/refresh');
        const { accessToken } = response.data;
        localStorage.setItem('token', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## JWT 보안 주의사항

### 1. 비밀키 관리

```yaml
# 잘못된 예: 짧은 비밀키
jwt:
  secret: mysecret

# 올바른 예: 256비트 이상 무작위 키
jwt:
  secret: ${JWT_SECRET:your-256-bit-secret-key-here-must-be-long-enough-for-hs256-algorithm}
```

환경 변수로 관리하고 절대 코드에 하드코딩하지 않습니다.

### 2. 토큰 크기

너무 많은 정보를 Payload에 담으면 토큰이 비대해집니다.

```java
// 나쁜 예: 불필요한 정보 포함
Map<String, Object> claims = new HashMap<>();
claims.put("user_profile_image", "data:image/png;base64,..."); // 큰 데이터
claims.put("user_preferences", largeObject);

// 좋은 예: 최소한의 정보만
Map<String, Object> claims = new HashMap<>();
claims.put("role", "ADMIN");
claims.put("userId", 12345);
```

### 3. XSS 방어

LocalStorage는 JavaScript로 접근 가능하므로 XSS 공격에 취약합니다.

```javascript
// 방어 1: Content Security Policy 설정
// <meta http-equiv="Content-Security-Policy" content="default-src 'self'">

// 방어 2: 민감한 토큰은 HttpOnly 쿠키 사용 (Refresh Token)
// 서버: response.addCookie(new Cookie("refreshToken", token).setHttpOnly(true))

// 방어 3: 입력 값 검증 및 이스케이프
const sanitizeInput = (input) => {
  return input.replace(/[<>\"']/g, '');
};
```

### 4. CSRF 방어

Stateless 토큰 방식은 CSRF에 상대적으로 안전하지만, 쿠키 사용 시 주의가 필요합니다.

```java
// SameSite 쿠키 속성 사용
Cookie cookie = new Cookie("token", jwt);
cookie.setHttpOnly(true);
cookie.setSecure(true); // HTTPS only
cookie.setAttribute("SameSite", "Strict");
```

### 5. HTTPS 사용

JWT는 평문이므로 반드시 HTTPS를 사용해야 합니다.

## 실전 예시: 관리 콘솔 인증 시스템

### 시나리오

관리자가 관리 콘솔에 로그인하여 사용자 목록을 조회하고, 토큰 만료 전 자동 갱신되는 시스템을 구현합니다.

### 백엔드: 사용자 컨트롤러

```java
@RestController
@RequestMapping("/api/admin/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        // JWT 필터가 이미 인증을 처리했으므로 바로 조회
        return userService.findAll();
    }

    @GetMapping("/me")
    public User getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return userService.findByUsername(userDetails.getUsername());
    }
}
```

### 프론트엔드: 로그인 페이지

```jsx
// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('로그인 실패: 사용자명 또는 비밀번호를 확인하세요');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>관리자 로그인</h2>
        {error && <div className="error">{error}</div>}
        <input
          type="text"
          placeholder="사용자명"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">로그인</button>
      </form>
    </div>
  );
};

export default Login;
```

### 프론트엔드: 사용자 목록 페이지

```jsx
// src/pages/Users.jsx
import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import SessionWarning from '../components/SessionWarning';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="users-container">
      <SessionWarning />
      <h2>사용자 목록</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>사용자명</th>
            <th>이메일</th>
            <th>역할</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
```

### 동작 흐름

1. 사용자가 `/login`에서 인증 정보 입력
2. 서버가 JWT 토큰 발급 (1시간 유효)
3. 클라이언트가 LocalStorage에 토큰 저장
4. `/dashboard` 이동 시 Axios 인터셉터가 자동으로 `Authorization: Bearer <token>` 헤더 추가
5. 서버의 `JwtAuthenticationFilter`가 토큰 검증
6. 만료 55분 시점에 자동 갱신 또는 60초 전 경고 다이얼로그 표시
7. 사용자가 "연장하기" 클릭 시 `/auth/refresh`로 새 토큰 발급

## 마무리

JWT는 현대 웹 애플리케이션에서 확장성과 무상태성을 제공하는 강력한 인증 방식입니다. 세션 기반 인증의 한계를 극복하고, REST API와 마이크로서비스 환경에 적합합니다.

**핵심 요약:**
- JWT는 Header.Payload.Signature 구조로 자체 서명된 토큰
- Spring Security와 통합하여 stateless 인증 구현
- 프론트엔드에서 Axios 인터셉터로 토큰 자동 관리
- Refresh Token으로 보안성과 편의성 균형
- XSS/CSRF 방어와 HTTPS 사용 필수

다음 글에서는 암호화 기초를 다루며 AES, RSA, 디지털 서명의 원리와 구현을 알아보겠습니다.
