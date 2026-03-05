---
title: "Java 17+ 최신 문법 - Record, Sealed Class, Pattern Matching, Virtual Thread"
date: 2026-02-16T13:10:00+09:00
draft: false
tags: ["Java", "Java17", "최신기능", "프로그래밍"]
categories: ["Java"]
series: "Java"
description: "Java 17 이상의 주요 기능과 변경사항을 정리합니다"
---

## 개요

Java는 6개월마다 새로운 버전을 출시하며 지속적으로 발전하고 있습니다. Java 17은 LTS(Long-Term Support) 버전으로, 이후 Java 21도 LTS로 지정되었습니다. 이 글에서는 Java 17 이상에서 도입된 주요 기능들을 실제 코드 예제와 함께 살펴보겠습니다.

## 1. Sealed Classes (봉인 클래스)

Sealed Classes는 Java 17에서 정식 기능으로 추가되었으며, 클래스 계층 구조를 명시적으로 제어할 수 있게 해줍니다. 어떤 클래스가 특정 클래스를 상속할 수 있는지를 제한함으로써 더 안전하고 예측 가능한 코드를 작성할 수 있습니다.

### 기본 문법

```java
public sealed class Shape
    permits Circle, Rectangle, Triangle {
    // 공통 메서드
}

public final class Circle extends Shape {
    private final double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    public double area() {
        return Math.PI * radius * radius;
    }
}

public final class Rectangle extends Shape {
    private final double width;
    private final double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    public double area() {
        return width * height;
    }
}

public non-sealed class Triangle extends Shape {
    // 다른 클래스가 Triangle을 상속할 수 있음
}
```

### 주요 특징

- `sealed` 키워드로 봉인 클래스 선언
- `permits` 절로 허용할 하위 클래스 명시
- 하위 클래스는 반드시 `final`, `sealed`, `non-sealed` 중 하나로 선언
- 도메인 모델링 시 타입 안전성 향상

## 2. Pattern Matching (패턴 매칭)

### instanceof 패턴 매칭

기존의 instanceof 검사 후 캐스팅하는 번거로운 과정을 간소화합니다.

```java
// 기존 방식
if (obj instanceof String) {
    String str = (String) obj;
    System.out.println(str.length());
}

// 패턴 매칭 방식 (Java 16+)
if (obj instanceof String str) {
    System.out.println(str.length());
}

// 조건과 함께 사용
if (obj instanceof String str && str.length() > 5) {
    System.out.println("긴 문자열: " + str);
}
```

### Switch 패턴 매칭

Java 21에서는 switch 문에서도 패턴 매칭을 사용할 수 있습니다.

```java
public String processShape(Shape shape) {
    return switch (shape) {
        case Circle c -> "원의 넓이: " + c.area();
        case Rectangle r -> "사각형의 넓이: " + r.area();
        case Triangle t -> "삼각형의 넓이: " + t.area();
        case null -> "도형이 없습니다";
    };
}

// when 절을 사용한 조건부 패턴
public String classifyNumber(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "양수";
        case Integer i when i < 0 -> "음수";
        case Integer i -> "0";
        case Double d -> "실수: " + d;
        case String s -> "문자열: " + s;
        default -> "알 수 없는 타입";
    };
}
```

## 3. Records (레코드)

Records는 불변 데이터를 간결하게 표현하기 위한 특별한 클래스입니다. Java 16에서 정식 기능이 되었습니다.

### 기본 사용법

```java
// Record 정의
public record Person(String name, int age, String email) {
    // 자동 생성: 생성자, getter, equals(), hashCode(), toString()
}

// 사용 예제
Person person = new Person("김철수", 30, "kim@example.com");
System.out.println(person.name());    // 김철수
System.out.println(person.age());     // 30
System.out.println(person);           // Person[name=김철수, age=30, email=kim@example.com]
```

### 고급 기능

```java
public record Point(int x, int y) {
    // Compact 생성자 - 유효성 검사
    public Point {
        if (x < 0 || y < 0) {
            throw new IllegalArgumentException("좌표는 음수일 수 없습니다");
        }
    }

    // 추가 메서드
    public double distanceFromOrigin() {
        return Math.sqrt(x * x + y * y);
    }

    // 정적 팩토리 메서드
    public static Point origin() {
        return new Point(0, 0);
    }
}

// 중첩 Record
public record Order(
    String orderId,
    Customer customer,
    List<Item> items
) {
    public record Customer(String name, String email) {}
    public record Item(String productId, int quantity, double price) {}
}
```

## 4. Text Blocks (텍스트 블록)

Java 15에서 정식 기능이 된 Text Blocks는 여러 줄의 문자열을 깔끔하게 작성할 수 있게 해줍니다.

```java
// 기존 방식
String html = "<html>\n" +
              "  <body>\n" +
              "    <p>Hello, World!</p>\n" +
              "  </body>\n" +
              "</html>\n";

// Text Blocks 방식
String html = """
    <html>
      <body>
        <p>Hello, World!</p>
      </body>
    </html>
    """;

// JSON 예제
String json = """
    {
      "name": "김철수",
      "age": 30,
      "address": {
        "city": "서울",
        "country": "한국"
      }
    }
    """;

// SQL 쿼리
String query = """
    SELECT u.name, u.email, o.order_date
    FROM users u
    JOIN orders o ON u.id = o.user_id
    WHERE o.status = 'COMPLETED'
    ORDER BY o.order_date DESC
    """;

// 변수 보간
String name = "홍길동";
int age = 25;
String message = """
    안녕하세요, %s님!
    회원님의 나이는 %d세입니다.
    """.formatted(name, age);
```

## 5. Virtual Threads (가상 스레드)

Java 21의 가장 혁신적인 기능 중 하나로, 경량 스레드를 통해 수백만 개의 동시 작업을 효율적으로 처리할 수 있습니다.

### 기본 사용법

```java
// 기존 플랫폼 스레드
Thread platformThread = new Thread(() -> {
    System.out.println("플랫폼 스레드");
});
platformThread.start();

// Virtual Thread 생성
Thread virtualThread = Thread.startVirtualThread(() -> {
    System.out.println("가상 스레드");
});

// ExecutorService 사용
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10000; i++) {
        int taskId = i;
        executor.submit(() -> {
            System.out.println("작업 " + taskId + " 실행");
            Thread.sleep(1000);
            return taskId;
        });
    }
} // 자동으로 종료 대기
```

### 실전 예제 - 동시 HTTP 요청

```java
public class VirtualThreadExample {

    public static void fetchMultipleUrls(List<String> urls) {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<String>> futures = urls.stream()
                .map(url -> executor.submit(() -> fetchUrl(url)))
                .toList();

            for (Future<String> future : futures) {
                try {
                    String result = future.get();
                    System.out.println("결과: " + result);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private static String fetchUrl(String url) throws Exception {
        // HTTP 요청 시뮬레이션
        Thread.sleep(100);
        return "데이터 from " + url;
    }
}
```

### Virtual Thread 장점

- 메모리 효율성: 플랫폼 스레드보다 훨씬 적은 메모리 사용
- 확장성: 수백만 개의 동시 작업 처리 가능
- 간단한 프로그래밍 모델: 기존 스레드 API와 호환
- I/O 집약적 작업에 최적화

## 6. var 키워드 (지역 변수 타입 추론)

Java 10에서 도입된 var 키워드는 지역 변수의 타입을 추론하여 코드를 더 간결하게 만듭니다.

```java
// 기존 방식
HashMap<String, List<Integer>> map = new HashMap<>();
ArrayList<String> list = new ArrayList<>();

// var 사용
var map = new HashMap<String, List<Integer>>();
var list = new ArrayList<String>();

// 복잡한 타입도 간결하게
var result = apiService.fetchData()
    .map(this::transform)
    .filter(Objects::nonNull)
    .collect(Collectors.toList());

// for-each에서 사용
var numbers = List.of(1, 2, 3, 4, 5);
for (var number : numbers) {
    System.out.println(number);
}

// try-with-resources에서 사용
try (var reader = new BufferedReader(new FileReader("file.txt"))) {
    var line = reader.readLine();
    System.out.println(line);
}
```

### var 사용 시 주의사항

```java
// 좋은 사용 예
var userName = getUserName();          // 메서드 이름이 타입을 암시
var activeUsers = filterActiveUsers(); // 반환 타입이 명확

// 피해야 할 사용 예
var data = getData();     // 타입이 불분명
var x = process();        // 의미 없는 변수명

// 불가능한 사용
// var noInit;            // 초기화 필수
// var nullValue = null;  // null 불가
// var lambda = x -> x;   // 람다 불가
```

## 7. 기타 유용한 기능들

### Stream API 개선

```java
// takeWhile / dropWhile (Java 9+)
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8);
var result = numbers.stream()
    .takeWhile(n -> n < 5)  // [1, 2, 3, 4]
    .toList();

// toList() 편의 메서드 (Java 16+)
var squares = numbers.stream()
    .map(n -> n * n)
    .toList();  // 불변 리스트 반환
```

### Optional 개선

```java
// ifPresentOrElse (Java 9+)
Optional<String> opt = Optional.of("Hello");
opt.ifPresentOrElse(
    value -> System.out.println("값: " + value),
    () -> System.out.println("값이 없습니다")
);

// or (Java 9+)
Optional<String> result = Optional.empty()
    .or(() -> Optional.of("기본값"));
```

### String 메서드 추가

```java
// isBlank() (Java 11+)
"   ".isBlank();  // true

// lines() (Java 11+)
String multiline = "첫째\n둘째\n셋째";
multiline.lines()
    .forEach(System.out::println);

// repeat() (Java 11+)
"*".repeat(10);  // "**********"

// indent() (Java 12+)
String text = "Hello\nWorld";
text.indent(4);  // 각 줄에 4칸 들여쓰기
```

## 마무리

Java 17 이상의 최신 버전들은 개발자의 생산성을 크게 향상시키는 다양한 기능을 제공합니다. Sealed Classes로 타입 안전성을 높이고, Records로 데이터 클래스를 간결하게 작성하며, Virtual Threads로 고성능 동시성 프로그래밍을 구현할 수 있습니다.

특히 Java 21 LTS는 Virtual Threads와 Pattern Matching의 완성도가 높아져, 프로덕션 환경에서 적극적으로 활용할 만한 가치가 있습니다. 기존 Java 8이나 11을 사용 중이라면, 최신 LTS 버전으로의 마이그레이션을 검토해보시기 바랍니다.

이러한 최신 기능들을 활용하면 더 안전하고, 읽기 쉬우며, 성능이 뛰어난 Java 애플리케이션을 개발할 수 있습니다.
