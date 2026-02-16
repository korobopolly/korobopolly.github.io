---
title: "Spring Boot 캐싱 전략 - Caffeine으로 성능 최적화"
date: 2026-02-16T13:19:00+09:00
draft: false
tags: ["Spring Boot", "캐싱", "Caffeine", "성능"]
categories: ["Spring Boot"]
series: "Spring Boot"
description: "Spring Boot에서 Caffeine 캐시를 활용하여 애플리케이션 성능을 최적화하는 방법을 알아봅니다"
---

## 캐싱이란

캐싱(Caching)은 자주 사용되는 데이터를 빠르게 접근할 수 있는 임시 저장소에 보관하는 기술입니다. 데이터베이스 조회, 외부 API 호출, 복잡한 연산 결과 등을 메모리에 저장하여 동일한 요청에 대해 빠르게 응답할 수 있습니다.

## 왜 캐싱이 필요한가

### 성능 향상

데이터베이스 조회는 일반적으로 수십~수백 밀리초가 걸리지만, 메모리 캐시는 마이크로초 단위로 응답합니다.

```java
// 캐시 없이 매번 DB 조회
public User getUser(Long id) {
    return userRepository.findById(id).orElseThrow(); // 평균 50ms
}

// 캐시 적용
@Cacheable("users")
public User getUser(Long id) {
    return userRepository.findById(id).orElseThrow(); // 첫 조회 50ms, 이후 0.1ms
}
```

### 비용 절감

외부 API 호출이나 복잡한 연산을 캐싱하면 서버 리소스와 비용을 절감할 수 있습니다.

```java
// 외부 API 호출 (비용 발생)
public WeatherData getWeather(String city) {
    return externalWeatherApi.fetch(city); // API 호출 비용 + 지연시간
}

// 캐싱으로 비용 절감 (5분간 재사용)
@Cacheable(value = "weather", key = "#city")
public WeatherData getWeather(String city) {
    return externalWeatherApi.fetch(city); // 5분에 1번만 호출
}
```

### 시스템 안정성

데이터베이스 부하를 줄여 시스템 전체의 안정성을 높입니다.

## Spring Boot 캐시 추상화

Spring Boot는 다양한 캐시 구현체를 동일한 인터페이스로 사용할 수 있는 추상화를 제공합니다.

### @EnableCaching

캐시 기능을 활성화하는 설정입니다.

```java
@Configuration
@EnableCaching
public class CacheConfig {
}
```

### @Cacheable

메서드 결과를 캐시에 저장합니다. 동일한 파라미터로 호출 시 캐시된 결과를 반환합니다.

```java
@Service
public class ProductService {

    @Cacheable("products")
    public Product findById(Long id) {
        log.info("DB에서 상품 조회: {}", id);
        return productRepository.findById(id).orElseThrow();
    }

    @Cacheable(value = "products", key = "#id")
    public Product findByIdWithKey(Long id) {
        return productRepository.findById(id).orElseThrow();
    }

    // 조건부 캐싱
    @Cacheable(value = "products", condition = "#id > 10")
    public Product findByIdConditional(Long id) {
        return productRepository.findById(id).orElseThrow();
    }

    // null 캐싱 제외
    @Cacheable(value = "products", unless = "#result == null")
    public Product findByIdUnlessNull(Long id) {
        return productRepository.findById(id).orElse(null);
    }
}
```

### @CacheEvict

캐시를 삭제합니다. 데이터 수정/삭제 시 사용합니다.

```java
@Service
public class ProductService {

    // 특정 키 삭제
    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    // 전체 캐시 삭제
    @CacheEvict(value = "products", allEntries = true)
    public void deleteAllProducts() {
        productRepository.deleteAll();
    }

    // 메서드 실행 전 삭제
    @CacheEvict(value = "products", key = "#product.id", beforeInvocation = true)
    public void updateProduct(Product product) {
        productRepository.save(product);
    }
}
```

### @CachePut

메서드를 항상 실행하고 결과를 캐시에 업데이트합니다.

```java
@Service
public class ProductService {

    @CachePut(value = "products", key = "#product.id")
    public Product updateProduct(Product product) {
        log.info("상품 업데이트 및 캐시 갱신: {}", product.getId());
        return productRepository.save(product);
    }

    @CachePut(value = "products", key = "#result.id")
    public Product createProduct(ProductRequest request) {
        Product product = new Product(request);
        return productRepository.save(product);
    }
}
```

### @Caching

여러 캐시 어노테이션을 조합합니다.

```java
@Service
public class ProductService {

    @Caching(
        evict = {
            @CacheEvict(value = "products", key = "#product.id"),
            @CacheEvict(value = "productList", allEntries = true)
        },
        put = {
            @CachePut(value = "products", key = "#product.id")
        }
    )
    public Product updateProduct(Product product) {
        return productRepository.save(product);
    }
}
```

## Caffeine 캐시 소개

Caffeine은 고성능 Java 캐싱 라이브러리로, Guava Cache의 후속작입니다. Spring Boot 3.x의 기본 캐시 구현체입니다.

### Caffeine의 장점

1. **높은 성능**: 비블로킹 알고리즘으로 높은 처리량과 낮은 지연시간
2. **다양한 만료 정책**: 시간 기반, 크기 기반, 참조 기반 만료
3. **자동 로딩**: `CacheLoader`를 통한 자동 캐시 로딩
4. **비동기 지원**: `AsyncCache`로 비동기 캐싱
5. **통계 수집**: 캐시 히트율, 로드 시간 등 모니터링

### 의존성 추가

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-cache'
    implementation 'com.github.ben-manes.caffeine:caffeine'
}
```

## Caffeine 설정

### 기본 설정

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(caffeineCacheBuilder());
        return cacheManager;
    }

    Caffeine<Object, Object> caffeineCacheBuilder() {
        return Caffeine.newBuilder()
                .maximumSize(1000)                    // 최대 1000개 항목
                .expireAfterWrite(10, TimeUnit.MINUTES)  // 쓰기 후 10분
                .recordStats();                       // 통계 수집
    }
}
```

### maximumSize

캐시에 저장할 최대 항목 수를 설정합니다.

```java
Caffeine.newBuilder()
    .maximumSize(10000)  // 최대 10,000개
    .build();

// 또는 메모리 크기 기반
Caffeine.newBuilder()
    .maximumWeight(10_000_000)  // 최대 10MB
    .weigher((key, value) -> ((String) value).length())
    .build();
```

### expireAfterWrite

항목이 생성되거나 마지막으로 업데이트된 후 지정된 시간이 지나면 만료됩니다.

```java
Caffeine.newBuilder()
    .expireAfterWrite(5, TimeUnit.MINUTES)
    .build();
```

### expireAfterAccess

항목이 마지막으로 읽히거나 쓰여진 후 지정된 시간이 지나면 만료됩니다.

```java
Caffeine.newBuilder()
    .expireAfterAccess(30, TimeUnit.MINUTES)
    .build();
```

### 동적 만료 시간

```java
Caffeine.newBuilder()
    .expireAfter(new Expiry<String, User>() {
        @Override
        public long expireAfterCreate(String key, User user, long currentTime) {
            // VIP 사용자는 1시간, 일반 사용자는 10분
            return user.isVip()
                ? TimeUnit.HOURS.toNanos(1)
                : TimeUnit.MINUTES.toNanos(10);
        }

        @Override
        public long expireAfterUpdate(String key, User user,
                                      long currentTime, long currentDuration) {
            return currentDuration;
        }

        @Override
        public long expireAfterRead(String key, User user,
                                    long currentTime, long currentDuration) {
            return currentDuration;
        }
    })
    .build();
```

## CacheManager 설정 (다중 캐시)

각 캐시마다 다른 설정을 적용할 수 있습니다.

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.registerCustomCache("users", userCache());
        cacheManager.registerCustomCache("products", productCache());
        cacheManager.registerCustomCache("sessions", sessionCache());
        return cacheManager;
    }

    private Cache<Object, Object> userCache() {
        return Caffeine.newBuilder()
                .maximumSize(10000)
                .expireAfterWrite(1, TimeUnit.HOURS)
                .recordStats()
                .build();
    }

    private Cache<Object, Object> productCache() {
        return Caffeine.newBuilder()
                .maximumSize(5000)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats()
                .build();
    }

    private Cache<Object, Object> sessionCache() {
        return Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterAccess(15, TimeUnit.MINUTES)
                .recordStats()
                .build();
    }
}
```

### application.yml 기반 설정

```yaml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=10m
    cache-names:
      - users
      - products
      - sessions
```

## 캐시 전략

### Cache-Aside (Lazy Loading)

애플리케이션이 캐시를 직접 관리하는 가장 일반적인 패턴입니다. Spring의 `@Cacheable`이 이 패턴을 구현합니다.

```java
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    @Cacheable("users")
    public User getUser(Long id) {
        // 1. 캐시 확인 (자동)
        // 2. 캐시 미스 시 DB 조회
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        // 3. 결과를 캐시에 저장 (자동)
    }

    @CachePut(value = "users", key = "#user.id")
    public User updateUser(User user) {
        // DB 업데이트 후 캐시 갱신
        return userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        // DB 삭제 후 캐시 제거
        userRepository.deleteById(id);
    }
}
```

**장점:**
- 구현이 간단
- 필요한 데이터만 캐싱 (메모리 효율적)

**단점:**
- 캐시 미스 시 지연 발생
- 캐시와 DB 간 불일치 가능성

### Write-Through

데이터를 쓸 때 캐시와 DB를 동시에 업데이트합니다.

```java
@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CacheManager cacheManager;

    public Product createProduct(ProductRequest request) {
        Product product = new Product(request);

        // 1. DB에 저장
        product = productRepository.save(product);

        // 2. 캐시에도 저장
        Cache cache = cacheManager.getCache("products");
        if (cache != null) {
            cache.put(product.getId(), product);
        }

        return product;
    }
}
```

**장점:**
- 캐시와 DB의 일관성 보장
- 읽기 성능 우수 (항상 캐시에 존재)

**단점:**
- 쓰기 지연 발생 (DB와 캐시 둘 다 업데이트)
- 사용되지 않는 데이터도 캐싱

### Write-Behind (Write-Back)

데이터를 캐시에 먼저 쓰고, 비동기로 DB에 반영합니다.

```java
@Service
@RequiredArgsConstructor
public class LogService {
    private final LogRepository logRepository;
    private final Cache<Long, Log> logCache;
    private final ExecutorService executorService;

    public void writeLog(Log log) {
        // 1. 캐시에 즉시 저장
        logCache.put(log.getId(), log);

        // 2. 비동기로 DB에 저장
        executorService.submit(() -> {
            logRepository.save(log);
        });
    }
}
```

**장점:**
- 매우 빠른 쓰기 성능
- DB 부하 감소 (배치 처리 가능)

**단점:**
- 복잡한 구현
- 장애 시 데이터 유실 가능성

## TTL과 만료 정책

### 시간 기반 만료

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // 짧은 TTL: 자주 변경되는 데이터
        cacheManager.registerCustomCache("realtimeData",
            Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.MINUTES)
                .build());

        // 중간 TTL: 보통 변경되는 데이터
        cacheManager.registerCustomCache("userData",
            Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .build());

        // 긴 TTL: 거의 변경되지 않는 데이터
        cacheManager.registerCustomCache("configData",
            Caffeine.newBuilder()
                .expireAfterWrite(24, TimeUnit.HOURS)
                .build());

        return cacheManager;
    }
}
```

### 크기 기반 만료

```java
Caffeine.newBuilder()
    .maximumSize(1000)  // LRU 방식으로 가장 오래 사용되지 않은 항목 제거
    .build();
```

### 참조 기반 만료

```java
Caffeine.newBuilder()
    .weakKeys()    // 키를 WeakReference로 보관
    .weakValues()  // 값을 WeakReference로 보관
    .softValues()  // 값을 SoftReference로 보관 (메모리 부족 시 GC)
    .build();
```

## 실전 예시: 스케줄 설정과 rsync 설정 캐싱

파일 동기화 시스템에서 자주 조회되는 설정 데이터를 캐싱하여 DB 부하를 줄이는 예제입니다.

### 캐시 설정

```java
@Configuration
@EnableCaching
public class SyncCacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // 스케줄 설정 캐시
        cacheManager.registerCustomCache("schedules", scheduleCache());

        // Rsync 설정 캐시
        cacheManager.registerCustomCache("rsyncConfigs", rsyncConfigCache());

        // 파일 메타데이터 캐시
        cacheManager.registerCustomCache("fileMetadata", fileMetadataCache());

        return cacheManager;
    }

    private Cache<Object, Object> scheduleCache() {
        return Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .expireAfterAccess(10, TimeUnit.MINUTES)
                .recordStats()
                .build();
    }

    private Cache<Object, Object> rsyncConfigCache() {
        return Caffeine.newBuilder()
                .maximumSize(100)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats()
                .build();
    }

    private Cache<Object, Object> fileMetadataCache() {
        return Caffeine.newBuilder()
                .maximumSize(10000)
                .expireAfterWrite(1, TimeUnit.MINUTES)
                .recordStats()
                .build();
    }
}
```

### 스케줄 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleService {
    private final ScheduleRepository scheduleRepository;

    @Cacheable(value = "schedules", key = "#id")
    public Schedule getSchedule(Long id) {
        log.info("DB에서 스케줄 조회: {}", id);
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ScheduleNotFoundException(id));
    }

    @Cacheable(value = "schedules", key = "'active'")
    public List<Schedule> getActiveSchedules() {
        log.info("DB에서 활성 스케줄 목록 조회");
        return scheduleRepository.findByActiveTrue();
    }

    @CachePut(value = "schedules", key = "#schedule.id")
    @CacheEvict(value = "schedules", key = "'active'")
    public Schedule updateSchedule(Schedule schedule) {
        log.info("스케줄 업데이트 및 캐시 갱신: {}", schedule.getId());
        return scheduleRepository.save(schedule);
    }

    @CacheEvict(value = "schedules", allEntries = true)
    public void refreshAllSchedules() {
        log.info("모든 스케줄 캐시 삭제");
    }
}
```

### Rsync 설정 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RsyncConfigService {
    private final RsyncConfigRepository rsyncConfigRepository;

    @Cacheable(value = "rsyncConfigs", key = "#scheduleId")
    public RsyncConfig getConfig(Long scheduleId) {
        log.info("DB에서 Rsync 설정 조회: {}", scheduleId);
        return rsyncConfigRepository.findByScheduleId(scheduleId)
                .orElseThrow(() -> new ConfigNotFoundException(scheduleId));
    }

    @Cacheable(value = "rsyncConfigs", key = "'default'")
    public RsyncConfig getDefaultConfig() {
        log.info("DB에서 기본 Rsync 설정 조회");
        return rsyncConfigRepository.findByIsDefaultTrue()
                .orElseGet(() -> RsyncConfig.builder()
                        .bandwidth(1000)
                        .timeout(3600)
                        .retryCount(3)
                        .build());
    }

    @CachePut(value = "rsyncConfigs", key = "#config.scheduleId")
    public RsyncConfig updateConfig(RsyncConfig config) {
        log.info("Rsync 설정 업데이트: {}", config.getScheduleId());
        return rsyncConfigRepository.save(config);
    }
}
```

### 파일 동기화 서비스 (캐시 활용)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class FileSyncService {
    private final ScheduleService scheduleService;
    private final RsyncConfigService rsyncConfigService;
    private final RsyncExecutor rsyncExecutor;

    public void syncFiles(Long scheduleId) {
        // 캐시에서 스케줄 조회 (첫 조회만 DB 접근)
        Schedule schedule = scheduleService.getSchedule(scheduleId);

        if (!schedule.isActive()) {
            log.warn("비활성 스케줄: {}", scheduleId);
            return;
        }

        // 캐시에서 Rsync 설정 조회
        RsyncConfig config = rsyncConfigService.getConfig(scheduleId);

        log.info("동기화 시작 - 스케줄: {}, 설정: {}",
                 schedule.getName(), config.getBandwidth());

        // Rsync 실행
        rsyncExecutor.execute(schedule, config);
    }

    public void syncAllActiveSchedules() {
        // 활성 스케줄 목록도 캐싱됨
        List<Schedule> schedules = scheduleService.getActiveSchedules();

        log.info("활성 스케줄 {}개 동기화 시작", schedules.size());

        schedules.forEach(schedule -> {
            try {
                syncFiles(schedule.getId());
            } catch (Exception e) {
                log.error("동기화 실패: {}", schedule.getId(), e);
            }
        });
    }
}
```

### 성능 비교

```java
@SpringBootTest
class CachePerformanceTest {

    @Autowired
    private ScheduleService scheduleService;

    @Test
    void cachePerformanceTest() {
        Long scheduleId = 1L;

        // 첫 번째 조회 (DB 접근)
        long start1 = System.nanoTime();
        scheduleService.getSchedule(scheduleId);
        long duration1 = System.nanoTime() - start1;

        // 두 번째 조회 (캐시 히트)
        long start2 = System.nanoTime();
        scheduleService.getSchedule(scheduleId);
        long duration2 = System.nanoTime() - start2;

        log.info("첫 번째 조회 (DB): {}ms", duration1 / 1_000_000);
        log.info("두 번째 조회 (캐시): {}ms", duration2 / 1_000_000);
        log.info("성능 향상: {}배", duration1 / duration2);

        // 결과 예시:
        // 첫 번째 조회 (DB): 45ms
        // 두 번째 조회 (캐시): 0.05ms
        // 성능 향상: 900배
    }
}
```

## 캐시 모니터링과 통계

### 캐시 통계 수집

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats()  // 통계 수집 활성화
        );
        return cacheManager;
    }
}
```

### 통계 조회

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheMonitorService {
    private final CacheManager cacheManager;

    public CacheStats getCacheStats(String cacheName) {
        CaffeineCache cache = (CaffeineCache) cacheManager.getCache(cacheName);
        if (cache == null) {
            return null;
        }

        com.github.benmanes.caffeine.cache.Cache<Object, Object> nativeCache =
                cache.getNativeCache();
        CacheStats stats = nativeCache.stats();

        log.info("캐시 '{}' 통계:", cacheName);
        log.info("  히트 수: {}", stats.hitCount());
        log.info("  미스 수: {}", stats.missCount());
        log.info("  히트율: {:.2f}%", stats.hitRate() * 100);
        log.info("  평균 로드 시간: {:.2f}ms", stats.averageLoadPenalty() / 1_000_000);
        log.info("  제거 수: {}", stats.evictionCount());

        return stats;
    }

    public void logAllCacheStats() {
        Collection<String> cacheNames = cacheManager.getCacheNames();

        cacheNames.forEach(cacheName -> {
            getCacheStats(cacheName);
        });
    }
}
```

### 스케줄링된 모니터링

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class CacheMonitorScheduler {
    private final CacheMonitorService cacheMonitorService;

    @Scheduled(fixedRate = 60000)  // 1분마다
    public void monitorCaches() {
        log.info("=== 캐시 통계 수집 시작 ===");
        cacheMonitorService.logAllCacheStats();
    }

    @Scheduled(cron = "0 0 * * * *")  // 매 시간
    public void checkCacheHealth() {
        CacheStats stats = cacheMonitorService.getCacheStats("schedules");

        if (stats != null && stats.hitRate() < 0.5) {
            log.warn("캐시 히트율이 낮습니다: {:.2f}%", stats.hitRate() * 100);
            // 알림 발송 또는 캐시 설정 조정
        }
    }
}
```

### REST API로 통계 노출

```java
@RestController
@RequestMapping("/api/cache")
@RequiredArgsConstructor
public class CacheStatsController {
    private final CacheMonitorService cacheMonitorService;
    private final CacheManager cacheManager;

    @GetMapping("/stats")
    public Map<String, CacheStatsDto> getAllStats() {
        Map<String, CacheStatsDto> statsMap = new HashMap<>();

        cacheManager.getCacheNames().forEach(cacheName -> {
            CacheStats stats = cacheMonitorService.getCacheStats(cacheName);
            if (stats != null) {
                statsMap.put(cacheName, new CacheStatsDto(stats));
            }
        });

        return statsMap;
    }

    @GetMapping("/stats/{cacheName}")
    public CacheStatsDto getStats(@PathVariable String cacheName) {
        CacheStats stats = cacheMonitorService.getCacheStats(cacheName);
        return new CacheStatsDto(stats);
    }

    @DeleteMapping("/{cacheName}")
    public void clearCache(@PathVariable String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        }
    }
}

@Data
class CacheStatsDto {
    private long hitCount;
    private long missCount;
    private double hitRate;
    private double missRate;
    private long loadCount;
    private long evictionCount;
    private double averageLoadPenalty;

    public CacheStatsDto(CacheStats stats) {
        this.hitCount = stats.hitCount();
        this.missCount = stats.missCount();
        this.hitRate = stats.hitRate();
        this.missRate = stats.missRate();
        this.loadCount = stats.loadCount();
        this.evictionCount = stats.evictionCount();
        this.averageLoadPenalty = stats.averageLoadPenalty();
    }
}
```

### 캐시 워밍업

애플리케이션 시작 시 자주 사용되는 데이터를 미리 캐싱합니다.

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class CacheWarmer {
    private final ScheduleService scheduleService;
    private final RsyncConfigService rsyncConfigService;

    @EventListener(ApplicationReadyEvent.class)
    public void warmUpCache() {
        log.info("캐시 워밍업 시작");

        // 활성 스케줄 미리 로드
        scheduleService.getActiveSchedules();

        // 기본 설정 미리 로드
        rsyncConfigService.getDefaultConfig();

        log.info("캐시 워밍업 완료");
    }
}
```

## 마무리

Spring Boot의 캐싱은 애플리케이션 성능을 크게 향상시킬 수 있는 강력한 도구입니다.

### 핵심 정리

1. **캐싱의 필요성**: DB 조회 감소, 성능 향상, 비용 절감
2. **Spring 캐시 추상화**: `@Cacheable`, `@CacheEvict`, `@CachePut`로 간편한 캐싱
3. **Caffeine 캐시**: 고성능 인메모리 캐시, 다양한 만료 정책
4. **캐시 전략**: Cache-Aside, Write-Through, Write-Behind
5. **TTL 설정**: `expireAfterWrite`, `expireAfterAccess`로 만료 관리
6. **모니터링**: `recordStats()`로 히트율, 로드 시간 추적

### 캐싱 적용 시나리오

- **읽기 위주**: 사용자 정보, 상품 정보, 설정 데이터
- **계산 비용이 큼**: 통계, 집계, 복잡한 연산 결과
- **외부 API**: 날씨, 환율, 주소 검색 등
- **자주 변경되지 않음**: 코드 테이블, 카테고리, 메뉴

### 주의사항

1. **캐시 일관성**: 데이터 변경 시 캐시 무효화 필수
2. **메모리 관리**: `maximumSize`로 메모리 사용량 제한
3. **적절한 TTL**: 데이터 특성에 맞는 만료 시간 설정
4. **과도한 캐싱 지양**: 자주 변경되는 데이터는 캐싱 비효율
5. **분산 환경**: 여러 서버에서는 Redis 등 분산 캐시 고려

Caffeine과 Spring Boot의 캐시 추상화를 활용하면 코드 변경을 최소화하면서 애플리케이션 성능을 대폭 향상시킬 수 있습니다.
