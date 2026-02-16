---
title: "React E2E 테스팅 - Playwright로 신뢰할 수 있는 테스트"
date: 2026-02-16T13:21:00+09:00
draft: false
tags: ["React", "테스팅", "Playwright", "E2E"]
categories: ["React"]
series: "React"
description: "Playwright를 활용한 React 애플리케이션 E2E 테스트 작성법을 알아봅니다"
---

E2E 테스트는 실제 사용자 관점에서 애플리케이션을 검증합니다. 이번 글에서는 Playwright를 활용한 React 애플리케이션 E2E 테스트 작성법을 알아봅니다.

## E2E 테스트란

### 테스트 피라미드

소프트웨어 테스트는 세 가지 레벨로 나뉩니다.

```
        /\
       /  \  E2E 테스트 (적음, 느림, 비용 높음)
      /____\
     /      \  통합 테스트 (중간)
    /________\
   /          \  단위 테스트 (많음, 빠름, 비용 낮음)
  /____________\
```

**단위 테스트 (Unit Test):**
- 개별 함수, 컴포넌트 테스트
- 빠르고 격리된 환경
- 예: `sum(1, 2) === 3`

**통합 테스트 (Integration Test):**
- 여러 모듈 간 상호작용 테스트
- API 호출, 데이터베이스 연동
- 예: React Testing Library로 컴포넌트 + API 테스트

**E2E 테스트 (End-to-End Test):**
- 실제 브라우저에서 사용자 시나리오 테스트
- 전체 시스템 통합 검증
- 예: 로그인 → 상품 검색 → 장바구니 → 결제

### E2E 테스트가 필요한 이유

```jsx
// 단위 테스트로는 잡기 어려운 문제들

// 1. 네트워크 에러 처리
function LoginForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // ❌ 로그인 성공 후 리다이렉트 코드를 깜빡함
    } catch (error) {
      setError(error.message);
    }
  };
  // ...
}

// 2. CSS로 인한 버튼 클릭 불가
<button style={{ position: 'absolute', left: '-9999px' }}>
  제출
</button>

// 3. 타이밍 이슈
useEffect(() => {
  // ❌ fetchData가 완료되기 전에 컴포넌트가 언마운트될 수 있음
  fetchData().then(setData);
}, []);
```

E2E 테스트는 이런 실전 문제를 잡아냅니다.

## Playwright 소개와 설치

Playwright는 Microsoft가 만든 모던 E2E 테스팅 프레임워크입니다.

**특징:**
- Chromium, Firefox, WebKit 모두 지원
- 자동 대기 (Auto-wait)
- 네트워크 요청 모킹
- 스크린샷, 비디오 녹화
- 병렬 실행, 재시도 기능

### 설치

```bash
npm init playwright@latest
```

대화형 설치 과정:

```
✔ Do you want to use TypeScript or JavaScript? · TypeScript
✔ Where to put your end-to-end tests? · tests
✔ Add a GitHub Actions workflow? · true
✔ Install Playwright browsers? · true
```

생성되는 파일:

```
my-app/
├── tests/
│   └── example.spec.ts
├── playwright.config.ts
└── package.json
```

## playwright.config.ts 설정

전체 설정 파일 예시 (Playwright 1.40+):

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 테스트 디렉토리
  testDir: './tests',

  // 각 테스트 최대 실행 시간
  timeout: 30 * 1000,

  // expect() 타임아웃
  expect: {
    timeout: 5000
  },

  // 테스트 실패 시 재시도 횟수
  retries: process.env.CI ? 2 : 0,

  // 병렬 실행 워커 수
  workers: process.env.CI ? 1 : undefined,

  // 리포터 설정
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],

  // 모든 테스트에 공통 적용
  use: {
    // 기본 URL (baseURL 사용 시 page.goto('/')로 이동 가능)
    baseURL: 'http://localhost:3000',

    // 브라우저 컨텍스트 옵션
    viewport: { width: 1280, height: 720 },

    // 실패 시 스크린샷
    screenshot: 'only-on-failure',

    // 실패 시 비디오
    video: 'retain-on-failure',

    // 네트워크 로그
    trace: 'on-first-retry',
  },

  // 프로젝트 (브라우저별 설정)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 모바일 테스트
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 개발 서버 자동 실행
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 주요 설정 설명

**timeout:** 각 테스트가 완료되어야 하는 최대 시간입니다.

```typescript
timeout: 30 * 1000, // 30초
```

**retries:** 실패 시 재시도 횟수입니다. CI 환경에서는 네트워크 불안정으로 인한 실패를 줄이기 위해 사용합니다.

```typescript
retries: process.env.CI ? 2 : 0,
```

**baseURL:** 모든 테스트에서 공통으로 사용할 기본 URL입니다.

```typescript
use: {
  baseURL: 'http://localhost:3000',
}

// 테스트에서
await page.goto('/'); // http://localhost:3000/ 로 이동
await page.goto('/login'); // http://localhost:3000/login 으로 이동
```

## 첫 번째 테스트 작성

### 로그인 테스트

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('로그인', () => {
  test('성공적인 로그인', async ({ page }) => {
    // 1. 로그인 페이지로 이동
    await page.goto('/login');

    // 2. 폼 입력
    await page.getByLabel('이메일').fill('user@example.com');
    await page.getByLabel('비밀번호').fill('password123');

    // 3. 로그인 버튼 클릭
    await page.getByRole('button', { name: '로그인' }).click();

    // 4. 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard');

    // 5. 사용자 이름이 표시되는지 확인
    await expect(page.getByText('홍길동님 환영합니다')).toBeVisible();
  });

  test('잘못된 비밀번호', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('이메일').fill('user@example.com');
    await page.getByLabel('비밀번호').fill('wrongpassword');

    await page.getByRole('button', { name: '로그인' }).click();

    // 에러 메시지 확인
    await expect(page.getByText('이메일 또는 비밀번호가 잘못되었습니다')).toBeVisible();

    // 여전히 로그인 페이지에 있는지 확인
    await expect(page).toHaveURL('/login');
  });

  test('빈 폼 제출', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: '로그인' }).click();

    // HTML5 validation 메시지 확인
    const emailInput = page.getByLabel('이메일');
    await expect(emailInput).toHaveAttribute('required');
  });
});
```

테스트 실행:

```bash
# 모든 테스트 실행
npx playwright test

# 특정 파일만 실행
npx playwright test login.spec.ts

# UI 모드로 실행 (디버깅에 유용)
npx playwright test --ui

# 헤드풀 모드 (브라우저 보이게)
npx playwright test --headed

# 특정 브라우저만
npx playwright test --project=chromium
```

## Locator 전략

올바른 locator를 선택하는 것이 테스트 안정성의 핵심입니다.

### 우선순위

**1순위: getByRole**

접근성을 고려한 가장 안정적인 방법입니다.

```typescript
// ✅ 좋음: 의미 있는 role 사용
await page.getByRole('button', { name: '제출' });
await page.getByRole('link', { name: '홈으로' });
await page.getByRole('textbox', { name: '이메일' });
await page.getByRole('checkbox', { name: '약관 동의' });

// 사용 가능한 role 확인
await page.getByRole('button').all(); // 페이지의 모든 버튼
```

**2순위: getByLabel**

폼 요소에 적합합니다.

```typescript
// ✅ 좋음: label과 연결된 input
await page.getByLabel('사용자 이름').fill('홍길동');
await page.getByLabel('생년월일').fill('2000-01-01');
```

**3순위: getByText**

텍스트 콘텐츠로 찾기.

```typescript
// ✅ 좋음: 고유한 텍스트
await page.getByText('주문 완료').click();

// 부분 매칭
await page.getByText(/주문 완료/);
await page.getByText('주문', { exact: false });
```

**4순위: getByTestId**

스타일 변경에 영향받지 않는 안정적인 방법입니다.

```tsx
// React 컴포넌트
<button data-testid="submit-button">제출</button>

// 테스트
await page.getByTestId('submit-button').click();
```

**피해야 할 방법:**

```typescript
// ❌ 나쁨: CSS selector (스타일 변경에 취약)
await page.locator('.btn-primary.submit-button');

// ❌ 나쁨: XPath (가독성 낮음)
await page.locator('//*[@id="app"]/div[1]/button');
```

### 복잡한 Locator

```typescript
// 특정 텍스트를 포함한 요소 찾기
await page.getByRole('listitem').filter({ hasText: '완료' });

// 자식 요소 찾기
await page.getByRole('article').getByRole('button', { name: '삭제' });

// 여러 조건 조합
await page
  .getByRole('row')
  .filter({ has: page.getByText('홍길동') })
  .getByRole('button', { name: '편집' });

// n번째 요소
await page.getByRole('listitem').nth(2);

// 첫 번째, 마지막
await page.getByRole('listitem').first();
await page.getByRole('listitem').last();
```

## 페이지 네비게이션 테스트

```typescript
// tests/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('네비게이션', () => {
  test('메뉴 링크 동작', async ({ page }) => {
    await page.goto('/');

    // 메뉴 클릭
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL('/about');

    // 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL('/');

    // 앞으로가기
    await page.goForward();
    await expect(page).toHaveURL('/about');
  });

  test('브레드크럼 네비게이션', async ({ page }) => {
    await page.goto('/products/123');

    // 브레드크럼: 홈 > 제품 > 제품 상세
    await page.getByRole('link', { name: '제품' }).click();
    await expect(page).toHaveURL('/products');

    await page.getByRole('link', { name: '홈' }).click();
    await expect(page).toHaveURL('/');
  });

  test('탭 네비게이션', async ({ page }) => {
    await page.goto('/settings');

    // 프로필 탭
    await page.getByRole('tab', { name: '프로필' }).click();
    await expect(page.getByText('프로필 정보')).toBeVisible();

    // 알림 탭
    await page.getByRole('tab', { name: '알림' }).click();
    await expect(page.getByText('알림 설정')).toBeVisible();
  });
});
```

## 폼 인터랙션 테스트

```typescript
// tests/form.spec.ts
import { test, expect } from '@playwright/test';

test.describe('회원가입 폼', () => {
  test('전체 폼 제출', async ({ page }) => {
    await page.goto('/signup');

    // 텍스트 입력
    await page.getByLabel('이메일').fill('user@example.com');
    await page.getByLabel('비밀번호').fill('StrongPass123!');
    await page.getByLabel('비밀번호 확인').fill('StrongPass123!');

    // 셀렉트박스
    await page.getByLabel('국가').selectOption('KR');

    // 라디오 버튼
    await page.getByLabel('남성').check();

    // 체크박스
    await page.getByLabel('마케팅 수신 동의').check();
    await page.getByLabel('개인정보 처리방침 동의').check();

    // 파일 업로드
    await page.getByLabel('프로필 사진').setInputFiles('tests/fixtures/profile.jpg');

    // 제출
    await page.getByRole('button', { name: '가입하기' }).click();

    // 성공 메시지
    await expect(page.getByText('회원가입이 완료되었습니다')).toBeVisible();
  });

  test('비밀번호 불일치', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('이메일').fill('user@example.com');
    await page.getByLabel('비밀번호').fill('Password123!');
    await page.getByLabel('비밀번호 확인').fill('DifferentPass123!');

    // blur 이벤트 트리거
    await page.getByLabel('비밀번호 확인').blur();

    // 에러 메시지 확인
    await expect(page.getByText('비밀번호가 일치하지 않습니다')).toBeVisible();
  });

  test('이메일 중복 체크', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('이메일').fill('existing@example.com');
    await page.getByRole('button', { name: '중복 확인' }).click();

    // 에러 메시지 대기
    await expect(page.getByText('이미 사용 중인 이메일입니다')).toBeVisible();
  });
});
```

## 네트워크 요청 모킹

실제 API 호출 없이 테스트할 수 있습니다.

```typescript
// tests/api-mocking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('API 모킹', () => {
  test('사용자 목록 로드', async ({ page }) => {
    // API 응답 모킹
    await page.route('**/api/users', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: '홍길동', email: 'hong@example.com' },
          { id: 2, name: '김철수', email: 'kim@example.com' }
        ])
      });
    });

    await page.goto('/users');

    // 모킹된 데이터 확인
    await expect(page.getByText('홍길동')).toBeVisible();
    await expect(page.getByText('김철수')).toBeVisible();
  });

  test('API 에러 처리', async ({ page }) => {
    // 500 에러 모킹
    await page.route('**/api/users', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/users');

    // 에러 메시지 확인
    await expect(page.getByText('서버 오류가 발생했습니다')).toBeVisible();
  });

  test('네트워크 지연 시뮬레이션', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      // 3초 지연
      await new Promise(resolve => setTimeout(resolve, 3000));

      route.fulfill({
        status: 200,
        body: JSON.stringify([])
      });
    });

    await page.goto('/users');

    // 로딩 스피너 확인
    await expect(page.getByTestId('loading-spinner')).toBeVisible();

    // 데이터 로드 후 스피너 사라짐
    await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  });

  test('POST 요청 검증', async ({ page }) => {
    let requestBody;

    await page.route('**/api/users', (route) => {
      requestBody = route.request().postDataJSON();

      route.fulfill({
        status: 201,
        body: JSON.stringify({ id: 3, ...requestBody })
      });
    });

    await page.goto('/users/new');

    await page.getByLabel('이름').fill('이영희');
    await page.getByLabel('이메일').fill('lee@example.com');
    await page.getByRole('button', { name: '생성' }).click();

    // 요청 본문 검증
    expect(requestBody).toEqual({
      name: '이영희',
      email: 'lee@example.com'
    });
  });
});
```

## 스크린샷과 비디오 캡처

```typescript
// tests/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('비주얼 테스트', () => {
  test('전체 페이지 스크린샷', async ({ page }) => {
    await page.goto('/');

    // 전체 페이지
    await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true });

    // 특정 요소만
    const header = page.getByRole('banner');
    await header.screenshot({ path: 'screenshots/header.png' });
  });

  test('비주얼 리그레션 테스트', async ({ page }) => {
    await page.goto('/');

    // 스크린샷 비교 (첫 실행 시 기준 이미지 생성)
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('다크모드 스크린샷', async ({ page }) => {
    await page.goto('/');

    // 다크모드 활성화
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(page).toHaveScreenshot('homepage-dark.png');
  });

  test('모바일 뷰포트 스크린샷', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });
});
```

비디오는 자동으로 녹화됩니다 (설정에서 활성화한 경우):

```typescript
// playwright.config.ts
use: {
  video: 'on', // 항상 녹화
  // video: 'retain-on-failure', // 실패 시만 보관
  // video: 'on-first-retry', // 재시도 시만 녹화
}
```

## CI/CD 파이프라인 통합

### GitHub Actions

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results
          path: test-results/
          retention-days: 7
```

### 병렬 실행

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      # ... 이전 단계들

      - name: Run Playwright tests
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

## 실전 예시: 파일 동기화 콘솔

실무에서 사용할 법한 복잡한 시나리오를 테스트해봅시다.

```typescript
// tests/file-sync.spec.ts
import { test, expect } from '@playwright/test';

test.describe('파일 동기화 콘솔', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 (재사용 가능하도록 별도 함수로 분리)
    await login(page, 'admin@example.com', 'admin123');
  });

  test('로그인 후 대시보드 확인', async ({ page }) => {
    // 이미 beforeEach에서 로그인됨
    await expect(page).toHaveURL('/dashboard');

    // 대시보드 위젯 확인
    await expect(page.getByText('동기화 작업')).toBeVisible();
    await expect(page.getByTestId('active-jobs-count')).toBeVisible();
  });

  test('새 동기화 작업 생성', async ({ page }) => {
    // API 모킹
    await page.route('**/api/jobs', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          body: JSON.stringify({
            id: 'job-123',
            status: 'pending',
            createdAt: new Date().toISOString()
          })
        });
      }
    });

    // 작업 생성 페이지로 이동
    await page.getByRole('link', { name: '새 작업' }).click();
    await expect(page).toHaveURL('/jobs/new');

    // 폼 입력
    await page.getByLabel('작업 이름').fill('프로덕션 DB 동기화');
    await page.getByLabel('소스').selectOption('postgres-prod');
    await page.getByLabel('대상').selectOption('postgres-replica');

    // 고급 옵션 토글
    await page.getByRole('button', { name: '고급 옵션' }).click();
    await page.getByLabel('배치 크기').fill('1000');
    await page.getByLabel('재시도 횟수').fill('3');

    // 제출
    await page.getByRole('button', { name: '생성' }).click();

    // 성공 알림
    await expect(page.getByText('작업이 생성되었습니다')).toBeVisible();

    // 작업 목록으로 리다이렉트
    await expect(page).toHaveURL('/jobs');

    // 새 작업이 목록에 나타남
    await expect(page.getByText('프로덕션 DB 동기화')).toBeVisible();
  });

  test('작업 실행 및 로그 확인', async ({ page }) => {
    // WebSocket 메시지 모킹
    await page.goto('/jobs/job-123');

    // 실행 버튼 클릭
    await page.getByRole('button', { name: '실행' }).click();

    // 상태 변경 확인 (폴링)
    await expect(page.getByTestId('job-status')).toHaveText('실행 중', { timeout: 10000 });

    // 실시간 로그 확인
    await expect(page.getByTestId('log-stream')).toContainText('연결 중...');
    await expect(page.getByTestId('log-stream')).toContainText('데이터 전송 시작');

    // 진행률 바 확인
    const progressBar = page.getByRole('progressbar');
    await expect(progressBar).toHaveAttribute('aria-valuenow', /[1-9]/);

    // 완료 대기
    await expect(page.getByTestId('job-status')).toHaveText('완료', { timeout: 60000 });

    // 통계 확인
    await expect(page.getByText(/총 \d+ 건 전송/)).toBeVisible();
  });

  test('데이터 일관성 체크', async ({ page }) => {
    await page.goto('/jobs/job-123');

    // 일관성 체크 실행
    await page.getByRole('button', { name: '일관성 체크' }).click();

    // 체크 결과 대기
    await expect(page.getByTestId('consistency-result')).toBeVisible({ timeout: 30000 });

    // 일치하는 레코드 수
    const matchedCount = await page.getByTestId('matched-count').textContent();
    expect(parseInt(matchedCount!)).toBeGreaterThan(0);

    // 불일치 레코드가 있으면 표시
    const mismatchedRows = page.getByTestId('mismatched-row');
    const count = await mismatchedRows.count();

    if (count > 0) {
      // 첫 번째 불일치 항목 확인
      await expect(mismatchedRows.first()).toBeVisible();

      // 상세 정보 펼치기
      await mismatchedRows.first().getByRole('button', { name: '상세' }).click();
      await expect(page.getByText('소스 값')).toBeVisible();
      await expect(page.getByText('대상 값')).toBeVisible();
    }
  });

  test('에러 처리', async ({ page }) => {
    // 네트워크 에러 시뮬레이션
    await page.route('**/api/jobs/job-123/run', (route) => {
      route.abort('failed');
    });

    await page.goto('/jobs/job-123');
    await page.getByRole('button', { name: '실행' }).click();

    // 에러 토스트 메시지
    await expect(page.getByRole('alert')).toContainText('네트워크 오류');

    // 재시도 버튼
    await expect(page.getByRole('button', { name: '재시도' })).toBeVisible();
  });

  test('동시 작업 제한', async ({ page }) => {
    await page.goto('/jobs');

    // 이미 3개 실행 중인 상태 모킹
    await page.route('**/api/jobs/active-count', (route) => {
      route.fulfill({ body: JSON.stringify({ count: 3 }) });
    });

    // 새 작업 실행 시도
    await page.getByRole('row').first().getByRole('button', { name: '실행' }).click();

    // 경고 메시지
    await expect(page.getByText('동시 실행 가능한 최대 작업 수(3개)에 도달했습니다')).toBeVisible();
  });
});

// 헬퍼 함수
import type { Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await page.waitForURL('/dashboard');
}
```

### 인증 상태 재사용

매번 로그인하면 느리므로 상태를 저장해서 재사용합니다.

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('이메일').fill('admin@example.com');
  await page.getByLabel('비밀번호').fill('admin123');
  await page.getByRole('button', { name: '로그인' }).click();

  await page.waitForURL('/dashboard');

  // 인증 상태 저장
  await page.context().storageState({ path: authFile });
});
```

설정 파일에서 사용:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // 인증 설정
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // 인증이 필요한 테스트
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

## 마무리

Playwright를 활용하면 실제 사용자 경험을 자동으로 검증할 수 있습니다.

**핵심 정리:**

1. **E2E 테스트:** 전체 시스템 통합을 사용자 관점에서 검증
2. **Locator 전략:** getByRole > getByLabel > getByTestId 순으로 선택
3. **자동 대기:** Playwright는 요소가 준비될 때까지 자동으로 대기
4. **네트워크 모킹:** 실제 API 없이도 모든 시나리오 테스트 가능
5. **CI/CD 통합:** GitHub Actions로 PR마다 자동 테스트
6. **인증 재사용:** 상태 저장으로 테스트 속도 향상

다음 글에서는 React 성능 최적화 기법을 알아보겠습니다.
