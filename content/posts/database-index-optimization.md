---
title: "인덱스와 쿼리 최적화 - 데이터베이스 성능 튜닝"
date: 2026-02-16T13:21:00+09:00
draft: false
tags: ["SQL", "Database", "인덱스", "성능최적화"]
categories: ["Database"]
series: "Database"
description: "인덱스의 원리를 이해하고 쿼리 성능을 최적화하는 방법을 배웁니다"
---

데이터베이스의 성능을 좌우하는 가장 중요한 요소 중 하나가 바로 **인덱스**입니다. 이 글에서는 인덱스의 동작 원리부터 실전 최적화 기법까지 단계별로 알아봅니다.

## 1. 인덱스란?

인덱스는 데이터베이스 테이블의 **검색 속도를 높이기 위한 자료구조**입니다. 책의 색인(index)처럼 특정 데이터를 빠르게 찾을 수 있도록 도와줍니다.

### B-Tree 구조

대부분의 RDBMS는 B-Tree(Balanced Tree) 구조를 사용합니다.

```
        [50]
       /    \
    [25]    [75]
   /   \    /   \
[10] [30] [60] [90]
```

**B-Tree의 특징:**
- 균형 잡힌 트리 구조로 탐색 시간이 O(log N)
- 루트 노드에서 시작해 리프 노드까지 탐색
- 데이터가 정렬된 상태로 유지됨

**왜 빠른가?**

```sql
-- 인덱스 없을 때 (Full Table Scan)
-- 100만 건 중 1건 찾기: 100만 번 비교

-- 인덱스 있을 때 (Index Scan)
-- B-Tree 깊이가 4라면: 4번만 비교
```

인덱스는 **전체 스캔을 피하고 필요한 데이터만 빠르게 찾을 수 있게** 해줍니다.

## 2. 인덱스 종류

### 단일 인덱스 (Single Column Index)

하나의 컬럼에 대한 인덱스입니다.

```sql
CREATE INDEX idx_user_email ON users(email);
```

### 복합 인덱스 (Composite Index)

여러 컬럼을 조합한 인덱스입니다. **컬럼 순서가 중요합니다.**

```sql
CREATE INDEX idx_user_name_age ON users(name, age);

-- 사용됨
SELECT * FROM users WHERE name = '홍길동' AND age = 30;
SELECT * FROM users WHERE name = '홍길동';  -- 첫 번째 컬럼만 사용

-- 사용 안됨 (첫 번째 컬럼이 WHERE에 없음)
SELECT * FROM users WHERE age = 30;
```

**복합 인덱스 규칙:**
- 왼쪽부터 순서대로 사용됨 (Leftmost Prefix Rule)
- 등호(=) 조건이 많은 컬럼을 앞에 배치
- 범위 조건(>, <, BETWEEN) 컬럼은 뒤에 배치

### 유니크 인덱스 (Unique Index)

중복을 허용하지 않는 인덱스입니다.

```sql
CREATE UNIQUE INDEX idx_user_email ON users(email);

-- PK는 자동으로 유니크 인덱스 생성됨
```

### 커버링 인덱스 (Covering Index)

쿼리에 필요한 모든 컬럼을 인덱스가 포함하여 **테이블 접근 없이** 결과를 반환합니다.

```sql
-- 인덱스: (name, age, email)
SELECT name, age, email
FROM users
WHERE name = '홍길동';

-- 인덱스만으로 모든 데이터 조회 가능 (Using index)
```

## 3. 인덱스 생성/삭제

### 인덱스 생성

```sql
-- 기본 인덱스
CREATE INDEX idx_name ON users(name);

-- 복합 인덱스
CREATE INDEX idx_name_age ON users(name, age);

-- 유니크 인덱스
CREATE UNIQUE INDEX idx_email ON users(email);

-- 내림차순 인덱스
CREATE INDEX idx_created_desc ON posts(created_at DESC);
```

### 인덱스 조회

```sql
-- MySQL
SHOW INDEX FROM users;

-- PostgreSQL
\d users
```

### 인덱스 삭제

```sql
DROP INDEX idx_name ON users;  -- MySQL
DROP INDEX idx_name;            -- PostgreSQL
```

## 4. EXPLAIN - 실행 계획 읽는 법

실행 계획을 확인하여 쿼리가 인덱스를 제대로 사용하는지 확인합니다.

```sql
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
```

### MySQL 실행 계획 주요 항목

```
+----+-------------+-------+------+---------------+------+---------+-------+------+-------+
| id | select_type | table | type | possible_keys | key  | key_len | ref   | rows | Extra |
+----+-------------+-------+------+---------------+------+---------+-------+------+-------+
```

**type (접근 방법) - 중요도 순:**

| type   | 설명                           | 성능 |
|--------|--------------------------------|------|
| const  | PK 또는 Unique 인덱스로 단건 조회 | ⭐⭐⭐⭐⭐ |
| eq_ref | JOIN 시 PK/Unique로 접근       | ⭐⭐⭐⭐⭐ |
| ref    | 일반 인덱스로 여러 건 조회      | ⭐⭐⭐⭐ |
| range  | 범위 조건 (BETWEEN, >, <)      | ⭐⭐⭐ |
| index  | 인덱스 풀 스캔                 | ⭐⭐ |
| ALL    | 테이블 풀 스캔                 | ⭐ |

**Extra 항목:**

```sql
-- 좋은 케이스
Using index       -- 커버링 인덱스 사용
Using where       -- WHERE 조건 필터링

-- 나쁜 케이스
Using filesort    -- 별도 정렬 작업 발생
Using temporary   -- 임시 테이블 생성
```

### 실습 예제

```sql
-- 테스트 데이터
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT,
  status VARCHAR(20),
  created_at DATETIME
);

-- 인덱스 없을 때
EXPLAIN SELECT * FROM orders WHERE user_id = 100;
-- type: ALL (테이블 풀 스캔)

-- 인덱스 생성
CREATE INDEX idx_user_id ON orders(user_id);

-- 인덱스 있을 때
EXPLAIN SELECT * FROM orders WHERE user_id = 100;
-- type: ref (인덱스 사용)
```

## 5. 인덱스가 동작하지 않는 경우

인덱스를 만들어도 아래 경우엔 사용되지 않습니다.

### 1) 컬럼에 함수 적용

```sql
-- ❌ 인덱스 사용 안됨
SELECT * FROM users WHERE YEAR(created_at) = 2024;
SELECT * FROM users WHERE UPPER(name) = 'HONG';

-- ✅ 인덱스 사용됨
SELECT * FROM users
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';

SELECT * FROM users WHERE name = 'Hong';  -- 대소문자 구분 설정 확인
```

### 2) 타입 변환

```sql
-- user_id는 INT 타입
-- ❌ 문자열로 비교 (타입 변환 발생)
SELECT * FROM users WHERE user_id = '100';

-- ✅ 동일한 타입으로 비교
SELECT * FROM users WHERE user_id = 100;
```

### 3) LIKE 앞에 와일드카드

```sql
-- ❌ 인덱스 사용 안됨
SELECT * FROM users WHERE name LIKE '%홍길동';
SELECT * FROM users WHERE name LIKE '%홍%';

-- ✅ 인덱스 사용됨
SELECT * FROM users WHERE name LIKE '홍길동%';
```

### 4) OR 조건

```sql
-- ❌ 인덱스 사용 제한적
SELECT * FROM users WHERE name = '홍길동' OR age = 30;

-- ✅ UNION 사용 (각각 인덱스 활용)
SELECT * FROM users WHERE name = '홍길동'
UNION
SELECT * FROM users WHERE age = 30;
```

### 5) 복합 인덱스 순서 위반

```sql
-- 인덱스: (name, age, city)

-- ✅ 사용됨
SELECT * FROM users WHERE name = '홍길동';
SELECT * FROM users WHERE name = '홍길동' AND age = 30;

-- ❌ 사용 안됨 (첫 번째 컬럼 없음)
SELECT * FROM users WHERE age = 30;
SELECT * FROM users WHERE city = '서울';
```

## 6. 쿼리 최적화 기법

### 1) SELECT * 지양

```sql
-- ❌ 불필요한 데이터까지 조회
SELECT * FROM users WHERE id = 1;

-- ✅ 필요한 컬럼만 조회
SELECT id, name, email FROM users WHERE id = 1;
```

**이유:**
- 네트워크 트래픽 감소
- 메모리 사용량 감소
- 커버링 인덱스 활용 가능

### 2) 적절한 JOIN

```sql
-- INNER JOIN: 양쪽 테이블에 모두 존재하는 데이터
SELECT u.name, o.order_date
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN: 왼쪽 테이블 기준, 오른쪽은 NULL 허용
SELECT u.name, o.order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;
```

**최적화 팁:**
- JOIN 컬럼에 인덱스 생성
- 작은 테이블을 먼저 조인 (Driving Table)
- WHERE 조건으로 먼저 필터링 후 JOIN

### 3) 페이징 최적화

#### OFFSET 방식 (전통적)

```sql
-- 1페이지 (빠름)
SELECT * FROM posts ORDER BY id DESC LIMIT 10 OFFSET 0;

-- 1000페이지 (느림 - 10000건을 읽고 버림)
SELECT * FROM posts ORDER BY id DESC LIMIT 10 OFFSET 10000;
```

**문제점:** OFFSET이 클수록 읽어야 할 데이터가 많아져 느려짐

#### Cursor 방식 (최적화)

```sql
-- 첫 페이지
SELECT * FROM posts ORDER BY id DESC LIMIT 10;

-- 다음 페이지 (마지막 id = 100)
SELECT * FROM posts
WHERE id < 100
ORDER BY id DESC
LIMIT 10;
```

**장점:**
- 항상 일정한 성능
- 인덱스 스캔만으로 처리 가능

## 7. N+1 문제와 해결법

### N+1 문제란?

```sql
-- 1. 사용자 목록 조회 (1번 쿼리)
SELECT * FROM users LIMIT 10;

-- 2. 각 사용자의 주문 조회 (N번 쿼리)
-- user_id = 1
SELECT * FROM orders WHERE user_id = 1;
-- user_id = 2
SELECT * FROM orders WHERE user_id = 2;
-- ... (10번 반복)

-- 총 11번의 쿼리 발생
```

### 해결법 1: JOIN 사용

```sql
-- 1번의 쿼리로 해결
SELECT u.*, o.*
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.id IN (1, 2, 3, ..., 10);
```

### 해결법 2: IN 절 사용

```sql
-- 1. 사용자 목록 조회
SELECT * FROM users LIMIT 10;  -- id: 1, 2, 3, ..., 10

-- 2. 해당 사용자들의 주문 일괄 조회
SELECT * FROM orders WHERE user_id IN (1, 2, 3, ..., 10);

-- 총 2번의 쿼리
```

### JPA/Hibernate 최적화

```java
// ❌ N+1 발생
@Entity
public class User {
    @OneToMany(mappedBy = "user")
    private List<Order> orders;
}

// ✅ Fetch Join
@Query("SELECT u FROM User u JOIN FETCH u.orders")
List<User> findAllWithOrders();

// ✅ Batch Size 설정
@BatchSize(size = 10)
@OneToMany(mappedBy = "user")
private List<Order> orders;
```

## 8. 트랜잭션과 격리 수준

### 격리 수준 (Isolation Level)

격리 수준은 동시에 실행되는 트랜잭션 간 데이터 일관성을 제어합니다.

| 격리 수준          | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------------------|------------|---------------------|--------------|
| READ UNCOMMITTED  | 발생       | 발생                | 발생         |
| READ COMMITTED    | 방지       | 발생                | 발생         |
| REPEATABLE READ   | 방지       | 방지                | 발생         |
| SERIALIZABLE      | 방지       | 방지                | 방지         |

### 1) READ UNCOMMITTED

커밋되지 않은 데이터를 읽을 수 있습니다 (거의 사용 안 함).

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- Transaction A: UPDATE 후 커밋 전
UPDATE users SET balance = 1000 WHERE id = 1;

-- Transaction B: 커밋 안 된 데이터 읽음 (Dirty Read)
SELECT balance FROM users WHERE id = 1;  -- 1000
```

### 2) READ COMMITTED (MySQL InnoDB 기본)

커밋된 데이터만 읽습니다.

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

START TRANSACTION;
SELECT balance FROM users WHERE id = 1;  -- 500

-- 다른 트랜잭션에서 UPDATE & COMMIT
-- UPDATE users SET balance = 1000 WHERE id = 1; COMMIT;

SELECT balance FROM users WHERE id = 1;  -- 1000 (변경됨)
COMMIT;
```

**Non-Repeatable Read 발생:** 같은 트랜잭션 내에서 같은 데이터를 두 번 읽었을 때 값이 다름

### 3) REPEATABLE READ (MySQL 기본)

트랜잭션 시작 시점의 스냅샷을 읽습니다.

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

START TRANSACTION;
SELECT balance FROM users WHERE id = 1;  -- 500

-- 다른 트랜잭션에서 UPDATE & COMMIT
-- UPDATE users SET balance = 1000 WHERE id = 1; COMMIT;

SELECT balance FROM users WHERE id = 1;  -- 500 (일관성 유지)
COMMIT;
```

### 4) SERIALIZABLE

가장 엄격한 격리 수준. 모든 SELECT에 Lock이 걸립니다.

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

START TRANSACTION;
SELECT * FROM users WHERE age BETWEEN 20 AND 30;

-- 다른 트랜잭션에서 INSERT 시도 (대기)
-- INSERT INTO users (age) VALUES (25);  -- 블로킹됨
```

### 격리 수준 선택 기준

```sql
-- 실시간 집계/통계 (속도 중요)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 일반 서비스 (기본값 사용)
-- MySQL: REPEATABLE READ
-- PostgreSQL: READ COMMITTED

-- 금융 거래 (정확성 중요)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

## 9. 실전 최적화 사례

### 문제 상황

사용자 주문 목록 조회가 5초 이상 걸립니다.

```sql
-- 초기 쿼리 (5초 소요)
SELECT
    o.*,
    u.name,
    u.email,
    p.name as product_name,
    p.price
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 20;
```

### 1단계: 실행 계획 확인

```sql
EXPLAIN 위의 쿼리;

-- 결과:
-- orders: type=ALL (Full Table Scan)
-- users: type=ALL
-- order_items: type=ALL
-- products: type=ALL
```

**문제:** 모든 테이블이 풀 스캔

### 2단계: 인덱스 추가

```sql
-- orders 테이블
CREATE INDEX idx_orders_created ON orders(created_at);

-- JOIN 컬럼들
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

**결과:** 5초 → 2초

### 3단계: 불필요한 JOIN 제거

```sql
-- 실제로 product 정보는 나중에 별도로 조회해도 됨
SELECT
    o.*,
    u.name,
    u.email
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 20;

-- 필요시 product 정보는 애플리케이션에서 조회
```

**결과:** 2초 → 0.5초

### 4단계: 커버링 인덱스 적용

```sql
-- 자주 조회하는 컬럼만 포함한 인덱스
CREATE INDEX idx_orders_covering
ON orders(created_at, user_id, id, status);

-- 쿼리 수정 (최소 컬럼만 SELECT)
SELECT
    o.id,
    o.created_at,
    o.status,
    o.user_id
FROM orders o
WHERE o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 20;

-- 사용자 정보는 IN 절로 일괄 조회
SELECT id, name, email
FROM users
WHERE id IN (/* 위에서 조회한 user_id 목록 */);
```

**결과:** 0.5초 → 0.1초

### 5단계: 페이징 최적화 (Cursor 방식)

```sql
-- 첫 페이지
SELECT
    o.id,
    o.created_at,
    o.status,
    o.user_id
FROM orders o
WHERE o.created_at >= '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 20;

-- 다음 페이지 (마지막 created_at = '2024-06-15 10:30:00')
SELECT
    o.id,
    o.created_at,
    o.status,
    o.user_id
FROM orders o
WHERE o.created_at >= '2024-01-01'
  AND o.created_at < '2024-06-15 10:30:00'
ORDER BY o.created_at DESC
LIMIT 20;
```

**최종 결과:** 5초 → 0.1초 (50배 개선)

## 최적화 체크리스트

쿼리 성능 문제가 생겼을 때 순서대로 확인하세요:

1. **EXPLAIN으로 실행 계획 확인**
   - type이 ALL인가? → 인덱스 추가
   - Extra에 filesort, temporary가 있는가? → 쿼리 개선

2. **인덱스 확인**
   - WHERE 조건 컬럼에 인덱스가 있는가?
   - JOIN 컬럼에 인덱스가 있는가?
   - 복합 인덱스 순서가 적절한가?

3. **쿼리 패턴 개선**
   - SELECT *를 사용하고 있는가?
   - 불필요한 JOIN이 있는가?
   - N+1 문제가 발생하는가?

4. **페이징 방식**
   - OFFSET이 큰가? → Cursor 방식으로 변경

5. **데이터량 확인**
   - 테이블 row 수가 너무 많은가? → 파티셔닝 고려
   - 오래된 데이터인가? → 아카이빙 고려

## 마치며

인덱스와 쿼리 최적화는 **측정 → 분석 → 개선 → 검증**의 반복입니다.

- EXPLAIN으로 현재 상태를 정확히 파악하고
- 병목 지점을 찾아 인덱스를 추가하며
- 쿼리 패턴을 개선하고
- 다시 측정하여 개선 효과를 확인하세요

성능 튜닝의 핵심은 **추측이 아닌 데이터 기반의 개선**입니다.
