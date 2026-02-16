---
title: "Spring Boot REST API 구현 가이드 - 실전 CRUD 개발"
date: 2026-02-16T13:13:00+09:00
draft: false
tags: ["Spring Boot", "REST API", "CRUD", "백엔드"]
categories: ["Spring Boot"]
series: "Spring Boot"
description: "Spring Boot로 RESTful API를 설계하고 구현하는 방법을 실습합니다"
---

## REST API 설계 원칙

RESTful API는 HTTP 프로토콜을 기반으로 자원(Resource)을 URI로 표현하고, HTTP 메서드로 작업을 정의하는 아키텍처 스타일입니다. Spring Boot는 REST API 개발을 위한 강력한 기능을 제공합니다.

### REST의 핵심 원칙

**1. 자원 기반 URI 설계**
- 명사를 사용하여 자원을 표현: `/users`, `/products`
- 계층 구조 표현: `/users/{id}/orders`
- 복수형 사용 권장: `/users` (O), `/user` (X)

**2. HTTP 메서드 활용**
- GET: 조회
- POST: 생성
- PUT: 전체 수정
- PATCH: 부분 수정
- DELETE: 삭제

**3. 상태 코드 활용**
- 2xx: 성공 (200 OK, 201 Created, 204 No Content)
- 4xx: 클라이언트 오류 (400 Bad Request, 404 Not Found)
- 5xx: 서버 오류 (500 Internal Server Error)

## @RestController와 @RequestMapping

Spring Boot에서 REST API를 만들 때 가장 먼저 사용하는 어노테이션입니다.

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    // 모든 응답이 자동으로 JSON으로 변환됩니다
}
```

**@RestController vs @Controller**
- `@RestController` = `@Controller` + `@ResponseBody`
- 모든 메서드의 반환값이 HTTP 응답 본문으로 직렬화됩니다
- ViewResolver를 거치지 않고 바로 JSON/XML로 변환됩니다

**@RequestMapping 속성**
```java
@RequestMapping(
    value = "/api/users",
    method = RequestMethod.GET,
    produces = MediaType.APPLICATION_JSON_VALUE,
    consumes = MediaType.APPLICATION_JSON_VALUE
)
```

## HTTP 메서드 매핑

Spring Boot는 각 HTTP 메서드에 대응하는 편리한 어노테이션을 제공합니다.

### @GetMapping - 조회

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    // 전체 목록 조회
    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.findAll();
    }

    // 단건 조회
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    // 검색 (쿼리 파라미터)
    @GetMapping("/search")
    public List<UserResponse> searchUsers(
        @RequestParam(required = false) String name,
        @RequestParam(required = false) Integer age
    ) {
        return userService.search(name, age);
    }
}
```

### @PostMapping - 생성

```java
@PostMapping
public ResponseEntity<UserResponse> createUser(
    @RequestBody @Valid UserCreateRequest request
) {
    UserResponse created = userService.create(request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(created);
}
```

### @PutMapping - 전체 수정

```java
@PutMapping("/{id}")
public UserResponse updateUser(
    @PathVariable Long id,
    @RequestBody @Valid UserUpdateRequest request
) {
    return userService.update(id, request);
}
```

### @PatchMapping - 부분 수정

```java
@PatchMapping("/{id}")
public UserResponse patchUser(
    @PathVariable Long id,
    @RequestBody Map<String, Object> updates
) {
    return userService.patch(id, updates);
}
```

### @DeleteMapping - 삭제

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    userService.delete(id);
    return ResponseEntity.noContent().build();
}
```

## 요청/응답 DTO 패턴

Entity를 직접 노출하지 않고 DTO(Data Transfer Object)를 사용하는 것이 모범 사례입니다.

### 요청 DTO

```java
// 생성 요청
@Getter
@NoArgsConstructor
public class UserCreateRequest {
    @NotBlank(message = "이름은 필수입니다")
    private String name;

    @Email(message = "올바른 이메일 형식이 아닙니다")
    @NotBlank
    private String email;

    @Min(value = 0, message = "나이는 0 이상이어야 합니다")
    @Max(value = 150, message = "나이는 150 이하여야 합니다")
    private Integer age;

    @Builder
    public UserCreateRequest(String name, String email, Integer age) {
        this.name = name;
        this.email = email;
        this.age = age;
    }
}

// 수정 요청
@Getter
@NoArgsConstructor
public class UserUpdateRequest {
    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @Min(0)
    @Max(150)
    private Integer age;

    @Builder
    public UserUpdateRequest(String name, String email, Integer age) {
        this.name = name;
        this.email = email;
        this.age = age;
    }
}
```

### 응답 DTO

```java
@Getter
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private Integer age;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder
    public UserResponse(Long id, String name, String email,
                       Integer age, LocalDateTime createdAt,
                       LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.age = age;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Entity에서 DTO로 변환
    public static UserResponse from(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .age(user.getAge())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
}
```

## @PathVariable, @RequestBody, @RequestParam

### @PathVariable - URI 경로 변수

```java
// 단일 경로 변수
@GetMapping("/users/{id}")
public UserResponse getUser(@PathVariable Long id) {
    return userService.findById(id);
}

// 다중 경로 변수
@GetMapping("/users/{userId}/orders/{orderId}")
public OrderResponse getUserOrder(
    @PathVariable Long userId,
    @PathVariable Long orderId
) {
    return orderService.findByUserAndOrder(userId, orderId);
}

// 변수명과 파라미터명이 다를 때
@GetMapping("/users/{user-id}")
public UserResponse getUser(@PathVariable("user-id") Long userId) {
    return userService.findById(userId);
}
```

### @RequestBody - 요청 본문

```java
@PostMapping("/users")
public ResponseEntity<UserResponse> createUser(
    @RequestBody @Valid UserCreateRequest request
) {
    // request 객체가 JSON에서 자동 변환됩니다
    UserResponse created = userService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}
```

**@Valid 검증**
```java
@PostMapping("/users")
public UserResponse createUser(
    @RequestBody @Valid UserCreateRequest request,
    BindingResult bindingResult
) {
    if (bindingResult.hasErrors()) {
        // 검증 오류 처리
        throw new ValidationException(bindingResult);
    }
    return userService.create(request);
}
```

### @RequestParam - 쿼리 파라미터

```java
// 단일 파라미터
@GetMapping("/users/search")
public List<UserResponse> searchByName(
    @RequestParam String name
) {
    return userService.findByName(name);
}

// 다중 파라미터 (선택적)
@GetMapping("/users/filter")
public List<UserResponse> filterUsers(
    @RequestParam(required = false) String name,
    @RequestParam(required = false) Integer minAge,
    @RequestParam(required = false) Integer maxAge,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
) {
    return userService.filter(name, minAge, maxAge, page, size);
}

// Map으로 모든 파라미터 받기
@GetMapping("/users/dynamic")
public List<UserResponse> dynamicSearch(
    @RequestParam Map<String, String> params
) {
    return userService.dynamicSearch(params);
}
```

## ResponseEntity 활용

ResponseEntity를 사용하면 HTTP 상태 코드, 헤더, 본문을 세밀하게 제어할 수 있습니다.

### 기본 사용법

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    // 200 OK with body
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        UserResponse user = userService.findById(id);
        return ResponseEntity.ok(user);
    }

    // 201 Created with Location header
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
        @RequestBody @Valid UserCreateRequest request
    ) {
        UserResponse created = userService.create(request);
        URI location = URI.create("/api/users/" + created.getId());

        return ResponseEntity
            .created(location)
            .body(created);
    }

    // 204 No Content
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // 404 Not Found
    @GetMapping("/{id}/optional")
    public ResponseEntity<UserResponse> getUserOptional(@PathVariable Long id) {
        return userService.findByIdOptional(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
```

### 커스텀 헤더 추가

```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
    UserResponse user = userService.findById(id);

    return ResponseEntity.ok()
        .header("X-Custom-Header", "CustomValue")
        .header("X-User-Count", String.valueOf(userService.count()))
        .body(user);
}
```

### 조건부 응답

```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getUser(
    @PathVariable Long id,
    @RequestHeader(value = "If-Modified-Since", required = false)
    String ifModifiedSince
) {
    UserResponse user = userService.findById(id);

    if (ifModifiedSince != null && !userService.isModified(id, ifModifiedSince)) {
        return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
    }

    return ResponseEntity.ok(user);
}
```

## 예외 처리

### @ExceptionHandler - 컨트롤러 레벨

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    // 이 컨트롤러 내에서 발생하는 UserNotFoundException 처리
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(
        UserNotFoundException ex
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.NOT_FOUND.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
```

### @ControllerAdvice - 전역 예외 처리

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 Not Found
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(
        UserNotFoundException ex
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.NOT_FOUND.value())
            .message(ex.getMessage())
            .path(ex.getPath())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // 400 Bad Request - Validation 오류
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
        MethodArgumentNotValidException ex
    ) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );

        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST.value())
            .message("입력값 검증 실패")
            .errors(errors)
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.badRequest().body(error);
    }

    // 409 Conflict - 중복 데이터
    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(
        DuplicateEmailException ex
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.CONFLICT.value())
            .message(ex.getMessage())
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    // 500 Internal Server Error - 예상치 못한 오류
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
        Exception ex
    ) {
        ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
            .message("서버 오류가 발생했습니다")
            .timestamp(LocalDateTime.now())
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### 에러 응답 DTO

```java
@Getter
@Builder
public class ErrorResponse {
    private int status;
    private String message;
    private String path;
    private LocalDateTime timestamp;
    private Map<String, String> errors;  // 필드별 검증 오류
}
```

### 커스텀 예외

```java
public class UserNotFoundException extends RuntimeException {
    private final String path;

    public UserNotFoundException(Long id, String path) {
        super("사용자를 찾을 수 없습니다: " + id);
        this.path = path;
    }

    public String getPath() {
        return path;
    }
}

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("이미 사용 중인 이메일입니다: " + email);
    }
}
```

## Spring Data JPA 연동

### Entity 정의

```java
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column
    private Integer age;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public User(String name, String email, Integer age) {
        this.name = name;
        this.email = email;
        this.age = age;
    }

    // 비즈니스 로직 메서드
    public void update(String name, String email, Integer age) {
        this.name = name;
        this.email = email;
        this.age = age;
    }
}
```

### Repository 인터페이스

```java
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByNameContaining(String name);

    List<User> findByAgeBetween(Integer minAge, Integer maxAge);

    @Query("SELECT u FROM User u WHERE " +
           "(:name IS NULL OR u.name LIKE %:name%) AND " +
           "(:minAge IS NULL OR u.age >= :minAge) AND " +
           "(:maxAge IS NULL OR u.age <= :maxAge)")
    List<User> searchUsers(
        @Param("name") String name,
        @Param("minAge") Integer minAge,
        @Param("maxAge") Integer maxAge
    );
}
```

### Service 레이어

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    // 전체 조회
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
            .map(UserResponse::from)
            .toList();
    }

    // 단건 조회
    public UserResponse findById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id, "/api/users/" + id));
        return UserResponse.from(user);
    }

    // 생성
    @Transactional
    public UserResponse create(UserCreateRequest request) {
        // 이메일 중복 검사
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateEmailException(request.getEmail());
        }

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .age(request.getAge())
            .build();

        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    // 수정
    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id, "/api/users/" + id));

        // 다른 사용자가 이미 해당 이메일을 사용 중인지 확인
        userRepository.findByEmail(request.getEmail())
            .filter(u -> !u.getId().equals(id))
            .ifPresent(u -> {
                throw new DuplicateEmailException(request.getEmail());
            });

        user.update(request.getName(), request.getEmail(), request.getAge());
        return UserResponse.from(user);
    }

    // 삭제
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id, "/api/users/" + id);
        }
        userRepository.deleteById(id);
    }

    // 검색
    public List<UserResponse> search(String name, Integer age) {
        if (name != null && age != null) {
            return userRepository.findByNameContaining(name).stream()
                .filter(u -> u.getAge().equals(age))
                .map(UserResponse::from)
                .toList();
        } else if (name != null) {
            return userRepository.findByNameContaining(name).stream()
                .map(UserResponse::from)
                .toList();
        } else {
            return findAll();
        }
    }
}
```

## 전체 CRUD 예제 - 사용자 관리 API

이제 모든 구성 요소를 결합한 완전한 사용자 관리 API를 구현해 보겠습니다.

### 프로젝트 구조

```
src/main/java/com/example/demo/
├── domain/
│   └── user/
│       ├── User.java (Entity)
│       ├── UserRepository.java
│       ├── UserService.java
│       └── UserController.java
├── dto/
│   ├── UserCreateRequest.java
│   ├── UserUpdateRequest.java
│   └── UserResponse.java
├── exception/
│   ├── UserNotFoundException.java
│   ├── DuplicateEmailException.java
│   ├── ErrorResponse.java
│   └── GlobalExceptionHandler.java
└── DemoApplication.java
```

### 완성된 Controller

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 전체 사용자 조회
     * GET /api/users
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * 사용자 단건 조회
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        UserResponse user = userService.findById(id);
        return ResponseEntity.ok(user);
    }

    /**
     * 사용자 검색
     * GET /api/users/search?name=홍길동&age=30
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(
        @RequestParam(required = false) String name,
        @RequestParam(required = false) Integer age
    ) {
        List<UserResponse> users = userService.search(name, age);
        return ResponseEntity.ok(users);
    }

    /**
     * 사용자 생성
     * POST /api/users
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
        @RequestBody @Valid UserCreateRequest request
    ) {
        UserResponse created = userService.create(request);
        URI location = URI.create("/api/users/" + created.getId());

        return ResponseEntity.created(location).body(created);
    }

    /**
     * 사용자 수정
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
        @PathVariable Long id,
        @RequestBody @Valid UserUpdateRequest request
    ) {
        UserResponse updated = userService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * 사용자 삭제
     * DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### application.yml 설정

```yaml
spring:
  application:
    name: demo

  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
    username: sa
    password:

  jpa:
    hibernate:
      ddl-auto: create-drop
    properties:
      hibernate:
        format_sql: true
        show_sql: true
    open-in-view: false

  h2:
    console:
      enabled: true
      path: /h2-console

logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.type.descriptor.sql.BasicBinder: trace
```

### 테스트 (REST API 호출 예제)

**1. 사용자 생성**
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "email": "hong@example.com",
    "age": 30
  }'
```

응답:
```json
{
  "id": 1,
  "name": "홍길동",
  "email": "hong@example.com",
  "age": 30,
  "createdAt": "2026-02-12T10:00:00",
  "updatedAt": "2026-02-12T10:00:00"
}
```

**2. 전체 사용자 조회**
```bash
curl http://localhost:8080/api/users
```

**3. 단건 조회**
```bash
curl http://localhost:8080/api/users/1
```

**4. 검색**
```bash
curl "http://localhost:8080/api/users/search?name=홍길동"
```

**5. 수정**
```bash
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "홍길동",
    "email": "hong.updated@example.com",
    "age": 31
  }'
```

**6. 삭제**
```bash
curl -X DELETE http://localhost:8080/api/users/1
```

## 정리

Spring Boot로 REST API를 구현할 때 핵심 포인트는 다음과 같습니다.

1. **명확한 URI 설계**: 자원 중심의 REST 원칙을 따르고 HTTP 메서드를 적절히 활용합니다
2. **DTO 패턴**: Entity를 직접 노출하지 않고 요청/응답 전용 객체를 사용합니다
3. **Validation**: `@Valid`와 Bean Validation으로 입력값을 검증합니다
4. **예외 처리**: `@ControllerAdvice`로 일관된 에러 응답을 제공합니다
5. **ResponseEntity**: HTTP 상태 코드와 헤더를 명시적으로 제어합니다
6. **계층 분리**: Controller - Service - Repository 구조로 책임을 분리합니다

이 가이드의 패턴을 활용하면 확장 가능하고 유지보수하기 쉬운 REST API를 구축할 수 있습니다.
