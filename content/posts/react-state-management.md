---
title: "React 상태 관리 - Context API, Provider 패턴, Redux vs Zustand 비교"
date: 2026-02-16T13:20:00+09:00
draft: false
tags: ["React", "상태관리", "Context", "Architecture"]
categories: ["React"]
series: "React"
description: "전역 상태 관리 아키텍처 패턴과 Context 조합, 상태 관리 라이브러리 선택 가이드"
---

Props drilling 문제를 겪어보신 적 있나요? 컴포넌트가 깊어질수록 상태를 여러 단계에 걸쳐 전달해야 하는 문제가 발생합니다. 이번 글에서는 전역 상태 관리 아키텍처 패턴과 실전 Context 조합 전략, 그리고 프로젝트 규모에 맞는 상태 관리 솔루션 선택 방법을 알아봅니다.

## 상태 관리의 필요성

### Props Drilling 문제

중간 컴포넌트들이 실제로 사용하지 않는 props를 단순히 아래로 전달만 하는 상황입니다.

```jsx
// Props Drilling 예시
function App() {
  const [user, setUser] = useState(null);

  return <Layout user={user} setUser={setUser} />;
}

function Layout({ user, setUser }) {
  return (
    <div>
      <Header user={user} setUser={setUser} />
      <Main user={user} />
    </div>
  );
}

function Header({ user, setUser }) {
  return <UserMenu user={user} setUser={setUser} />;
}

function UserMenu({ user, setUser }) {
  // 실제로 사용하는 곳은 여기
  return user ? (
    <button onClick={() => setUser(null)}>로그아웃</button>
  ) : (
    <button onClick={() => setUser({ name: '홍길동' })}>로그인</button>
  );
}
```

중간 컴포넌트들은 `user`와 `setUser`를 직접 사용하지 않지만 전달만 하고 있습니다. 이것이 Props Drilling 문제입니다.

## 전역 상태 관리가 필요한 시점

다음과 같은 상황에서 전역 상태 관리를 고려해야 합니다:

- **3단계 이상 Props 전달**: 중간 컴포넌트들이 단순 전달자 역할만 함
- **여러 컴포넌트에서 공유**: 인증 정보, 테마, 언어 설정 등
- **앱 전역 이벤트**: 알림, 모달, 토스트 메시지 등
- **복잡한 상태 동기화**: 여러 컴포넌트가 동일한 상태를 수정

### 해결 방법의 스펙트럼

```text
Props → Composition → Context → 상태 관리 라이브러리
(간단)                                        (복잡)
```

**Composition 우선 고려:**
많은 경우 컴포넌트 합성으로 해결 가능합니다.

```jsx
// Props drilling 예시
function App() {
  const [user, setUser] = useState(null);
  return <Layout user={user} setUser={setUser} />;
}

function Layout({ user, setUser }) {
  return (
    <div>
      <Header user={user} setUser={setUser} />
      <Main user={user} />
    </div>
  );
}

// Composition으로 개선
function App() {
  const [user, setUser] = useState(null);
  return (
    <Layout
      header={<Header user={user} setUser={setUser} />}
      main={<Main user={user} />}
    />
  );
}

function Layout({ header, main }) {
  return (
    <div>
      {header}
      {main}
    </div>
  );
}
```

Layout이 `user`를 몰라도 되므로 Props drilling이 해결됩니다.

## Context로 전역 상태 관리

### AuthContext 예시

실전에서 자주 사용되는 인증 상태 관리입니다.

```jsx
// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 로드 시 토큰 확인
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다');
  }
  return context;
};
```

### ThemeContext 예시

다크모드 전환 기능을 구현해봅시다.

```jsx
// contexts/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

사용 예시:

```jsx
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

## Context 설계 원칙

### 1. 단일 책임 원칙

각 Context는 하나의 도메인만 담당해야 합니다.

```jsx
// ❌ 나쁜 예: 모든 것을 하나의 Context에
const AppContext = createContext({
  user: null,
  theme: 'light',
  language: 'ko',
  notifications: [],
  cart: []
});

// ✅ 좋은 예: 도메인별로 분리
const AuthContext = createContext({ user: null });
const ThemeContext = createContext({ theme: 'light' });
const I18nContext = createContext({ language: 'ko' });
const NotificationContext = createContext({ notifications: [] });
const CartContext = createContext({ cart: [] });
```

**장점:**
- 불필요한 리렌더링 방지
- 테스트 용이
- 독립적 개발/배포 가능

### 2. 커스텀 Hook으로 캡슐화

Context 사용을 커스텀 Hook으로 감싸면 사용성과 안정성이 향상됩니다.

```jsx
// contexts/AuthContext.jsx
const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다');
  }
  return context;
}

// 사용 시
function Profile() {
  const { user, logout } = useAuth(); // useContext 대신 커스텀 Hook
  // ...
}
```

### 3. 값과 액션 분리

상태 값과 업데이트 함수를 별도 Context로 분리하면 성능이 개선됩니다.

```jsx
const TodoStateContext = createContext(null);
const TodoDispatchContext = createContext(null);

export function TodoProvider({ children }) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  return (
    <TodoStateContext.Provider value={state}>
      <TodoDispatchContext.Provider value={dispatch}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoStateContext.Provider>
  );
}

// 상태만 필요한 컴포넌트
function TodoCount() {
  const state = useContext(TodoStateContext);
  return <p>{state.todos.length}개</p>;
}

// dispatch만 필요한 컴포넌트 (state 변경 시 리렌더링 안 됨)
function AddTodoButton() {
  const dispatch = useContext(TodoDispatchContext);
  return <button onClick={() => dispatch({ type: 'ADD_TODO' })}>추가</button>;
}
```

## Provider 중첩 패턴

실전에서는 여러 Context를 조합해서 사용합니다.

```jsx
// App.jsx
function App() {
  return (
    <AuthProvider>
      <LicenseProvider>
        <AgentProvider>
          <ThemeProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </Router>
          </ThemeProvider>
        </AgentProvider>
      </LicenseProvider>
    </AuthProvider>
  );
}
```

중첩을 줄이기 위해 컴포즈 패턴을 사용할 수 있습니다:

```jsx
// providers/AppProviders.jsx
function compose(...Providers) {
  return function ComposedProviders({ children }) {
    return Providers.reduceRight((acc, Provider) => {
      return <Provider>{acc}</Provider>;
    }, children);
  };
}

export const AppProviders = compose(
  AuthProvider,
  LicenseProvider,
  AgentProvider,
  ThemeProvider
);
```

사용:

```jsx
function App() {
  return (
    <AppProviders>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </AppProviders>
  );
}
```

## Provider 조합 전략

### 조건부 Provider 로딩

필요할 때만 Provider를 활성화합니다.

```jsx
function ConditionalProviders({ children, features }) {
  let tree = children;

  if (features.notifications) {
    tree = <NotificationProvider>{tree}</NotificationProvider>;
  }

  if (features.realtime) {
    tree = <WebSocketProvider>{tree}</WebSocketProvider>;
  }

  return tree;
}

// 사용
<ConditionalProviders features={{ notifications: true, realtime: false }}>
  <App />
</ConditionalProviders>
```

### 의존성 있는 Provider 순서

일부 Provider는 다른 Provider에 의존합니다.

```jsx
// ❌ 나쁜 예: NotificationProvider가 AuthContext를 사용하는데 순서가 잘못됨
<NotificationProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</NotificationProvider>

// ✅ 좋은 예: 의존성 순서 준수
<AuthProvider>
  <NotificationProvider> {/* AuthContext 사용 가능 */}
    <App />
  </NotificationProvider>
</AuthProvider>
```

**의존성 그래프 예시:**

```text
AuthProvider (독립)
  ↓
I18nProvider (AuthContext 사용)
  ↓
NotificationProvider (AuthContext, I18nContext 사용)
  ↓
App
```

## Context vs Redux vs Zustand 비교

### Context API

**장점:**
- React 내장 기능
- 별도 라이브러리 불필요
- 간단한 전역 상태에 적합

**단점:**
- 복잡한 상태 로직에는 보일러플레이트가 많음
- 성능 최적화에 신경써야 함
- DevTools 지원 제한적

### Redux

**장점:**
- 예측 가능한 상태 관리
- 강력한 DevTools
- 미들웨어 생태계 (redux-saga, redux-thunk)

**단점:**
- 보일러플레이트 코드 많음
- 학습 곡선 높음
- 작은 앱에는 과한 설정

### Zustand

**장점:**
- 간단한 API
- 보일러플레이트 최소화
- Context 없이 작동 (리렌더링 최적화)

**단점:**
- Redux만큼의 생태계는 아님
- 팀원이 익숙하지 않을 수 있음

```jsx
// Zustand 예시
import { create } from 'zustand';

const useStore = create((set) => ({
  user: null,
  login: (userData) => set({ user: userData }),
  logout: () => set({ user: null })
}));

function UserMenu() {
  const { user, logout } = useStore();
  return user ? <button onClick={logout}>로그아웃</button> : null;
}
```

**선택 가이드:**
- 소규모 앱, 테마/인증만 관리 → Context API
- 대규모 엔터프라이즈, 복잡한 비즈니스 로직 → Redux
- 중규모 앱, 빠른 개발 → Zustand

## 실전 예시: 인증 상태 관리

JWT 토큰 기반 인증 시스템을 Context로 구현해봅시다.

```jsx
// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 토큰 만료 체크
  const isTokenExpired = useCallback((token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, []);

  // 토큰 갱신
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) throw new Error('토큰 갱신 실패');

      const { accessToken, refreshToken: newRefreshToken } = await response.json();
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      return accessToken;
    } catch (error) {
      console.error('토큰 갱신 에러:', error);
      logout();
      return null;
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      // 토큰 만료 체크
      if (isTokenExpired(token)) {
        const newToken = await refreshToken();
        if (!newToken) {
          setLoading(false);
          return;
        }
      }

      // 사용자 정보 로드
      try {
        const response = await fetch('/api/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [isTokenExpired, refreshToken]);

  // 자동 로그아웃 타이머
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const decoded = jwtDecode(token);
    const expiresIn = decoded.exp * 1000 - Date.now();

    // 만료 5분 전에 토큰 갱신
    const refreshTimer = setTimeout(() => {
      refreshToken();
    }, expiresIn - 5 * 60 * 1000);

    return () => clearTimeout(refreshTimer);
  }, [user, refreshToken]);

  const login = async (email, password) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('로그인 실패');
    }

    const { accessToken, refreshToken, user } = await response.json();
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(user);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshToken }),
    [user, loading, login, logout, refreshToken]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다');
  }
  return context;
};
```

보호된 라우트 구현:

```jsx
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

사용:

```jsx
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

## 마무리

Context API와 커스텀 Hooks를 활용하면 Redux 없이도 효과적인 전역 상태 관리가 가능합니다.

**핵심 정리:**

1. **Props Drilling 방지:** Context로 깊은 컴포넌트 트리에 값 전달
2. **커스텀 Hooks:** 재사용 가능한 로직을 Hook으로 추출
3. **useReducer:** 복잡한 상태 로직은 reducer로 관리
4. **성능 최적화:** React.memo, useMemo, Context 분리
5. **외부 상태:** useSyncExternalStore로 안전하게 동기화
6. **실전 패턴:** JWT 인증, 자동 갱신, 세션 만료 처리

다음 글에서는 React Query와 서버 상태 관리에 대해 알아보겠습니다.
