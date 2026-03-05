---
title: "React 시작하기 - JSX, 컴포넌트, Props, State, 이벤트 처리"
date: 2026-02-16T13:14:00+09:00
draft: false
tags: ["React", "JavaScript", "프론트엔드", "웹개발"]
categories: ["React"]
series: "React"
description: "React의 핵심 개념인 컴포넌트, JSX, Props, State를 알아봅니다"
---

## React란?

React는 Meta(구 Facebook)에서 개발한 UI 라이브러리입니다. **컴포넌트 기반 아키텍처**로 복잡한 UI를 독립적이고 재사용 가능한 조각으로 나누어 개발할 수 있습니다.

### React의 핵심 특징

- **컴포넌트 기반**: UI를 독립적인 컴포넌트로 분리하여 관리
- **선언적 UI**: 상태에 따라 UI가 자동으로 업데이트
- **Virtual DOM**: 효율적인 렌더링으로 성능 최적화
- **단방향 데이터 흐름**: 예측 가능한 데이터 관리
- **풍부한 생태계**: Next.js, React Native 등 확장 가능

## 프로젝트 생성

### Vite로 React 프로젝트 생성

```bash
# Vite로 React + TypeScript 프로젝트 생성
npm create vite@latest my-react-app -- --template react-ts

# 프로젝트 디렉토리로 이동
cd my-react-app

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 프로젝트 구조

```text
my-react-app/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**핵심 파일 설명**:
- `src/main.tsx`: 앱의 진입점, ReactDOM 렌더링
- `src/App.tsx`: 루트 컴포넌트
- `index.html`: HTML 템플릿
- `vite.config.ts`: Vite 빌드 설정

## JSX (JavaScript XML)

JSX는 JavaScript 안에서 HTML과 유사한 마크업을 작성할 수 있게 해주는 문법 확장입니다.

### 기본 문법

```tsx
function App() {
  return (
    <div className="app">
      <h1>안녕하세요, React!</h1>
      <p>첫 번째 React 앱입니다.</p>
    </div>
  );
}
```

### JSX 규칙

```tsx
function JsxRules() {
  const name = "React";
  const isLoggedIn = true;
  const items = ["사과", "바나나", "체리"];

  return (
    // 1. 반드시 하나의 루트 요소로 감싸야 함
    <div>
      {/* 2. JavaScript 표현식은 중괄호 {} 사용 */}
      <h1>안녕하세요, {name}!</h1>
      <p>2 + 3 = {2 + 3}</p>

      {/* 3. class 대신 className 사용 */}
      <div className="container">

        {/* 4. 조건부 렌더링 */}
        {isLoggedIn ? <p>환영합니다!</p> : <p>로그인 해주세요</p>}
        {isLoggedIn && <button>로그아웃</button>}

        {/* 5. 리스트 렌더링 - key 필수 */}
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>

        {/* 6. 인라인 스타일은 객체로 */}
        <p style={{ color: "blue", fontSize: "1.2rem" }}>
          스타일 적용
        </p>
      </div>
    </div>
  );
}
```

### Fragment 사용

불필요한 DOM 요소 없이 여러 요소를 그룹화할 수 있습니다.

```tsx
function FragmentExample() {
  return (
    <>
      <h1>제목</h1>
      <p>내용</p>
    </>
  );
}
```

## 컴포넌트

### 함수형 컴포넌트

React에서는 함수형 컴포넌트가 표준입니다.

```tsx
// 기본 컴포넌트
function Welcome() {
  return <h1>환영합니다!</h1>;
}

// Arrow Function으로도 작성 가능
const Welcome = () => {
  return <h1>환영합니다!</h1>;
};

// 사용
function App() {
  return (
    <div>
      <Welcome />
    </div>
  );
}
```

### 컴포넌트 분리

```tsx
// Header.tsx
function Header() {
  return (
    <header>
      <nav>
        <a href="/">홈</a>
        <a href="/about">소개</a>
      </nav>
    </header>
  );
}

export default Header;

// Footer.tsx
function Footer() {
  return (
    <footer>
      <p>&copy; 2026 My App</p>
    </footer>
  );
}

export default Footer;

// App.tsx
import Header from "./Header";
import Footer from "./Footer";

function App() {
  return (
    <>
      <Header />
      <main>
        <h1>메인 콘텐츠</h1>
      </main>
      <Footer />
    </>
  );
}
```

## Props (속성)

Props는 부모 컴포넌트에서 자식 컴포넌트로 데이터를 전달하는 방법입니다.

### 기본 Props

```tsx
// Props 타입 정의
interface GreetingProps {
  name: string;
  age?: number;  // 선택적 prop
}

function Greeting({ name, age }: GreetingProps) {
  return (
    <div>
      <h2>안녕하세요, {name}님!</h2>
      {age && <p>나이: {age}세</p>}
    </div>
  );
}

// 사용
function App() {
  return (
    <div>
      <Greeting name="홍길동" age={30} />
      <Greeting name="김철수" />
    </div>
  );
}
```

### children Props

```tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// 사용
function App() {
  return (
    <Card title="공지사항">
      <p>이것은 카드 안의 내용입니다.</p>
      <button>자세히 보기</button>
    </Card>
  );
}
```

### Props로 이벤트 핸들러 전달

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// 사용
function App() {
  const handleClick = () => {
    alert("버튼이 클릭되었습니다!");
  };

  return (
    <div>
      <Button label="확인" onClick={handleClick} />
      <Button label="취소" onClick={() => console.log("취소")} variant="secondary" />
    </div>
  );
}
```

## State (상태)

### useState

컴포넌트 내부에서 변경 가능한 데이터를 관리합니다.

```tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
      <button onClick={() => setCount(0)}>초기화</button>
    </div>
  );
}
```

### 다양한 State 타입

```tsx
function StateExamples() {
  // 문자열
  const [name, setName] = useState("");

  // 불리언
  const [isVisible, setIsVisible] = useState(false);

  // 객체
  const [user, setUser] = useState({ name: "", email: "" });

  // 배열
  const [todos, setTodos] = useState<string[]>([]);

  return (
    <div>
      {/* 입력 폼 */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 입력"
      />

      {/* 토글 */}
      <button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? "숨기기" : "보이기"}
      </button>
      {isVisible && <p>보이는 내용입니다!</p>}

      {/* 객체 업데이트 (스프레드 연산자 사용) */}
      <input
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
        placeholder="사용자 이름"
      />

      {/* 배열에 항목 추가 */}
      <button onClick={() => setTodos([...todos, name])}>
        할 일 추가
      </button>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 이벤트 처리

### 기본 이벤트

```tsx
function EventExamples() {
  // 클릭 이벤트
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("클릭!", e.currentTarget);
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("폼 제출!");
  };

  // 입력 변경
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("입력값:", e.target.value);
  };

  // 키보드 이벤트
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log("Enter 키 누름!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="입력하세요"
      />
      <button onClick={handleClick}>제출</button>
    </form>
  );
}
```

## 조건부 렌더링

상태에 따라 다른 UI를 렌더링하는 방법입니다. if-else, 삼항 연산자, 논리 연산자를 활용할 수 있습니다.

```tsx
interface StatusProps {
  status: "loading" | "success" | "error";
  data?: string;
  error?: string;
}

function StatusDisplay({ status, data, error }: StatusProps) {
  // if-else 패턴
  if (status === "loading") {
    return <div className="spinner">로딩 중...</div>;
  }

  if (status === "error") {
    return <div className="error">에러: {error}</div>;
  }

  return <div className="success">데이터: {data}</div>;
}

// 사용
function App() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  return <StatusDisplay status={status} data="결과 데이터" />;
}
```

## 리스트 렌더링

배열 데이터를 `map()`으로 순회하여 렌더링합니다. 각 항목에는 고유한 `key` prop이 필수입니다.

```tsx
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "React 배우기", completed: false },
    { id: 2, text: "TypeScript 배우기", completed: true },
    { id: 3, text: "프로젝트 만들기", completed: false },
  ]);

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <span
            style={{
              textDecoration: todo.completed ? "line-through" : "none",
            }}
            onClick={() => toggleTodo(todo.id)}
          >
            {todo.text}
          </span>
          <button onClick={() => deleteTodo(todo.id)}>삭제</button>
        </li>
      ))}
    </ul>
  );
}
```

## 폼 처리

제어 컴포넌트 패턴으로 폼 상태를 React state와 동기화합니다. `onChange` 핸들러로 입력값을 관리하고 `onSubmit`으로 제출을 처리합니다.

```tsx
interface FormData {
  username: string;
  email: string;
  role: string;
}

function SignupForm() {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    role: "user",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("제출 데이터:", formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="username">사용자명</label>
        <input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="role">역할</label>
        <select id="role" name="role" value={formData.role} onChange={handleChange}>
          <option value="user">일반 사용자</option>
          <option value="admin">관리자</option>
        </select>
      </div>

      <button type="submit">가입</button>
    </form>
  );
}
```

## 마무리

React의 핵심 개념을 정리하면:

- **JSX**: JavaScript 안에서 UI를 선언적으로 작성
- **컴포넌트**: 독립적이고 재사용 가능한 UI 조각
- **Props**: 부모에서 자식으로 데이터 전달 (읽기 전용)
- **State**: 컴포넌트 내부의 변경 가능한 데이터
- **이벤트 처리**: onClick, onChange 등으로 사용자 상호작용 처리

다음 글에서는 React Hooks를 활용한 심화 패턴과 상태 관리 방법을 알아보겠습니다.

**관련 글:**
- React Hooks 심화 가이드
