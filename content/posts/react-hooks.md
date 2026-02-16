---
title: "React Hooks 심화 가이드 - 실전 패턴과 커스텀 훅"
date: 2026-02-16T13:15:00+09:00
draft: false
tags: ["React", "Hooks", "프론트엔드", "TypeScript"]
categories: ["React"]
series: "React"
description: "useEffect, useRef, useMemo 등 React Hooks의 실전 활용법을 알아봅니다"
---

## React Hooks란?

Hooks는 함수형 컴포넌트에서 상태 관리, 사이드 이펙트 처리, 성능 최적화 등을 가능하게 하는 함수입니다. React 16.8에서 도입되어 현재 React 개발의 핵심이 되었습니다.

### Hooks 규칙

1. **최상위에서만 호출**: 조건문, 반복문, 중첩 함수 내에서 호출 금지
2. **React 함수 내에서만 호출**: 일반 JavaScript 함수에서 호출 금지

```tsx
// 잘못된 사용
function BadExample() {
  if (someCondition) {
    const [value, setValue] = useState(""); // 조건문 안에서 호출 금지
  }
}

// 올바른 사용
function GoodExample() {
  const [value, setValue] = useState("");

  if (someCondition) {
    // Hook이 아닌 로직은 조건문 안에서 사용 가능
  }
}
```

## useEffect - 사이드 이펙트 처리

### 기본 사용법

```tsx
import { useState, useEffect } from "react";

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 사이드 이펙트 실행
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]); // userId가 변경될 때만 실행

  if (loading) return <p>로딩 중...</p>;
  if (!user) return <p>사용자를 찾을 수 없습니다.</p>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### 의존성 배열 패턴

```tsx
function EffectPatterns() {
  const [count, setCount] = useState(0);

  // 1. 마운트 시 1회만 실행
  useEffect(() => {
    console.log("컴포넌트 마운트");
  }, []);

  // 2. 특정 값 변경 시 실행
  useEffect(() => {
    console.log("count 변경:", count);
  }, [count]);

  // 3. 매 렌더링마다 실행 (의존성 배열 생략)
  useEffect(() => {
    console.log("렌더링됨");
  });

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 클린업 함수

컴포넌트 언마운트 시 또는 이펙트 재실행 전에 정리 작업을 수행합니다.

```tsx
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // 클린업: 컴포넌트 언마운트 시 인터벌 정리
    return () => clearInterval(interval);
  }, []);

  return <p>경과 시간: {seconds}초</p>;
}

function EventListener() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // 클린업: 이벤트 리스너 제거
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <p>창 너비: {windowWidth}px</p>;
}
```

## useRef - DOM 접근과 값 유지

### DOM 요소 접근

```tsx
import { useRef, useEffect } from "react";

function AutoFocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 마운트 시 자동 포커스
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} placeholder="자동 포커스" />;
}
```

### 렌더링 없이 값 유지

useRef는 값이 변경되어도 리렌더링을 발생시키지 않습니다.

```tsx
function StopWatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const start = () => {
    if (isRunning) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTime((prev) => prev + 10);
    }, 10);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
  };

  const reset = () => {
    stop();
    setTime(0);
  };

  return (
    <div>
      <p>{(time / 1000).toFixed(2)}초</p>
      <button onClick={start}>시작</button>
      <button onClick={stop}>정지</button>
      <button onClick={reset}>초기화</button>
    </div>
  );
}
```

### 이전 값 기억하기

```tsx
function PreviousValue({ value }: { value: number }) {
  const prevRef = useRef<number>(value);

  useEffect(() => {
    prevRef.current = value;
  }, [value]);

  return (
    <p>
      현재: {value}, 이전: {prevRef.current}
    </p>
  );
}
```

## useMemo - 계산 결과 캐싱

비용이 큰 계산의 결과를 메모이제이션합니다.

```tsx
import { useState, useMemo } from "react";

function ExpensiveList({ items, filter }: { items: Item[]; filter: string }) {
  // filter가 변경될 때만 재계산
  const filteredItems = useMemo(() => {
    console.log("필터링 실행");
    return items.filter((item) =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <ul>
      {filteredItems.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### 정렬과 통계 계산

```tsx
function Dashboard({ data }: { data: number[] }) {
  const stats = useMemo(() => {
    const sorted = [...data].sort((a, b) => a - b);
    const sum = data.reduce((acc, val) => acc + val, 0);
    const avg = sum / data.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    return { sum, avg, min, max };
  }, [data]);

  return (
    <div>
      <p>합계: {stats.sum}</p>
      <p>평균: {stats.avg.toFixed(2)}</p>
      <p>최소: {stats.min} / 최대: {stats.max}</p>
    </div>
  );
}
```

## useCallback - 함수 메모이제이션

함수의 참조를 유지하여 불필요한 자식 컴포넌트 리렌더링을 방지합니다.

```tsx
import { useState, useCallback, memo } from "react";

// memo로 감싼 자식 컴포넌트
const TodoItem = memo(function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  console.log(`TodoItem 렌더링: ${todo.text}`);
  return (
    <li>
      <span
        style={{ textDecoration: todo.completed ? "line-through" : "none" }}
        onClick={() => onToggle(todo.id)}
      >
        {todo.text}
      </span>
      <button onClick={() => onDelete(todo.id)}>삭제</button>
    </li>
  );
});

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  // useCallback으로 함수 참조 안정화
  const handleToggle = useCallback((id: number) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const handleDelete = useCallback((id: number) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const handleAdd = () => {
    if (!input.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), text: input, completed: false },
    ]);
    setInput("");
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
      />
      <button onClick={handleAdd}>추가</button>
      <ul>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    </div>
  );
}
```

## useReducer - 복잡한 상태 관리

useState보다 복잡한 상태 로직을 체계적으로 관리합니다.

```tsx
import { useReducer } from "react";

// 상태 타입
interface CartState {
  items: CartItem[];
  total: number;
}

// 액션 타입
type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "UPDATE_QUANTITY"; payload: { id: number; quantity: number } }
  | { type: "CLEAR_CART" };

// 리듀서 함수
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        const items = state.items.map((i) =>
          i.id === action.payload.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
        return { items, total: calcTotal(items) };
      }
      const items = [...state.items, { ...action.payload, quantity: 1 }];
      return { items, total: calcTotal(items) };
    }
    case "REMOVE_ITEM": {
      const items = state.items.filter((i) => i.id !== action.payload);
      return { items, total: calcTotal(items) };
    }
    case "UPDATE_QUANTITY": {
      const items = state.items.map((i) =>
        i.id === action.payload.id
          ? { ...i, quantity: action.payload.quantity }
          : i
      );
      return { items, total: calcTotal(items) };
    }
    case "CLEAR_CART":
      return { items: [], total: 0 };
    default:
      return state;
  }
}

function ShoppingCart() {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  return (
    <div>
      <h2>장바구니 ({cart.items.length}개)</h2>
      {cart.items.map((item) => (
        <div key={item.id}>
          <span>{item.name} x {item.quantity}</span>
          <button onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}>
            삭제
          </button>
        </div>
      ))}
      <p>총액: {cart.total.toLocaleString()}원</p>
      <button onClick={() => dispatch({ type: "CLEAR_CART" })}>
        장바구니 비우기
      </button>
    </div>
  );
}
```

## 커스텀 Hook

반복되는 로직을 재사용 가능한 Hook으로 추출합니다.

### useLocalStorage

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [storedValue, setValue] as const;
}

// 사용
function Settings() {
  const [theme, setTheme] = useLocalStorage("theme", "light");
  const [fontSize, setFontSize] = useLocalStorage("fontSize", 16);

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">라이트</option>
        <option value="dark">다크</option>
      </select>
      <input
        type="range"
        min={12}
        max={24}
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
      />
    </div>
  );
}
```

### useFetch

```tsx
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    setState({ data: null, loading: true, error: null });

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (err.name !== "AbortError") {
          setState({ data: null, loading: false, error: err.message });
        }
      });

    return () => controller.abort();
  }, [url]);

  return state;
}

// 사용
function UserList() {
  const { data: users, loading, error } = useFetch<User[]>("/api/users");

  if (loading) return <p>로딩 중...</p>;
  if (error) return <p>에러: {error}</p>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### useDebounce

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 사용 - 검색 입력 디바운싱
function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // 300ms 후에 API 호출
      console.log("검색:", debouncedQuery);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="검색어 입력..."
    />
  );
}
```

## Context API - 전역 상태 관리

Props drilling 없이 컴포넌트 트리 전체에서 데이터를 공유합니다.

```tsx
import { createContext, useContext, useState } from "react";

// Context 생성
interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContext | null>(null);

// Provider 컴포넌트
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setUser(data.user);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 커스텀 Hook으로 사용 편의성 향상
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 내에서 사용해야 합니다");
  }
  return context;
}

// 사용
function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      {user ? (
        <>
          <span>{user.name}님 환영합니다</span>
          <button onClick={logout}>로그아웃</button>
        </>
      ) : (
        <a href="/login">로그인</a>
      )}
    </nav>
  );
}

// App에서 Provider로 감싸기
function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main>{/* ... */}</main>
    </AuthProvider>
  );
}
```

## 마치며

React Hooks를 정리하면:

| Hook | 용도 |
|------|------|
| `useState` | 컴포넌트 상태 관리 |
| `useEffect` | 사이드 이펙트 (API 호출, 이벤트 리스너) |
| `useRef` | DOM 접근, 렌더링 없이 값 유지 |
| `useMemo` | 비용 큰 계산 결과 캐싱 |
| `useCallback` | 함수 참조 안정화 |
| `useReducer` | 복잡한 상태 로직 관리 |
| `useContext` | 전역 상태 공유 |
| **커스텀 Hook** | 재사용 가능한 로직 추출 |

Hooks를 활용하면 클래스 컴포넌트 없이도 React의 모든 기능을 효과적으로 사용할 수 있으며, 로직의 재사용성과 코드의 가독성을 크게 향상시킬 수 있습니다.
