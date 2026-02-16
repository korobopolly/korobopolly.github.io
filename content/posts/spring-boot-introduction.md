---
title: "Spring Boot 시작하기 - 프로젝트 생성부터 실행까지"
date: 2026-02-16T13:12:00+09:00
draft: false
tags: ["Spring Boot", "Java", "웹개발", "백엔드"]
categories: ["Spring Boot"]
series: "Spring Boot"
description: "Spring Boot의 기본 개념과 프로젝트 설정 방법을 알아봅니다"
---

## Spring Boot란 무엇인가?

Spring Boot는 Spring 프레임워크를 기반으로 한 오픈소스 Java 프레임워크입니다. Spring의 강력한 기능을 그대로 사용하면서도, 복잡한 설정 없이 빠르게 프로덕션 레벨의 애플리케이션을 만들 수 있도록 설계되었습니다.

### Spring vs Spring Boot

**전통적인 Spring Framework**의 경우:
- XML 기반의 복잡한 설정 파일 필요
- 의존성 버전 관리를 직접 해야 함
- 서버 배포를 위한 WAR 파일 생성 및 Tomcat 설치 필요
- 설정 코드가 비즈니스 로직보다 많아지는 경우 발생

**Spring Boot**는 이러한 문제를 해결합니다:
- **자동 설정(Auto Configuration)**: 클래스패스의 라이브러리를 분석하여 자동으로 설정
- **내장 서버**: Tomcat, Jetty 등이 내장되어 있어 별도 설치 불필요
- **독립 실행 가능**: JAR 파일 하나로 실행 가능
- **스타터 의존성**: 관련 라이브러리를 묶어서 제공
- **프로덕션 준비 기능**: 모니터링, 헬스 체크 등 기본 제공

## 프로젝트 생성하기

### Spring Initializr 사용

Spring Boot 프로젝트를 시작하는 가장 쉬운 방법은 [Spring Initializr](https://start.spring.io/)를 사용하는 것입니다.

1. **Project**: Gradle 선택 (Groovy 또는 Kotlin DSL)
2. **Language**: Java, Kotlin, Groovy 중 선택
3. **Spring Boot 버전**: 안정 버전(SNAPSHOT이 아닌) 선택
4. **Project Metadata**:
   - Group: 회사 도메인 역순 (예: com.example)
   - Artifact: 프로젝트 이름 (예: demo)
   - Packaging: Jar (권장) 또는 War
   - Java Version: 17 이상 권장

5. **Dependencies 추가**:
   - Spring Web: REST API 개발
   - Spring Data JPA: 데이터베이스 연동
   - H2 Database: 테스트용 인메모리 DB
   - Lombok: 보일러플레이트 코드 감소

IntelliJ IDEA나 VS Code에서도 Spring Initializr 플러그인을 통해 직접 생성할 수 있습니다.

### Gradle을 사용한 프로젝트 구조

```
my-spring-boot-app/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── demo/
│   │   │               └── DemoApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── static/      (정적 리소스: CSS, JS, 이미지)
│   │       └── templates/   (Thymeleaf 등 템플릿)
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── demo/
│                       └── DemoApplicationTests.java
├── build/                    (빌드 결과물)
├── build.gradle              (Gradle 빌드 스크립트)
├── settings.gradle           (프로젝트 설정)
└── gradlew, gradlew.bat     (Gradle Wrapper)
```

**핵심 디렉토리 설명**:
- `src/main/java`: Java 소스 코드
- `src/main/resources`: 설정 파일 및 리소스
- `src/test/java`: 테스트 코드
- `build.gradle`: 프로젝트 의존성 및 빌드 설정

## 프로젝트 설정 파일

### application.properties

`src/main/resources/application.properties`는 애플리케이션 설정을 관리하는 핵심 파일입니다.

```properties
# 서버 포트 설정
server.port=8080

# 애플리케이션 이름
spring.application.name=my-app

# 데이터베이스 설정
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA 설정
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# 로그 레벨
logging.level.root=INFO
logging.level.com.example.demo=DEBUG
```

### application.yml (YAML 형식)

YAML 형식은 계층 구조를 더 명확하게 표현할 수 있습니다:

```yaml
server:
  port: 8080

spring:
  application:
    name: my-app
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

logging:
  level:
    root: INFO
    com.example.demo: DEBUG
```

두 형식 모두 동일하게 작동하며, 선호하는 형식을 선택하면 됩니다.

## @SpringBootApplication 어노테이션

Spring Boot 애플리케이션의 진입점은 `@SpringBootApplication` 어노테이션이 붙은 클래스입니다.

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

`@SpringBootApplication`은 세 가지 어노테이션의 조합입니다:

1. **@SpringBootConfiguration**: Spring Boot 설정 클래스임을 명시
2. **@EnableAutoConfiguration**: 클래스패스 기반 자동 설정 활성화
3. **@ComponentScan**: 현재 패키지와 하위 패키지를 스캔하여 Spring Bean 등록

### 자동 설정의 원리

Spring Boot는 클래스패스에 있는 라이브러리를 분석합니다:

- `spring-boot-starter-web`이 있으면 → Tomcat 서버와 Spring MVC 자동 설정
- `spring-boot-starter-data-jpa`가 있으면 → JPA와 Hibernate 자동 설정
- `H2` 드라이버가 있으면 → 인메모리 데이터베이스 자동 설정

개발자는 비즈니스 로직에만 집중할 수 있습니다.

## 내장 서버 (Embedded Server)

Spring Boot의 가장 큰 장점 중 하나는 **내장 서버**입니다.

### 내장 Tomcat

`spring-boot-starter-web` 의존성을 추가하면 Tomcat이 자동으로 포함됩니다:

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
}
```

애플리케이션 실행 시 다음과 같은 로그를 볼 수 있습니다:

```
Tomcat started on port(s): 8080 (http)
Started DemoApplication in 2.345 seconds
```

### Jetty나 Undertow로 변경

Tomcat 대신 다른 서버를 사용하려면:

```groovy
dependencies {
    implementation('org.springframework.boot:spring-boot-starter-web') {
        exclude module: 'spring-boot-starter-tomcat'
    }
    implementation 'org.springframework.boot:spring-boot-starter-jetty'
}
```

### 서버 설정 커스터마이징

```properties
server.port=9090
server.servlet.context-path=/api
server.compression.enabled=true
server.http2.enabled=true
```

## 의존성 관리 - Starter Dependencies

Spring Boot Starter는 관련 라이브러리를 묶어서 제공하는 의존성 묶음입니다.

### 주요 Starter 목록

| Starter | 용도 |
|---------|------|
| spring-boot-starter-web | REST API, Spring MVC |
| spring-boot-starter-data-jpa | JPA, Hibernate |
| spring-boot-starter-security | Spring Security 인증/인가 |
| spring-boot-starter-validation | Bean Validation |
| spring-boot-starter-test | JUnit, Mockito, AssertJ |
| spring-boot-starter-actuator | 모니터링, 헬스 체크 |
| spring-boot-starter-cache | 캐싱 추상화 |
| spring-boot-starter-mail | 이메일 발송 |

### 버전 관리의 편리함

Spring Boot Gradle 플러그인이 호환되는 라이브러리 버전을 자동으로 관리합니다:

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

dependencies {
    // 버전을 명시하지 않아도 됨
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
}
```

모든 의존성이 테스트된 호환 버전으로 자동 설정되므로 버전 충돌 걱정이 없습니다.

## 프로필 관리 (Profiles)

개발, 스테이징, 프로덕션 환경마다 다른 설정이 필요합니다. Spring Boot는 프로필 기능을 제공합니다.

### 프로필별 설정 파일

```
resources/
├── application.properties          (공통 설정)
├── application-dev.properties      (개발 환경)
├── application-prod.properties     (프로덕션 환경)
└── application-test.properties     (테스트 환경)
```

**application.properties** (공통):
```properties
spring.application.name=my-app
```

**application-dev.properties**:
```properties
server.port=8080
spring.datasource.url=jdbc:h2:mem:devdb
logging.level.root=DEBUG
```

**application-prod.properties**:
```properties
server.port=80
spring.datasource.url=jdbc:mysql://prod-db:3306/myapp
logging.level.root=WARN
```

### 프로필 활성화 방법

**1. application.properties에서:**
```properties
spring.profiles.active=dev
```

**2. 실행 시 인자로:**
```bash
java -jar myapp.jar --spring.profiles.active=prod
```

**3. 환경 변수로:**
```bash
export SPRING_PROFILES_ACTIVE=prod
java -jar myapp.jar
```

**4. IDE 설정:**
IntelliJ IDEA의 Run Configuration에서 `Active profiles`에 `dev` 입력

### 프로필별 Bean 등록

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @Profile("dev")
    public DataSource devDataSource() {
        return new H2DataSource();
    }

    @Bean
    @Profile("prod")
    public DataSource prodDataSource() {
        return new MySQLDataSource();
    }
}
```

## 첫 번째 컨트롤러 만들기

이제 실제로 동작하는 REST API를 만들어보겠습니다.

### 간단한 Hello World 컨트롤러

```java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }

    @GetMapping("/greet")
    public String greet(@RequestParam(defaultValue = "World") String name) {
        return "Hello, " + name + "!";
    }
}
```

### 실행 및 테스트

**1. 애플리케이션 실행:**
```bash
./gradlew bootRun
```

또는 IDE에서 `DemoApplication` 클래스의 `main` 메서드 실행

**2. API 테스트:**
```bash
curl http://localhost:8080/hello
# 출력: Hello, Spring Boot!

curl http://localhost:8080/greet?name=John
# 출력: Hello, John!
```

### JSON 응답 반환

```java
package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class UserController {

    @GetMapping("/user/{id}")
    public Map<String, Object> getUser(@PathVariable Long id) {
        Map<String, Object> user = new HashMap<>();
        user.put("id", id);
        user.put("name", "홍길동");
        user.put("email", "hong@example.com");
        return user;
    }

    @PostMapping("/user")
    public Map<String, Object> createUser(@RequestBody Map<String, String> userData) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", userData);
        return response;
    }
}
```

**테스트:**
```bash
# GET 요청
curl http://localhost:8080/api/user/1

# POST 요청
curl -X POST http://localhost:8080/api/user \
  -H "Content-Type: application/json" \
  -d '{"name":"김철수","email":"kim@example.com"}'
```

### DTO를 사용한 타입 안전성

```java
package com.example.demo.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String name;
    private String email;
}
```

```java
@RestController
@RequestMapping("/api/v2")
public class UserV2Controller {

    @GetMapping("/user/{id}")
    public UserDto getUser(@PathVariable Long id) {
        UserDto user = new UserDto();
        user.setId(id);
        user.setName("홍길동");
        user.setEmail("hong@example.com");
        return user;
    }
}
```

## 애플리케이션 실행 방법

### 1. IDE에서 실행
IntelliJ IDEA나 Eclipse에서 `DemoApplication` 클래스를 찾아 Run 버튼 클릭

### 2. Gradle로 실행
```bash
./gradlew bootRun
```

### 3. JAR 파일로 실행
```bash
# 빌드
./gradlew clean bootJar

# 실행
java -jar build/libs/demo-0.0.1-SNAPSHOT.jar
```

### 4. 개발 중 Hot Reload
`spring-boot-devtools` 의존성을 추가하면 코드 변경 시 자동 재시작:

```groovy
dependencies {
    developmentOnly 'org.springframework.boot:spring-boot-devtools'
}
```

## 마치며

Spring Boot는 설정보다 **관례(Convention over Configuration)**를 우선시하여 개발자가 비즈니스 로직에 집중할 수 있게 해줍니다.

이번 글에서 다룬 내용:
- ✅ Spring Boot의 개념과 장점
- ✅ 프로젝트 생성 및 구조
- ✅ 설정 파일 관리 (properties, yml)
- ✅ 자동 설정과 내장 서버
- ✅ Starter 의존성 시스템
- ✅ 프로필을 통한 환경별 설정
- ✅ REST API 컨트롤러 작성

다음 글에서는 Spring Boot로 본격적인 REST API를 개발하고 데이터베이스 연동하는 방법을 알아보겠습니다.

**관련 글:**
- Spring Boot REST API 개발하기
- Spring Data JPA로 데이터베이스 다루기
- Spring Security로 인증/인가 구현하기
