---
title: "GitHub Actions CI/CD - Spring Boot, React, Docker 빌드와 배포"
date: 2026-02-16T13:23:00+09:00
draft: false
tags: ["GitHub Actions", "CI/CD", "DevOps", "배포"]
categories: ["Docker & 배포"]
series: "Docker & 배포"
description: "GitHub Actions로 자동화된 빌드, 테스트, 배포 파이프라인을 구축합니다"
---

GitHub Actions를 활용하면 코드 푸시부터 배포까지 전 과정을 자동화할 수 있습니다. 이번 포스트에서는 실전에서 바로 사용할 수 있는 CI/CD 파이프라인 구축 방법을 다룹니다.

## 1. CI/CD 개념 이해하기

### CI (Continuous Integration, 지속적 통합)

개발자가 코드를 커밋할 때마다 자동으로 빌드와 테스트를 실행하는 프로세스입니다.

**주요 목적:**
- 코드 통합 과정에서 발생하는 버그를 조기 발견
- 빌드 실패나 테스트 실패를 즉시 파악
- 코드 품질 유지 및 향상

### CD (Continuous Deployment/Delivery, 지속적 배포)

테스트를 통과한 코드를 자동으로 프로덕션 환경에 배포하는 프로세스입니다.

**Continuous Delivery vs Continuous Deployment:**
- **Delivery**: 배포 준비까지 자동화, 최종 배포는 수동 승인
- **Deployment**: 배포까지 완전 자동화

## 2. GitHub Actions 기본 구조

### 핵심 개념

```yaml
# .github/workflows/example.yml
name: CI/CD Pipeline          # 워크플로우 이름

on: [push, pull_request]      # 트리거 이벤트

jobs:                          # 실행할 작업들
  build:                       # Job 이름
    runs-on: ubuntu-latest     # Runner (실행 환경)

    steps:                     # 순차적으로 실행할 단계들
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run tests
        run: npm test
```

**주요 구성 요소:**
- **Workflow**: `.github/workflows/` 디렉토리의 YAML 파일
- **Job**: 독립적으로 실행되는 작업 단위 (병렬 실행 가능)
- **Step**: Job 내에서 순차적으로 실행되는 명령
- **Runner**: 워크플로우를 실행하는 서버 (ubuntu-latest, windows-latest 등)

## 3. YAML 문법 기초

### on: 워크플로우 트리거

```yaml
# 단일 이벤트
on: push

# 여러 이벤트
on: [push, pull_request]

# 세부 설정
on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
```

### jobs: 작업 정의

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  deploy:
    needs: test              # test job 완료 후 실행
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

### with: 액션 파라미터 전달

```yaml
steps:
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'
```

### env: 환경변수 설정

```yaml
env:
  NODE_ENV: production

jobs:
  build:
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    steps:
      - run: echo $NODE_ENV
```

## 4. 첫 번째 워크플로우 작성

간단한 Node.js 프로젝트의 빌드 및 테스트 자동화:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 의존성 설치
        run: npm ci

      - name: 빌드
        run: npm run build

      - name: 테스트 실행
        run: npm test
```

**주요 포인트:**
- `npm ci`: `npm install`보다 빠르고 일관된 설치 (CI 환경에 최적화)
- `cache: 'npm'`: node_modules 캐싱으로 설치 속도 향상
- PR 생성 시에도 자동으로 테스트 실행

## 5. Spring Boot CI 파이프라인

Gradle 기반 Spring Boot 프로젝트의 빌드 및 테스트:

```yaml
# .github/workflows/spring-boot-ci.yml
name: Spring Boot CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4

      - name: JDK 17 설정
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Gradle 실행 권한 부여
        run: chmod +x gradlew

      - name: Gradle 빌드
        run: ./gradlew build

      - name: 테스트 실행
        run: ./gradlew test

      - name: JaCoCo 테스트 커버리지 리포트
        run: ./gradlew jacocoTestReport

      - name: 테스트 결과 업로드
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: build/test-results/

      - name: 커버리지 리포트 업로드
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-report
          path: build/reports/jacoco/
```

**JaCoCo 설정 (build.gradle):**

```gradle
plugins {
    id 'jacoco'
}

jacoco {
    toolVersion = "0.8.11"
}

test {
    finalizedBy jacocoTestReport
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
}
```

## 6. React CI 파이프라인

Vite 기반 React 프로젝트의 린트, 테스트, 빌드:

```yaml
# .github/workflows/react-ci.yml
name: React CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest

    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 의존성 설치
        run: npm ci

      - name: ESLint 검사
        run: npm run lint

      - name: 타입 체크 (TypeScript)
        run: npm run type-check
        continue-on-error: false

      - name: 테스트 실행
        run: npm test -- --coverage

      - name: 프로덕션 빌드
        run: npm run build

      - name: 빌드 결과물 업로드
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
```

**package.json 스크립트 예시:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "preview": "vite preview"
  }
}
```

## 7. Docker 이미지 빌드 & GitHub Container Registry 푸시

빌드한 애플리케이션을 Docker 이미지로 만들고 GHCR에 푸시:

```yaml
# .github/workflows/docker-build.yml
name: Docker Build & Push

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4

      - name: Docker Buildx 설정
        uses: docker/setup-buildx-action@v3

      - name: GHCR 로그인
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: 메타데이터 추출
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Docker 이미지 빌드 및 푸시
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Dockerfile 예시 (Spring Boot):**

```dockerfile
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**주요 포인트:**
- `GITHUB_TOKEN`: 자동으로 제공되는 시크릿 (별도 설정 불필요)
- `cache-from/cache-to`: 빌드 캐시로 속도 향상
- `metadata-action`: 브랜치명, 태그, SHA 기반으로 이미지 태그 자동 생성

## 8. 환경별 배포 전략

### 환경변수와 Secrets 관리

**GitHub Secrets 설정:**
1. Repository → Settings → Secrets and variables → Actions
2. `New repository secret` 클릭
3. Name과 Value 입력 (예: `DATABASE_URL`, `API_KEY`)

**Environment 기반 배포:**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - develop
      - main

jobs:
  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: development

    steps:
      - name: 개발 환경 배포
        run: |
          echo "배포 대상: ${{ vars.DEPLOY_URL }}"
          echo "API_KEY: ${{ secrets.API_KEY }}"

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: 프로덕션 배포
        run: |
          echo "배포 대상: ${{ vars.DEPLOY_URL }}"
          echo "API_KEY: ${{ secrets.API_KEY }}"
```

**Environment 설정 방법:**
1. Repository → Settings → Environments
2. `New environment` 클릭 (development, staging, production)
3. Environment secrets 및 variables 설정
4. (선택) Protection rules 설정 (승인 필요, 특정 브랜치만 허용)

### 다중 환경 배포 워크플로우

```yaml
# .github/workflows/multi-env-deploy.yml
name: Multi-Environment Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: '배포 환경'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}

    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4

      - name: 환경 정보 출력
        run: |
          echo "Environment: ${{ github.event.inputs.environment }}"
          echo "Deploy URL: ${{ vars.DEPLOY_URL }}"

      - name: Docker 이미지 배포
        run: |
          docker pull ghcr.io/${{ github.repository }}:latest
          # 배포 스크립트 실행
```

**주요 포인트:**
- `workflow_dispatch`: 수동으로 워크플로우 실행 가능
- `environment`: 환경별로 다른 시크릿/변수 사용
- `vars.VARIABLE_NAME`: 환경 변수 참조
- `secrets.SECRET_NAME`: 환경 시크릿 참조

## 9. 실전 워크플로우 예제

PR 생성 시 테스트 → main 머지 시 자동 배포:

```yaml
# .github/workflows/pr-main-deploy.yml
name: PR Test & Main Deploy

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test:
    name: 테스트 실행
    runs-on: ubuntu-latest

    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 의존성 설치
        run: npm ci

      - name: 린트 검사
        run: npm run lint

      - name: 테스트 실행
        run: npm test -- --coverage

      - name: 빌드 검증
        run: npm run build

  build-and-push:
    name: Docker 이미지 빌드 및 푸시
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4

      - name: GHCR 로그인
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Docker 이미지 빌드 및 푸시
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}

  deploy:
    name: 프로덕션 배포
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: 서버 배포
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /app
            docker pull ghcr.io/${{ github.repository }}:latest
            docker-compose down
            docker-compose up -d
            docker image prune -f

      - name: 배포 완료 알림
        run: |
          echo "✅ 배포 완료: https://${{ vars.DEPLOY_URL }}"
```

### Spring Boot + React 풀스택 예제

```yaml
# .github/workflows/fullstack-cicd.yml
name: Fullstack CI/CD

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test-backend:
    name: 백엔드 테스트
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: JDK 설정
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: 백엔드 테스트
        run: |
          cd backend
          chmod +x gradlew
          ./gradlew test

  test-frontend:
    name: 프론트엔드 테스트
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: 프론트엔드 테스트
        run: |
          cd frontend
          npm ci
          npm run lint
          npm test
          npm run build

  deploy:
    name: 통합 배포
    needs: [test-backend, test-frontend]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Docker Compose 배포
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /app
            git pull origin main
            docker-compose build
            docker-compose down
            docker-compose up -d
```

**docker-compose.yml 예시:**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DATABASE_URL=${DATABASE_URL}

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

## 마무리

GitHub Actions를 활용한 CI/CD 파이프라인 구축의 핵심은 다음과 같습니다:

1. **작은 단위로 시작**: 간단한 테스트 자동화부터 시작하여 점진적으로 확장
2. **실패 빠르게 파악**: PR 단계에서 문제를 조기 발견
3. **환경 분리**: 개발/스테이징/프로덕션 환경을 명확히 구분
4. **보안 관리**: Secrets로 민감 정보 보호
5. **캐싱 활용**: 빌드 시간 단축으로 개발자 경험 향상

다음 단계로는 다음 주제들을 고려해볼 수 있습니다:
- Blue-Green 배포 전략
- Canary 배포로 점진적 롤아웃
- 자동 롤백 메커니즘
- Slack/Discord 알림 연동
- 성능 테스트 자동화

실제 프로젝트에 적용하면서 팀의 상황에 맞게 커스터마이징해보세요.
