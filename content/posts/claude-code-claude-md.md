---
title: "CLAUDE.md 가이드 - 프로젝트 컨텍스트 관리하기"
date: 2026-02-16T13:01:00+09:00
description: "CLAUDE.md 파일을 활용하여 Claude Code에 프로젝트 지침과 컨텍스트를 효과적으로 전달하는 방법"
tags: ["Claude Code", "CLAUDE.md", "프로젝트 설정"]
categories: ["Claude Code"]
series: "Claude Code"
draft: false
---

## CLAUDE.md란?

CLAUDE.md는 Claude Code에게 프로젝트별 컨텍스트와 작업 지침을 전달하는 특수한 마크다운 파일입니다. 이 파일을 프로젝트 루트에 두면 Claude Code가 세션 시작 시 자동으로 읽어들여 프로젝트의 규칙, 코딩 스타일, 아키텍처 결정사항 등을 이해하고 작업에 반영합니다.

전역 설정 파일인 `~/.claude/CLAUDE.md`와 달리, 프로젝트 루트의 `CLAUDE.md`는 해당 프로젝트에만 적용되며 팀원 간 공유가 가능하여 일관된 개발 경험을 제공합니다.

## CLAUDE.md의 주요 역할

### 1. 프로젝트 컨텍스트 제공

Claude Code에게 프로젝트의 목적, 기술 스택, 디렉토리 구조 등을 명시적으로 알려줄 수 있습니다.

```markdown
# Project Context

This is a Next.js 14 blog built with:
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS
- Content: MDX files in /content/posts/
- Deployment: Vercel

## Directory Structure
- /app: Next.js app router pages
- /components: React components
- /content/posts: Blog post MDX files
- /lib: Utility functions
```

### 2. 코딩 규칙과 스타일 가이드

팀의 코딩 컨벤션을 명시하여 Claude Code가 일관된 스타일로 코드를 작성하도록 유도합니다.

```markdown
## Coding Conventions

### TypeScript
- Always use strict mode
- Prefer type over interface for object types
- Use explicit return types for all functions
- No any types - use unknown instead

### React
- Use functional components only (no class components)
- Prefer named exports over default exports
- Use React Server Components by default
- Client components must have 'use client' directive
```

### 3. 작업 프로세스 및 워크플로우

프로젝트별 개발 워크플로우, 테스트 전략, 배포 프로세스를 문서화합니다.

```markdown
## Development Workflow

### Before Making Changes
1. Read existing code first - understand before modifying
2. Check for related tests
3. Verify the change aligns with our architecture

### After Implementation
1. Run `npm run typecheck` - must pass
2. Run `npm test` - all tests must pass
3. Run `npm run build` - verify production build succeeds
4. Manual testing in dev environment

### Git Workflow
- Feature branches: `feature/short-description`
- Commit messages: Follow conventional commits
- Always squash before merging to main
```

## CLAUDE.md 작성 모범 사례

### 1. 명확하고 구체적으로 작성

모호한 지침보다는 구체적인 예시와 함께 작성하는 것이 효과적입니다.

**나쁜 예:**
```markdown
- Write good error messages
```

**좋은 예:**
```markdown
- Error messages should be user-facing and actionable:
  ✅ "Email format invalid. Expected: user@example.com"
  ❌ "Invalid input"
```

### 2. 우선순위와 맥락 제공

모든 규칙이 동등하게 중요한 것은 아닙니다. 우선순위를 명시하세요.

```markdown
## Critical Rules (MUST follow)
- Never commit secrets or API keys
- All database queries must use prepared statements
- Authentication required for all /api/admin/* endpoints

## Style Preferences (SHOULD follow)
- Prefer functional programming patterns
- Use descriptive variable names
- Keep functions under 50 lines
```

### 3. 예제 코드 포함

실제 코드 예제를 포함하면 Claude Code가 패턴을 더 잘 이해합니다.

```markdown
## API Route Pattern

All API routes should follow this structure:

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1),
  content: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    // Business logic here

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```
```

### 4. 자주 발생하는 실수 명시

프로젝트에서 반복적으로 발생하는 문제를 미리 방지할 수 있습니다.

```markdown
## Common Mistakes to Avoid

❌ Don't use `fetch` in Server Components - use our `db` client directly
❌ Don't use `useEffect` for data fetching - use React Server Components
❌ Don't import from `@/components/index` - import directly from component files
❌ Don't use CSS modules - we use Tailwind only

✅ Do use Server Actions for mutations
✅ Do use `<Link>` instead of `<a>` for internal navigation
✅ Do use absolute imports with `@/` prefix
✅ Do validate all user input with Zod
```

## 실전 예시: 블로그 프로젝트 CLAUDE.md

다음은 실제 Next.js 블로그 프로젝트에서 사용할 수 있는 CLAUDE.md 예시입니다.

```markdown
# Blog Project - Claude Code Instructions

## Project Overview
Next.js 14 blog with MDX content, series support, and search functionality.

## Tech Stack
- Next.js 14.2+ (App Router, React Server Components)
- TypeScript 5.4+ (strict mode)
- Tailwind CSS 3.4+
- MDX for blog content
- Vercel for deployment

## File Organization

### Content Structure
- Blog posts: `/content/posts/*.md`
- Front matter required: title, date, description, tags, series (optional), draft
- Use ISO date format: YYYY-MM-DD

### Code Structure
- `/app`: Next.js app router (layouts, pages, API routes)
- `/components`: Reusable React components
- `/lib`: Utilities (mdx processing, search indexing, etc.)
- `/public`: Static assets (images, favicon, etc.)

## Development Rules

### Content Guidelines
1. All blog posts must include proper front matter
2. Code blocks must specify language for syntax highlighting
3. Use h2/h3 headings for automatic TOC generation
4. Keep line length under 100 characters for readability

### Code Standards
1. TypeScript strict mode - no implicit any
2. Named exports only (no default exports except page.tsx)
3. Server Components by default - add 'use client' only when needed
4. Tailwind for all styling - no CSS modules or inline styles

### Before Committing
- Run `npm run build` to verify production build
- Check that all MDX files have valid front matter
- Verify no hardcoded URLs (use env vars)
- Test search functionality if content changed

## Architecture Decisions

### Why Server Components?
We use React Server Components for all blog pages to:
- Reduce client-side JavaScript
- Improve SEO and initial page load
- Simplify data fetching

### Why MDX in /content?
- Version control friendly
- Easy to edit in any text editor
- Supports front matter for metadata
- Can embed React components when needed

## Common Tasks

### Adding a New Blog Post
1. Create `/content/posts/slug-name.md`
2. Add front matter (copy from existing post)
3. Write content with proper headings
4. Test locally: `npm run dev`
5. Verify in production build: `npm run build && npm start`

### Adding a New Component
1. Create in `/components/ComponentName.tsx`
2. Use named export: `export function ComponentName()`
3. Add TypeScript props interface
4. Use Tailwind for styling
5. Test in Storybook if applicable

## Don't Do This
- Don't modify /node_modules or /package-lock.json manually
- Don't use `any` type - use `unknown` or proper types
- Don't create new CSS files - use Tailwind
- Don't use client-side rendering for static content
- Don't commit commented-out code - delete it

## Workflow Preferences
- Read existing code before making changes
- Make surgical changes - only touch what's necessary
- Verify changes don't break existing functionality
- Keep commits focused and atomic
```

## CLAUDE.md 활용 팁

### 1. 점진적으로 발전시키기

처음부터 완벽한 CLAUDE.md를 작성하려 하지 마세요. 프로젝트를 진행하면서 Claude Code가 반복적으로 실수하는 부분이나 자주 설명해야 하는 내용을 추가해 나가세요.

### 2. 팀과 함께 관리하기

CLAUDE.md는 Git으로 관리되므로 팀원들과 함께 리뷰하고 개선할 수 있습니다. Pull Request를 통해 새로운 규칙을 추가하거나 오래된 내용을 업데이트하세요.

### 3. 프로젝트 문서와 동기화

README.md, CONTRIBUTING.md 등 다른 프로젝트 문서와 일관성을 유지하세요. 중복된 내용은 한 곳에만 두고 서로 참조하도록 합니다.

### 4. 너무 길어지지 않게 유지

CLAUDE.md가 너무 길면 Claude Code가 핵심 내용을 놓칠 수 있습니다. 중요한 규칙과 자주 참조할 내용 위주로 간결하게 유지하고, 상세한 내용은 별도 문서로 분리하세요.

## 마치며

CLAUDE.md는 단순한 설정 파일이 아니라 Claude Code와 효과적으로 협업하기 위한 커뮤니케이션 도구입니다. 프로젝트의 맥락을 명확히 전달하고 일관된 코드 품질을 유지하는 데 큰 도움이 됩니다.

프로젝트의 특성에 맞게 CLAUDE.md를 작성하고 지속적으로 개선해 나가다 보면, Claude Code가 점점 더 프로젝트에 익숙한 팀원처럼 작동하는 것을 경험할 수 있을 것입니다.
