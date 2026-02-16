---
title: "Java Stream API 완벽 가이드 - 함수형 데이터 처리"
date: 2026-02-16T13:11:00+09:00
draft: false
tags: ["Java", "Stream", "함수형프로그래밍", "컬렉션"]
categories: ["Java"]
series: "Java"
description: "Java Stream API를 활용한 효율적인 데이터 처리 방법을 알아봅니다"
---

## Stream API란?

Java 8에서 도입된 Stream API는 컬렉션 데이터를 함수형 스타일로 처리할 수 있게 해주는 강력한 도구입니다. Stream을 사용하면 데이터를 선언적으로 처리하고, 병렬 처리를 쉽게 구현할 수 있으며, 코드의 가독성을 크게 향상시킬 수 있습니다.

Stream은 데이터의 흐름을 나타내며, 원본 데이터를 변경하지 않고 중간 연산과 최종 연산을 통해 데이터를 처리합니다. 이러한 특성 덕분에 불변성을 유지하면서도 효율적인 데이터 처리가 가능합니다.

## Stream 생성 방법

Stream을 생성하는 다양한 방법이 있습니다.

### 컬렉션으로부터 생성

```java
List<String> list = Arrays.asList("Apple", "Banana", "Cherry");
Stream<String> stream = list.stream();

// 병렬 스트림
Stream<String> parallelStream = list.parallelStream();
```

### 배열로부터 생성

```java
String[] array = {"Apple", "Banana", "Cherry"};
Stream<String> stream = Arrays.stream(array);

// 범위 지정
int[] numbers = {1, 2, 3, 4, 5};
IntStream stream = Arrays.stream(numbers, 1, 4); // 2, 3, 4
```

### Stream.of() 사용

```java
Stream<String> stream = Stream.of("Apple", "Banana", "Cherry");
Stream<Integer> numberStream = Stream.of(1, 2, 3, 4, 5);
```

### 범위 생성

```java
// 1부터 10까지 (10 포함)
IntStream range = IntStream.rangeClosed(1, 10);

// 1부터 10까지 (10 미포함)
IntStream range2 = IntStream.range(1, 10);
```

### 무한 스트림 생성

```java
// iterate: 초기값부터 시작해서 함수를 반복 적용
Stream<Integer> evenNumbers = Stream.iterate(0, n -> n + 2);

// generate: 매번 새로운 값을 생성
Stream<Double> randomNumbers = Stream.generate(Math::random);

// 무한 스트림은 limit()으로 제한 필요
Stream<Integer> first10Evens = Stream.iterate(0, n -> n + 2).limit(10);
```

## 중간 연산 (Intermediate Operations)

중간 연산은 Stream을 반환하므로 여러 개를 연결(chaining)할 수 있습니다. 중간 연산은 지연 평가(lazy evaluation)되어 최종 연산이 호출될 때까지 실행되지 않습니다.

### filter() - 조건에 맞는 요소 필터링

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 짝수만 필터링
List<Integer> evenNumbers = numbers.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
// [2, 4, 6, 8, 10]

// 여러 조건 결합
List<Integer> filtered = numbers.stream()
    .filter(n -> n > 3)
    .filter(n -> n < 8)
    .collect(Collectors.toList());
// [4, 5, 6, 7]
```

### map() - 요소를 다른 형태로 변환

```java
List<String> names = Arrays.asList("alice", "bob", "charlie");

// 대문자로 변환
List<String> upperNames = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());
// [ALICE, BOB, CHARLIE]

// 문자열 길이로 변환
List<Integer> nameLengths = names.stream()
    .map(String::length)
    .collect(Collectors.toList());
// [5, 3, 7]
```

### flatMap() - 중첩 구조를 평탄화

```java
List<List<Integer>> nestedList = Arrays.asList(
    Arrays.asList(1, 2, 3),
    Arrays.asList(4, 5),
    Arrays.asList(6, 7, 8, 9)
);

// 중첩 리스트를 단일 리스트로 평탄화
List<Integer> flatList = nestedList.stream()
    .flatMap(List::stream)
    .collect(Collectors.toList());
// [1, 2, 3, 4, 5, 6, 7, 8, 9]

// 문자열을 문자로 분리
List<String> words = Arrays.asList("Hello", "World");
List<String> characters = words.stream()
    .flatMap(word -> Arrays.stream(word.split("")))
    .collect(Collectors.toList());
// [H, e, l, l, o, W, o, r, l, d]
```

### sorted() - 정렬

```java
List<Integer> numbers = Arrays.asList(5, 3, 8, 1, 9, 2);

// 기본 정렬 (오름차순)
List<Integer> sorted = numbers.stream()
    .sorted()
    .collect(Collectors.toList());
// [1, 2, 3, 5, 8, 9]

// 역순 정렬
List<Integer> reversed = numbers.stream()
    .sorted(Comparator.reverseOrder())
    .collect(Collectors.toList());
// [9, 8, 5, 3, 2, 1]

// 객체 정렬
List<Person> people = Arrays.asList(
    new Person("Alice", 25),
    new Person("Bob", 30),
    new Person("Charlie", 20)
);

List<Person> sortedByAge = people.stream()
    .sorted(Comparator.comparing(Person::getAge))
    .collect(Collectors.toList());
```

### distinct() - 중복 제거

```java
List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 3, 3, 4, 5, 5);

List<Integer> unique = numbers.stream()
    .distinct()
    .collect(Collectors.toList());
// [1, 2, 3, 4, 5]
```

### limit()와 skip() - 개수 제한 및 건너뛰기

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 처음 5개만
List<Integer> first5 = numbers.stream()
    .limit(5)
    .collect(Collectors.toList());
// [1, 2, 3, 4, 5]

// 처음 3개 건너뛰고 5개
List<Integer> middle = numbers.stream()
    .skip(3)
    .limit(5)
    .collect(Collectors.toList());
// [4, 5, 6, 7, 8]
```

## 최종 연산 (Terminal Operations)

최종 연산은 Stream을 소비하고 결과를 반환합니다. 최종 연산이 호출되면 Stream은 더 이상 사용할 수 없습니다.

### collect() - 결과를 컬렉션으로 수집

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// List로 수집
List<String> list = names.stream()
    .collect(Collectors.toList());

// Set으로 수집
Set<String> set = names.stream()
    .collect(Collectors.toSet());

// Map으로 수집
Map<String, Integer> nameToLength = names.stream()
    .collect(Collectors.toMap(
        name -> name,
        String::length
    ));
```

### reduce() - 요소를 하나로 축약

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 합계
int sum = numbers.stream()
    .reduce(0, (a, b) -> a + b);
// 15

// 곱셈
int product = numbers.stream()
    .reduce(1, (a, b) -> a * b);
// 120

// 최댓값
Optional<Integer> max = numbers.stream()
    .reduce(Integer::max);
```

### forEach() - 각 요소에 대해 작업 수행

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

names.stream()
    .forEach(System.out::println);

// 순서 보장이 필요한 경우 forEachOrdered 사용
names.parallelStream()
    .forEachOrdered(System.out::println);
```

### count() - 요소 개수 세기

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

long count = numbers.stream()
    .filter(n -> n > 2)
    .count();
// 3
```

### anyMatch(), allMatch(), noneMatch() - 조건 검사

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 하나라도 조건을 만족하는가?
boolean hasEven = numbers.stream()
    .anyMatch(n -> n % 2 == 0);
// true

// 모두 조건을 만족하는가?
boolean allPositive = numbers.stream()
    .allMatch(n -> n > 0);
// true

// 모두 조건을 만족하지 않는가?
boolean noNegative = numbers.stream()
    .noneMatch(n -> n < 0);
// true
```

### findFirst()와 findAny() - 요소 찾기

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 첫 번째 요소
Optional<Integer> first = numbers.stream()
    .findFirst();

// 아무 요소나 (병렬 스트림에서 유용)
Optional<Integer> any = numbers.stream()
    .findAny();
```

## Collectors 활용

Collectors는 Stream의 요소를 다양한 방식으로 수집할 수 있는 유틸리티를 제공합니다.

### groupingBy() - 그룹핑

```java
List<Person> people = Arrays.asList(
    new Person("Alice", 25, "Engineering"),
    new Person("Bob", 30, "Marketing"),
    new Person("Charlie", 25, "Engineering"),
    new Person("David", 30, "Sales")
);

// 부서별로 그룹핑
Map<String, List<Person>> byDept = people.stream()
    .collect(Collectors.groupingBy(Person::getDepartment));

// 나이별로 그룹핑하고 개수 세기
Map<Integer, Long> ageCount = people.stream()
    .collect(Collectors.groupingBy(
        Person::getAge,
        Collectors.counting()
    ));

// 부서별 평균 나이
Map<String, Double> avgAgeByDept = people.stream()
    .collect(Collectors.groupingBy(
        Person::getDepartment,
        Collectors.averagingInt(Person::getAge)
    ));
```

### partitioningBy() - 조건으로 분할

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// 짝수와 홀수로 분할
Map<Boolean, List<Integer>> partitioned = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
// {false=[1, 3, 5, 7, 9], true=[2, 4, 6, 8, 10]}
```

### joining() - 문자열 결합

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// 단순 결합
String joined = names.stream()
    .collect(Collectors.joining());
// "AliceBobCharlie"

// 구분자 사용
String withComma = names.stream()
    .collect(Collectors.joining(", "));
// "Alice, Bob, Charlie"

// 접두사, 구분자, 접미사
String formatted = names.stream()
    .collect(Collectors.joining(", ", "[", "]"));
// "[Alice, Bob, Charlie]"
```

### summarizingInt/Long/Double() - 통계

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

IntSummaryStatistics stats = numbers.stream()
    .collect(Collectors.summarizingInt(Integer::intValue));

System.out.println("Count: " + stats.getCount());
System.out.println("Sum: " + stats.getSum());
System.out.println("Min: " + stats.getMin());
System.out.println("Max: " + stats.getMax());
System.out.println("Average: " + stats.getAverage());
```

## 병렬 스트림 (Parallel Stream)

병렬 스트림을 사용하면 멀티코어 환경에서 데이터를 병렬로 처리할 수 있습니다.

```java
List<Integer> numbers = IntStream.rangeClosed(1, 1000000)
    .boxed()
    .collect(Collectors.toList());

// 순차 스트림
long sequentialSum = numbers.stream()
    .mapToInt(Integer::intValue)
    .sum();

// 병렬 스트림
long parallelSum = numbers.parallelStream()
    .mapToInt(Integer::intValue)
    .sum();

// 순차를 병렬로 전환
Stream<Integer> parallelStream = numbers.stream().parallel();

// 병렬을 순차로 전환
Stream<Integer> sequentialStream = numbers.parallelStream().sequential();
```

### 병렬 스트림 사용 시 주의사항

1. **상태가 없는 연산 사용**: 병렬 처리 시 스레드 안전성을 보장해야 합니다.

```java
// 나쁜 예: 외부 변수 사용 (스레드 안전하지 않음)
List<Integer> results = new ArrayList<>();
IntStream.range(1, 100).parallel()
    .forEach(results::add); // 경쟁 조건 발생

// 좋은 예: collect 사용
List<Integer> results = IntStream.range(1, 100)
    .parallel()
    .boxed()
    .collect(Collectors.toList());
```

2. **작은 데이터셋에는 비효율적**: 오버헤드가 이익보다 클 수 있습니다.

3. **순서가 중요한 경우**: forEachOrdered() 사용

## Optional과 함께 사용

Stream과 Optional을 함께 사용하면 null 안전한 코드를 작성할 수 있습니다.

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// 이름 찾기
Optional<String> found = names.stream()
    .filter(name -> name.startsWith("B"))
    .findFirst();

found.ifPresent(System.out::println); // "Bob"

// 기본값 제공
String result = names.stream()
    .filter(name -> name.startsWith("Z"))
    .findFirst()
    .orElse("Not Found");

// 예외 던지기
String result2 = names.stream()
    .filter(name -> name.startsWith("Z"))
    .findFirst()
    .orElseThrow(() -> new NoSuchElementException("Name not found"));

// Optional 스트림 (Java 9+)
List<Optional<String>> optionals = Arrays.asList(
    Optional.of("Alice"),
    Optional.empty(),
    Optional.of("Bob")
);

List<String> values = optionals.stream()
    .flatMap(Optional::stream)
    .collect(Collectors.toList());
// [Alice, Bob]
```

## 실전 예제

### 데이터 변환 예제

```java
// 주문 데이터를 통계로 변환
class Order {
    private String product;
    private int quantity;
    private double price;
    // constructor, getters
}

List<Order> orders = Arrays.asList(
    new Order("Laptop", 2, 1200.0),
    new Order("Mouse", 5, 25.0),
    new Order("Keyboard", 3, 75.0),
    new Order("Monitor", 2, 300.0)
);

// 제품별 총 매출
Map<String, Double> revenueByProduct = orders.stream()
    .collect(Collectors.groupingBy(
        Order::getProduct,
        Collectors.summingDouble(o -> o.getQuantity() * o.getPrice())
    ));

// 총 매출
double totalRevenue = orders.stream()
    .mapToDouble(o -> o.getQuantity() * o.getPrice())
    .sum();

// 가장 많이 팔린 제품
Optional<String> topProduct = orders.stream()
    .collect(Collectors.groupingBy(
        Order::getProduct,
        Collectors.summingInt(Order::getQuantity)
    ))
    .entrySet().stream()
    .max(Map.Entry.comparingByValue())
    .map(Map.Entry::getKey);
```

### 복잡한 필터링과 변환

```java
class Employee {
    private String name;
    private String department;
    private int age;
    private double salary;
    // constructor, getters
}

List<Employee> employees = Arrays.asList(
    new Employee("Alice", "Engineering", 28, 75000),
    new Employee("Bob", "Marketing", 35, 65000),
    new Employee("Charlie", "Engineering", 32, 80000),
    new Employee("David", "Sales", 29, 60000),
    new Employee("Eve", "Engineering", 26, 70000)
);

// Engineering 부서에서 급여가 70000 이상인 직원의 이름을 나이순으로
List<String> seniorEngineers = employees.stream()
    .filter(e -> e.getDepartment().equals("Engineering"))
    .filter(e -> e.getSalary() >= 70000)
    .sorted(Comparator.comparing(Employee::getAge).reversed())
    .map(Employee::getName)
    .collect(Collectors.toList());

// 부서별 평균 급여
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.averagingDouble(Employee::getSalary)
    ));

// 30세 미만 직원들을 부서별로 그룹핑
Map<String, List<Employee>> youngByDept = employees.stream()
    .filter(e -> e.getAge() < 30)
    .collect(Collectors.groupingBy(Employee::getDepartment));
```

### 데이터 집계 예제

```java
// 텍스트 분석
String text = "Java Stream API is a powerful tool for processing collections. " +
              "Stream makes data processing efficient and readable.";

// 단어별 빈도수
Map<String, Long> wordFrequency = Arrays.stream(text.toLowerCase().split("\\s+"))
    .collect(Collectors.groupingBy(
        word -> word.replaceAll("[^a-z]", ""),
        Collectors.counting()
    ));

// 가장 자주 나오는 단어
Optional<Map.Entry<String, Long>> mostFrequent = wordFrequency.entrySet().stream()
    .max(Map.Entry.comparingByValue());

// 길이가 5 이상인 단어들을 알파벳 순으로
List<String> longWords = Arrays.stream(text.split("\\s+"))
    .map(word -> word.replaceAll("[^a-zA-Z]", ""))
    .filter(word -> word.length() >= 5)
    .map(String::toLowerCase)
    .distinct()
    .sorted()
    .collect(Collectors.toList());
```

## 성능 최적화 팁

1. **적절한 Stream 타입 사용**: IntStream, LongStream, DoubleStream을 사용하면 박싱/언박싱 오버헤드를 피할 수 있습니다.

```java
// 비효율적
int sum = numbers.stream()
    .mapToInt(Integer::intValue)
    .sum();

// 효율적
int sum = numbers.stream()
    .mapToInt(i -> i)
    .sum();

// 더 효율적 (직접 IntStream 사용)
IntStream.range(1, 100)
    .sum();
```

2. **Short-circuit 연산 활용**: anyMatch, allMatch, findFirst 등은 조건을 만족하면 즉시 종료됩니다.

```java
boolean hasLargeSalary = employees.stream()
    .anyMatch(e -> e.getSalary() > 100000); // 조건 만족 시 즉시 종료
```

3. **적절한 순서로 연산 배치**: 데이터를 먼저 줄이는 연산을 앞에 배치합니다.

```java
// 비효율적: map 후 filter
list.stream()
    .map(expensiveOperation)
    .filter(condition)
    .collect(Collectors.toList());

// 효율적: filter 후 map
list.stream()
    .filter(condition)
    .map(expensiveOperation)
    .collect(Collectors.toList());
```

## 결론

Java Stream API는 컬렉션 데이터를 함수형 스타일로 처리할 수 있는 강력한 도구입니다. 선언적이고 읽기 쉬운 코드를 작성할 수 있으며, 병렬 처리를 통해 성능을 향상시킬 수 있습니다.

핵심 포인트:
- Stream은 원본 데이터를 변경하지 않습니다
- 중간 연산은 지연 평가되며 최종 연산에서 실행됩니다
- 병렬 스트림으로 멀티코어 활용이 가능합니다
- Collectors를 활용하면 복잡한 데이터 변환과 집계가 쉬워집니다
- Optional과 함께 사용하면 null 안전한 코드를 작성할 수 있습니다

Stream API를 효과적으로 활용하면 더 간결하고 유지보수하기 쉬운 코드를 작성할 수 있습니다. 다만, 모든 상황에서 Stream이 최선은 아니므로, 코드의 가독성과 성능을 고려하여 적절히 사용하는 것이 중요합니다.
