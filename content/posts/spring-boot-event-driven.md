---
title: "Spring Boot 이벤트 아키텍처 - @EventListener, @Async, 트랜잭션 이벤트"
date: 2026-02-16T13:18:00+09:00
draft: false
tags: ["Spring Boot", "이벤트", "비동기", "아키텍처"]
categories: ["Spring Boot"]
series: "Spring Boot"
description: "ApplicationEvent와 @EventListener를 활용한 이벤트 기반 아키텍처 구현 방법을 알아봅니다"
---

## 이벤트 기반 아키텍처란

이벤트 기반 아키텍처(Event-Driven Architecture)는 시스템의 컴포넌트들이 이벤트를 통해 상호작용하는 설계 패턴입니다. 특정 작업이 완료되었을 때 이벤트를 발행하고, 관심 있는 컴포넌트가 이를 구독하여 처리하는 방식입니다.

전통적인 방식에서는 서비스 A가 서비스 B, C, D를 직접 호출했다면, 이벤트 기반 방식에서는 서비스 A가 이벤트만 발행하고, B, C, D가 각자 필요한 이벤트를 구독하여 처리합니다.

## 왜 이벤트 기반 아키텍처인가

### 서비스 간 결합도 감소

직접 호출 방식의 문제점:

```java
@Service
public class UserService {
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final AnalyticsService analyticsService;

    public void registerUser(User user) {
        userRepository.save(user);

        // 모든 서비스를 직접 호출
        emailService.sendWelcomeEmail(user);
        notificationService.sendPushNotification(user);
        auditService.logUserRegistration(user);
        analyticsService.trackUserSignup(user);
    }
}
```

위 코드는 `UserService`가 4개의 서비스에 강하게 결합되어 있습니다. 새로운 기능 추가 시마다 `UserService`를 수정해야 합니다.

이벤트 기반 방식:

```java
@Service
public class UserService {
    private final ApplicationEventPublisher eventPublisher;

    public void registerUser(User user) {
        userRepository.save(user);

        // 이벤트만 발행
        eventPublisher.publishEvent(new UserRegisteredEvent(user));
    }
}
```

`UserService`는 이제 사용자 등록 후 이벤트만 발행합니다. 다른 서비스들은 독립적으로 이 이벤트를 구독하여 처리할 수 있습니다.

### 주요 장점

1. **낮은 결합도**: 이벤트 발행자는 구독자를 알 필요가 없습니다
2. **높은 확장성**: 새로운 이벤트 리스너를 추가해도 기존 코드를 수정하지 않습니다
3. **비동기 처리**: 시간이 오래 걸리는 작업을 비동기로 처리할 수 있습니다
4. **단일 책임 원칙**: 각 컴포넌트가 자신의 역할에만 집중합니다

## ApplicationEvent 정의하기

Spring에서 이벤트를 정의하는 방법은 간단합니다.

### 기본 이벤트 클래스

```java
public class UserRegisteredEvent {
    private final User user;
    private final LocalDateTime occurredAt;

    public UserRegisteredEvent(User user) {
        this.user = user;
        this.occurredAt = LocalDateTime.now();
    }

    public User getUser() {
        return user;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }
}
```

Spring 4.2 이후부터는 `ApplicationEvent`를 상속받지 않아도 됩니다. 일반 POJO 클래스로 이벤트를 정의할 수 있습니다.

### ApplicationEvent 상속 방식

```java
public class OrderCompletedEvent extends ApplicationEvent {
    private final Order order;
    private final BigDecimal totalAmount;

    public OrderCompletedEvent(Object source, Order order, BigDecimal totalAmount) {
        super(source);
        this.order = order;
        this.totalAmount = totalAmount;
    }

    public Order getOrder() {
        return order;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
}
```

### 제네릭 이벤트

```java
public class EntityCreatedEvent<T> {
    private final T entity;
    private final String entityType;
    private final Long entityId;

    public EntityCreatedEvent(T entity, String entityType, Long entityId) {
        this.entity = entity;
        this.entityType = entityType;
        this.entityId = entityId;
    }

    public T getEntity() {
        return entity;
    }

    public String getEntityType() {
        return entityType;
    }

    public Long getEntityId() {
        return entityId;
    }
}
```

## ApplicationEventPublisher로 이벤트 발행

`ApplicationEventPublisher`는 Spring이 제공하는 이벤트 발행 인터페이스입니다.

### 기본 발행 방식

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Order createOrder(OrderRequest request) {
        Order order = new Order(request);
        order = orderRepository.save(order);

        // 이벤트 발행
        eventPublisher.publishEvent(new OrderCompletedEvent(this, order, order.getTotalAmount()));

        return order;
    }
}
```

### 여러 이벤트 발행

```java
@Service
@RequiredArgsConstructor
public class PaymentService {
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void processPayment(Payment payment) {
        payment.setStatus(PaymentStatus.PROCESSING);

        try {
            // 결제 처리 로직
            externalPaymentGateway.charge(payment);
            payment.setStatus(PaymentStatus.COMPLETED);

            // 성공 이벤트 발행
            eventPublisher.publishEvent(new PaymentCompletedEvent(payment));
            eventPublisher.publishEvent(new NotificationEvent("결제가 완료되었습니다"));

        } catch (PaymentException e) {
            payment.setStatus(PaymentStatus.FAILED);

            // 실패 이벤트 발행
            eventPublisher.publishEvent(new PaymentFailedEvent(payment, e.getMessage()));
        }
    }
}
```

## @EventListener로 이벤트 수신

`@EventListener` 어노테이션을 사용하여 이벤트를 구독할 수 있습니다.

### 기본 리스너

```java
@Component
@Slf4j
public class UserEventListener {

    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        User user = event.getUser();
        log.info("새로운 사용자 등록: {}, 이메일: {}", user.getName(), user.getEmail());
    }
}
```

### 여러 리스너 메서드

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class OrderEventListener {
    private final EmailService emailService;
    private final InventoryService inventoryService;

    @EventListener
    public void handleOrderCompleted(OrderCompletedEvent event) {
        Order order = event.getOrder();
        log.info("주문 완료: 주문번호 {}, 금액 {}", order.getId(), event.getTotalAmount());

        // 주문 확인 이메일 발송
        emailService.sendOrderConfirmation(order);
    }

    @EventListener
    public void updateInventory(OrderCompletedEvent event) {
        Order order = event.getOrder();

        // 재고 업데이트
        order.getItems().forEach(item ->
            inventoryService.decreaseStock(item.getProductId(), item.getQuantity())
        );
    }
}
```

### 조건부 리스너

```java
@Component
@Slf4j
public class PaymentEventListener {

    // 특정 조건에만 실행
    @EventListener(condition = "#event.totalAmount > 100000")
    public void handleLargePayment(PaymentCompletedEvent event) {
        log.warn("고액 결제 감지: {} 원", event.getTotalAmount());
        // 추가 검증 로직
    }

    @EventListener(condition = "#event.user.vip == true")
    public void handleVipUserRegistration(UserRegisteredEvent event) {
        log.info("VIP 사용자 등록: {}", event.getUser().getName());
        // VIP 전용 처리
    }
}
```

## @Async와 비동기 이벤트 처리

이벤트 처리를 비동기로 수행하여 메인 로직의 성능을 향상시킬 수 있습니다.

### 비동기 설정

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("event-async-");
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            log.error("비동기 이벤트 처리 중 예외 발생: {}", method.getName(), ex);
    }
}
```

### 비동기 리스너

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class NotificationEventListener {
    private final EmailService emailService;
    private final SmsService smsService;

    @Async
    @EventListener
    public void sendEmailNotification(UserRegisteredEvent event) {
        log.info("이메일 발송 시작 (비동기): {}", Thread.currentThread().getName());

        // 시간이 오래 걸리는 작업
        emailService.sendWelcomeEmail(event.getUser());

        log.info("이메일 발송 완료: {}", event.getUser().getEmail());
    }

    @Async
    @EventListener
    public void sendSmsNotification(OrderCompletedEvent event) {
        log.info("SMS 발송 시작 (비동기): {}", Thread.currentThread().getName());

        // 외부 API 호출
        smsService.sendOrderConfirmation(event.getOrder());

        log.info("SMS 발송 완료");
    }
}
```

### 비동기 처리 장점

```java
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ApplicationEventPublisher eventPublisher;

    public void createProduct(Product product) {
        long startTime = System.currentTimeMillis();

        productRepository.save(product);

        // 비동기 이벤트 발행 - 즉시 반환
        eventPublisher.publishEvent(new ProductCreatedEvent(product));

        long endTime = System.currentTimeMillis();
        log.info("상품 생성 완료 ({}ms)", endTime - startTime);
        // 이메일, 알림 등의 처리 시간과 무관하게 빠르게 응답
    }
}
```

## @TransactionalEventListener (트랜잭션 후 이벤트)

트랜잭션 커밋 후에 이벤트를 처리하려면 `@TransactionalEventListener`를 사용합니다.

### 기본 사용법

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class TransactionalEventListener {
    private final CacheManager cacheManager;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleAfterCommit(UserRegisteredEvent event) {
        log.info("트랜잭션 커밋 후 실행");
        // 캐시 무효화
        cacheManager.getCache("users").clear();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void handleAfterRollback(PaymentFailedEvent event) {
        log.warn("트랜잭션 롤백 후 실행");
        // 보상 트랜잭션 또는 알림
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMPLETION)
    public void handleAfterCompletion(OrderCompletedEvent event) {
        log.info("트랜잭션 완료 후 실행 (커밋/롤백 무관)");
    }
}
```

### 트랜잭션 페이즈

- `BEFORE_COMMIT`: 트랜잭션 커밋 직전
- `AFTER_COMMIT`: 트랜잭션 커밋 후 (기본값)
- `AFTER_ROLLBACK`: 트랜잭션 롤백 후
- `AFTER_COMPLETION`: 커밋 또는 롤백 후

### 실전 예제: 외부 시스템 연동

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Order createOrder(OrderRequest request) {
        Order order = new Order(request);
        order = orderRepository.save(order);

        // DB 저장 후 이벤트 발행
        eventPublisher.publishEvent(new OrderCreatedEvent(order));

        return order;
    }
}

@Component
@RequiredArgsConstructor
public class OrderIntegrationListener {
    private final ExternalApiClient externalApiClient;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void syncToExternalSystem(OrderCreatedEvent event) {
        // 트랜잭션이 성공적으로 커밋된 후에만 외부 시스템 호출
        externalApiClient.notifyOrderCreated(event.getOrder());
    }
}
```

## 실전 예시: 파일 동기화 시스템에서의 이벤트

실제 파일 동기화 시스템에서 23개의 도메인 이벤트를 활용하는 사례를 살펴보겠습니다.

### 동기화 진행 상황 이벤트

```java
public class SyncProgressEvent {
    private final Long scheduleId;
    private final String phase;
    private final int progress;
    private final long totalFiles;
    private final long processedFiles;

    public SyncProgressEvent(Long scheduleId, String phase, int progress,
                             long totalFiles, long processedFiles) {
        this.scheduleId = scheduleId;
        this.phase = phase;
        this.progress = progress;
        this.totalFiles = totalFiles;
        this.processedFiles = processedFiles;
    }

    // getters
}
```

### 백업 완료 이벤트

```java
public class BackupCompletedEvent {
    private final Long backupId;
    private final String backupPath;
    private final long fileCount;
    private final long totalSize;
    private final Duration duration;

    public BackupCompletedEvent(Long backupId, String backupPath,
                                long fileCount, long totalSize, Duration duration) {
        this.backupId = backupId;
        this.backupPath = backupPath;
        this.fileCount = fileCount;
        this.totalSize = totalSize;
        this.duration = duration;
    }

    // getters
}
```

### 동기화 서비스

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class FileSyncService {
    private final ApplicationEventPublisher eventPublisher;
    private final RsyncExecutor rsyncExecutor;

    @Async
    public void syncFiles(SyncSchedule schedule) {
        try {
            // 동기화 시작 이벤트
            eventPublisher.publishEvent(new SyncStartedEvent(schedule.getId()));

            long totalFiles = calculateTotalFiles(schedule);
            long processedFiles = 0;

            // 진행 상황 업데이트
            for (String directory : schedule.getDirectories()) {
                rsyncExecutor.sync(directory, schedule.getDestination());
                processedFiles++;

                int progress = (int) ((processedFiles * 100) / totalFiles);
                eventPublisher.publishEvent(
                    new SyncProgressEvent(schedule.getId(), "syncing",
                                         progress, totalFiles, processedFiles)
                );
            }

            // 동기화 완료 이벤트
            eventPublisher.publishEvent(new SyncCompletedEvent(schedule.getId(), processedFiles));

        } catch (Exception e) {
            // 동기화 실패 이벤트
            eventPublisher.publishEvent(new SyncFailedEvent(schedule.getId(), e.getMessage()));
        }
    }
}
```

### 이벤트 리스너들

```java
@Component
@Slf4j
@RequiredArgsConstructor
public class SyncEventListeners {
    private final NotificationService notificationService;
    private final MetricsCollector metricsCollector;
    private final AuditLogger auditLogger;

    @EventListener
    public void handleSyncStarted(SyncStartedEvent event) {
        log.info("동기화 시작: 스케줄 ID {}", event.getScheduleId());
        auditLogger.log("SYNC_STARTED", event.getScheduleId());
    }

    @Async
    @EventListener
    public void handleSyncProgress(SyncProgressEvent event) {
        log.info("동기화 진행: {}% ({}/{})",
                 event.getProgress(), event.getProcessedFiles(), event.getTotalFiles());

        // WebSocket으로 실시간 진행 상황 전송
        notificationService.broadcastProgress(event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleSyncCompleted(SyncCompletedEvent event) {
        log.info("동기화 완료: 스케줄 ID {}, 파일 수 {}",
                 event.getScheduleId(), event.getFileCount());

        // 메트릭 수집
        metricsCollector.recordSyncSuccess(event.getScheduleId(), event.getFileCount());

        // 완료 알림
        notificationService.sendCompletionNotification(event);
    }

    @EventListener
    public void handleSyncFailed(SyncFailedEvent event) {
        log.error("동기화 실패: 스케줄 ID {}, 원인: {}",
                  event.getScheduleId(), event.getErrorMessage());

        // 에러 알림
        notificationService.sendErrorNotification(event);

        // 재시도 스케줄링
        retryScheduler.scheduleRetry(event.getScheduleId());
    }

    @Async
    @EventListener
    public void handleBackupCompleted(BackupCompletedEvent event) {
        log.info("백업 완료: {} 파일, {} bytes, 소요시간 {}",
                 event.getFileCount(), event.getTotalSize(), event.getDuration());

        // 백업 통계 업데이트
        metricsCollector.recordBackup(event);

        // 오래된 백업 정리 스케줄링
        cleanupScheduler.scheduleOldBackupCleanup(event.getBackupPath());
    }
}
```

### 다중 이벤트 발행 패턴

```java
@Service
@RequiredArgsConstructor
public class BackupService {
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void createBackup(BackupRequest request) {
        Instant startTime = Instant.now();

        // 백업 시작 이벤트
        eventPublisher.publishEvent(new BackupStartedEvent(request.getScheduleId()));

        try {
            BackupResult result = performBackup(request);
            Duration duration = Duration.between(startTime, Instant.now());

            // 백업 완료 이벤트
            eventPublisher.publishEvent(new BackupCompletedEvent(
                result.getBackupId(),
                result.getBackupPath(),
                result.getFileCount(),
                result.getTotalSize(),
                duration
            ));

            // 통계 업데이트 이벤트
            eventPublisher.publishEvent(new BackupStatisticsUpdatedEvent(
                request.getScheduleId(),
                result.getFileCount(),
                result.getTotalSize()
            ));

            // 검증 시작 이벤트
            eventPublisher.publishEvent(new BackupVerificationStartedEvent(
                result.getBackupId()
            ));

        } catch (BackupException e) {
            // 백업 실패 이벤트
            eventPublisher.publishEvent(new BackupFailedEvent(
                request.getScheduleId(),
                e.getMessage(),
                e.getErrorCode()
            ));
        }
    }
}
```

## 이벤트 vs 직접 호출 비교

### 직접 호출 방식

```java
@Service
@RequiredArgsConstructor
public class OrderServiceDirect {
    private final OrderRepository orderRepository;
    private final EmailService emailService;
    private final InventoryService inventoryService;
    private final AnalyticsService analyticsService;
    private final NotificationService notificationService;

    @Transactional
    public Order createOrder(OrderRequest request) {
        Order order = new Order(request);
        order = orderRepository.save(order);

        // 모든 서비스를 직접 호출
        emailService.sendOrderConfirmation(order);
        inventoryService.updateStock(order);
        analyticsService.trackOrder(order);
        notificationService.notifyWarehouse(order);

        return order;
    }
}
```

**문제점:**
- `OrderService`가 4개의 서비스에 강하게 결합
- 새 기능 추가 시 `OrderService` 수정 필요
- 테스트 시 모든 의존성 모킹 필요
- 한 서비스의 실패가 전체 주문 프로세스에 영향

### 이벤트 기반 방식

```java
@Service
@RequiredArgsConstructor
public class OrderServiceEvent {
    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Order createOrder(OrderRequest request) {
        Order order = new Order(request);
        order = orderRepository.save(order);

        // 이벤트만 발행
        eventPublisher.publishEvent(new OrderCreatedEvent(order));

        return order;
    }
}

@Component
@RequiredArgsConstructor
class OrderCreatedListeners {

    @Async
    @EventListener
    public void sendEmail(OrderCreatedEvent event) {
        emailService.sendOrderConfirmation(event.getOrder());
    }

    @Async
    @EventListener
    public void updateInventory(OrderCreatedEvent event) {
        inventoryService.updateStock(event.getOrder());
    }

    @Async
    @EventListener
    public void trackAnalytics(OrderCreatedEvent event) {
        analyticsService.trackOrder(event.getOrder());
    }

    @Async
    @EventListener
    public void notifyWarehouse(OrderCreatedEvent event) {
        notificationService.notifyWarehouse(event.getOrder());
    }
}
```

**장점:**
- `OrderService`는 단일 책임(주문 생성)만 가짐
- 리스너 추가/제거가 `OrderService`에 영향 없음
- 각 리스너를 독립적으로 테스트 가능
- 비동기 처리로 성능 향상
- 한 리스너의 실패가 다른 리스너에 영향 없음

### 성능 비교

```java
@Service
@Slf4j
public class PerformanceComparisonService {

    // 직접 호출: 순차 실행
    public void directCall() {
        long start = System.currentTimeMillis();

        service1.process(); // 100ms
        service2.process(); // 150ms
        service3.process(); // 200ms

        long total = System.currentTimeMillis() - start;
        log.info("직접 호출 총 시간: {}ms", total); // 약 450ms
    }

    // 이벤트 기반: 비동기 실행
    public void eventDriven() {
        long start = System.currentTimeMillis();

        eventPublisher.publishEvent(new SomeEvent());

        long total = System.currentTimeMillis() - start;
        log.info("이벤트 발행 시간: {}ms", total); // 약 5ms
        // 실제 처리는 백그라운드에서 병렬로 실행
    }
}
```

## 마무리

Spring Boot의 이벤트 기반 아키텍처는 애플리케이션의 결합도를 낮추고 확장성을 높이는 강력한 도구입니다.

### 핵심 정리

1. **이벤트 기반 아키텍처**: 컴포넌트 간 느슨한 결합을 통한 유연한 설계
2. **ApplicationEvent**: POJO 또는 `ApplicationEvent` 상속으로 이벤트 정의
3. **ApplicationEventPublisher**: `publishEvent()`로 이벤트 발행
4. **@EventListener**: 이벤트 구독 및 처리
5. **@Async**: 비동기 이벤트 처리로 성능 향상
6. **@TransactionalEventListener**: 트랜잭션 커밋 후 안전한 이벤트 처리

### 사용 시나리오

- **사용자 활동 추적**: 회원가입, 로그인, 주문 등의 이벤트 로깅
- **알림 시스템**: 이메일, SMS, 푸시 알림 비동기 발송
- **데이터 동기화**: 캐시 무효화, 외부 시스템 연동
- **비즈니스 프로세스**: 주문 처리, 결제, 배송 등 다단계 프로세스
- **모니터링**: 성능 메트릭 수집, 에러 추적

### 주의사항

1. **순서 보장**: 여러 리스너의 실행 순서는 보장되지 않습니다(`@Order` 사용 가능)
2. **트랜잭션 전파**: 동기 리스너는 발행자의 트랜잭션을 공유합니다
3. **예외 처리**: 리스너의 예외가 발행자에게 전파될 수 있습니다(비동기 시 주의)
4. **과도한 사용**: 단순한 로직에는 직접 호출이 더 명확할 수 있습니다

이벤트 기반 아키텍처는 복잡한 비즈니스 로직을 깔끔하게 분리하고, 시스템의 확장성과 유지보수성을 크게 향상시킵니다.
