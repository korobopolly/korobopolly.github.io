# Korobopolly's Dev Blog

AI 도구, Java, Spring Boot, React 등 실전 개발 기술을 다루는 기술 블로그입니다.

**https://korobopolly.github.io**

## 시리즈

| 시리즈 | 포스트 수 | 주요 내용 |
|--------|-----------|-----------|
| Claude Code | 5 | Plan Mode, MCP 서버, Hooks, CLAUDE.md, 커스텀 슬래시 커맨드 |
| OMC 플러그인 | 4 | 소개, Autopilot/Ralph, Team/Pipeline, EcoMode/Ultrawork |
| Java | 4 | Stream API, 최신 기능, 동시성 프로그래밍, 디자인 패턴 |
| Spring Boot | 4 | 프로젝트 시작하기, REST API, 이벤트 기반 아키텍처, 캐싱 전략 |
| React | 4 | 소개, Hooks, 전역 상태 관리, E2E 테스팅 |
| 네트워크 | 2 | TCP 소켓 프로그래밍, WebSocket/STOMP |
| 보안 | 2 | JWT 인증 시스템, RSA/AES 암호화 |
| Database | 2 | SQL 기초, 인덱스 최적화 |
| Git | 2 | 기초, 브랜치 전략 |
| Docker & 배포 | 2 | 기초, GitHub Actions CI/CD |
| Hugo | 1 | Hugo로 블로그 시작하기 |

## Tech Stack

- **Hugo** — 정적 사이트 생성기 (커스텀 테마)
- **GitHub Pages** — 호스팅
- **GitHub Actions** — `main` 푸시 시 자동 배포

## 프로젝트 구조

```
content/
  posts/          # 블로그 포스트 (마크다운)
  about.md        # 소개 페이지
layouts/          # Hugo 레이아웃 템플릿
static/
  css/style.css   # 스타일시트
  js/main.js      # 검색, 테마 전환 등
```

## 개발

```bash
# 로컬 서버 실행 (드래프트 포함)
hugo server -D

# 새 포스트 생성
hugo new posts/my-post.md

# 프로덕션 빌드
hugo --gc --minify
```

## 배포

`main` 브랜치에 푸시하면 GitHub Actions를 통해 자동으로 빌드 및 배포됩니다.
