---
title: "OMC Ecomode와 Ultrawork: 효율적 실행 전략"
date: 2026-02-16T13:09:00+09:00
description: "토큰 비용을 절약하는 Ecomode와 최대 병렬 처리를 위한 Ultrawork 모드 활용법"
tags: ["OMC", "Ecomode", "Ultrawork", "비용 최적화"]
series: "OMC 플러그인"
draft: false
---

## 실행 모드의 중요성

oh-my-claudecode(OMC)는 다양한 실행 모드를 제공하여 작업의 특성에 따라 최적의 전략을 선택할 수 있습니다. 그 중에서도 Ecomode와 Ultrawork는 서로 다른 목표를 가진 두 가지 핵심 모드입니다.

- **Ecomode**: 토큰 비용을 최소화하면서 합리적인 성능 유지
- **Ultrawork**: 실행 속도를 최대화하기 위한 공격적인 병렬 처리

이 두 모드를 이해하고 적절히 활용하면 비용과 성능 사이의 균형을 프로젝트 요구사항에 맞게 조정할 수 있습니다.

## Ecomode: 토큰 효율적 실행

### Ecomode란?

Ecomode는 가능한 한 적은 토큰을 사용하면서도 작업을 완수하는 것을 목표로 하는 실행 모드입니다. Claude 모델의 계층 구조를 활용하여 작업의 복잡도에 따라 적절한 모델을 자동 선택합니다.

### 모델 라우팅 전략

Ecomode는 다음과 같은 모델 라우팅 규칙을 적용합니다:

```
┌─────────────────────┬──────────────────┬─────────────────┐
│ 작업 유형           │ 기본 모드        │ Ecomode         │
├─────────────────────┼──────────────────┼─────────────────┤
│ 코드베이스 탐색     │ Sonnet           │ Haiku           │
│ 간단한 검색/조회    │ Sonnet           │ Haiku           │
│ 스타일 리뷰         │ Sonnet           │ Haiku           │
│ 문서 작성           │ Sonnet           │ Haiku           │
├─────────────────────┼──────────────────┼─────────────────┤
│ 코드 구현           │ Sonnet           │ Sonnet          │
│ 디버깅              │ Sonnet           │ Sonnet          │
│ 테스트 작성         │ Sonnet           │ Sonnet          │
│ 품질 리뷰           │ Opus             │ Sonnet          │
├─────────────────────┼──────────────────┼─────────────────┤
│ 아키텍처 설계       │ Opus             │ Opus            │
│ 복잡한 리팩토링     │ Opus             │ Opus            │
│ 전체 코드 리뷰      │ Opus             │ Opus            │
└─────────────────────┴──────────────────┴─────────────────┘
```

핵심 원칙:
- **Haiku 우선**: 단순 작업은 가장 저렴한 Haiku 모델 활용
- **Sonnet 적정 사용**: 구현과 분석은 Sonnet으로 처리
- **Opus 선택적 사용**: 복잡한 설계 결정만 Opus 활용

### Ecomode 활성화

Ecomode를 사용하는 방법은 여러 가지가 있습니다:

#### 1. 키워드로 활성화

대화 중 "eco", "ecomode", "budget" 키워드를 사용하면 자동 활성화됩니다.

```
"eco 모드로 블로그 포스트 5개 생성해줘"
"budget-friendly 방식으로 전체 테스트 실행"
```

#### 2. 슬래시 스킬로 활성화

```bash
/oh-my-claudecode:ecomode "Create 10 blog posts about React"
```

#### 3. 설정 파일로 기본값 지정

`~/.claude/.omc-config.json`에서 기본 실행 모드를 지정할 수 있습니다:

```json
{
  "defaultExecutionMode": "ecomode",
  "modelRouting": {
    "explore": "haiku",
    "executor": "sonnet",
    "planner": "sonnet",
    "architect": "opus"
  }
}
```

### Ecomode 사용 시나리오

#### 시나리오 1: 대량 콘텐츠 생성

블로그 포스트, 문서, 테스트 케이스 등 대량의 콘텐츠를 생성할 때 Ecomode가 효과적입니다.

```bash
/ecomode "Create 20 unit tests for the authentication module"
```

**비용 비교:**
- 기본 모드: Sonnet 20회 실행 = 높은 비용
- Ecomode: Haiku 15회 + Sonnet 5회 = 약 60% 비용 절감

#### 시나리오 2: 반복적인 리팩토링

여러 파일에 걸친 단순한 패턴 변경 작업:

```bash
/ecomode "Convert all class components to functional components"
```

Haiku가 파일 탐색과 단순 변환을 처리하고, Sonnet은 복잡한 상태 로직만 처리합니다.

#### 시나리오 3: 문서 업데이트

README, API 문서, 주석 업데이트 등:

```bash
/ecomode "Update all JSDoc comments to include TypeScript types"
```

문서 작성은 Haiku로도 충분하므로 큰 비용 절감 효과가 있습니다.

### Ecomode 제한사항

다음 상황에서는 Ecomode를 피하는 것이 좋습니다:

❌ **복잡한 버그 디버깅**
- Haiku는 복잡한 논리 추론에 한계가 있음
- 미묘한 버그를 놓칠 위험

❌ **아키텍처 의사결정**
- 시스템 설계는 Opus의 깊이 있는 분석 필요
- 잘못된 결정의 비용이 토큰 절약보다 큼

❌ **보안 검토**
- 보안 취약점은 절대 놓쳐서는 안 됨
- Opus 수준의 철저한 분석 필요

❌ **프로덕션 코드 리뷰**
- 품질 관련 타협 불가
- Sonnet 또는 Opus 사용 권장

## Ultrawork: 최대 병렬 처리

### Ultrawork란?

Ultrawork는 OMC의 공격적인 병렬 실행 모드입니다. 독립적인 작업들을 최대한 많이 동시에 실행하여 전체 완료 시간을 최소화합니다.

### 병렬 처리 전략

Ultrawork는 다음 원칙으로 작업을 병렬화합니다:

#### 1. 의존성 분석

작업 간 의존성을 자동으로 분석하여 병렬 실행 가능 여부를 판단합니다.

```
Task 1: Explore codebase          → 독립 실행 가능
Task 2: Read config files          → 독립 실행 가능
Task 3: Analyze dependencies       → Task 1 완료 후 실행
Task 4: Write documentation        → 독립 실행 가능
Task 5: Update tests               → Task 3 완료 후 실행
```

**병렬화 결과:**
- Wave 1: Task 1, 2, 4 동시 실행
- Wave 2: Task 3 실행 (Task 1 완료 대기)
- Wave 3: Task 5 실행 (Task 3 완료 대기)

#### 2. 에이전트 풀 관리

동시에 최대 20개의 에이전트를 실행할 수 있습니다:

```javascript
// Ultrawork 내부 로직 (개념적 표현)
const MAX_PARALLEL = 20;
const agentPool = [];

while (tasksRemaining) {
  const availableSlots = MAX_PARALLEL - agentPool.length;
  const readyTasks = getTasksWithNoBlockingDependencies();

  const tasksToSpawn = readyTasks.slice(0, availableSlots);
  tasksToSpawn.forEach(task => {
    agentPool.push(spawnAgent(task));
  });

  await Promise.race(agentPool); // 하나라도 완료되면 계속
}
```

#### 3. 작업 분할

큰 작업을 더 작은 독립적 단위로 분할합니다:

```
"Update 50 component files"
→
- Task 1: Update files 1-10
- Task 2: Update files 11-20
- Task 3: Update files 21-30
- Task 4: Update files 31-40
- Task 5: Update files 41-50

(5개 에이전트가 동시에 각 그룹 처리)
```

### Ultrawork 활성화

#### 1. 키워드로 활성화

"ulw", "ultrawork", "parallel", "fast" 등의 키워드 사용:

```
"ultrawork 모드로 전체 테스트 스위트 실행해줘"
"빠르게 모든 컴포넌트에 TypeScript 타입 추가"
```

#### 2. 슬래시 스킬로 활성화

```bash
/oh-my-claudecode:ultrawork "Refactor all API routes to use new error handling"
```

#### 3. 설정으로 기본값 지정

```json
{
  "defaultExecutionMode": "ultrawork",
  "parallelism": {
    "maxConcurrent": 20,
    "chunkSize": 10
  }
}
```

### Ultrawork 사용 시나리오

#### 시나리오 1: 대규모 마이그레이션

100개 파일의 import 경로를 변경하는 작업:

```bash
/ultrawork "Update all imports from '@/components' to '@/ui/components'"
```

**성능 비교:**
- 순차 실행: 100개 × 30초 = 50분
- Ultrawork (20개 병렬): 100개 ÷ 20 × 30초 = 2.5분
- **속도 향상: 20배**

#### 시나리오 2: 전체 테스트 실행

각 테스트 파일을 독립적으로 실행:

```bash
/ultrawork "Run all test files and collect coverage"
```

각 테스트 파일이 독립적이므로 완전한 병렬 실행이 가능합니다.

#### 시나리오 3: 다중 파일 분석

여러 파일을 동시에 분석하여 리포트 생성:

```bash
/ultrawork "Analyze all API routes for security vulnerabilities"
```

20개 에이전트가 각각 다른 라우트를 분석하여 시간을 크게 단축합니다.

### Ultrawork 주의사항

#### 1. API Rate Limiting

너무 많은 동시 요청은 API 제한에 걸릴 수 있습니다:

```json
{
  "parallelism": {
    "maxConcurrent": 10,  // 제한이 있다면 낮게 설정
    "requestDelay": 100    // 요청 간 지연 (ms)
  }
}
```

#### 2. 메모리 사용량

각 에이전트는 별도의 컨텍스트를 유지하므로 메모리를 소비합니다. 시스템 리소스를 모니터링하세요.

#### 3. 디버깅 어려움

병렬 실행 중 오류가 발생하면 원인 파악이 어려울 수 있습니다. 중요한 작업은 순차 실행을 고려하세요.

#### 4. 의존성 오판

자동 의존성 분석이 완벽하지 않을 수 있습니다. 명시적으로 의존성을 지정할 수 있습니다:

```bash
/ultrawork "Task A, then Task B (depends on A), Task C (independent)"
```

## Ecomode + Ultrawork 조합

두 모드를 함께 사용하여 비용 효율성과 속도를 동시에 얻을 수 있습니다:

```bash
/ecomode /ultrawork "Generate 50 test files for all components"
```

이 조합은:
- Ecomode: 각 에이전트가 Haiku 모델 사용 (비용 절감)
- Ultrawork: 20개 에이전트 병렬 실행 (속도 향상)

### 조합 활용 사례

#### 사례 1: 대량 문서 생성

```bash
/eco /ulw "Create API documentation for all 100 endpoints"
```

- Haiku로 각 엔드포인트 문서 생성 (저비용)
- 20개씩 병렬 처리 (빠른 완료)
- **결과**: 저비용 + 고속 실행

#### 사례 2: 테스트 스위트 확장

```bash
/ecomode /ultrawork "Add unit tests for all utility functions"
```

- 단순 테스트는 Haiku로 생성
- 복잡한 로직은 Sonnet으로 처리
- 모든 파일 동시 작업

#### 사례 3: 스타일 일관성 작업

```bash
/eco /ulw "Format all source files and update imports"
```

- 포맷팅은 Haiku로 충분
- 모든 파일 병렬 처리
- 빠르고 저렴한 완료

## 실행 모드 선택 가이드

### 의사결정 트리

```
작업 유형 파악
    │
    ├─ 시간이 중요한가?
    │   ├─ YES → Ultrawork 고려
    │   └─ NO → 비용이 중요한가?
    │       ├─ YES → Ecomode 고려
    │       └─ NO → 기본 모드
    │
    ├─ 많은 독립 작업인가?
    │   ├─ YES → Ultrawork 적합
    │   └─ NO → 순차 모드 또는 기본 Team
    │
    ├─ 단순 반복 작업인가?
    │   ├─ YES → Ecomode 적합
    │   └─ NO → 복잡도는?
    │       ├─ HIGH → Opus (기본 모드)
    │       └─ MEDIUM → Sonnet (Ecomode 가능)
    │
    └─ 품질이 최우선인가?
        ├─ YES → 기본 모드 (Opus 사용)
        └─ NO → Ecomode 또는 Ultrawork
```

### 상황별 권장 모드

| 상황 | 권장 모드 | 이유 |
|------|----------|------|
| 긴급 버그 수정 | 기본 모드 (Sonnet/Opus) | 품질과 정확성 우선 |
| 100개 파일 리팩토링 | Ultrawork | 병렬 처리로 시간 단축 |
| 문서 대량 생성 | Ecomode | Haiku로 충분, 비용 절감 |
| 아키텍처 설계 | 기본 모드 (Opus) | 깊이 있는 분석 필요 |
| 테스트 작성 (다수) | Eco + Ultra | 저비용 + 고속 |
| 보안 감사 | 기본 모드 (Opus) | 절대 타협 불가 |
| 스타일 일관성 작업 | Eco + Ultra | 단순 + 많은 파일 |

## 모니터링과 최적화

### 비용 추적

OMC는 모드별 토큰 사용량을 추적합니다:

```bash
# 세션 통계 확인
/oh-my-claudecode:trace-summary

# 출력 예시:
Mode: Ecomode
Total Tokens: 150,000
- Haiku: 100,000 (67%)
- Sonnet: 45,000 (30%)
- Opus: 5,000 (3%)
Estimated Cost: $2.50

Mode: Ultrawork
Parallel Agents: 20
Avg Completion Time: 3.2 minutes
Total Tokens: 200,000
```

### 성능 최적화 팁

#### 1. 작업 크기 조정

너무 작은 작업으로 쪼개면 오버헤드가 증가합니다:

```
❌ 나쁨: 500개 파일을 500개 작업으로 분할
✅ 좋음: 500개 파일을 25개 작업(각 20개 파일)으로 분할
```

#### 2. 적절한 모델 선택

Ecomode에서도 수동으로 모델을 지정할 수 있습니다:

```bash
/ecomode "Complex refactoring" --model sonnet  # Haiku 대신 Sonnet 강제
```

#### 3. 병렬도 조정

시스템 리소스에 따라 동시 실행 수를 조정하세요:

```json
{
  "parallelism": {
    "maxConcurrent": 10  // 기본 20에서 조정
  }
}
```

## 마치며

Ecomode와 Ultrawork는 OMC의 유연성을 보여주는 핵심 기능입니다. 프로젝트의 요구사항, 예산, 일정에 따라 적절한 모드를 선택하면 Claude Code를 더욱 효과적으로 활용할 수 있습니다.

**핵심 원칙:**
- 품질이 중요하면 → 기본 모드
- 시간이 중요하면 → Ultrawork
- 비용이 중요하면 → Ecomode
- 둘 다 중요하면 → Eco + Ultra 조합

처음에는 기본 모드로 시작하여 작업 패턴을 파악한 후, 점차 Ecomode나 Ultrawork를 실험해보세요. 경험이 쌓이면 상황에 맞는 최적의 모드를 자연스럽게 선택할 수 있게 될 것입니다.
