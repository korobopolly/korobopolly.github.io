---
title: "oh-my-claudecode 소개 - 에이전트 카탈로그, 모델 라우팅, 상태 관리"
date: 2026-02-16T13:06:00+09:00
draft: false
tags: ["OMC", "에이전트", "플러그인", "AI코딩"]
categories: ["OMC"]
series: "OMC 플러그인"
description: "oh-my-claudecode(OMC) 플러그인의 아키텍처와 핵심 개념을 소개합니다"
---

## OMC란 무엇인가

oh-my-claudecode(OMC)는 Claude Code를 위한 멀티 에이전트 오케스트레이션 레이어입니다. Claude Code의 기본 기능 위에서 동작하며, Hooks와 MCP(Model Context Protocol) 도구를 활용하여 복잡한 소프트웨어 개발 작업을 여러 전문화된 AI 에이전트들이 협업하여 처리할 수 있도록 합니다.

단일 AI 에이전트가 모든 작업을 처리하는 대신, OMC는 각 작업의 특성에 맞는 전문 에이전트에게 업무를 위임합니다. 코드 탐색, 아키텍처 설계, 구현, 테스트, 검증, 리뷰 등 각 단계마다 최적화된 에이전트가 투입되어 작업의 품질과 효율성을 극대화합니다.

## Quick Start

### Step 1: Install

Claude Code 플러그인 마켓플레이스에서 설치합니다.

```text
/plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
/plugin install oh-my-claudecode
```

### Step 2: Setup

설치 후 초기 설정을 실행합니다.

```text
/oh-my-claudecode:omc-setup
```

### Step 3: Build something

바로 사용해보세요. 나머지는 전부 자동입니다.

```text
autopilot: build a REST API for managing tasks
```

## 에이전트 카탈로그

OMC는 다양한 역할의 전문 에이전트를 제공합니다. 각 에이전트는 특정 작업에 최적화된 프롬프트와 워크플로우를 가지고 있습니다.

### Build/Analysis 레인

개발 과정의 핵심 단계를 담당하는 에이전트들입니다.

- **explore**: 코드베이스 탐색과 파일/심볼 매핑. 프로젝트 구조를 빠르게 파악하고 관련 코드를 찾아냅니다.
- **analyst**: 요구사항 명확화, 수용 기준 정의, 숨겨진 제약사항 발견
- **planner**: 작업 순서 계획, 실행 계획 수립, 리스크 플래깅
- **architect**: 시스템 설계, 경계와 인터페이스 정의, 장기적 트레이드오프 고려
- **executor**: 코드 구현, 리팩토링, 기능 개발의 실질적 작업 수행
- **deep-executor**: 복잡한 자율적 목표 지향 작업 처리
- **debugger**: 근본 원인 분석, 리그레션 격리, 실패 진단
- **verifier**: 완성도 증명, 주장 검증, 테스트 적정성 확인

### Review 레인

코드 품질을 보장하는 리뷰 전문 에이전트들입니다.

- **style-reviewer**: 포매팅, 네이밍, 관용구, 린트 규칙 준수 검토
- **quality-reviewer**: 로직 결함, 유지보수성, 안티패턴 탐지
- **api-reviewer**: API 계약, 버저닝, 하위 호환성 검증
- **security-reviewer**: 취약점, 신뢰 경계, 인증/인가 보안 검토
- **performance-reviewer**: 핫스팟, 복잡도, 메모리/레이턴시 최적화
- **code-reviewer**: 여러 관심사를 아우르는 종합 리뷰

### Domain 스페셜리스트

특정 영역의 전문성을 제공하는 에이전트들입니다.

- **test-engineer**: 테스트 전략, 커버리지, 플래키 테스트 강화
- **build-fixer**: 빌드/툴체인/타입 오류 해결
- **designer**: UX/UI 아키텍처, 인터랙션 디자인
- **writer**: 문서화, 마이그레이션 노트, 사용자 가이드 작성

## 모델 라우팅

OMC는 작업의 복잡도에 따라 적절한 Claude 모델을 선택할 수 있습니다.

- **haiku**: 빠른 검색, 경량 작업, 간단한 스캔에 적합
- **sonnet**: 표준 구현, 디버깅, 리뷰 작업에 적합
- **opus**: 아키텍처 설계, 심층 분석, 복잡한 리팩토링에 적합

Task 호출 시 model 파라미터로 명시할 수 있습니다:

```text
Task(subagent_type="oh-my-claudecode:architect", model="opus", prompt="이 모듈의 경계를 요약해줘")
Task(subagent_type="oh-my-claudecode:executor", model="sonnet", prompt="로그인 플로우에 입력 검증 추가")
Task(subagent_type="oh-my-claudecode:explorer", model="haiku", prompt="인증 관련 파일 찾기")
```

올바른 모델 선택은 작업 품질과 비용 효율성 모두를 최적화합니다.

## MCP 도구 통합

OMC는 외부 AI 모델을 MCP 프로토콜을 통해 통합합니다.

### ask_codex

OpenAI의 gpt-5.3-codex 모델을 사용합니다. 코드 분석, 계획 검증, 비평, 리뷰에 특화되어 있습니다.

권장 역할: architect, planner, critic, analyst, code-reviewer, security-reviewer, tdd-guide

```text
mcp__x__ask_codex(
  agent_role="architect",
  prompt="이 API 설계의 확장성 문제를 분석해줘",
  context_files=["src/api/routes.ts", "src/api/middleware.ts"]
)
```

### ask_gemini

Google의 gemini-3-pro-preview 모델을 사용합니다. 1M 토큰 컨텍스트 윈도우로 대용량 파일 분석과 디자인 리뷰에 특화되어 있습니다.

권장 역할: designer, writer, vision

```text
mcp__g__ask_gemini(
  agent_role="designer",
  prompt="이 컴포넌트 구조의 UX 개선점을 제안해줘",
  files=["src/components/**/*.tsx"]
)
```

MCP 도구는 Claude 에이전트보다 빠르고 비용 효율적이며, 읽기 전용 분석 작업에 권장됩니다.

## 상태 관리

OMC는 작업 모드의 상태를 추적하고 지속합니다.

```text
state_write(mode="autopilot", active=true, iteration=3, current_phase="implementation")
state_read(mode="autopilot")
state_clear(mode="autopilot")
```

지원되는 모드: autopilot, ultrapilot, team, pipeline, ralph, ultrawork, ultraqa, ecomode

모든 상태 파일은 `{worktree}/.omc/state/` 디렉토리에 저장됩니다.

## Notepad - 세션 메모리

프로젝트별 메모를 관리하는 notepad 시스템을 제공합니다.

```text
notepad_write_priority("이 프로젝트는 항상 TypeScript strict 모드 사용")
notepad_write_working("API 엔드포인트 /auth/login 구현 완료")
notepad_write_manual("데이터베이스 마이그레이션은 수동으로만 실행")
```

- **priority**: 500자 이하 권장, 세션 시작 시 항상 로드, 영구 보존
- **working**: 타임스탬프 자동 추가, 7일 후 자동 정리
- **manual**: 영구 보존, 자동 정리 없음

notepad는 `{worktree}/.omc/notepad.md`에 저장됩니다.

## Project Memory - 프로젝트 지식베이스

프로젝트의 기술 스택, 빌드 규칙, 컨벤션을 영구 저장합니다.

```text
project_memory_write({
  techStack: "React 18, TypeScript 5, Vite 4",
  build: "npm run build",
  conventions: "모든 컴포넌트는 함수형, props는 interface로 정의",
  structure: "src/components - 재사용 컴포넌트, src/pages - 페이지 컴포넌트"
})

project_memory_add_note("build", "프로덕션 빌드 전 반드시 타입 체크 실행")
project_memory_add_directive("항상 에러 바운더리로 컴포넌트 래핑", priority="high")
```

Project Memory는 `{worktree}/.omc/project-memory.json`에 저장되며 세션 간 공유됩니다.

## 마무리

OMC는 Claude Code의 능력을 멀티 에이전트 협업으로 확장합니다. 각 에이전트는 특정 작업에 최적화되어 있으며, 모델 라우팅과 MCP 통합으로 비용과 성능을 모두 최적화할 수 있습니다.

다음 글에서는 OMC의 Autopilot과 Ralph 모드를 통해 아이디어에서 완성된 코드까지 완전 자동화하는 방법을 살펴보겠습니다.