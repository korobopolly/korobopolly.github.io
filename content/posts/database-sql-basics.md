---
title: "SQL 기초와 데이터 모델링 - 관계형 데이터베이스 입문"
date: 2026-02-16T13:20:00+09:00
draft: false
tags: ["SQL", "Database", "데이터모델링", "백엔드"]
categories: ["Database"]
series: "Database"
description: "SQL 기본 문법과 관계형 데이터베이스 설계의 핵심 개념을 알아봅니다"
---

## 관계형 데이터베이스 개념

관계형 데이터베이스(RDBMS)는 데이터를 **테이블** 형태로 저장하고 관리합니다.

### 핵심 용어

- **테이블(Table)**: 데이터를 저장하는 구조 (엑셀의 시트와 유사)
- **행(Row)**: 하나의 레코드 (데이터 항목)
- **열(Column)**: 속성 또는 필드
- **기본키(Primary Key)**: 각 행을 고유하게 식별하는 열 (중복 불가, NULL 불가)
- **외래키(Foreign Key)**: 다른 테이블의 기본키를 참조하는 열

```sql
-- 예시: users 테이블
-- id (기본키), name, email, created_at (열)
-- 각 행은 한 명의 사용자 데이터
```

---

## DDL (Data Definition Language)

테이블 구조를 정의하는 명령어입니다.

### CREATE TABLE - 테이블 생성

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 주요 데이터 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `INT` | 정수 | 1, 100, -50 |
| `VARCHAR(n)` | 가변 길이 문자열 | 'hello', '안녕하세요' |
| `TEXT` | 긴 텍스트 | 게시글 본문 |
| `DECIMAL(p,s)` | 고정 소수점 | 19.99 (p=전체자리, s=소수자리) |
| `DATE` | 날짜 | '2026-02-16' |
| `TIMESTAMP` | 날짜+시간 | '2026-02-16 13:20:00' |
| `BOOLEAN` | 참/거짓 | TRUE, FALSE |

### ALTER TABLE - 테이블 수정

```sql
-- 열 추가
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- 열 삭제
ALTER TABLE users DROP COLUMN age;

-- 열 타입 변경
ALTER TABLE users MODIFY COLUMN name VARCHAR(150);
```

### DROP TABLE - 테이블 삭제

```sql
DROP TABLE users; -- 테이블과 모든 데이터 삭제 (주의!)
```

---

## DML (Data Manipulation Language)

데이터를 조작하는 명령어입니다.

### INSERT - 데이터 삽입

```sql
-- 단일 행 삽입
INSERT INTO users (name, email, age)
VALUES ('김철수', 'kim@example.com', 28);

-- 여러 행 삽입
INSERT INTO users (name, email, age)
VALUES
    ('이영희', 'lee@example.com', 32),
    ('박민수', 'park@example.com', 25);
```

### SELECT - 데이터 조회

```sql
-- 모든 열 조회
SELECT * FROM users;

-- 특정 열만 조회
SELECT name, email FROM users;

-- 중복 제거
SELECT DISTINCT age FROM users;

-- 별칭(alias) 사용
SELECT name AS 이름, email AS 이메일 FROM users;
```

### UPDATE - 데이터 수정

```sql
-- 특정 행 수정
UPDATE users
SET age = 29
WHERE name = '김철수';

-- 여러 열 동시 수정
UPDATE users
SET age = 30, email = 'newkim@example.com'
WHERE id = 1;
```

### DELETE - 데이터 삭제

```sql
-- 조건에 맞는 행 삭제
DELETE FROM users WHERE age < 20;

-- 모든 행 삭제 (테이블 구조는 유지)
DELETE FROM users;
```

---

## WHERE 조건절

데이터 필터링에 사용합니다.

### 기본 연산자

```sql
-- 비교 연산자
SELECT * FROM users WHERE age = 28;
SELECT * FROM users WHERE age > 25;
SELECT * FROM users WHERE age <= 30;
SELECT * FROM users WHERE age != 28;

-- 논리 연산자
SELECT * FROM users WHERE age > 20 AND age < 40;
SELECT * FROM users WHERE name = '김철수' OR name = '이영희';
SELECT * FROM users WHERE NOT age = 28;
```

### LIKE - 패턴 매칭

```sql
-- 이름이 '김'으로 시작
SELECT * FROM users WHERE name LIKE '김%';

-- 이메일에 'gmail'이 포함
SELECT * FROM users WHERE email LIKE '%gmail%';

-- 이름이 '수'로 끝남
SELECT * FROM users WHERE name LIKE '%수';

-- 두 번째 글자가 '영'
SELECT * FROM users WHERE name LIKE '_영%';
```

### IN - 여러 값 중 하나와 일치

```sql
SELECT * FROM users WHERE age IN (25, 28, 32);

-- NOT IN
SELECT * FROM users WHERE age NOT IN (25, 28);
```

### BETWEEN - 범위 조건

```sql
SELECT * FROM users WHERE age BETWEEN 20 AND 30; -- 20 이상 30 이하

SELECT * FROM users WHERE created_at BETWEEN '2025-01-01' AND '2025-12-31';
```

### IS NULL - NULL 값 확인

```sql
SELECT * FROM users WHERE phone IS NULL;

SELECT * FROM users WHERE phone IS NOT NULL;
```

---

## JOIN - 테이블 결합

여러 테이블의 데이터를 연결하여 조회합니다.

### 테스트 데이터 준비

```sql
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

INSERT INTO departments VALUES (1, '개발팀'), (2, '디자인팀');
INSERT INTO employees VALUES
    (1, '김철수', 1),
    (2, '이영희', 1),
    (3, '박민수', 2),
    (4, '최지연', NULL);
```

### INNER JOIN

**양쪽 테이블에 모두 존재하는 데이터만 조회**

```sql
SELECT e.name AS 직원명, d.name AS 부서명
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- 결과:
-- 김철수 | 개발팀
-- 이영희 | 개발팀
-- 박민수 | 디자인팀
-- (최지연은 부서가 NULL이므로 제외)
```

### LEFT JOIN (LEFT OUTER JOIN)

**왼쪽 테이블의 모든 데이터 + 오른쪽 테이블의 매칭되는 데이터**

```sql
SELECT e.name AS 직원명, d.name AS 부서명
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- 결과:
-- 김철수 | 개발팀
-- 이영희 | 개발팀
-- 박민수 | 디자인팀
-- 최지연 | NULL (부서 없는 직원도 포함)
```

### RIGHT JOIN (RIGHT OUTER JOIN)

**오른쪽 테이블의 모든 데이터 + 왼쪽 테이블의 매칭되는 데이터**

```sql
SELECT e.name AS 직원명, d.name AS 부서명
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;

-- 직원이 없는 부서도 포함됨
```

### FULL OUTER JOIN

**양쪽 테이블의 모든 데이터** (MySQL은 미지원, UNION으로 구현)

```sql
-- MySQL에서는 UNION 사용
SELECT e.name, d.name
FROM employees e LEFT JOIN departments d ON e.department_id = d.id
UNION
SELECT e.name, d.name
FROM employees e RIGHT JOIN departments d ON e.department_id = d.id;
```

### JOIN 다이어그램

```
INNER JOIN: [A ∩ B]
LEFT JOIN:  [A + (A ∩ B)]
RIGHT JOIN: [(A ∩ B) + B]
FULL OUTER: [A + B]
```

---

## 집계와 그룹화

### 집계 함수

```sql
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2),
    category VARCHAR(50),
    stock INT
);

INSERT INTO products VALUES
    (1, '노트북', 1200000, '전자제품', 10),
    (2, '마우스', 25000, '전자제품', 50),
    (3, '책상', 150000, '가구', 5),
    (4, '의자', 80000, '가구', 8);
```

```sql
-- 총 개수
SELECT COUNT(*) AS 총상품수 FROM products;

-- NULL이 아닌 값만 카운트
SELECT COUNT(stock) FROM products;

-- 합계
SELECT SUM(stock) AS 총재고 FROM products;

-- 평균
SELECT AVG(price) AS 평균가격 FROM products;

-- 최대/최소
SELECT MAX(price) AS 최고가, MIN(price) AS 최저가 FROM products;
```

### GROUP BY - 그룹별 집계

```sql
-- 카테고리별 상품 수
SELECT category, COUNT(*) AS 상품수
FROM products
GROUP BY category;

-- 결과:
-- 전자제품 | 2
-- 가구     | 2

-- 카테고리별 평균 가격
SELECT category, AVG(price) AS 평균가격, SUM(stock) AS 총재고
FROM products
GROUP BY category;
```

### HAVING - 그룹 필터링

```sql
-- WHERE: 그룹화 전 필터링
-- HAVING: 그룹화 후 필터링

-- 평균 가격이 100,000원 이상인 카테고리
SELECT category, AVG(price) AS 평균가격
FROM products
GROUP BY category
HAVING AVG(price) >= 100000;
```

### ORDER BY - 정렬

```sql
-- 오름차순 (기본)
SELECT * FROM products ORDER BY price;

-- 내림차순
SELECT * FROM products ORDER BY price DESC;

-- 여러 열 정렬
SELECT * FROM products
ORDER BY category ASC, price DESC;
```

---

## 서브쿼리

쿼리 안에 또 다른 쿼리를 포함합니다.

### 스칼라 서브쿼리 (단일 값 반환)

```sql
-- 평균 가격보다 비싼 상품
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products);
```

### 인라인 뷰 (FROM절 서브쿼리)

```sql
-- 카테고리별 평균 가격을 먼저 구한 뒤, 그 결과를 조회
SELECT category, 평균가격
FROM (
    SELECT category, AVG(price) AS 평균가격
    FROM products
    GROUP BY category
) AS category_avg
WHERE 평균가격 > 100000;
```

### WHERE절 서브쿼리

```sql
-- IN 사용
SELECT name FROM products
WHERE category IN (
    SELECT category FROM products WHERE price > 100000
);

-- EXISTS 사용 (존재 여부 확인)
SELECT name FROM products p
WHERE EXISTS (
    SELECT 1 FROM products WHERE category = p.category AND price > 500000
);
```

---

## 데이터 모델링 기초

### 정규화 (Normalization)

데이터 중복을 제거하고 무결성을 높이는 과정입니다.

#### 1NF (제1정규형)

**모든 속성이 원자값(Atomic Value)을 가져야 함**

```sql
-- 위반 예시
CREATE TABLE orders (
    id INT,
    customer VARCHAR(50),
    products VARCHAR(255) -- '사과, 바나나, 오렌지' (여러 값 저장)
);

-- 1NF 준수
CREATE TABLE order_items (
    order_id INT,
    product VARCHAR(50) -- 각 행에 하나의 상품만
);
```

#### 2NF (제2정규형)

**1NF를 만족하고, 부분 함수 종속 제거**

기본키가 복합키일 때, 기본키 일부에만 종속되는 컬럼이 있으면 안 됨.

```sql
-- 위반 예시 (order_id + product_id가 복합 기본키)
CREATE TABLE order_details (
    order_id INT,
    product_id INT,
    customer_name VARCHAR(50), -- order_id에만 종속 (문제!)
    product_name VARCHAR(50),  -- product_id에만 종속 (문제!)
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- 2NF 준수: 테이블 분리
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_name VARCHAR(50)
);

CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(50)
);
```

#### 3NF (제3정규형)

**2NF를 만족하고, 이행 함수 종속 제거**

기본키가 아닌 컬럼이 다른 일반 컬럼을 결정하면 안 됨.

```sql
-- 위반 예시
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department_id INT,
    department_name VARCHAR(50) -- department_id에 종속 (문제!)
);

-- 3NF 준수: department_name 분리
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department_id INT
);

CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(50)
);
```

### ERD (Entity Relationship Diagram)

**테이블 간 관계를 시각화한 도표**

- **1:1 관계**: 사용자 - 프로필
- **1:N 관계**: 부서 - 직원
- **N:M 관계**: 학생 - 수업 (중간 테이블 필요)

---

## 실전 예제: 쇼핑몰 DB 설계

### 요구사항

- 사용자가 상품을 주문할 수 있음
- 한 주문에 여러 상품이 포함될 수 있음
- 각 상품의 수량과 가격을 기록

### ERD 설계

```
users (1) ─── (N) orders (1) ─── (N) order_items (N) ─── (1) products
```

### 테이블 생성

```sql
-- 1. 사용자 테이블
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 상품 테이블
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 주문 테이블
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 주문 상세 테이블 (N:M 관계 해소)
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL, -- 주문 당시 가격 기록
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 샘플 데이터 삽입

```sql
-- 사용자 생성
INSERT INTO users (name, email, password) VALUES
    ('김철수', 'kim@example.com', 'hashed_pw_1'),
    ('이영희', 'lee@example.com', 'hashed_pw_2');

-- 상품 생성
INSERT INTO products (name, description, price, stock) VALUES
    ('무선 키보드', '블루투스 지원', 45000, 20),
    ('게이밍 마우스', 'RGB LED', 65000, 15),
    ('모니터 암', '듀얼 모니터 지원', 89000, 10);

-- 주문 생성
INSERT INTO orders (user_id, total_amount, status) VALUES
    (1, 110000, 'completed');

-- 주문 상세 (김철수가 키보드 1개, 마우스 1개 구매)
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
    (1, 1, 1, 45000),
    (1, 2, 1, 65000);
```

### 실용 쿼리

```sql
-- 1. 사용자별 총 주문 금액
SELECT u.name, SUM(o.total_amount) AS 총구매액
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name;

-- 2. 가장 많이 팔린 상품 TOP 3
SELECT p.name, SUM(oi.quantity) AS 판매량
FROM products p
JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY 판매량 DESC
LIMIT 3;

-- 3. 특정 주문의 상세 내역
SELECT o.id AS 주문번호,
       u.name AS 고객명,
       p.name AS 상품명,
       oi.quantity AS 수량,
       oi.price AS 단가,
       (oi.quantity * oi.price) AS 소계
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.id = 1;

-- 4. 재고가 10개 이하인 상품 알림
SELECT name, stock
FROM products
WHERE stock <= 10
ORDER BY stock ASC;

-- 5. 최근 30일간 주문이 없는 사용자
SELECT u.name, u.email
FROM users u
WHERE u.id NOT IN (
    SELECT DISTINCT user_id
    FROM orders
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
);
```

---

## 정리

### SQL 학습 로드맵

1. **기본 CRUD** → SELECT, INSERT, UPDATE, DELETE
2. **조건과 정렬** → WHERE, ORDER BY, LIMIT
3. **집계와 그룹화** → GROUP BY, HAVING, 집계 함수
4. **조인** → INNER JOIN, LEFT JOIN
5. **서브쿼리** → WHERE절, FROM절 서브쿼리
6. **데이터 모델링** → 정규화, ERD 설계
7. **실전 DB 설계** → 요구사항 분석 → 테이블 설계 → 쿼리 작성

### 추가 학습 주제

- 인덱스(Index)와 쿼리 최적화
- 트랜잭션(Transaction)과 ACID
- 뷰(View), 프로시저(Procedure), 트리거(Trigger)
- NoSQL과의 차이점

SQL은 백엔드 개발의 필수 기술입니다. 직접 데이터베이스를 설계하고 쿼리를 작성하며 익숙해지세요!
