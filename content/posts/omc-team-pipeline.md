---
title: "OMC Team과 Pipeline - 멀티 에이전트 협업의 모든 것"
date: 2026-02-16T13:08:00+09:00
draft: false
tags: ["OMC", "Team", "Pipeline", "멀티에이전트"]
categories: ["OMC"]
series: "OMC 플러그인"
description: "OMC의 Team 모드와 Pipeline으로 여러 AI 에이전트가 협업하는 워크플로우를 구축합니다"
---

## 멀티 에이전트 협업의 필요성

복잡한 소프트웨어 프로젝트는 단일 개발자가 모든 것을 처리하기 어렵습니다. 프론트엔드, 백엔드, 데이터베이스, 테스트, 배포 등 각 영역은 서로 다른 전문성을 요구합니다. OMC의 Team과 Pipeline 모드는 이러한 현실을 AI 에이전트 세계에 그대로 적용합니다.

여러 전문 에이전트가 각자의 역할을 수행하고, 서로 통신하며, 의존성을 관리하고, 최종 목표를 향해 협업합니다. 마치 실제 개발팀처럼 작동하는 AI 팀을 구성할 수 있습니다.

## Team 모드 - 조직화된 협업

Team 모드는 Claude Code의 네이티브 팀 기능을 활용하여 여러 에이전트를 조직화하고 협업시킵니다.

### 기본 사용법

```
/team 5 "풀스택 블로그 애플리케이션 구축: React 프론트엔드, Express API, PostgreSQL 데이터베이스, 인증, 배포 설정"
```

숫자 5는 팀원 수를 의미합니다. Team 모드는 리드 에이전트를 포함하여 총 6개의 에이전트로 구성됩니다.

### Team 워크플로우

Team 모드는 리드 에이전트가 중심이 되어 작업을 조율합니다:

1. **작업 분해** (team-lead)
   - 사용자 요청을 구체적인 하위 작업으로 분할
   - 각 작업의 우선순위와 의존성 파악
   - 필요한 에이전트 역할 결정

2. **팀 생성**
   - TeamCreate로 팀 인스턴스 생성
   - 각 팀원에게 고유한 역할 부여 (worker-1, worker-2, ...)

3. **태스크 할당**
   - TaskCreate로 작업 생성
   - 의존성 설정 (addBlockedBy)
   - 각 팀원에게 작업 할당

4. **병렬 실행**
   - 블로킹되지 않은 작업들을 팀원들이 동시에 수행
   - 각 팀원은 할당된 작업을 독립적으로 완료

5. **진행 모니터링**
   - TaskList로 전체 진행 상황 추적
   - 완료된 작업은 의존 작업 언블로킹
   - 막힌 작업은 team-lead가 해결

6. **결과 통합**
   - 모든 작업 완료 확인
   - 통합 테스트 실행
   - 최종 검증 및 보고

### Staged Pipeline

Team 모드는 내부적으로 단계별 파이프라인을 실행합니다:

**team-plan → team-prd → team-exec → team-verify → team-fix**

각 단계는 전문화된 에이전트들을 사용합니다:

#### team-plan 단계
- **explore** (haiku): 코드베이스 탐색, 관련 파일 식별
- **planner** (opus): 작업 계획 수립, 순서 정의
- **analyst** (선택): 요구사항 명확화
- **architect** (선택): 시스템 설계 검토

#### team-prd 단계
- **analyst** (opus): 상세 요구사항과 수용 기준 작성
- **product-manager** (선택): 문제 프레이밍, 사용자 스토리
- **critic** (선택): 계획 검증 및 리스크 식별

#### team-exec 단계
- **executor** (sonnet): 핵심 코드 구현
- **designer** (sonnet): UI/UX 컴포넌트 작업
- **build-fixer** (sonnet): 빌드 및 타입 오류 해결
- **writer** (haiku): 문서 작성
- **test-engineer** (sonnet): 테스트 코드 작성
- **deep-executor** (opus): 복잡한 자율 작업

#### team-verify 단계
- **verifier** (sonnet): 완성도 검증
- **security-reviewer** (sonnet): 보안 검토
- **code-reviewer** (opus): 코드 품질 리뷰
- **quality-reviewer** (sonnet): 유지보수성 평가
- **performance-reviewer** (sonnet): 성능 분석

#### team-fix 단계
- **executor** (sonnet): 일반 버그 수정
- **build-fixer** (sonnet): 빌드 문제 해결
- **debugger** (sonnet): 복잡한 버그 분석 및 수정

### 단계 전환 규칙

- **team-plan → team-prd**: 계획과 분해 완료 시
- **team-prd → team-exec**: 수용 기준과 범위 명확화 시
- **team-exec → team-verify**: 모든 실행 작업이 완료 상태 도달 시
- **team-verify → team-fix** | **complete** | **failed**: 검증 결과에 따라 분기
- **team-fix → team-exec** | **team-verify** | **complete** | **failed**: 수정 후 재실행, 재검증, 또는 종료

team-fix 루프는 최대 시도 횟수로 제한되며, 초과 시 failed 상태로 전환됩니다.

## 팀원 간 통신

Team 모드에서 에이전트들은 SendMessage 도구로 통신합니다.

### 직접 메시지

특정 팀원에게 메시지 전송:

```
SendMessage(
  type="message",
  recipient="worker-2",
  content="Task #3 완료했습니다. API 엔드포인트 /api/posts가 준비되었으니 프론트엔드 연동 시작하셔도 됩니다.",
  summary="API 완료 알림"
)
```

### 브로드캐스트

전체 팀원에게 중요한 공지:

```
SendMessage(
  type="broadcast",
  content="데이터베이스 스키마가 변경되었습니다. 모든 팀원은 마이그레이션을 실행해주세요.",
  summary="스키마 변경 공지"
)
```

브로드캐스트는 비용이 높으므로 (팀원 수만큼 메시지 전송) 정말 필요한 경우만 사용합니다.

### 셧다운 요청

작업 완료 후 팀원에게 종료 요청:

```
SendMessage(
  type="shutdown_request",
  recipient="worker-3",
  content="할당된 모든 작업이 완료되었습니다. 종료해주세요."
)
```

팀원은 shutdown_response로 승인 또는 거부:

```
SendMessage(
  type="shutdown_response",
  request_id="abc-123",
  approve=true
)
```

## 태스크 관리

Team 모드의 핵심은 태스크 시스템입니다.

### 태스크 생성

```
TaskCreate(
  subject="API 엔드포인트 구현",
  description="RESTful API 엔드포인트 /api/posts CRUD 작업 구현. Express 라우터 사용, PostgreSQL 연동, 입력 검증 포함.",
  activeForm="API 엔드포인트 구현 중"
)
```

- **subject**: 작업 제목 (명령형: "구현", "수정", "테스트")
- **description**: 상세 설명과 수용 기준
- **activeForm**: 진행 중 표시 문구 (현재진행형: "구현 중", "테스트 중")

### 태스크 상태 변경

작업 시작:

```
TaskUpdate(taskId="1", status="in_progress")
```

작업 완료:

```
TaskUpdate(taskId="1", status="completed")
```

작업 삭제:

```
TaskUpdate(taskId="1", status="deleted")
```

### 의존성 설정

Task #2가 Task #1 완료 후에만 시작 가능:

```
TaskUpdate(taskId="2", addBlockedBy=["1"])
```

Task #3이 Task #4와 #5를 차단:

```
TaskUpdate(taskId="3", addBlocks=["4", "5"])
```

### 태스크 조회

전체 태스크 목록:

```
TaskList()
```

특정 태스크 상세 정보:

```
TaskGet(taskId="3")
```

## Pipeline 모드 - 순차 에이전트 체이닝

Pipeline 모드는 에이전트들을 순차적으로 연결하여 데이터를 전달합니다.

### 기본 사용법

```
/pipeline "사용자 피드백 데이터 분석 → 개선 사항 도출 → 기능 명세 작성 → 구현"
```

### 데이터 흐름

Pipeline은 각 단계의 출력을 다음 단계의 입력으로 전달합니다:

1. **scientist**: 피드백 데이터 분석
   - 출력: 통계 리포트, 주요 불만 사항

2. **analyst**: 개선 사항 도출
   - 입력: scientist의 분석 결과
   - 출력: 우선순위가 정해진 개선 항목

3. **product-manager**: 기능 명세 작성
   - 입력: analyst의 개선 항목
   - 출력: PRD 문서

4. **executor**: 구현
   - 입력: product-manager의 PRD
   - 출력: 완성된 코드

각 에이전트는 이전 에이전트의 결과물을 컨텍스트로 받아 작업합니다.

### Pipeline vs Team

**Pipeline 사용 시기:**
- 순차적 변환이 필요한 작업
- 각 단계가 이전 단계에 강하게 의존
- 데이터 파이프라인, 분석 워크플로우

**Team 사용 시기:**
- 병렬 실행 가능한 독립적 작업
- 대규모 프로젝트, 여러 영역 동시 작업
- 복잡한 의존성과 협업 필요

## Team + Ralph - 지속적 개선

Team과 Ralph를 결합하면 팀 전체가 목표 달성까지 반복 작업합니다.

### 사용법

```
/team ralph "완벽한 REST API 구축: 모든 엔드포인트 테스트 통과, 보안 검토 통과, 성능 기준 충족"
```

### 동작 방식

1. **Team 실행**: team-plan → team-prd → team-exec
2. **Team 검증**: team-verify
3. **Ralph 루프**: 검증 실패 시
   - team-fix: 문제점 수정
   - team-exec: 재실행
   - team-verify: 재검증
4. **성공 또는 최대 반복 도달 시 종료**

Team의 병렬 실행 능력과 Ralph의 반복 검증을 결합하여 품질과 속도를 모두 확보합니다.

## 실전 예시 - 풀스택 블로그 구축

5명의 에이전트로 풀스택 블로그 애플리케이션을 구축하는 과정:

### 초기 요청

```
/team 5 "풀스택 블로그: React 프론트엔드, Express API, PostgreSQL, JWT 인증, Tailwind CSS, 배포 설정"
```

### 팀 구성 및 작업 분배

**team-lead**가 다음과 같이 작업을 분해하고 할당합니다:

**worker-1 (Backend Engineer)**
- Task #1: PostgreSQL 스키마 설계 및 마이그레이션
- Task #2: Express API 엔드포인트 구현
- Task #3: JWT 인증 미들웨어

**worker-2 (Frontend Engineer)**
- Task #4: React 컴포넌트 구조 설계 (blocked by #1)
- Task #5: 포스트 목록/상세 페이지 구현 (blocked by #2)
- Task #6: 인증 플로우 UI (blocked by #3)

**worker-3 (Designer)**
- Task #7: Tailwind CSS 디자인 시스템
- Task #8: 반응형 레이아웃 구현

**worker-4 (Test Engineer)**
- Task #9: API 통합 테스트 (blocked by #2)
- Task #10: 프론트엔드 E2E 테스트 (blocked by #5)

**worker-5 (DevOps)**
- Task #11: Docker 컨테이너화
- Task #12: CI/CD 파이프라인 설정
- Task #13: 클라우드 배포 구성

### 실행 흐름

**0분**: worker-1(#1), worker-3(#7), worker-5(#11) 동시 시작
**15분**: #1 완료 → worker-2가 #4 시작
**20분**: #7 완료 → worker-3이 #8 시작
**30분**: #11 완료 → worker-5가 #12 시작
**35분**: worker-1이 #2 완료 → worker-2가 #5 시작, worker-4가 #9 시작
**50분**: worker-1이 #3 완료 → worker-2가 #6 시작
**65분**: #5 완료 → worker-4가 #10 시작
**80분**: 모든 작업 완료 → team-verify 단계 진입
**85분**: 검증 통과 → 프로젝트 완성

총 소요 시간: 약 85분 (순차 실행 시 약 300분 소요)

### 팀원 간 통신 예시

worker-1 → worker-2:

```
SendMessage(
  type="message",
  recipient="worker-2",
  content="API 엔드포인트가 준비되었습니다. GET /api/posts, POST /api/posts, GET /api/posts/:id, PUT /api/posts/:id, DELETE /api/posts/:id 모두 사용 가능합니다.",
  summary="API 준비 완료"
)
```

worker-3 → team-lead:

```
SendMessage(
  type="message",
  recipient="team-lead",
  content="디자인 시스템 완성. 모든 팀원은 tailwind.config.js의 커스텀 테마를 사용하세요.",
  summary="디자인 시스템 공유"
)
```

## 상태 지속성

Team 모드는 .omc/state/team-state.json에 상태를 저장합니다:

```json
{
  "active": true,
  "current_phase": "team-exec",
  "team_name": "fullstack-blog-team",
  "fix_loop_count": 0,
  "stage_history": ["team-plan", "team-prd", "team-exec"]
}
```

작업 중단 시에도 상태를 복구하여 이어서 진행할 수 있습니다.

## 작업 취소

모든 팀원에게 종료를 요청하고 팀을 해체:

```
/oh-my-claudecode:cancel
```

Team과 Ralph가 연결된 경우 두 모드 모두 취소됩니다.

## 마무리

OMC의 Team과 Pipeline 모드는 AI 에이전트들의 진정한 협업을 가능하게 합니다. Team은 실제 개발팀처럼 작업을 분배하고 병렬로 실행하며, Pipeline은 데이터를 단계별로 변환합니다.

여러 전문 에이전트가 각자의 강점을 발휘하고, 서로 통신하며, 공동의 목표를 향해 나아가는 모습은 미래의 소프트웨어 개발 방식을 보여줍니다. OMC와 함께라면 혼자서도 전체 팀의 생산성을 발휘할 수 있습니다.