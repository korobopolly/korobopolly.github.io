---
title: "Hugo 시작하기 - 설치, 사이트 생성, GitHub Pages 배포"
date: 2026-02-16T14:00:00+09:00
draft: false
tags: ["Hugo", "블로그", "정적사이트"]
categories: ["Hugo"]
series: "Hugo"
description: "Hugo 설치, 프로젝트 생성, 로컬 개발 서버 실행, 빌드까지 한 번에 알아봅니다"
---

## Hugo란?

Hugo는 Go로 작성된 정적 사이트 생성기(Static Site Generator)입니다. 마크다운으로 글을 쓰면 HTML로 변환해주며, 빌드 속도가 매우 빠릅니다.

- 수천 개의 페이지도 수 초 이내에 빌드
- 마크다운 기반 콘텐츠 관리
- 테마와 레이아웃 커스터마이징 자유도 높음
- GitHub Pages, Netlify, Vercel 등 다양한 플랫폼에 배포 가능

## 1. 설치

### Windows

```bash
# winget
winget install Hugo.Hugo.Extended

# chocolatey
choco install hugo-extended
```

### macOS

```bash
brew install hugo
```

### Linux (Ubuntu/Debian)

```bash
# snap
sudo snap install hugo

# apt (버전이 오래될 수 있음)
sudo apt install hugo
```

### Linux (직접 설치)

최신 버전이 필요하면 GitHub 릴리즈에서 직접 다운로드합니다.

```bash
HUGO_VERSION=0.128.0
wget https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb
sudo dpkg -i hugo_extended_${HUGO_VERSION}_linux-amd64.deb
```

### 설치 확인

```bash
hugo version
# hugo v0.128.0-... extended
```

`extended` 버전인지 확인하세요. SCSS/SASS 처리에 필요합니다.

## 2. 새 사이트 만들기

```bash
hugo new site my-blog
cd my-blog
```

생성되는 디렉토리 구조:

```text
my-blog/
├── archetypes/    # 새 글 템플릿
├── content/       # 마크다운 콘텐츠
├── layouts/       # HTML 템플릿
├── static/        # 정적 파일 (CSS, JS, 이미지)
├── themes/        # 테마
└── hugo.toml      # 설정 파일
```

## 3. 콘텐츠 작성

새 포스트를 생성합니다.

```bash
hugo new posts/my-first-post.md
```

생성된 파일을 편집합니다.

```markdown
---
title: "나의 첫 번째 포스트"
date: 2026-02-16T10:00:00+09:00
draft: false
tags: ["시작"]
---

여기에 마크다운으로 글을 작성합니다.

## 소제목

본문 내용...
```

`draft: true`이면 빌드에 포함되지 않습니다. 작성이 완료되면 `false`로 바꾸세요.

## 4. 로컬 개발 서버

```bash
hugo server
```

`http://localhost:1313`에서 블로그를 확인할 수 있습니다.

파일을 수정하면 자동으로 새로고침됩니다(Live Reload).

### WSL 환경에서 Live Reload가 안 될 때

WSL에서 `/mnt/c/` 경로의 파일을 수정하면 파일 변경 이벤트가 Hugo에 전달되지 않을 수 있습니다. `--poll` 옵션으로 해결합니다.

```bash
hugo server --poll 500ms
```

파일 시스템 이벤트 대신 0.5초마다 변경을 직접 확인하는 방식입니다.

### 유용한 옵션

```bash
# 초안(draft) 포스트도 포함
hugo server -D

# 포트 변경
hugo server -p 3000

# 외부 접속 허용 (같은 네트워크의 다른 기기에서 확인)
hugo server --bind 0.0.0.0
```

## 5. 빌드

```bash
hugo
```

`public/` 디렉토리에 정적 파일이 생성됩니다. 이 디렉토리를 웹 서버에 배포하면 됩니다.

### 프로덕션 빌드

```bash
hugo --gc --minify
```

- `--gc`: 사용하지 않는 캐시 파일 정리
- `--minify`: HTML, CSS, JS 압축

## 6. GitHub Pages 배포

이 블로그는 GitHub Actions로 자동 배포됩니다. `.github/workflows/hugo.yml` 파일을 설정하면 `main` 브랜치에 push할 때마다 자동으로 빌드 및 배포가 진행됩니다.

```yaml
name: Deploy Hugo site to Pages

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.128.0
    steps:
      - name: Install Hugo CLI
        run: |
          wget -O ${{ runner.temp }}/hugo.deb \
            https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
          && sudo dpkg -i ${{ runner.temp }}/hugo.deb
      - name: Checkout
        uses: actions/checkout@v4
      - name: Build with Hugo
        run: hugo --gc --minify
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    runs-on: ubuntu-latest
    needs: build
    permissions:
      pages: write
      id-token: write
    steps:
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

워크플로우 설정 후 GitHub 리포지토리의 **Settings > Pages > Source**에서 `GitHub Actions`를 선택하면 배포가 활성화됩니다.

## 마무리

Hugo를 사용하면 마크다운 파일만 작성하면 블로그가 완성됩니다. 설치 → 글 작성 → `hugo server`로 확인 → push하면 자동 배포. 이것이 전부입니다.

다음 글에서는 Hugo 테마 커스터마이징과 레이아웃 구조를 다루겠습니다.
