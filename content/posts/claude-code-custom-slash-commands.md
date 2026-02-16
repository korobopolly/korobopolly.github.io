---
title: "Claude Code 커스텀 슬래시 커맨드 만들기"
date: 2026-02-16T13:02:00+09:00
description: "프로젝트에 맞는 커스텀 슬래시 커맨드를 만들어 반복 작업을 자동화하는 방법"
tags: ["Claude Code", "슬래시 커맨드", "자동화"]
categories: ["Claude Code"]
series: "Claude Code"
draft: false
---

## 슬래시 커맨드란?

Claude Code에서 슬래시 커맨드(Slash Command)는 `/commit`, `/plan`, `/review`처럼 `/`로 시작하는 단축 명령어입니다. 이 커맨드들은 복잡한 작업 지시를 간단한 한 줄로 실행할 수 있게 해주며, 반복적인 작업을 자동화하는 강력한 도구입니다.

내장 커맨드 외에도 프로젝트별로 커스텀 슬래시 커맨드를 정의하여 팀의 워크플로우에 맞는 자동화를 구축할 수 있습니다.

## 커스텀 커맨드의 필요성

### 반복 작업의 문제

다음과 같은 상황을 생각해봅시다:

```
"새 블로그 포스트를 만들어줘. 제목은 [title]이고, 날짜는 오늘,
태그는 [tags], 시리즈는 [series]로 설정하고,
/content/posts/ 디렉토리에 slug 형식으로 파일명 만들고,
프론트매터는 기존 포스트 형식 따라서..."
```

이런 지시를 매번 반복하는 것은 비효율적입니다. 커스텀 커맨드를 만들면:

```
/new-post "Next.js 서버 액션 가이드" --tags "Next.js, React" --series "Next.js 심화"
```

한 줄로 해결할 수 있습니다.

## 커맨드 파일 구조

Claude Code의 커스텀 커맨드는 `.claude/commands/` 디렉토리에 마크다운 파일로 정의됩니다.

### 기본 디렉토리 구조

```
your-project/
├── .claude/
│   ├── commands/
│   │   ├── new-post.md
│   │   ├── update-deps.md
│   │   ├── run-tests.md
│   │   └── deploy-preview.md
│   └── CLAUDE.md
├── src/
└── package.json
```

### 커맨드 파일 형식

각 커맨드 파일은 프론트매터와 프롬프트 본문으로 구성됩니다.

```markdown
---
description: "Create a new blog post with proper front matter"
args:
  - name: title
    description: "Post title"
    required: true
  - name: tags
    description: "Comma-separated tags"
    required: false
  - name: series
    description: "Series name"
    required: false
---

Create a new blog post with the following specifications:

Title: {{title}}
Date: {{currentDate}}
Tags: {{tags || "General"}}
Series: {{series || "none"}}

1. Generate a URL-friendly slug from the title
2. Create /content/posts/{slug}.md
3. Add proper front matter following our blog format
4. Include basic content structure with h2 headings
5. Open the file for editing

Front matter template:
```yaml
---
title: "{{title}}"
date: {{currentDate}}
description: "TODO: Add description"
tags: [{{tags}}]
{{#if series}}series: "{{series}}"{{/if}}
draft: false
---
```

Content template:
- Introduction section
- Main content sections (at least 2 h2 headings)
- Conclusion section
```

## 실전 커맨드 예제

### 1. 블로그 포스트 생성 커맨드

**`.claude/commands/new-post.md`**

```markdown
---
description: "Create a new blog post with Korean content structure"
args:
  - name: title
    description: "Post title in Korean"
    required: true
  - name: tags
    description: "Comma-separated tags"
    required: true
  - name: series
    description: "Series name (optional)"
    required: false
---

Create a new Korean blog post:

**Title:** {{title}}
**Date:** {{currentDate}}
**Tags:** {{tags}}
**Series:** {{series}}

## Steps:

1. Generate slug from title (romanized, lowercase, hyphens)
2. Create `/content/posts/{slug}.md` with this front matter:

```yaml
---
title: "{{title}}"
date: {{currentDate}}
description: "{{title}}에 대한 상세 가이드"
tags: [{{tags}}]
{{#if series}}series: "{{series}}"{{/if}}
draft: false
---
```

3. Add Korean blog post structure:
   - 서론 (h2): 주제 소개
   - 본론 (h2): 핵심 내용 (2-3개 섹션)
   - 실전 예제 (h2): 코드 예제 포함
   - 마치며 (h2): 요약 및 다음 단계

4. Minimum 1500 characters in Korean
5. Include at least 2 code blocks with proper language tags
6. Open the file for review

After creation, show me the file path and ask if I want to edit anything.
```

**사용 예:**
```
/new-post "React Server Components 완벽 가이드" --tags "React, Next.js, RSC" --series "Next.js 심화"
```

### 2. 의존성 업데이트 커맨드

**`.claude/commands/update-deps.md`**

```markdown
---
description: "Update project dependencies safely"
args:
  - name: scope
    description: "Update scope: all, prod, dev, or package-name"
    required: false
    default: "all"
---

Safely update project dependencies:

**Scope:** {{scope}}

## Process:

1. **Backup:** Create git commit with current state
   ```bash
   git add -A
   git commit -m "chore: backup before dependency update"
   ```

2. **Check outdated packages:**
   ```bash
   npm outdated
   ```

3. **Update based on scope:**
   {{#if (eq scope "all")}}
   ```bash
   npm update
   ```
   {{else if (eq scope "prod")}}
   ```bash
   npm update --save
   ```
   {{else if (eq scope "dev")}}
   ```bash
   npm update --save-dev
   ```
   {{else}}
   ```bash
   npm update {{scope}}
   ```
   {{/if}}

4. **Verify:**
   - Run `npm run typecheck`
   - Run `npm test`
   - Run `npm run build`

5. **Report:**
   - List updated packages with version changes
   - Show any breaking changes or warnings
   - Recommend manual testing areas

If any step fails, rollback with:
```bash
git reset --hard HEAD~1
```

Show me the results before committing the update.
```

**사용 예:**
```
/update-deps
/update-deps --scope next
/update-deps --scope dev
```

### 3. 테스트 실행 및 리포트 커맨드

**`.claude/commands/test-full.md`**

```markdown
---
description: "Run full test suite with coverage report"
args:
  - name: watch
    description: "Run in watch mode"
    required: false
    default: false
---

Run comprehensive test suite:

## Test Execution Plan:

1. **Type Check:**
   ```bash
   npm run typecheck
   ```

2. **Linting:**
   ```bash
   npm run lint
   ```

3. **Unit Tests:**
   {{#if watch}}
   ```bash
   npm test -- --watch
   ```
   {{else}}
   ```bash
   npm test -- --coverage
   ```
   {{/if}}

4. **Build Verification:**
   ```bash
   npm run build
   ```

## Report Format:

After all tests complete, provide:

### ✅ Pass/Fail Status
- TypeScript: [PASS/FAIL]
- Linting: [PASS/FAIL]
- Unit Tests: [PASS/FAIL] (X/Y tests)
- Build: [PASS/FAIL]

### 📊 Coverage Summary (if applicable)
- Statements: X%
- Branches: X%
- Functions: X%
- Lines: X%

### ❌ Failures (if any)
List each failure with:
- Test name
- Error message
- File location
- Suggested fix

### 📝 Recommendations
- Areas needing more test coverage
- Flaky tests to investigate
- Performance concerns

Run all steps and show me the consolidated report.
```

**사용 예:**
```
/test-full
/test-full --watch
```

### 4. 배포 프리뷰 생성 커맨드

**`.claude/commands/deploy-preview.md`**

```markdown
---
description: "Create preview deployment and share URL"
args:
  - name: message
    description: "Deployment message/description"
    required: false
---

Create preview deployment:

**Message:** {{message || "Preview deployment"}}

## Deployment Steps:

1. **Pre-deployment checks:**
   - Verify no uncommitted changes (or auto-commit them)
   - Run `npm run build` to ensure production build works
   - Check for any critical errors or warnings

2. **Create preview branch:**
   ```bash
   git checkout -b preview/$(date +%Y%m%d-%H%M%S)
   ```

3. **Deploy to preview environment:**
   ```bash
   vercel deploy --prod=false
   ```

4. **Capture deployment info:**
   - Preview URL
   - Deployment ID
   - Commit SHA
   - Timestamp

5. **Generate shareable message:**
   ```
   🚀 Preview Deployment Ready

   📎 URL: [preview-url]
   💬 Message: {{message}}
   🔖 Commit: [sha]
   ⏰ Time: [timestamp]

   Test the following:
   - [ ] Homepage loads correctly
   - [ ] Blog posts render properly
   - [ ] Search functionality works
   - [ ] Navigation is functional
   ```

6. **Cleanup:**
   ```bash
   git checkout -
   git branch -D preview/*
   ```

Show me the preview URL and the test checklist.
```

**사용 예:**
```
/deploy-preview
/deploy-preview --message "Testing new search feature"
```

## 고급 패턴

### 1. 조건부 로직

Handlebars 템플릿 문법을 활용하여 조건부 동작을 정의할 수 있습니다.

```markdown
{{#if (eq environment "production")}}
Run full test suite including E2E tests
{{else}}
Run unit tests only
{{/if}}
```

### 2. 반복문

여러 항목을 처리할 때 유용합니다.

```markdown
{{#each files}}
Process file: {{this}}
- Check formatting
- Run linter
- Verify imports
{{/each}}
```

### 3. 변수와 헬퍼

내장 변수와 헬퍼 함수를 활용합니다.

```markdown
- Current date: {{currentDate}}
- Current time: {{currentTime}}
- Project root: {{projectRoot}}
- Git branch: {{gitBranch}}
```

## 베스트 프랙티스

### 1. 명확한 설명 작성

커맨드의 목적과 사용법을 description에 명확히 작성하세요.

```yaml
---
description: "Create API endpoint with TypeScript types, validation, and tests"
---
```

### 2. 필수/선택 인자 구분

사용자가 어떤 인자를 꼭 제공해야 하는지 명시하세요.

```yaml
args:
  - name: endpoint
    description: "API endpoint path (e.g., /api/users)"
    required: true
  - name: method
    description: "HTTP method (GET, POST, etc.)"
    required: true
  - name: auth
    description: "Require authentication"
    required: false
    default: true
```

### 3. 단계별 지시

복잡한 작업은 번호가 매겨진 단계로 나누어 작성하세요.

```markdown
1. First, do X
2. Then, verify Y
3. Finally, report Z
```

### 4. 안전장치 추가

실수를 방지하기 위한 확인 단계를 포함하세요.

```markdown
Before proceeding:
- Confirm no uncommitted changes will be lost
- Verify backup exists
- Check production safeguards are in place

Ask for confirmation before executing destructive operations.
```

### 5. 결과 보고 형식 정의

커맨드 실행 후 어떤 정보를 보여줄지 명시하세요.

```markdown
After completion, report:
- Files created/modified (with paths)
- Any errors or warnings encountered
- Next steps or recommendations
- Verification checklist
```

## 커맨드 관리 팁

### 1. 팀과 공유

`.claude/commands/` 디렉토리를 Git에 커밋하여 팀원들이 동일한 커맨드를 사용하도록 합니다.

```bash
git add .claude/commands/
git commit -m "Add custom slash commands for blog workflow"
```

### 2. 문서화

README.md나 별도 문서에 사용 가능한 커맨드 목록과 예제를 정리하세요.

```markdown
## Available Custom Commands

- `/new-post` - Create new blog post
- `/update-deps` - Update dependencies safely
- `/test-full` - Run complete test suite
- `/deploy-preview` - Create preview deployment
```

### 3. 정기적으로 리뷰

사용하지 않는 커맨드는 삭제하고, 자주 사용하는 워크플로우는 커맨드로 만드세요.

### 4. 버전 관리

커맨드 파일에 주석으로 변경 이력을 남기세요.

```markdown
<!--
Version: 1.2.0
Last updated: 2026-02-09
Changes:
- Added --series parameter support
- Improved slug generation for Korean titles
-->
```

## 마치며

커스텀 슬래시 커맨드는 Claude Code를 프로젝트의 워크플로우에 완벽하게 통합하는 강력한 방법입니다. 반복적인 작업을 자동화하고, 팀의 베스트 프랙티스를 코드화하며, 일관된 품질을 유지할 수 있습니다.

처음에는 간단한 커맨드 하나부터 시작하세요. 팀원들의 피드백을 받아 점진적으로 개선하다 보면, 프로젝트에 최적화된 커맨드 라이브러리를 구축할 수 있을 것입니다.
