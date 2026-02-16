---
title: "Claude Code Plan Mode 완벽 가이드 - 체계적인 코드 설계"
date: 2026-02-16T13:01:00+09:00
draft: false
tags: ["Claude Code", "Plan Mode", "코드설계", "AI코딩"]
categories: ["Claude Code"]
series: "Claude Code"
description: "Claude Code의 Plan Mode를 활용한 체계적인 코드 설계와 컨텍스트 관리 전략을 알아봅니다"
---

## Plan Mode란 무엇인가

Claude Code의 Plan Mode는 복잡한 코드 변경 작업을 시작하기 전에 체계적인 설계와 탐색을 수행할 수 있는 특별한 작업 모드입니다. EnterPlanMode 도구를 통해 진입하며, 이 모드에서는 코드를 직접 수정하지 않고 코드베이스를 탐색하고 설계 문서를 작성하는 데 집중합니다.

Plan Mode의 핵심 철학은 "생각 먼저, 구현은 나중에"입니다. 특히 멀티파일 변경이나 아키텍처 결정이 필요한 상황에서 성급한 코드 수정으로 인한 시행착오를 크게 줄일 수 있습니다.

## Plan Mode를 사용해야 하는 시나리오

Plan Mode는 모든 작업에 필요한 것은 아닙니다. 다음과 같은 경우에 특히 유용합니다.

### 새로운 기능 구현

기존 코드베이스에 새로운 기능을 추가할 때, 어떤 파일들을 수정해야 하고 어떤 인터페이스를 설계해야 하는지 먼저 파악하는 것이 중요합니다.

### 멀티파일 변경

3개 이상의 파일을 수정해야 하는 작업이라면 Plan Mode를 통해 변경 범위와 영향도를 먼저 분석하는 것이 좋습니다.

### 아키텍처 결정

새로운 모듈 구조를 설계하거나 기존 아키텍처를 리팩토링할 때는 전체적인 구조를 먼저 계획해야 합니다.

### 불명확한 요구사항

요구사항이 모호하거나 기존 코드의 동작 방식을 먼저 이해해야 하는 경우, Plan Mode에서 탐색 후 명확한 계획을 세울 수 있습니다.

## Plan Mode 워크플로우

### 1단계: Plan Mode 진입과 탐색

Plan Mode에 진입하면 Claude Code는 코드 수정 도구(Edit, Write 등)를 사용할 수 없고, 대신 탐색 도구에 집중합니다.

```bash
# 주로 사용하는 탐색 도구들
- Glob: 파일 패턴 검색
- Grep: 코드 내용 검색
- Read: 파일 읽기
```

예를 들어, 사용자 인증 시스템을 구현한다면 다음과 같이 탐색합니다.

```markdown
# 인증 관련 기존 코드 확인
- Glob로 auth 관련 파일 찾기: **/auth*.js, **/user*.js
- Grep으로 session 관련 코드 검색
- Read로 주요 파일 내용 확인
```

### 2단계: 설계 문서 작성

탐색한 내용을 바탕으로 구체적인 설계 계획을 작성합니다. 이 계획은 ExitPlanMode 시 사용자에게 제시됩니다.

```markdown
## 사용자 인증 시스템 설계 계획

### 파일 구조
- src/auth/authenticate.js (새 파일) - 인증 로직
- src/auth/middleware.js (새 파일) - Express 미들웨어
- src/models/User.js (수정) - 비밀번호 해싱 메서드 추가
- src/routes/auth.js (새 파일) - 로그인/로그아웃 라우트

### 주요 설계 결정
1. bcrypt를 사용한 비밀번호 해싱
2. JWT 토큰 기반 세션 관리
3. 기존 User 모델 확장 (재작성 불필요)

### 구현 순서
1. User 모델에 comparePassword 메서드 추가
2. authenticate.js에 로그인 로직 구현
3. 미들웨어로 보호된 라우트 처리
4. 라우트 통합 및 테스트
```

### 3단계: Plan Mode 종료와 승인

ExitPlanMode를 호출하면 작성한 계획이 사용자에게 제시됩니다. 사용자는 계획을 검토하고 승인하거나 수정을 요청할 수 있습니다.

### 4단계: 구현

계획이 승인되면 Claude Code는 설계 문서를 따라 실제 코드를 작성합니다. 이미 명확한 로드맵이 있기 때문에 구현이 빠르고 정확합니다.

## CLAUDE.md를 통한 컨텍스트 관리

Plan Mode의 효과를 극대화하려면 프로젝트별 컨텍스트를 잘 관리해야 합니다. CLAUDE.md 파일은 프로젝트 루트에 위치하며 프로젝트별 규칙과 지침을 정의합니다.

```markdown
# CLAUDE.md

## 프로젝트 개요
Node.js + Express + MongoDB 기반 REST API

## 코딩 스타일
- ESLint + Prettier 사용
- async/await 선호 (Promise 체인 지양)
- 에러는 항상 next(error)로 전달

## 아키텍처 규칙
- 컨트롤러는 routes/ 디렉토리
- 비즈니스 로직은 services/ 디렉토리
- 데이터 접근은 models/ 디렉토리

## 빌드 및 테스트
- 개발 서버: npm run dev
- 테스트: npm test
- 린트: npm run lint

## 중요 제약사항
- 인증은 JWT 토큰 방식만 사용
- 데이터베이스 마이그레이션은 migrate-mongo 사용
- 민감한 정보는 반드시 .env 파일에 저장
```

Claude Code는 Plan Mode에서 CLAUDE.md를 참고하여 프로젝트의 규칙과 패턴에 맞는 설계를 제안합니다.

## .claude/ 디렉토리 활용

프로젝트별 Claude Code 설정은 `.claude/` 디렉토리에 저장됩니다.

### settings.json

```json
{
  "planModeRequired": false,
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint-staged"
          }
        ]
      }
    ]
  }
}
```

### agents/ 디렉토리

커스텀 에이전트 정의를 저장할 수 있습니다. Plan Mode에서 특정 도메인 지식이 필요한 경우 유용합니다.

## 실전 예시: 사용자 인증 시스템 설계

실제로 Plan Mode를 사용하여 인증 시스템을 설계하는 전체 과정을 살펴보겠습니다.

### 초기 요청

"Express 앱에 JWT 기반 사용자 인증을 추가해주세요."

### Plan Mode 탐색

```javascript
// 1. 기존 User 모델 확인 (Glob + Read)
// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  passwordHash: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

// 2. Express 앱 구조 확인 (Grep "app.use")
// src/app.js에서 라우트 구조 파악
```

### 설계 계획 작성

```markdown
## 인증 시스템 구현 계획

### 새로운 의존성
- jsonwebtoken (JWT 생성/검증)
- bcrypt (비밀번호 해싱)

### 파일 변경사항

1. src/models/User.js (수정)
   - comparePassword 인스턴스 메서드 추가
   - hashPassword pre-save 훅 추가

2. src/middleware/auth.js (새 파일)
   - authenticateToken 미들웨어 구현

3. src/routes/auth.js (새 파일)
   - POST /auth/login
   - POST /auth/logout

4. src/app.js (수정)
   - auth 라우트 연결

### 보안 고려사항
- JWT secret은 환경변수로 관리
- 비밀번호는 bcrypt로 해싱 (saltRounds: 10)
- 토큰 만료 시간: 24시간
```

### 구현 코드 예시

계획 승인 후 생성되는 코드:

```javascript
// src/models/User.js (수정)
const bcrypt = require('bcrypt');

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

// src/middleware/auth.js (새 파일)
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };

// src/routes/auth.js (새 파일)
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## Plan Mode 활용 팁

### 간단한 작업에는 불필요

단일 파일 수정이나 명확한 버그 수정처럼 간단한 작업에는 Plan Mode가 오히려 비효율적입니다. 바로 구현하는 것이 낫습니다.

### 3개 이상 파일 변경 시 권장

여러 파일을 동시에 수정해야 한다면 Plan Mode로 전체 그림을 먼저 그리는 것이 좋습니다.

### 설계 문서는 구체적으로

"인증 추가"가 아니라 "User.js에 comparePassword 메서드 추가, auth.js 미들웨어 생성"처럼 구체적으로 작성합니다.

### 기존 코드 패턴 따르기

Plan Mode에서 기존 코드를 탐색할 때는 프로젝트의 기존 패턴과 관례를 파악하고 따라야 합니다.

## 마무리

Plan Mode는 복잡한 코드 변경 작업에서 체계적인 접근을 가능하게 합니다. 탐색과 설계를 먼저 수행하고, 명확한 계획을 세운 후 구현함으로써 시행착오를 줄이고 더 나은 코드를 작성할 수 있습니다.

특히 CLAUDE.md와 .claude/ 디렉토리를 통해 프로젝트별 컨텍스트를 잘 관리하면 Plan Mode의 효과가 극대화됩니다. 다음 번 복잡한 기능을 구현할 때는 Plan Mode를 활용해보세요.