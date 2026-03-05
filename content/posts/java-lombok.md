---
title: "Lombok 핵심 어노테이션 - @Data, @Builder, Spring Boot 실전 패턴"
date: 2026-02-16T13:11:00+09:00
draft: false
tags: ["Java", "Lombok", "Spring Boot", "생산성"]
categories: ["Java"]
series: "Java"
description: "Lombok의 핵심 어노테이션과 Spring Boot에서의 실전 활용 패턴을 알아봅니다"
---

## Lombok이란

Java로 개발하다 보면 getter, setter, 생성자, toString, equals 같은 반복적인 코드를 매번 작성해야 합니다. Lombok은 어노테이션만으로 이런 보일러플레이트 코드를 컴파일 시점에 자동 생성해주는 라이브러리입니다.

### Lombok 없이 vs 있을 때

**Lombok 없이:**

```java
public class User {
    private Long id;
    private String name;
    private String email;

    public User() {}

    public User(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @Override
    public String toString() {
        return "User{id=" + id + ", name=" + name + ", email=" + email + "}";
    }

    @Override
    public boolean equals(Object o) { /* ... */ }

    @Override
    public int hashCode() { /* ... */ }
}
```

**Lombok 사용:**

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String name;
    private String email;
}
```

40줄이 넘던 코드가 7줄로 줄어듭니다.

## 설치 방법

### Gradle

```groovy
dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
}
```

### Maven

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### IDE 설정

- **IntelliJ IDEA**: `Settings → Plugins → Lombok` 플러그인 설치 후 `Settings → Build → Compiler → Annotation Processors → Enable annotation processing` 체크
- **VS Code**: `Language Support for Java` 확장이 Lombok을 자동 지원

## 핵심 어노테이션

### @Getter / @Setter

필드의 getter/setter 메서드를 자동 생성합니다.

```java
@Getter
@Setter
public class Product {
    private Long id;
    private String name;
    private int price;
}

// 사용
Product p = new Product();
p.setName("노트북");
System.out.println(p.getName()); // 노트북
```

클래스 레벨에 붙이면 모든 필드에 적용되고, 필드 레벨에 붙이면 해당 필드에만 적용됩니다.

```java
@Getter
public class Product {
    private Long id;
    private String name;

    @Setter
    private int price; // price만 setter 생성
}
```

접근 제한도 가능합니다:

```java
@Getter(AccessLevel.PROTECTED)
private String internalCode;
```

### @NoArgsConstructor / @AllArgsConstructor / @RequiredArgsConstructor

생성자를 자동 생성합니다.

```java
@NoArgsConstructor       // 기본 생성자: User()
@AllArgsConstructor      // 전체 필드 생성자: User(id, name, email)
public class User {
    private Long id;
    private String name;
    private String email;
}
```

**@RequiredArgsConstructor**는 `final` 필드와 `@NonNull` 필드만으로 생성자를 만듭니다.

```java
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;  // 생성자에 포함
    private final EmailService emailService;      // 생성자에 포함
    private String tempValue;                     // 생성자에 미포함
}

// 자동 생성되는 코드:
// public UserService(UserRepository userRepository, EmailService emailService) {
//     this.userRepository = userRepository;
//     this.emailService = emailService;
// }
```

Spring에서 가장 많이 사용되는 패턴입니다. `@Autowired` 없이 생성자 주입이 가능합니다.

### @Data

`@Getter` + `@Setter` + `@ToString` + `@EqualsAndHashCode` + `@RequiredArgsConstructor`를 한 번에 적용합니다.

```java
@Data
public class UserDto {
    private Long id;
    private String name;
    private String email;
}

// 다음이 모두 자동 생성:
// - 모든 필드의 getter/setter
// - toString()
// - equals(), hashCode()
// - final 필드 기반 생성자
```

DTO나 간단한 데이터 클래스에 적합합니다.

### @Builder

빌더 패턴을 자동 생성합니다. 필드가 많은 객체를 가독성 좋게 생성할 수 있습니다.

```java
@Getter
@Builder
public class Order {
    private Long orderId;
    private String customerName;
    private String product;
    private int quantity;
    private double totalPrice;
    private String shippingAddress;
}

// 사용
Order order = Order.builder()
    .orderId(1L)
    .customerName("홍길동")
    .product("노트북")
    .quantity(2)
    .totalPrice(2400000)
    .shippingAddress("서울시 강남구")
    .build();
```

기본값을 지정하려면 `@Builder.Default`를 사용합니다:

```java
@Getter
@Builder
public class Order {
    private Long orderId;
    private String customerName;

    @Builder.Default
    private String status = "PENDING";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
```

### @Slf4j

로깅을 위한 `log` 필드를 자동 생성합니다.

```java
@Slf4j
@Service
public class PaymentService {

    public void processPayment(Payment payment) {
        log.info("결제 처리 시작: {}", payment.getId());

        try {
            // 결제 로직
            log.debug("결제 상세: amount={}, method={}", payment.getAmount(), payment.getMethod());
        } catch (Exception e) {
            log.error("결제 실패: {}", payment.getId(), e);
        }
    }
}

// 자동 생성되는 코드:
// private static final org.slf4j.Logger log =
//     org.slf4j.LoggerFactory.getLogger(PaymentService.class);
```

Log4j2를 사용한다면 `@Log4j2`를 대신 사용합니다.

### @ToString

`toString()` 메서드를 자동 생성합니다.

```java
@ToString
public class User {
    private Long id;
    private String name;

    @ToString.Exclude
    private String password; // toString에서 제외
}

// User(id=1, name=홍길동)
```

### @EqualsAndHashCode

`equals()`와 `hashCode()`를 자동 생성합니다.

```java
@EqualsAndHashCode
public class Product {
    private Long id;
    private String name;
    private int price;
}

// 특정 필드만 사용
@EqualsAndHashCode(of = "id")
public class Product {
    private Long id;
    private String name;
    private int price;
}
```

### @Value

불변(Immutable) 클래스를 만듭니다. 모든 필드가 `private final`이 되고 setter가 생성되지 않습니다.

```java
@Value
public class Money {
    String currency;
    BigDecimal amount;
}

// 자동 생성: getter, toString, equals, hashCode, AllArgsConstructor
// setter는 생성되지 않음 (불변 객체)

Money price = new Money("KRW", new BigDecimal("50000"));
// price.setAmount(...) → 컴파일 에러
```

## Spring Boot에서의 실전 패턴

### Service - @RequiredArgsConstructor로 생성자 주입

Spring에서 의존성 주입의 권장 방식은 생성자 주입입니다. Lombok과 함께 사용하면 매우 간결해집니다.

```java
// Lombok 없이
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        PaymentService paymentService,
                        NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }
}

// Lombok 사용
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
}
```

생성자가 하나뿐이면 Spring이 자동으로 `@Autowired`를 적용합니다.

### Entity - @Getter + @NoArgsConstructor

JPA Entity에서는 `@Data` 대신 `@Getter`와 `@NoArgsConstructor`를 사용합니다.

```java
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Builder
    public User(String name, String email) {
        this.name = name;
        this.email = email;
    }
}
```

`@NoArgsConstructor(access = AccessLevel.PROTECTED)` - JPA 스펙상 기본 생성자가 필요하지만, 외부에서 빈 객체를 만드는 것은 막습니다.

### DTO - @Getter + @Builder 또는 @Data

요청/응답 DTO에서는 용도에 따라 다르게 사용합니다.

```java
// 요청 DTO - setter 필요 (Jackson 역직렬화)
@Getter
@NoArgsConstructor
public class CreateUserRequest {
    private String name;
    private String email;
}

// 응답 DTO - 불변 객체
@Getter
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
```

### Controller + Service + Repository 전체 패턴

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping
    public UserResponse createUser(@RequestBody CreateUserRequest request) {
        return userService.createUser(request);
    }
}

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;

    public UserResponse createUser(CreateUserRequest request) {
        log.info("사용자 생성: {}", request.getName());

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .build();

        user = userRepository.save(user);
        return UserResponse.from(user);
    }
}
```

`@RequiredArgsConstructor`로 의존성 주입, `@Slf4j`로 로깅, `@Builder`로 객체 생성까지 Lombok이 Spring Boot 전반에 걸쳐 사용됩니다.

## 주의사항

### @Data를 Entity에 사용하면 안 되는 이유

`@Data`는 `@EqualsAndHashCode`를 포함하며, 모든 필드를 비교합니다. JPA Entity에서 이것이 문제가 됩니다:

```java
// 위험한 코드
@Data
@Entity
public class Order {
    @Id
    private Long id;

    @ManyToOne
    private User user; // equals() 호출 시 User도 로딩 → N+1 문제

    @OneToMany(mappedBy = "order")
    private List<OrderItem> items; // 순환 참조 → StackOverflowError
}
```

**해결**: Entity에는 `@Getter` + `@NoArgsConstructor`만 사용하고, 필요하면 `@EqualsAndHashCode(of = "id")`를 명시합니다.

### @Builder와 @NoArgsConstructor 함께 사용

`@Builder`만 사용하면 `@AllArgsConstructor`를 암묵적으로 생성하므로, `@NoArgsConstructor`와 충돌합니다.

```java
// 컴파일 에러
@Builder
@NoArgsConstructor
public class User { ... }

// 해결: @AllArgsConstructor를 명시
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User { ... }
```

### @ToString과 순환 참조

양방향 관계에서 `@ToString`이 순환 참조를 일으킬 수 있습니다.

```java
@Entity
@Getter
@ToString
public class Team {
    @OneToMany(mappedBy = "team")
    private List<Member> members; // Member.toString() → Team.toString() → 무한루프
}

// 해결
@ToString(exclude = "members")
public class Team { ... }
```

## 어노테이션 선택 가이드

| 사용처 | 권장 조합 | 이유 |
|--------|-----------|------|
| JPA Entity | `@Getter` + `@NoArgsConstructor(PROTECTED)` + `@Builder` | setter 방지, equals/hashCode 문제 회피 |
| 요청 DTO | `@Getter` + `@NoArgsConstructor` | Jackson 역직렬화에 기본 생성자 필요 |
| 응답 DTO | `@Getter` + `@Builder` | 불변 객체로 안전하게 반환 |
| Service/Controller | `@RequiredArgsConstructor` + `@Slf4j` | 생성자 주입 + 로깅 |
| 간단한 데이터 클래스 | `@Data` | 빠른 개발, Entity가 아닌 경우만 |
| 불변 객체 | `@Value` | 모든 필드 final, setter 없음 |

## 마무리

Lombok은 Java 개발에서 반복적인 보일러플레이트 코드를 줄여주는 필수 도구입니다.

**핵심 정리:**
- `@Getter/@Setter`: 접근자 자동 생성
- `@RequiredArgsConstructor`: Spring 생성자 주입의 핵심
- `@Builder`: 가독성 좋은 객체 생성
- `@Slf4j`: 로깅 설정 간소화
- `@Data`: DTO용 올인원 (Entity에는 사용 금지)
- `@Value`: 불변 객체 생성

**실전 원칙:**
- Entity에는 `@Data` 대신 `@Getter` + `@NoArgsConstructor`
- Service/Controller에는 `@RequiredArgsConstructor` + `@Slf4j`
- DTO는 용도에 따라 `@Builder` 또는 `@Data` 선택
- 양방향 관계에서는 `@ToString.Exclude`로 순환 참조 방지
