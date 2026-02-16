---
title: "Java 동시성 프로그래밍 - ThreadPool부터 동기화까지"
date: 2026-02-16T13:16:00+09:00
draft: false
tags: ["Java", "동시성", "멀티스레딩", "ThreadPool"]
categories: ["Java"]
series: "Java"
description: "ExecutorService, ConcurrentHashMap, Semaphore 등 Java 동시성 핵심 개념을 실전 예제로 알아봅니다"
---

## 동시성 프로그래밍이란

현대 애플리케이션은 여러 작업을 동시에 처리해야 합니다. 파일 업로드를 받으면서 DB 쿼리를 실행하고, API 요청을 처리하는 등 멀티태스킹은 필수입니다. Java는 강력한 동시성 라이브러리를 제공하여 이런 작업을 안전하고 효율적으로 처리할 수 있게 합니다.

이 글에서는 Thread 기본부터 ThreadPool, 동기화 메커니즘까지 실전 예제와 함께 알아봅니다.

## Thread와 Runnable 기본

### Thread 생성 방법

Java에서 스레드를 생성하는 두 가지 방법이 있습니다.

**1. Thread 클래스 상속**

```java
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread 실행: " + Thread.currentThread().getName());
    }
}

// 사용
MyThread thread = new MyThread();
thread.start();
```

**2. Runnable 인터페이스 구현 (권장)**

```java
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable 실행: " + Thread.currentThread().getName());
    }
}

// 사용
Thread thread = new Thread(new MyRunnable());
thread.start();

// 람다 표현식으로 간결하게
Thread thread2 = new Thread(() -> {
    System.out.println("Lambda 실행: " + Thread.currentThread().getName());
});
thread2.start();
```

Runnable 방식이 권장되는 이유:
- 다른 클래스를 상속받을 수 있음
- 코드 재사용성이 높음
- 함수형 인터페이스로 람다 사용 가능

### 간단한 병렬 다운로드 예제

```java
public class SimpleDownloader {
    public static void main(String[] args) {
        String[] urls = {
            "https://example.com/file1.zip",
            "https://example.com/file2.zip",
            "https://example.com/file3.zip"
        };

        for (String url : urls) {
            new Thread(() -> {
                downloadFile(url);
            }).start();
        }
    }

    private static void downloadFile(String url) {
        System.out.println("다운로드 시작: " + url +
            " [" + Thread.currentThread().getName() + "]");

        try {
            Thread.sleep(2000); // 다운로드 시뮬레이션
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("다운로드 완료: " + url);
    }
}
```

하지만 이 방식은 스레드 수를 제어할 수 없어 위험합니다. 수천 개의 파일이 있다면 수천 개의 스레드가 생성되어 시스템이 멈출 수 있습니다.

## ExecutorService와 ThreadPool

### ThreadPool의 필요성

스레드 생성은 비용이 큽니다. ThreadPool을 사용하면:
- 스레드를 미리 생성해두고 재사용
- 동시 실행 스레드 수 제한
- 작업 큐를 통한 작업 관리

### ExecutorService 기본 사용법

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class ExecutorServiceExample {
    public static void main(String[] args) {
        // 고정 크기 ThreadPool 생성
        ExecutorService executor = Executors.newFixedThreadPool(3);

        // 10개 작업 제출
        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            executor.submit(() -> {
                System.out.println("Task " + taskId +
                    " 실행 중 [" + Thread.currentThread().getName() + "]");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.println("Task " + taskId + " 완료");
            });
        }

        // Executor 종료
        executor.shutdown();

        try {
            // 모든 작업 완료 대기 (최대 60초)
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }

        System.out.println("모든 작업 완료");
    }
}
```

**출력 예시:**
```
Task 0 실행 중 [pool-1-thread-1]
Task 1 실행 중 [pool-1-thread-2]
Task 2 실행 중 [pool-1-thread-3]
Task 0 완료
Task 3 실행 중 [pool-1-thread-1]
...
```

3개 스레드만 사용하여 10개 작업을 순차적으로 처리합니다.

### newFixedThreadPool vs newCachedThreadPool

**newFixedThreadPool(n)**: 고정된 n개의 스레드 사용

```java
ExecutorService fixed = Executors.newFixedThreadPool(5);
// 5개 스레드로 모든 작업 처리
// 작업이 많으면 큐에 대기
```

**newCachedThreadPool()**: 필요시 스레드 생성, 60초 유휴시 제거

```java
ExecutorService cached = Executors.newCachedThreadPool();
// 작업 수만큼 스레드 생성 (제한 없음)
// 짧고 많은 작업에 적합
```

선택 기준:
- CPU 집약적 작업: `newFixedThreadPool(Runtime.getRuntime().availableProcessors())`
- I/O 집약적 작업: `newFixedThreadPool(n * 2)` 또는 `newCachedThreadPool()`
- 작업 수가 예측 가능: `newFixedThreadPool`
- 작업 수가 변동적이고 짧음: `newCachedThreadPool`

## ThreadPoolExecutor 커스터마이징

더 세밀한 제어가 필요하면 ThreadPoolExecutor를 직접 생성합니다.

```java
import java.util.concurrent.*;

public class CustomThreadPoolExample {
    public static void main(String[] args) {
        int corePoolSize = 5;        // 기본 스레드 수
        int maxPoolSize = 10;        // 최대 스레드 수
        long keepAliveTime = 60L;    // 유휴 스레드 대기 시간
        BlockingQueue<Runnable> queue = new LinkedBlockingQueue<>(100); // 작업 큐

        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            corePoolSize,
            maxPoolSize,
            keepAliveTime,
            TimeUnit.SECONDS,
            queue,
            new ThreadPoolExecutor.CallerRunsPolicy() // 거부 정책
        );

        // 작업 제출
        for (int i = 0; i < 200; i++) {
            final int taskId = i;
            executor.submit(() -> {
                System.out.println("Task " + taskId + " 처리 중");
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
        }

        // 모니터링
        System.out.println("Active threads: " + executor.getActiveCount());
        System.out.println("Pool size: " + executor.getPoolSize());
        System.out.println("Queue size: " + executor.getQueue().size());

        executor.shutdown();
    }
}
```

### 거부 정책 (RejectedExecutionHandler)

큐가 가득 차고 최대 스레드에 도달하면:

1. **AbortPolicy** (기본): RejectedExecutionException 발생
2. **CallerRunsPolicy**: 호출한 스레드에서 직접 실행 (백프레셔)
3. **DiscardPolicy**: 조용히 버림
4. **DiscardOldestPolicy**: 가장 오래된 작업 버리고 새 작업 추가

```java
// 백프레셔 적용 - 서버 과부하 방지
executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
```

## ConcurrentHashMap vs Collections.synchronizedMap

### 동기화된 컬렉션의 필요성

일반 HashMap은 멀티스레드 환경에서 안전하지 않습니다.

```java
// 위험한 코드
Map<String, Integer> map = new HashMap<>();

// 여러 스레드가 동시에 접근
executor.submit(() -> map.put("key1", 1));
executor.submit(() -> map.put("key2", 2));
// ConcurrentModificationException 또는 데이터 손실 발생 가능
```

### Collections.synchronizedMap

```java
Map<String, Integer> syncMap = Collections.synchronizedMap(new HashMap<>());

syncMap.put("key1", 1); // 메서드 단위 동기화
```

**단점:**
- 모든 작업에 락이 걸려 성능 저하
- iteration시 외부에서 동기화 필요

```java
synchronized (syncMap) {
    for (Map.Entry<String, Integer> entry : syncMap.entrySet()) {
        System.out.println(entry.getKey() + ": " + entry.getValue());
    }
}
```

### ConcurrentHashMap (권장)

세그먼트별 락으로 동시성 향상:

```java
import java.util.concurrent.ConcurrentHashMap;

public class ConcurrentMapExample {
    private static ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();

    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(10);

        // 동시 쓰기
        for (int i = 0; i < 100; i++) {
            final int value = i;
            executor.submit(() -> {
                map.put("key" + value, value);
            });
        }

        // 원자적 연산
        executor.submit(() -> {
            map.putIfAbsent("counter", 0);
            map.compute("counter", (k, v) -> v + 1);
        });

        executor.submit(() -> {
            map.computeIfAbsent("newKey", k -> 100);
        });

        executor.shutdown();
        try {
            executor.awaitTermination(1, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // iteration에 외부 동기화 불필요
        map.forEach((key, value) -> {
            System.out.println(key + ": " + value);
        });
    }
}
```

**ConcurrentHashMap의 장점:**
- 읽기 작업은 락 없음
- 쓰기 작업은 세그먼트별 락
- `putIfAbsent`, `compute`, `merge` 등 원자적 연산 제공

## AtomicInteger와 AtomicBoolean

### 문제 상황: 카운터의 동시성 이슈

```java
// 위험한 코드
private int counter = 0;

public void increment() {
    counter++; // 원자적이지 않음! (read-modify-write)
}
```

여러 스레드가 동시에 `increment()`를 호출하면 값이 누락됩니다.

### synchronized로 해결

```java
private int counter = 0;

public synchronized void increment() {
    counter++;
}
```

간단하지만 락 비용이 있습니다.

### AtomicInteger 사용 (권장)

```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicCounterExample {
    private AtomicInteger counter = new AtomicInteger(0);

    public void increment() {
        counter.incrementAndGet(); // 원자적 연산, 락 없음
    }

    public int get() {
        return counter.get();
    }

    public static void main(String[] args) throws InterruptedException {
        AtomicCounterExample example = new AtomicCounterExample();
        ExecutorService executor = Executors.newFixedThreadPool(10);

        // 1000번 증가 작업 제출
        for (int i = 0; i < 1000; i++) {
            executor.submit(example::increment);
        }

        executor.shutdown();
        executor.awaitTermination(1, TimeUnit.SECONDS);

        System.out.println("최종 카운터: " + example.get()); // 정확히 1000
    }
}
```

### AtomicBoolean으로 상태 관리

```java
import java.util.concurrent.atomic.AtomicBoolean;

public class FileProcessor {
    private AtomicBoolean isProcessing = new AtomicBoolean(false);

    public void processFile(String filePath) {
        // 이미 처리 중이면 스킵
        if (!isProcessing.compareAndSet(false, true)) {
            System.out.println("이미 처리 중입니다.");
            return;
        }

        try {
            // 파일 처리 로직
            System.out.println("파일 처리 중: " + filePath);
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            isProcessing.set(false); // 처리 완료
        }
    }
}
```

**compareAndSet(expected, update)**: 현재 값이 expected면 update로 변경하고 true 반환 (원자적)

## Semaphore로 동시 접근 제어

### Semaphore란

특정 자원에 동시 접근할 수 있는 스레드 수를 제한합니다.

```java
import java.util.concurrent.Semaphore;

public class ConnectionPool {
    private Semaphore semaphore;

    public ConnectionPool(int maxConnections) {
        this.semaphore = new Semaphore(maxConnections);
    }

    public void useConnection(String taskName) {
        try {
            System.out.println(taskName + " - 커넥션 대기 중...");
            semaphore.acquire(); // 허가 획득 (없으면 대기)

            System.out.println(taskName + " - 커넥션 획득! [가용: " +
                semaphore.availablePermits() + "]");

            // DB 작업 시뮬레이션
            Thread.sleep(2000);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            System.out.println(taskName + " - 커넥션 반환");
            semaphore.release(); // 허가 반환
        }
    }

    public static void main(String[] args) {
        ConnectionPool pool = new ConnectionPool(3); // 최대 3개 동시 접근
        ExecutorService executor = Executors.newFixedThreadPool(10);

        for (int i = 0; i < 10; i++) {
            final String taskName = "Task-" + i;
            executor.submit(() -> pool.useConnection(taskName));
        }

        executor.shutdown();
    }
}
```

**출력 예시:**
```
Task-0 - 커넥션 대기 중...
Task-1 - 커넥션 대기 중...
Task-0 - 커넥션 획득! [가용: 2]
Task-1 - 커넥션 획득! [가용: 1]
Task-2 - 커넥션 대기 중...
Task-2 - 커넥션 획득! [가용: 0]
Task-3 - 커넥션 대기 중...
// Task-3는 누군가 release()할 때까지 대기
```

## synchronized vs Lock

### synchronized 키워드

```java
public class SynchronizedExample {
    private int balance = 0;

    // 메서드 전체 동기화
    public synchronized void deposit(int amount) {
        balance += amount;
    }

    // 블록 단위 동기화
    public void withdraw(int amount) {
        synchronized (this) {
            balance -= amount;
        }
    }

    // 정적 메서드 동기화 (클래스 레벨 락)
    public static synchronized void staticMethod() {
        // ...
    }
}
```

**장점:**
- 간단하고 명확
- 자동 락 해제 (예외 발생시에도)

**단점:**
- 타임아웃 불가
- 공정성 제어 불가
- 읽기/쓰기 구분 불가

### ReentrantLock

```java
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class LockExample {
    private final Lock lock = new ReentrantLock();
    private int balance = 0;

    public void deposit(int amount) {
        lock.lock();
        try {
            balance += amount;
        } finally {
            lock.unlock(); // 반드시 finally에서 해제
        }
    }

    // 타임아웃 지원
    public boolean tryDepositWithTimeout(int amount) {
        try {
            if (lock.tryLock(1, TimeUnit.SECONDS)) {
                try {
                    balance += amount;
                    return true;
                } finally {
                    lock.unlock();
                }
            } else {
                System.out.println("락 획득 실패 - 타임아웃");
                return false;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
```

### ReadWriteLock으로 성능 향상

읽기는 동시에, 쓰기는 독점적으로:

```java
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class CacheWithReadWriteLock {
    private final Map<String, String> cache = new HashMap<>();
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();

    public String get(String key) {
        rwLock.readLock().lock();
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public void put(String key, String value) {
        rwLock.writeLock().lock();
        try {
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
```

읽기가 많고 쓰기가 적으면 성능이 크게 향상됩니다.

## CompletableFuture 비동기 처리

### Future의 한계

```java
ExecutorService executor = Executors.newFixedThreadPool(2);

Future<String> future = executor.submit(() -> {
    Thread.sleep(2000);
    return "결과";
});

// 블로킹 대기
String result = future.get(); // 2초 동안 멈춤
```

콜백이나 체이닝이 불가능합니다.

### CompletableFuture 기본

```java
import java.util.concurrent.CompletableFuture;

public class CompletableFutureExample {
    public static void main(String[] args) {
        // 비동기 작업 시작
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            System.out.println("비동기 작업 시작 [" +
                Thread.currentThread().getName() + "]");
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            return "데이터 조회 완료";
        });

        // 콜백 체이닝
        future.thenApply(result -> {
            System.out.println("변환: " + result);
            return result.toUpperCase();
        }).thenAccept(result -> {
            System.out.println("최종 결과: " + result);
        }).exceptionally(ex -> {
            System.err.println("오류 발생: " + ex.getMessage());
            return null;
        });

        System.out.println("메인 스레드는 계속 실행");

        // 완료 대기 (실전에서는 다른 방식 사용)
        future.join();
    }
}
```

### 여러 작업 조합

```java
public class CombineExample {
    public static void main(String[] args) {
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "사용자 정보";
        });

        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
            sleep(1500);
            return "주문 정보";
        });

        CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> {
            sleep(800);
            return "배송 정보";
        });

        // 모두 완료 대기
        CompletableFuture<Void> allOf = CompletableFuture.allOf(future1, future2, future3);

        allOf.thenRun(() -> {
            try {
                System.out.println(future1.get());
                System.out.println(future2.get());
                System.out.println(future3.get());
            } catch (Exception e) {
                e.printStackTrace();
            }
        });

        // 가장 빠른 것 하나만
        CompletableFuture<Object> anyOf = CompletableFuture.anyOf(future1, future2, future3);
        anyOf.thenAccept(result -> {
            System.out.println("가장 빠른 결과: " + result);
        });

        allOf.join();
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

### 순차적 의존 작업

```java
CompletableFuture.supplyAsync(() -> {
    return getUserId();
})
.thenCompose(userId -> {
    return CompletableFuture.supplyAsync(() -> getUserProfile(userId));
})
.thenApply(profile -> {
    return enrichProfile(profile);
})
.thenAccept(finalProfile -> {
    System.out.println("프로필: " + finalProfile);
});
```

`thenCompose`는 중첩된 Future를 평탄화합니다 (flatMap과 유사).

## 실전 예시: 파일 병렬 전송 시나리오

실제 파일 동기화 시스템에서 여러 파티션의 파일을 병렬로 전송하는 예제입니다.

```java
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ParallelFileSyncSystem {
    private final ExecutorService executor;
    private final Semaphore bandwidthLimiter;
    private final AtomicInteger totalFilesProcessed = new AtomicInteger(0);
    private final ConcurrentHashMap<String, SyncStatus> statusMap = new ConcurrentHashMap<>();

    public ParallelFileSyncSystem(int maxThreads, int maxConcurrentUploads) {
        this.executor = new ThreadPoolExecutor(
            maxThreads / 2,
            maxThreads,
            60L,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(1000),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
        this.bandwidthLimiter = new Semaphore(maxConcurrentUploads);
    }

    public void syncPartitions(List<Partition> partitions) {
        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (Partition partition : partitions) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                syncPartition(partition);
            }, executor);

            futures.add(future);
        }

        // 모든 파티션 동기화 완료 대기
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenRun(() -> {
                System.out.println("=== 전체 동기화 완료 ===");
                System.out.println("처리된 파일 수: " + totalFilesProcessed.get());
                printStatusSummary();
            })
            .join();
    }

    private void syncPartition(Partition partition) {
        System.out.println("파티션 동기화 시작: " + partition.getName());
        statusMap.put(partition.getName(), SyncStatus.IN_PROGRESS);

        List<String> files = partition.getFiles();
        List<CompletableFuture<Void>> fileFutures = new ArrayList<>();

        for (String file : files) {
            CompletableFuture<Void> fileFuture = CompletableFuture.runAsync(() -> {
                transferFile(partition.getName(), file);
            }, executor);

            fileFutures.add(fileFuture);
        }

        // 파티션 내 모든 파일 완료 대기
        CompletableFuture.allOf(fileFutures.toArray(new CompletableFuture[0]))
            .thenRun(() -> {
                statusMap.put(partition.getName(), SyncStatus.COMPLETED);
                System.out.println("파티션 완료: " + partition.getName() +
                    " (" + files.size() + " files)");
            })
            .exceptionally(ex -> {
                statusMap.put(partition.getName(), SyncStatus.FAILED);
                System.err.println("파티션 실패: " + partition.getName() +
                    " - " + ex.getMessage());
                return null;
            })
            .join();
    }

    private void transferFile(String partitionName, String filePath) {
        try {
            // 대역폭 제한 (동시 업로드 수 제어)
            bandwidthLimiter.acquire();

            System.out.println("  [" + partitionName + "] 전송 시작: " + filePath +
                " [" + Thread.currentThread().getName() + "]");

            // 파일 전송 시뮬레이션
            Thread.sleep(ThreadLocalRandom.current().nextInt(500, 1500));

            totalFilesProcessed.incrementAndGet();

            System.out.println("  [" + partitionName + "] 전송 완료: " + filePath);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("전송 중단: " + filePath, e);
        } finally {
            bandwidthLimiter.release();
        }
    }

    private void printStatusSummary() {
        System.out.println("\n=== 파티션별 상태 ===");
        statusMap.forEach((partition, status) -> {
            System.out.println(partition + ": " + status);
        });
    }

    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
    }

    // 데이터 클래스
    static class Partition {
        private final String name;
        private final List<String> files;

        public Partition(String name, List<String> files) {
            this.name = name;
            this.files = files;
        }

        public String getName() { return name; }
        public List<String> getFiles() { return files; }
    }

    enum SyncStatus {
        IN_PROGRESS, COMPLETED, FAILED
    }

    // 테스트 실행
    public static void main(String[] args) {
        List<Partition> partitions = Arrays.asList(
            new Partition("partition-A", Arrays.asList(
                "/data/a/file1.dat", "/data/a/file2.dat", "/data/a/file3.dat"
            )),
            new Partition("partition-B", Arrays.asList(
                "/data/b/file1.dat", "/data/b/file2.dat"
            )),
            new Partition("partition-C", Arrays.asList(
                "/data/c/file1.dat", "/data/c/file2.dat", "/data/c/file3.dat", "/data/c/file4.dat"
            ))
        );

        ParallelFileSyncSystem syncSystem = new ParallelFileSyncSystem(
            8,  // 최대 스레드 수
            3   // 동시 업로드 수 (대역폭 제한)
        );

        long startTime = System.currentTimeMillis();
        syncSystem.syncPartitions(partitions);
        long endTime = System.currentTimeMillis();

        System.out.println("\n총 소요 시간: " + (endTime - startTime) + "ms");

        syncSystem.shutdown();
    }
}
```

**핵심 포인트:**

1. **ThreadPoolExecutor**: 스레드 수와 큐 크기 커스터마이징
2. **Semaphore**: 동시 업로드 수 제한으로 대역폭 관리
3. **ConcurrentHashMap**: 파티션별 상태를 안전하게 관리
4. **AtomicInteger**: 전체 처리 파일 수 카운팅
5. **CompletableFuture**: 파티션별, 파일별 비동기 처리 및 조합
6. **CallerRunsPolicy**: 백프레셔로 메모리 보호

**출력 예시:**
```
파티션 동기화 시작: partition-A
파티션 동기화 시작: partition-B
  [partition-A] 전송 시작: /data/a/file1.dat [pool-1-thread-1]
  [partition-B] 전송 시작: /data/b/file1.dat [pool-1-thread-2]
  [partition-A] 전송 완료: /data/a/file1.dat
  [partition-A] 전송 시작: /data/a/file2.dat [pool-1-thread-1]
...
파티션 완료: partition-B (2 files)
파티션 완료: partition-A (3 files)
=== 전체 동기화 완료 ===
처리된 파일 수: 9
```

## 마무리

Java 동시성 프로그래밍의 핵심을 정리하면:

1. **ThreadPool 사용**: 직접 Thread 생성 대신 ExecutorService 사용
2. **적절한 크기 설정**: CPU 집약적 작업은 코어 수만큼, I/O 작업은 더 많이
3. **동시성 컬렉션**: HashMap 대신 ConcurrentHashMap
4. **Atomic 클래스**: 간단한 카운터나 플래그는 AtomicInteger/AtomicBoolean
5. **Semaphore**: 자원 접근 수 제한
6. **CompletableFuture**: 비동기 작업 체이닝과 조합
7. **항상 종료 처리**: shutdown() + awaitTermination()

동시성은 어렵지만, Java가 제공하는 도구를 잘 활용하면 안전하고 효율적인 멀티스레드 프로그램을 만들 수 있습니다. 작은 예제부터 시작해서 점진적으로 복잡한 시스템으로 확장해 보세요.
