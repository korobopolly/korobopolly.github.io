---
title: "Claude Code Hooks 시스템으로 워크플로우 자동화하기"
date: 2026-02-16T13:03:00+09:00
draft: false
tags: ["Claude Code", "Hooks", "자동화", "워크플로우"]
categories: ["Claude Code"]
series: "Claude Code"
description: "Claude Code의 Hooks 시스템을 활용하여 도구 실행 전후 자동화 워크플로우를 구축하는 방법"
---

## Hooks 시스템 개요

Claude Code의 Hooks는 도구 실행의 특정 시점에 자동으로 쉘 명령을 실행할 수 있는 자동화 메커니즘입니다. 파일을 편집할 때마다 자동으로 린팅을 실행하거나, 세션 시작 시 프로젝트 컨텍스트를 로딩하거나, 특정 도구 호출 후 알림을 보내는 등 다양한 자동화가 가능합니다.

Hooks는 개발 워크플로우를 크게 개선할 수 있습니다. 반복적인 작업을 자동화하고, 코드 품질을 즉각적으로 검증하며, 작업 흐름을 방해하지 않으면서도 필요한 체크를 수행할 수 있습니다.

## Hook 이벤트 타입

Claude Code는 네 가지 주요 이벤트 타입을 제공합니다.

### PreToolUse - 도구 실행 전

도구가 실행되기 직전에 트리거됩니다. 주로 사전 검증이나 준비 작업에 사용합니다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'About to write file...'"
          }
        ]
      }
    ]
  }
}
```

### PostToolUse - 도구 실행 후

도구 실행이 완료된 직후에 트리거됩니다. 결과 검증이나 후속 작업에 유용합니다.

```json
{
  "hooks": {
    "PostToolUse": [
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

### SessionStart - 세션 시작

Claude Code 세션이 시작될 때 한 번 실행됩니다. 환경 설정이나 초기화 작업에 적합합니다.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git fetch origin"
          }
        ]
      }
    ]
  }
}
```

### UserPromptSubmit - 프롬프트 제출

사용자가 프롬프트를 제출할 때마다 실행됩니다. 사용자 입력에 따른 동적 처리에 사용합니다.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'User submitted a prompt'"
          }
        ]
      }
    ]
  }
}
```

## Hook 설정 방법

Hooks는 `.claude/settings.json` 파일에서 설정합니다.

### 기본 구조

```json
{
  "hooks": {
    "이벤트타입": [
      {
        "matcher": "도구이름",
        "hooks": [
          {
            "type": "command",
            "command": "실행할 명령어"
          }
        ]
      }
    ]
  }
}
```

### matcher 패턴

matcher는 어떤 도구에 대해 hook을 실행할지 지정합니다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [{ "type": "command", "command": "npm run lint" }]
      },
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "npm run format" }]
      }
    ]
  }
}
```

특정 도구에만 적용하려면 도구 이름을 정확히 명시합니다. 모든 도구에 적용하려면 matcher를 생략하거나 정규식을 사용할 수 있습니다.

## 컨텍스트 변수

Hook 명령어에서는 다음 환경변수를 사용할 수 있습니다.

- `tool_name`: 실행된 도구 이름 (예: Edit, Write, Bash)
- `tool_input`: 도구에 전달된 입력 (JSON 문자열)
- `tool_response`: 도구 실행 결과 (PostToolUse에서만 사용 가능)
- `session_id`: 현재 세션 ID
- `cwd`: 현재 작업 디렉토리

### 변수 활용 예시

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"Edited file in session: $session_id\""
          }
        ]
      }
    ]
  }
}
```

## 실전 예시 1: 파일 편집 후 자동 린팅

코드를 편집할 때마다 자동으로 ESLint를 실행하여 즉시 문제를 발견할 수 있습니다.

### settings.json 설정

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint-staged 2>&1 || echo 'Lint found issues'"
          }
        ]
      }
    ]
  }
}
```

### package.json 설정

```json
{
  "scripts": {
    "lint-staged": "eslint --fix $(git diff --name-only --cached | grep '\\.js$')"
  }
}
```

이렇게 설정하면 파일을 편집할 때마다 자동으로 ESLint가 실행되고, 가능한 문제는 자동으로 수정됩니다.

### Hook 실행 흐름

```
1. Claude Code가 Edit 도구 실행
2. 파일 수정 완료
3. PostToolUse hook 트리거
4. npm run lint-staged 실행
5. ESLint가 수정된 파일 검사
6. 자동 수정 가능한 문제 해결
7. 결과를 Claude Code에 전달
```

## 실전 예시 2: 세션 시작 시 프로젝트 컨텍스트 로딩

세션이 시작될 때 자동으로 프로젝트 정보를 로드하여 Claude Code가 프로젝트를 더 잘 이해하도록 합니다.

### 컨텍스트 로더 스크립트

```bash
#!/bin/bash
# .claude/scripts/load-context.sh

echo "Loading project context..."

# Git 정보 수집
BRANCH=$(git rev-parse --abbrev-ref HEAD)
LAST_COMMIT=$(git log -1 --oneline)

# 프로젝트 구조 분석
FILE_COUNT=$(find src -type f | wc -l)
JS_FILES=$(find src -name "*.js" | wc -l)
TS_FILES=$(find src -name "*.ts" | wc -l)

# 의존성 확인
HAS_ESLINT=$(grep -q "eslint" package.json && echo "yes" || echo "no")
HAS_PRETTIER=$(grep -q "prettier" package.json && echo "yes" || echo "no")

# 컨텍스트 정보 출력
cat <<EOF
Project Context Loaded:
- Branch: $BRANCH
- Last commit: $LAST_COMMIT
- Total files: $FILE_COUNT
- JavaScript files: $JS_FILES
- TypeScript files: $TS_FILES
- ESLint configured: $HAS_ESLINT
- Prettier configured: $HAS_PRETTIER
EOF
```

### Hook 설정

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/scripts/load-context.sh"
          }
        ]
      }
    ]
  }
}
```

세션이 시작될 때마다 이 스크립트가 실행되어 프로젝트 상태를 요약하여 Claude Code에 제공합니다.

## 실전 예시 3: 테스트 자동 실행

코드를 수정한 후 관련 테스트를 자동으로 실행하여 즉시 피드백을 받을 수 있습니다.

### 스마트 테스트 러너

```bash
#!/bin/bash
# .claude/scripts/smart-test.sh

# tool_input에서 수정된 파일 경로 추출
MODIFIED_FILE=$(echo "$tool_input" | jq -r '.file_path // empty')

if [ -z "$MODIFIED_FILE" ]; then
  echo "No file path found"
  exit 0
fi

# 파일 이름에서 테스트 파일 추론
TEST_FILE="${MODIFIED_FILE%.js}.test.js"

if [ -f "$TEST_FILE" ]; then
  echo "Running tests for $MODIFIED_FILE..."
  npm test -- "$TEST_FILE"
else
  echo "No test file found for $MODIFIED_FILE"
fi
```

### Hook 설정

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/scripts/smart-test.sh"
          }
        ]
      }
    ]
  }
}
```

이제 `src/utils/format.js`를 수정하면 자동으로 `src/utils/format.test.js`가 실행됩니다.

## 고급 기능: 조건부 실행

특정 조건에서만 hook을 실행하도록 스크립트를 작성할 수 있습니다.

### 조건부 린팅

```bash
#!/bin/bash
# .claude/scripts/conditional-lint.sh

# JavaScript/TypeScript 파일만 린트
MODIFIED_FILE=$(echo "$tool_input" | jq -r '.file_path // empty')

if [[ "$MODIFIED_FILE" =~ \.(js|ts|jsx|tsx)$ ]]; then
  echo "Linting $MODIFIED_FILE..."
  npx eslint "$MODIFIED_FILE" --fix
else
  echo "Skipping lint for non-JS file: $MODIFIED_FILE"
fi
```

### 브랜치별 검증

```bash
#!/bin/bash
# .claude/scripts/branch-check.sh

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "WARNING: You are on the main branch!"
  echo "Running full test suite..."
  npm test
else
  echo "On branch: $CURRENT_BRANCH - running quick checks only"
  npm run lint
fi
```

## 매처 패턴 고급 활용

여러 도구에 동일한 hook을 적용하거나, 특정 패턴의 도구만 선택할 수 있습니다.

### 여러 도구에 적용

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [{ "type": "command", "command": "npm run format" }]
      },
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "npm run format" }]
      }
    ]
  }
}
```

### 모든 도구에 적용

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo \"Tool executed: $tool_name\""
          }
        ]
      }
    ]
  }
}
```

matcher를 생략하면 모든 도구에 대해 hook이 실행됩니다.

## 디버깅 및 문제 해결

### Hook 실행 로그 확인

Hook이 예상대로 작동하지 않을 때는 로그를 확인합니다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo \"[DEBUG] tool_name=$tool_name tool_input=$tool_input\" >> /tmp/claude-hooks.log && npm run lint"
          }
        ]
      }
    ]
  }
}
```

`/tmp/claude-hooks.log` 파일에서 hook이 실제로 실행되었는지, 어떤 컨텍스트 변수가 전달되었는지 확인할 수 있습니다.

### 에러 처리

Hook 실행이 실패해도 Claude Code의 주 작업은 계속됩니다. 하지만 에러를 명시적으로 처리하면 더 나은 피드백을 받을 수 있습니다.

```bash
#!/bin/bash
# .claude/scripts/safe-lint.sh

set -e  # 에러 발생 시 즉시 종료

if ! command -v eslint &> /dev/null; then
  echo "ESLint not found. Skipping lint."
  exit 0
fi

if ! npx eslint "$MODIFIED_FILE" --fix; then
  echo "ESLint found issues that could not be auto-fixed"
  echo "Please review the errors above"
  exit 1
fi
```

### Hook 비활성화

디버깅 중 일시적으로 hook을 비활성화하려면 환경변수를 사용합니다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "[ \"$DISABLE_HOOKS\" != \"true\" ] && npm run lint || echo 'Hooks disabled'"
          }
        ]
      }
    ]
  }
}
```

```bash
# Hooks 비활성화하고 Claude Code 실행
DISABLE_HOOKS=true claude
```

## Hook 활용 모범 사례

### 빠른 피드백 우선

Hook은 즉각적으로 실행되므로 빠른 작업을 우선합니다. 느린 테스트나 빌드는 별도 CI/CD에서 실행하는 것이 좋습니다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint"
          }
        ]
      }
    ]
  }
}
```

전체 테스트 스위트는 포함하지 않습니다.

### 멱등성 보장

Hook은 여러 번 실행될 수 있으므로 멱등성을 보장해야 합니다.

```bash
# 나쁜 예: 매번 파일에 추가
echo "lint result" >> results.log

# 좋은 예: 덮어쓰기
echo "lint result" > results.log
```

### 명확한 피드백

Hook 실행 결과를 명확히 출력하여 사용자가 무슨 일이 일어났는지 알 수 있도록 합니다.

```bash
echo "Running ESLint on modified files..."
npm run lint
echo "Lint complete"
```

## 마무리

Claude Code의 Hooks 시스템은 개발 워크플로우를 자동화하는 강력한 도구입니다. 파일 편집 후 자동 린팅, 세션 시작 시 컨텍스트 로딩, 조건부 테스트 실행 등 다양한 자동화를 구현할 수 있습니다.

효과적인 hook 설정은 반복 작업을 줄이고 코드 품질을 즉시 검증하여 개발 생산성을 크게 향상시킵니다. 프로젝트의 특성에 맞는 hook을 설정하여 더 스마트한 개발 환경을 구축해보세요.