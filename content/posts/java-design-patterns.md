---
title: "Java 디자인 패턴 - Singleton, Builder, Observer, Strategy 구현"
date: 2026-02-16T13:15:00+09:00
draft: false
tags: ["Java", "디자인패턴", "객체지향", "설계"]
categories: ["Java"]
series: "Java"
description: "Singleton, Observer, Strategy, Builder 등 실무에서 자주 쓰이는 디자인 패턴을 Java로 구현합니다"
---

## 디자인 패턴이란

디자인 패턴은 소프트웨어 설계에서 반복적으로 나타나는 문제들에 대한 재사용 가능한 해결책입니다. "바퀴를 다시 발명하지 마라"는 원칙처럼, 검증된 설계 방법을 배우고 적용하면 유지보수가 쉽고 확장 가능한 코드를 작성할 수 있습니다.

이 글에서는 실무에서 자주 쓰이는 핵심 패턴들을 Java 코드와 함께 알아봅니다.

## 디자인 패턴의 분류

GoF(Gang of Four)는 23가지 패턴을 세 가지로 분류했습니다:

1. **생성 패턴 (Creational)**: 객체 생성 방식 - Singleton, Builder, Factory
2. **구조 패턴 (Structural)**: 객체 조합 방식 - Facade, Adapter, Decorator
3. **행위 패턴 (Behavioral)**: 객체 간 통신 방식 - Observer, Strategy, Template Method

모든 패턴을 외울 필요는 없습니다. 문제를 만났을 때 "이 상황에 맞는 패턴이 있나?"를 떠올릴 수 있으면 충분합니다.

## 생성 패턴

### Singleton - 단 하나의 인스턴스

애플리케이션에서 특정 클래스의 인스턴스가 딱 하나만 존재해야 할 때 사용합니다.

**사용 사례:**
- 설정 관리자 (ConfigManager)
- 로거 (Logger)
- DB 커넥션 풀
- 캐시

#### 기본 구현 (멀티스레드 환경에서 안전하지 않음)

```java
public class ConfigManager {
    private static ConfigManager instance;
    private Map<String, String> config;

    // private 생성자 - 외부에서 new 불가
    private ConfigManager() {
        config = new HashMap<>();
        loadConfig();
    }

    public static ConfigManager getInstance() {
        if (instance == null) {
            instance = new ConfigManager(); // 위험! 여러 스레드가 동시 접근하면 여러 인스턴스 생성 가능
        }
        return instance;
    }

    private void loadConfig() {
        config.put("db.url", "jdbc:mysql://localhost:3306/mydb");
        config.put("max.connections", "10");
    }

    public String get(String key) {
        return config.get(key);
    }
}
```

#### Thread-Safe 구현 1: Eager Initialization

```java
public class ConfigManager {
    // 클래스 로딩 시점에 생성 (스레드 안전)
    private static final ConfigManager INSTANCE = new ConfigManager();
    private Map<String, String> config;

    private ConfigManager() {
        config = new HashMap<>();
        loadConfig();
    }

    public static ConfigManager getInstance() {
        return INSTANCE;
    }

    private void loadConfig() {
        config.put("db.url", "jdbc:mysql://localhost:3306/mydb");
        config.put("max.connections", "10");
    }

    public String get(String key) {
        return config.get(key);
    }
}
```

**장점:** 간단하고 스레드 안전
**단점:** 사용하지 않아도 무조건 생성됨

#### Thread-Safe 구현 2: Double-Checked Locking

```java
public class ConfigManager {
    private static volatile ConfigManager instance;
    private Map<String, String> config;

    private ConfigManager() {
        config = new HashMap<>();
        loadConfig();
    }

    public static ConfigManager getInstance() {
        if (instance == null) { // 첫 번째 체크 (락 없이)
            synchronized (ConfigManager.class) { // 락 획득
                if (instance == null) { // 두 번째 체크
                    instance = new ConfigManager();
                }
            }
        }
        return instance;
    }

    private void loadConfig() {
        config.put("db.url", "jdbc:mysql://localhost:3306/mydb");
        config.put("max.connections", "10");
    }

    public String get(String key) {
        return config.get(key);
    }
}
```

**volatile** 키워드는 CPU 캐시가 아닌 메인 메모리에서 읽도록 강제합니다.

#### Thread-Safe 구현 3: Holder 패턴 (권장)

```java
public class ConfigManager {
    private Map<String, String> config;

    private ConfigManager() {
        config = new HashMap<>();
        loadConfig();
    }

    // 내부 static 클래스는 getInstance() 호출 시점에 로딩
    private static class Holder {
        private static final ConfigManager INSTANCE = new ConfigManager();
    }

    public static ConfigManager getInstance() {
        return Holder.INSTANCE;
    }

    private void loadConfig() {
        config.put("db.url", "jdbc:mysql://localhost:3306/mydb");
        config.put("max.connections", "10");
    }

    public String get(String key) {
        return config.get(key);
    }
}
```

**장점:** Lazy 로딩 + 스레드 안전 + 간결함 (JVM의 클래스 로딩 메커니즘 활용)

#### 사용 예시

```java
public class Application {
    public static void main(String[] args) {
        ConfigManager config = ConfigManager.getInstance();

        String dbUrl = config.get("db.url");
        System.out.println("DB URL: " + dbUrl);

        // 같은 인스턴스임을 확인
        ConfigManager config2 = ConfigManager.getInstance();
        System.out.println("같은 인스턴스? " + (config == config2)); // true
    }
}
```

### Builder - 유연한 객체 생성

생성자 파라미터가 많거나 선택적 파라미터가 있을 때 사용합니다.

#### 문제 상황: 생성자 지옥

```java
public class FileTransferConfig {
    private String sourceHost;
    private int sourcePort;
    private String destHost;
    private int destPort;
    private int maxRetries;
    private int timeout;
    private boolean compress;
    private boolean encrypt;

    // 생성자 1: 필수 파라미터만
    public FileTransferConfig(String sourceHost, String destHost) {
        this(sourceHost, 22, destHost, 22, 3, 30000, false, false);
    }

    // 생성자 2: 포트 포함
    public FileTransferConfig(String sourceHost, int sourcePort,
                               String destHost, int destPort) {
        this(sourceHost, sourcePort, destHost, destPort, 3, 30000, false, false);
    }

    // 생성자 3: 모든 파라미터 (텔레스코핑 생성자 패턴)
    public FileTransferConfig(String sourceHost, int sourcePort,
                               String destHost, int destPort,
                               int maxRetries, int timeout,
                               boolean compress, boolean encrypt) {
        this.sourceHost = sourceHost;
        this.sourcePort = sourcePort;
        this.destHost = destHost;
        this.destPort = destPort;
        this.maxRetries = maxRetries;
        this.timeout = timeout;
        this.compress = compress;
        this.encrypt = encrypt;
    }
}

// 사용: 가독성이 떨어짐
FileTransferConfig config = new FileTransferConfig(
    "source.com", 22, "dest.com", 22, 5, 60000, true, false
);
// 무슨 의미인지 파악하기 어려움
```

#### Builder 패턴 적용

```java
public class FileTransferConfig {
    private final String sourceHost;
    private final int sourcePort;
    private final String destHost;
    private final int destPort;
    private final int maxRetries;
    private final int timeout;
    private final boolean compress;
    private final boolean encrypt;

    // private 생성자
    private FileTransferConfig(Builder builder) {
        this.sourceHost = builder.sourceHost;
        this.sourcePort = builder.sourcePort;
        this.destHost = builder.destHost;
        this.destPort = builder.destPort;
        this.maxRetries = builder.maxRetries;
        this.timeout = builder.timeout;
        this.compress = builder.compress;
        this.encrypt = builder.encrypt;
    }

    // Getter 메서드들
    public String getSourceHost() { return sourceHost; }
    public int getSourcePort() { return sourcePort; }
    public String getDestHost() { return destHost; }
    public int getDestPort() { return destPort; }
    public int getMaxRetries() { return maxRetries; }
    public int getTimeout() { return timeout; }
    public boolean isCompress() { return compress; }
    public boolean isEncrypt() { return encrypt; }

    // Builder 내부 클래스
    public static class Builder {
        // 필수 파라미터
        private final String sourceHost;
        private final String destHost;

        // 선택적 파라미터 (기본값 설정)
        private int sourcePort = 22;
        private int destPort = 22;
        private int maxRetries = 3;
        private int timeout = 30000;
        private boolean compress = false;
        private boolean encrypt = false;

        public Builder(String sourceHost, String destHost) {
            this.sourceHost = sourceHost;
            this.destHost = destHost;
        }

        public Builder sourcePort(int port) {
            this.sourcePort = port;
            return this;
        }

        public Builder destPort(int port) {
            this.destPort = port;
            return this;
        }

        public Builder maxRetries(int retries) {
            this.maxRetries = retries;
            return this;
        }

        public Builder timeout(int timeout) {
            this.timeout = timeout;
            return this;
        }

        public Builder compress(boolean compress) {
            this.compress = compress;
            return this;
        }

        public Builder encrypt(boolean encrypt) {
            this.encrypt = encrypt;
            return this;
        }

        public FileTransferConfig build() {
            // 유효성 검증
            if (maxRetries < 0) {
                throw new IllegalArgumentException("maxRetries는 0 이상이어야 합니다");
            }
            if (timeout <= 0) {
                throw new IllegalArgumentException("timeout은 0보다 커야 합니다");
            }

            return new FileTransferConfig(this);
        }
    }
}
```

#### 사용 예시

```java
public class BuilderExample {
    public static void main(String[] args) {
        // 필수 파라미터만
        FileTransferConfig simple = new FileTransferConfig.Builder(
            "source.com", "dest.com"
        ).build();

        // 선택적 파라미터 체이닝 (읽기 쉬움!)
        FileTransferConfig advanced = new FileTransferConfig.Builder(
            "source.com", "dest.com"
        )
            .sourcePort(2222)
            .destPort(2222)
            .maxRetries(5)
            .timeout(60000)
            .compress(true)
            .encrypt(true)
            .build();

        System.out.println("Source: " + advanced.getSourceHost() + ":" +
            advanced.getSourcePort());
        System.out.println("Compress: " + advanced.isCompress());
    }
}
```

**장점:**
- 가독성 향상 (메서드 이름으로 파라미터 의미 명확)
- 불변 객체 생성 가능 (모든 필드 final)
- build() 단계에서 유효성 검증

**실제 사용 예:** StringBuilder, Retrofit, OkHttp

### Factory Method - 객체 생성 위임

생성할 객체의 타입을 서브클래스가 결정하도록 위임합니다.

#### 사용 사례: 파티셔닝 전략 생성

```java
// 추상 인터페이스
interface PartitionStrategy {
    List<String> partition(List<String> files);
}

// 구체적인 전략들
class SizeBasedPartition implements PartitionStrategy {
    @Override
    public List<String> partition(List<String> files) {
        System.out.println("파일 크기 기반 파티셔닝");
        // 파일 크기별로 그룹화
        return files;
    }
}

class HashBasedPartition implements PartitionStrategy {
    @Override
    public List<String> partition(List<String> files) {
        System.out.println("해시 기반 파티셔닝");
        // 파일명 해시값으로 그룹화
        return files;
    }
}

class TimeBasedPartition implements PartitionStrategy {
    @Override
    public List<String> partition(List<String> files) {
        System.out.println("시간 기반 파티셔닝");
        // 수정 시간별로 그룹화
        return files;
    }
}

// Factory
class PartitionStrategyFactory {
    public static PartitionStrategy createStrategy(String type) {
        switch (type.toLowerCase()) {
            case "size":
                return new SizeBasedPartition();
            case "hash":
                return new HashBasedPartition();
            case "time":
                return new TimeBasedPartition();
            default:
                throw new IllegalArgumentException("알 수 없는 타입: " + type);
        }
    }
}

// 사용
public class FactoryExample {
    public static void main(String[] args) {
        List<String> files = Arrays.asList("a.txt", "b.txt", "c.txt");

        // 런타임에 전략 결정
        String strategyType = "hash"; // 설정 파일이나 환경 변수에서 읽을 수 있음
        PartitionStrategy strategy = PartitionStrategyFactory.createStrategy(strategyType);

        List<String> partitioned = strategy.partition(files);
    }
}
```

**장점:**
- 객체 생성 로직을 한 곳에 집중
- 새로운 타입 추가 시 Factory만 수정
- 클라이언트 코드는 구체 클래스를 몰라도 됨

## 구조 패턴

### Facade - 복잡한 서브시스템 감싸기

여러 서브시스템을 간단한 인터페이스로 묶어줍니다.

#### 문제 상황: 복잡한 파일 전송 프로세스

```java
// 클라이언트 코드가 여러 클래스와 직접 상호작용
public class ComplexClient {
    public void transferFiles() {
        // 1. 커넥션 설정
        ConnectionManager connMgr = new ConnectionManager();
        connMgr.setHost("remote.com");
        connMgr.setPort(22);
        connMgr.setCredentials("user", "pass");
        connMgr.connect();

        // 2. 파일 목록 조회
        FileScanner scanner = new FileScanner(connMgr);
        List<String> files = scanner.scan("/data");

        // 3. 파티셔닝
        PartitionStrategy strategy = new HashBasedPartition();
        List<String> partitioned = strategy.partition(files);

        // 4. 전송
        FileTransferEngine engine = new FileTransferEngine(connMgr);
        for (String file : partitioned) {
            engine.transfer(file);
        }

        // 5. 검증
        FileValidator validator = new FileValidator(connMgr);
        validator.validate(partitioned);

        // 6. 커넥션 종료
        connMgr.disconnect();
    }
}
```

너무 복잡합니다. 클라이언트가 모든 세부사항을 알아야 합니다.

#### Facade 적용

```java
// 참고: ConnectionManager, FileScanner 등은 예시를 위한 가상 클래스입니다

// Facade 클래스
public class FileSyncFacade {
    private ConnectionManager connMgr;
    private FileScanner scanner;
    private PartitionStrategy partitioner;
    private FileTransferEngine engine;
    private FileValidator validator;

    public FileSyncFacade(String host, int port, String user, String password) {
        this.connMgr = new ConnectionManager();
        connMgr.setHost(host);
        connMgr.setPort(port);
        connMgr.setCredentials(user, password);

        this.scanner = new FileScanner(connMgr);
        this.partitioner = new HashBasedPartition();
        this.engine = new FileTransferEngine(connMgr);
        this.validator = new FileValidator(connMgr);
    }

    // 간단한 인터페이스 제공
    public void syncDirectory(String sourcePath) {
        try {
            // 내부에서 복잡한 과정 처리
            connMgr.connect();

            List<String> files = scanner.scan(sourcePath);
            List<String> partitioned = partitioner.partition(files);

            for (String file : partitioned) {
                engine.transfer(file);
            }

            validator.validate(partitioned);

            System.out.println("동기화 완료: " + partitioned.size() + " 파일");

        } catch (Exception e) {
            System.err.println("동기화 실패: " + e.getMessage());
        } finally {
            connMgr.disconnect();
        }
    }

    // 추가 편의 메서드
    public void syncDirectoryWithStrategy(String sourcePath, String strategyType) {
        this.partitioner = PartitionStrategyFactory.createStrategy(strategyType);
        syncDirectory(sourcePath);
    }
}

// 클라이언트 코드 - 매우 간단해짐
public class SimpleClient {
    public static void main(String[] args) {
        FileSyncFacade facade = new FileSyncFacade(
            "remote.com", 22, "user", "pass"
        );

        facade.syncDirectory("/data");
    }
}
```

**장점:**
- 복잡한 로직을 숨기고 간단한 API 제공
- 서브시스템 변경이 클라이언트에 영향 없음
- 코드 중복 감소

**실제 사용 예:** Spring의 JdbcTemplate, SLF4J 로깅 Facade

## 행위 패턴

### Observer - 이벤트 기반 통신

한 객체의 상태 변화를 여러 객체에게 자동으로 알립니다.

**참고:** Spring Boot에서는 ApplicationEvent와 @EventListener로 Observer 패턴을 구현합니다. 자세한 내용은 [Spring Boot 이벤트 기반 아키텍처](/posts/spring-boot-event-driven) 포스트를 참고하세요.

#### 사용 사례: 파일 전송 진행률 모니터링

```java
import java.util.ArrayList;
import java.util.List;

// Observer 인터페이스
interface TransferProgressListener {
    void onProgress(String fileName, int percentage);
    void onComplete(String fileName);
    void onError(String fileName, String error);
}

// Subject (Observable)
class FileTransferService {
    private List<TransferProgressListener> listeners = new ArrayList<>();

    // Observer 등록
    public void addListener(TransferProgressListener listener) {
        listeners.add(listener);
    }

    // Observer 제거
    public void removeListener(TransferProgressListener listener) {
        listeners.remove(listener);
    }

    // 파일 전송 (Subject의 상태 변화)
    public void transferFile(String fileName) {
        System.out.println("전송 시작: " + fileName);

        try {
            for (int progress = 0; progress <= 100; progress += 20) {
                Thread.sleep(300);

                // 모든 Observer에게 알림
                notifyProgress(fileName, progress);
            }

            notifyComplete(fileName);

        } catch (InterruptedException e) {
            notifyError(fileName, e.getMessage());
        }
    }

    private void notifyProgress(String fileName, int percentage) {
        for (TransferProgressListener listener : listeners) {
            listener.onProgress(fileName, percentage);
        }
    }

    private void notifyComplete(String fileName) {
        for (TransferProgressListener listener : listeners) {
            listener.onComplete(fileName);
        }
    }

    private void notifyError(String fileName, String error) {
        for (TransferProgressListener listener : listeners) {
            listener.onError(fileName, error);
        }
    }
}

// Concrete Observer 1: 콘솔 로거
class ConsoleLogger implements TransferProgressListener {
    @Override
    public void onProgress(String fileName, int percentage) {
        System.out.println("[LOG] " + fileName + ": " + percentage + "%");
    }

    @Override
    public void onComplete(String fileName) {
        System.out.println("[LOG] 완료: " + fileName);
    }

    @Override
    public void onError(String fileName, String error) {
        System.err.println("[LOG] 오류: " + fileName + " - " + error);
    }
}

// Concrete Observer 2: 통계 수집기
class StatisticsCollector implements TransferProgressListener {
    private int totalFiles = 0;
    private int completedFiles = 0;
    private int failedFiles = 0;

    @Override
    public void onProgress(String fileName, int percentage) {
        // 통계엔 진행률은 불필요
    }

    @Override
    public void onComplete(String fileName) {
        completedFiles++;
        printStats();
    }

    @Override
    public void onError(String fileName, String error) {
        failedFiles++;
        printStats();
    }

    private void printStats() {
        System.out.println("[STATS] 완료: " + completedFiles +
            ", 실패: " + failedFiles);
    }
}

// Concrete Observer 3: UI 업데이트 (시뮬레이션)
class UIUpdater implements TransferProgressListener {
    @Override
    public void onProgress(String fileName, int percentage) {
        updateProgressBar(fileName, percentage);
    }

    @Override
    public void onComplete(String fileName) {
        showNotification(fileName + " 전송 완료");
    }

    @Override
    public void onError(String fileName, String error) {
        showErrorDialog(fileName, error);
    }

    private void updateProgressBar(String fileName, int percentage) {
        System.out.println("[UI] 프로그레스바 업데이트: " + fileName +
            " -> " + percentage + "%");
    }

    private void showNotification(String message) {
        System.out.println("[UI] 알림: " + message);
    }

    private void showErrorDialog(String fileName, String error) {
        System.out.println("[UI] 오류 다이얼로그: " + fileName + " - " + error);
    }
}

// 사용
public class ObserverExample {
    public static void main(String[] args) {
        FileTransferService service = new FileTransferService();

        // Observer 등록
        service.addListener(new ConsoleLogger());
        service.addListener(new StatisticsCollector());
        service.addListener(new UIUpdater());

        // 파일 전송 (모든 Observer가 자동으로 알림받음)
        service.transferFile("file1.dat");
    }
}
```

**출력 예시:**
```
전송 시작: file1.dat
[LOG] file1.dat: 0%
[UI] 프로그레스바 업데이트: file1.dat -> 0%
[LOG] file1.dat: 20%
[UI] 프로그레스바 업데이트: file1.dat -> 20%
...
[LOG] 완료: file1.dat
[STATS] 완료: 1, 실패: 0
[UI] 알림: file1.dat 전송 완료
```

**장점:**
- Subject와 Observer가 느슨하게 결합
- 새로운 Observer 추가가 쉬움 (OCP 준수)
- 런타임에 동적으로 구독/해지 가능

**실제 사용 예:** Java Swing의 ActionListener, RxJava Observable

### Strategy - 알고리즘 교체

알고리즘을 캡슐화하고 런타임에 교체 가능하게 합니다.

#### 사용 사례: 파일 압축 방식 선택

```java
// Strategy 인터페이스
interface CompressionStrategy {
    byte[] compress(byte[] data);
    byte[] decompress(byte[] data);
    String getName();
}

// Concrete Strategy 1: ZIP 압축
class ZipCompression implements CompressionStrategy {
    @Override
    public byte[] compress(byte[] data) {
        System.out.println("ZIP 압축 수행");
        // 실제로는 java.util.zip 사용
        return data; // 시뮬레이션
    }

    @Override
    public byte[] decompress(byte[] data) {
        System.out.println("ZIP 압축 해제");
        return data;
    }

    @Override
    public String getName() {
        return "ZIP";
    }
}

// Concrete Strategy 2: GZIP 압축
class GzipCompression implements CompressionStrategy {
    @Override
    public byte[] compress(byte[] data) {
        System.out.println("GZIP 압축 수행 (ZIP보다 빠름)");
        return data;
    }

    @Override
    public byte[] decompress(byte[] data) {
        System.out.println("GZIP 압축 해제");
        return data;
    }

    @Override
    public String getName() {
        return "GZIP";
    }
}

// Concrete Strategy 3: LZ4 압축
class Lz4Compression implements CompressionStrategy {
    @Override
    public byte[] compress(byte[] data) {
        System.out.println("LZ4 압축 수행 (초고속, 낮은 압축률)");
        return data;
    }

    @Override
    public byte[] decompress(byte[] data) {
        System.out.println("LZ4 압축 해제");
        return data;
    }

    @Override
    public String getName() {
        return "LZ4";
    }
}

// Context (Strategy를 사용하는 클래스)
class FileCompressor {
    private CompressionStrategy strategy;

    public FileCompressor(CompressionStrategy strategy) {
        this.strategy = strategy;
    }

    // 런타임에 전략 변경 가능
    public void setStrategy(CompressionStrategy strategy) {
        this.strategy = strategy;
    }

    public void compressFile(String fileName, byte[] data) {
        System.out.println("\n파일 압축: " + fileName);
        System.out.println("압축 방식: " + strategy.getName());

        byte[] compressed = strategy.compress(data);

        System.out.println("원본 크기: " + data.length + " bytes");
        System.out.println("압축 후: " + compressed.length + " bytes");
    }

    public void decompressFile(String fileName, byte[] compressedData) {
        System.out.println("\n파일 압축 해제: " + fileName);
        byte[] decompressed = strategy.decompress(compressedData);
        System.out.println("복원 완료");
    }
}

// 사용
public class StrategyExample {
    public static void main(String[] args) {
        byte[] fileData = new byte[1024 * 100]; // 100KB

        // ZIP 전략 사용
        FileCompressor compressor = new FileCompressor(new ZipCompression());
        compressor.compressFile("document.txt", fileData);

        // 런타임에 전략 변경
        compressor.setStrategy(new Lz4Compression());
        compressor.compressFile("video.mp4", fileData);

        // 파일 타입에 따라 전략 선택
        String fileName = "archive.tar";
        CompressionStrategy strategy = selectStrategy(fileName);
        compressor.setStrategy(strategy);
        compressor.compressFile(fileName, fileData);
    }

    private static CompressionStrategy selectStrategy(String fileName) {
        if (fileName.endsWith(".txt") || fileName.endsWith(".log")) {
            return new GzipCompression(); // 텍스트는 GZIP
        } else if (fileName.endsWith(".mp4") || fileName.endsWith(".jpg")) {
            return new Lz4Compression(); // 이미 압축된 파일은 빠른 LZ4
        } else {
            return new ZipCompression(); // 기본은 ZIP
        }
    }
}
```

**출력 예시:**
```
파일 압축: document.txt
압축 방식: ZIP
ZIP 압축 수행
원본 크기: 102400 bytes
압축 후: 102400 bytes

파일 압축: video.mp4
압축 방식: LZ4
LZ4 압축 수행 (초고속, 낮은 압축률)
원본 크기: 102400 bytes
압축 후: 102400 bytes
```

**Factory와의 조합:**

```java
class CompressionStrategyFactory {
    public static CompressionStrategy create(String type) {
        switch (type.toLowerCase()) {
            case "zip": return new ZipCompression();
            case "gzip": return new GzipCompression();
            case "lz4": return new Lz4Compression();
            default: throw new IllegalArgumentException("Unknown type: " + type);
        }
    }
}

// 사용
String compressionType = System.getProperty("compression.type", "gzip");
CompressionStrategy strategy = CompressionStrategyFactory.create(compressionType);
FileCompressor compressor = new FileCompressor(strategy);
```

**장점:**
- 알고리즘 변경이 쉬움 (OCP 준수)
- 조건문(if-else) 제거
- 새로운 알고리즘 추가 시 기존 코드 수정 불필요

### Template Method - 알고리즘 골격 정의

알고리즘의 구조는 고정하고, 세부 단계는 서브클래스에서 구현합니다.

#### 사용 사례: 데이터 처리 파이프라인

```java
// 추상 클래스 - 템플릿 메서드 정의
abstract class DataProcessor {

    // 템플릿 메서드 (final로 오버라이드 방지)
    public final void process(String inputFile) {
        System.out.println("=== 데이터 처리 시작 ===\n");

        byte[] data = readData(inputFile);

        if (validate(data)) {
            byte[] transformed = transform(data);
            byte[] enriched = enrich(transformed);
            writeData(enriched);

            // Hook 메서드 (선택적 구현)
            afterProcessing();
        } else {
            System.err.println("검증 실패: " + inputFile);
        }

        System.out.println("\n=== 데이터 처리 완료 ===");
    }

    // 추상 메서드 (서브클래스에서 반드시 구현)
    protected abstract byte[] readData(String inputFile);
    protected abstract boolean validate(byte[] data);
    protected abstract byte[] transform(byte[] data);
    protected abstract void writeData(byte[] data);

    // 구체 메서드 (공통 로직)
    protected byte[] enrich(byte[] data) {
        System.out.println("데이터 보강 (타임스탬프 추가)");
        return data;
    }

    // Hook 메서드 (선택적 오버라이드)
    protected void afterProcessing() {
        // 기본 구현 없음 (서브클래스에서 필요시 구현)
    }
}

// Concrete Class 1: CSV 처리
class CsvDataProcessor extends DataProcessor {
    @Override
    protected byte[] readData(String inputFile) {
        System.out.println("CSV 파일 읽기: " + inputFile);
        return new byte[100]; // 시뮬레이션
    }

    @Override
    protected boolean validate(byte[] data) {
        System.out.println("CSV 형식 검증 (헤더 확인)");
        return true;
    }

    @Override
    protected byte[] transform(byte[] data) {
        System.out.println("CSV 변환 (컬럼 재정렬, 타입 변환)");
        return data;
    }

    @Override
    protected void writeData(byte[] data) {
        System.out.println("CSV 파일 저장");
    }

    @Override
    protected void afterProcessing() {
        System.out.println("CSV 통계 생성");
    }
}

// Concrete Class 2: JSON 처리
class JsonDataProcessor extends DataProcessor {
    @Override
    protected byte[] readData(String inputFile) {
        System.out.println("JSON 파일 읽기: " + inputFile);
        return new byte[100];
    }

    @Override
    protected boolean validate(byte[] data) {
        System.out.println("JSON 스키마 검증");
        return true;
    }

    @Override
    protected byte[] transform(byte[] data) {
        System.out.println("JSON 변환 (필드 매핑)");
        return data;
    }

    @Override
    protected void writeData(byte[] data) {
        System.out.println("JSON 파일 저장 (포맷팅)");
    }

    // afterProcessing은 구현하지 않음 (Hook은 선택적)
}

// Concrete Class 3: XML 처리
class XmlDataProcessor extends DataProcessor {
    @Override
    protected byte[] readData(String inputFile) {
        System.out.println("XML 파일 읽기: " + inputFile);
        return new byte[100];
    }

    @Override
    protected boolean validate(byte[] data) {
        System.out.println("XML 스키마 검증 (XSD)");
        return true;
    }

    @Override
    protected byte[] transform(byte[] data) {
        System.out.println("XML 변환 (XSLT)");
        return data;
    }

    @Override
    protected void writeData(byte[] data) {
        System.out.println("XML 파일 저장");
    }
}

// 사용
public class TemplateMethodExample {
    public static void main(String[] args) {
        DataProcessor csvProcessor = new CsvDataProcessor();
        csvProcessor.process("data.csv");

        System.out.println("\n" + "=".repeat(40) + "\n");

        DataProcessor jsonProcessor = new JsonDataProcessor();
        jsonProcessor.process("data.json");
    }
}
```

**출력 예시:**
```
=== 데이터 처리 시작 ===

CSV 파일 읽기: data.csv
CSV 형식 검증 (헤더 확인)
CSV 변환 (컬럼 재정렬, 타입 변환)
데이터 보강 (타임스탬프 추가)
CSV 파일 저장
CSV 통계 생성

=== 데이터 처리 완료 ===
```

**장점:**
- 알고리즘 구조를 재사용
- 코드 중복 제거 (공통 로직은 부모 클래스에)
- Hollywood Principle: "Don't call us, we'll call you" (프레임워크가 흐름 제어)

**실제 사용 예:** Spring의 JdbcTemplate, Servlet의 HttpServlet

## 실전 활용: 패턴 조합 예시

여러 패턴을 조합하여 시스템을 설계하는 방법을 살펴봅시다. 아래 예시는 간단한 작업 스케줄러를 구현합니다.

**참고:** 동시성 처리(ExecutorService, CompletableFuture 등)를 포함한 실전 파일 동기화 시스템은 [Java 동시성 프로그래밍](/posts/java-concurrency) 포스트를 참고하세요.

```java
import java.util.*;

// 1. Singleton: ConfigManager
class AppConfigManager {
    private static class Holder {
        private static final AppConfigManager INSTANCE = new AppConfigManager();
    }

    private Map<String, String> config = new HashMap<>();

    private AppConfigManager() {
        config.put("retry.count", "3");
        config.put("timeout.seconds", "30");
    }

    public static AppConfigManager getInstance() {
        return Holder.INSTANCE;
    }

    public String get(String key) {
        return config.get(key);
    }
}

// 2. Strategy: 작업 실행 전략
interface ExecutionStrategy {
    void execute(Task task);
}

class ImmediateExecution implements ExecutionStrategy {
    @Override
    public void execute(Task task) {
        System.out.println("즉시 실행: " + task.getName());
        task.run();
    }
}

class DelayedExecution implements ExecutionStrategy {
    @Override
    public void execute(Task task) {
        System.out.println("지연 실행 예약: " + task.getName());
        // 실제로는 스케줄러에 등록
    }
}

// 3. Observer: 작업 상태 리스너
interface TaskListener {
    void onStart(Task task);
    void onComplete(Task task);
}

class ConsoleLogger implements TaskListener {
    @Override
    public void onStart(Task task) {
        System.out.println("[시작] " + task.getName());
    }

    @Override
    public void onComplete(Task task) {
        System.out.println("[완료] " + task.getName());
    }
}

// 4. Builder: 복잡한 작업 설정
class Task {
    private final String name;
    private final int priority;
    private final int retryCount;
    private final List<TaskListener> listeners;

    private Task(Builder builder) {
        this.name = builder.name;
        this.priority = builder.priority;
        this.retryCount = builder.retryCount;
        this.listeners = builder.listeners;
    }

    public String getName() { return name; }
    public int getPriority() { return priority; }

    public void run() {
        listeners.forEach(l -> l.onStart(this));

        // 작업 실행
        System.out.println("  작업 수행 중...");

        listeners.forEach(l -> l.onComplete(this));
    }

    public static class Builder {
        private final String name;
        private int priority = 0;
        private int retryCount = 3;
        private List<TaskListener> listeners = new ArrayList<>();

        public Builder(String name) {
            this.name = name;
        }

        public Builder priority(int priority) {
            this.priority = priority;
            return this;
        }

        public Builder retryCount(int count) {
            this.retryCount = count;
            return this;
        }

        public Builder addListener(TaskListener listener) {
            this.listeners.add(listener);
            return this;
        }

        public Task build() {
            return new Task(this);
        }
    }
}

// 5. Facade: 전체 시스템 통합
class TaskScheduler {
    private ExecutionStrategy strategy;
    private AppConfigManager config;

    public TaskScheduler(ExecutionStrategy strategy) {
        this.strategy = strategy;
        this.config = AppConfigManager.getInstance();
    }

    public void scheduleTask(Task task) {
        System.out.println("=== 작업 스케줄링 ===");
        System.out.println("작업명: " + task.getName());
        System.out.println("우선순위: " + task.getPriority());

        // 전략 패턴으로 실행 방식 결정
        strategy.execute(task);
    }

    public void setStrategy(ExecutionStrategy strategy) {
        this.strategy = strategy;
    }
}

// 실행
public class TaskSchedulerExample {
    public static void main(String[] args) {
        // Builder로 작업 생성
        Task task = new Task.Builder("데이터 백업")
            .priority(5)
            .retryCount(3)
            .addListener(new ConsoleLogger())
            .build();

        // Facade로 스케줄링
        TaskScheduler scheduler = new TaskScheduler(new ImmediateExecution());
        scheduler.scheduleTask(task);

        // 전략 변경
        scheduler.setStrategy(new DelayedExecution());
        scheduler.scheduleTask(task);
    }
}
```

**패턴 조합 정리:**

| 패턴 | 역할 | 위치 |
|------|------|------|
| **Singleton** | 설정 관리 (전역 접근) | AppConfigManager |
| **Strategy** | 실행 방식 교체 | ExecutionStrategy |
| **Observer** | 작업 상태 알림 | TaskListener |
| **Builder** | 복잡한 작업 설정 | Task.Builder |
| **Facade** | 전체 시스템 통합 | TaskScheduler |

## 마무리

디자인 패턴은 도구입니다. 모든 상황에 패턴을 적용하려 하지 마세요. 오히려 과도한 추상화로 코드가 복잡해질 수 있습니다.

**패턴 선택 가이드:**

- 전역 인스턴스 필요? → **Singleton**
- 생성자 파라미터 많음? → **Builder**
- 런타임에 알고리즘 교체? → **Strategy**
- 복잡한 서브시스템 감추기? → **Facade**
- 상태 변화를 여러 곳에 알림? → **Observer**
- 알고리즘 구조는 같고 세부 단계만 다름? → **Template Method**

패턴은 암기가 아니라 문제 해결 도구입니다. 코드 리뷰나 리팩토링 과정에서 "이 부분에 패턴을 적용하면 더 나아질까?"를 질문하며 자연스럽게 익혀보세요.

실무에서는 Spring Framework, JPA 등이 이미 많은 패턴을 사용하고 있습니다. 프레임워크 코드를 읽으며 패턴을 발견하는 연습도 큰 도움이 됩니다.
