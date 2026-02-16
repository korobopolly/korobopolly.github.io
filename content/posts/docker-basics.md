---
title: "Docker 시작하기 - 컨테이너 기초부터 실전까지"
date: 2026-02-16T13:22:00+09:00
draft: false
tags: ["Docker", "컨테이너", "DevOps", "배포"]
categories: ["Docker & 배포"]
series: "Docker & 배포"
description: "Docker의 핵심 개념과 실전 컨테이너 활용법을 알아봅니다"
---

## 1. Docker란? - 컨테이너 vs VM

### Docker가 등장한 이유

"내 컴퓨터에선 잘 되는데요?" - 개발자라면 한 번쯤 들어본 말입니다. 개발 환경과 운영 환경의 차이로 인한 문제를 해결하기 위해 Docker가 등장했습니다.

### 컨테이너 vs 가상머신 (VM)

```
[ VM 구조 ]                    [ Container 구조 ]
┌──────────────┐              ┌──────────────┐
│   App A      │              │   App A      │
├──────────────┤              ├──────────────┤
│  Guest OS    │              │  Libraries   │
├──────────────┤              ├──────────────┤
│  Hypervisor  │              │ Docker Engine│
├──────────────┤              ├──────────────┤
│   Host OS    │              │   Host OS    │
└──────────────┘              └──────────────┘
```

**가상머신 (VM)**
- 하드웨어 전체를 가상화
- 각 VM마다 독립적인 OS 실행
- 무겁고 느림 (GB 단위 크기, 분 단위 부팅)
- 완전한 격리 보장

**컨테이너 (Container)**
- OS 커널을 공유하며 프로세스만 격리
- 호스트 OS의 커널 활용
- 가볍고 빠름 (MB 단위 크기, 초 단위 부팅)
- 적절한 수준의 격리

### Docker를 쓰는 이유

1. **환경 일관성**: 개발/테스트/운영 환경이 동일
2. **빠른 배포**: 초 단위로 컨테이너 실행 가능
3. **효율적 자원 활용**: VM보다 훨씬 가볍고 많은 컨테이너 실행 가능
4. **버전 관리**: 이미지로 애플리케이션 버전 관리
5. **마이크로서비스 적합**: 서비스별 독립 배포/확장

---

## 2. Docker 핵심 개념

### 이미지 (Image)

컨테이너를 실행하기 위한 **읽기 전용 템플릿**입니다.

```bash
# 공식 이미지 예시
docker pull ubuntu:22.04        # Ubuntu 22.04 이미지
docker pull node:18-alpine      # Node.js 18 (Alpine Linux 기반)
docker pull mysql:8.0           # MySQL 8.0
```

### 컨테이너 (Container)

이미지를 실행한 **실제 인스턴스**입니다. 격리된 환경에서 애플리케이션이 실행됩니다.

```bash
# 이미지 → 컨테이너 실행
docker run ubuntu:22.04
```

### 레지스트리 (Registry)

Docker 이미지를 저장하는 저장소입니다.

- **Docker Hub**: 공식 퍼블릭 레지스트리 (hub.docker.com)
- **Private Registry**: 기업 내부용 (AWS ECR, Google GCR 등)

### 레이어 (Layer)

Docker 이미지는 여러 **읽기 전용 레이어**로 구성됩니다.

```dockerfile
FROM ubuntu:22.04        # Layer 1: 기본 OS
RUN apt-get update       # Layer 2: 패키지 업데이트
RUN apt-get install -y   # Layer 3: 패키지 설치
COPY app.jar /app/       # Layer 4: 애플리케이션 파일
```

각 레이어는 캐싱되어 빌드 속도를 높입니다.

---

## 3. Docker 설치 및 기본 명령어

### 설치 확인

```bash
docker --version
# Docker version 25.0.0, build ...

docker run hello-world
# Hello from Docker! ...
```

### 핵심 명령어

```bash
# 1. 이미지 검색 및 다운로드
docker search nginx                    # Docker Hub에서 이미지 검색
docker pull nginx:latest               # 이미지 다운로드

# 2. 이미지 관리
docker images                          # 로컬 이미지 목록
docker rmi nginx:latest                # 이미지 삭제
docker image prune                     # 사용하지 않는 이미지 정리

# 3. 컨테이너 실행
docker run nginx                       # 컨테이너 실행 (포그라운드)
docker run -d nginx                    # 백그라운드 실행 (-d: detached)
docker run -d -p 8080:80 nginx         # 포트 매핑 (호스트:컨테이너)
docker run -d --name my-nginx nginx    # 컨테이너 이름 지정
docker run -d -e ENV=prod nginx        # 환경변수 설정

# 4. 컨테이너 상태 확인
docker ps                              # 실행 중인 컨테이너
docker ps -a                           # 모든 컨테이너 (중지된 것 포함)

# 5. 컨테이너 제어
docker stop my-nginx                   # 컨테이너 중지
docker start my-nginx                  # 컨테이너 시작
docker restart my-nginx                # 컨테이너 재시작
docker rm my-nginx                     # 컨테이너 삭제
docker rm -f my-nginx                  # 강제 삭제 (실행 중이어도)

# 6. 컨테이너 내부 접근
docker logs my-nginx                   # 로그 확인
docker logs -f my-nginx                # 실시간 로그 (-f: follow)
docker exec -it my-nginx bash          # 컨테이너 내부 쉘 접속
docker exec my-nginx ls /app           # 컨테이너 내부 명령 실행

# 7. 컨테이너 정보 확인
docker inspect my-nginx                # 상세 정보 (JSON)
docker stats                           # 리소스 사용량 (CPU, 메모리)
```

### 실전 예제

```bash
# MySQL 컨테이너 실행
docker run -d \
  --name my-mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=myapp \
  -p 3306:3306 \
  mysql:8.0

# Redis 컨테이너 실행
docker run -d \
  --name my-redis \
  -p 6379:6379 \
  redis:7-alpine

# 실행 확인
docker ps

# MySQL 접속
docker exec -it my-mysql mysql -uroot -proot123
```

---

## 4. Dockerfile 작성법

### Dockerfile 핵심 명령어

```dockerfile
# 기본 이미지 지정 (필수, 맨 처음에 와야 함)
FROM ubuntu:22.04

# 메타데이터 (선택)
LABEL maintainer="admin@example.com"
LABEL version="1.0"

# 작업 디렉토리 설정
WORKDIR /app

# 파일/디렉토리 복사
COPY package.json .              # 파일 복사
COPY src/ ./src/                 # 디렉토리 복사
ADD https://example.com/file .   # URL에서 다운로드 (비권장)

# 명령 실행 (이미지 빌드 시)
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*  # 캐시 정리로 이미지 크기 최소화

# 환경변수 설정
ENV NODE_ENV=production
ENV PORT=3000

# 포트 노출 (문서화 목적, 실제 포트 열림은 -p 옵션)
EXPOSE 3000

# 컨테이너 시작 시 실행할 명령 (쉘 형식)
CMD ["node", "server.js"]

# ENTRYPOINT vs CMD
ENTRYPOINT ["python", "app.py"]  # 고정 실행 명령
CMD ["--port", "8000"]            # 기본 파라미터 (오버라이드 가능)
```

### CMD vs ENTRYPOINT 차이

```dockerfile
# CMD만 사용 (전체 교체 가능)
FROM ubuntu
CMD ["echo", "Hello"]
# docker run image          → "Hello"
# docker run image bye      → "bye" (CMD 완전 교체)

# ENTRYPOINT + CMD (파라미터만 교체)
FROM ubuntu
ENTRYPOINT ["echo"]
CMD ["Hello"]
# docker run image          → "Hello"
# docker run image bye      → "bye" (CMD만 교체, echo는 유지)
```

---

## 5. Spring Boot 앱 Dockerfile (멀티스테이지 빌드)

### 기본 Dockerfile

```dockerfile
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Gradle 캐싱 최적화
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle
RUN ./gradlew dependencies --no-daemon

# 소스코드 복사 및 빌드
COPY src ./src
RUN ./gradlew bootJar --no-daemon

# JAR 파일 실행
EXPOSE 8080
CMD ["java", "-jar", "build/libs/app.jar"]
```

### 멀티스테이지 빌드 (권장)

빌드 환경과 실행 환경을 분리하여 **이미지 크기를 대폭 줄입니다**.

```dockerfile
# Stage 1: 빌드 스테이지
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Gradle Wrapper 및 의존성 캐싱
COPY build.gradle settings.gradle gradlew ./
COPY gradle ./gradle
RUN ./gradlew dependencies --no-daemon

# 소스 복사 및 빌드
COPY src ./src
RUN ./gradlew bootJar --no-daemon

# Stage 2: 실행 스테이지 (JRE만 포함)
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 빌드 스테이지에서 JAR만 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 보안: 루트가 아닌 사용자로 실행
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

EXPOSE 8080

# 힙 메모리 설정 및 실행
ENV JAVA_OPTS="-Xmx512m -Xms256m"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### 빌드 및 실행

```bash
# 이미지 빌드
docker build -t my-spring-app:1.0 .

# 컨테이너 실행
docker run -d \
  --name spring-app \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/mydb \
  my-spring-app:1.0

# 로그 확인
docker logs -f spring-app
```

---

## 6. React 앱 Dockerfile (Nginx 서빙)

### 멀티스테이지 Dockerfile

```dockerfile
# Stage 1: 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 설치 (캐싱 최적화)
COPY package.json package-lock.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Stage 2: Nginx 서빙
FROM nginx:1.25-alpine

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물만 복사
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx 설정 파일 (nginx.conf)

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # SPA 라우팅 지원 (React Router 등)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 (선택)
    location /api {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

### 빌드 및 실행

```bash
# 이미지 빌드
docker build -t my-react-app:1.0 .

# 컨테이너 실행
docker run -d \
  --name react-app \
  -p 3000:80 \
  my-react-app:1.0

# 브라우저에서 http://localhost:3000 접속
```

---

## 7. Docker Compose - 여러 컨테이너 관리

### Docker Compose란?

여러 컨테이너를 **YAML 파일 하나로 정의하고 관리**하는 도구입니다.

### Spring Boot + MySQL + Redis 예제

**디렉토리 구조**
```
project/
├── docker-compose.yml
├── backend/
│   └── Dockerfile
├── init.sql
└── .env
```

**docker-compose.yml**

```yaml
version: '3.8'

services:
  # MySQL 데이터베이스
  mysql:
    image: mysql:8.0
    container_name: mysql-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: myapp
      MYSQL_USER: user
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 캐시
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - app-network
    command: redis-server --appendonly yes

  # Spring Boot 백엔드
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: spring-backend
    restart: always
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/myapp
      SPRING_DATASOURCE_USERNAME: user
      SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD}
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network

# 볼륨 정의
volumes:
  mysql-data:
    driver: local
  redis-data:
    driver: local

# 네트워크 정의
networks:
  app-network:
    driver: bridge
```

**.env 파일**

```bash
MYSQL_ROOT_PASSWORD=root123
MYSQL_PASSWORD=user123
```

### Docker Compose 명령어

```bash
# 전체 서비스 시작 (백그라운드)
docker-compose up -d

# 빌드 후 시작
docker-compose up -d --build

# 로그 확인
docker-compose logs -f           # 전체 로그
docker-compose logs -f backend   # 특정 서비스 로그

# 서비스 상태 확인
docker-compose ps

# 특정 서비스 재시작
docker-compose restart backend

# 전체 중지
docker-compose stop

# 전체 중지 및 삭제 (볼륨 유지)
docker-compose down

# 전체 삭제 (볼륨 포함)
docker-compose down -v

# 특정 서비스만 실행
docker-compose up -d mysql redis
```

---

## 8. 볼륨과 네트워크 기초

### 볼륨 (Volume)

컨테이너가 삭제되어도 **데이터를 유지**하기 위한 저장소입니다.

```bash
# 볼륨 생성
docker volume create my-data

# 볼륨 목록
docker volume ls

# 볼륨 사용
docker run -d \
  --name mysql \
  -v my-data:/var/lib/mysql \
  mysql:8.0

# 호스트 디렉토리 마운트 (바인드 마운트)
docker run -d \
  --name web \
  -v /host/path:/container/path \
  nginx

# 읽기 전용 마운트
docker run -d -v /host/config:/app/config:ro nginx
```

**볼륨 vs 바인드 마운트**

| 구분 | 볼륨 | 바인드 마운트 |
|------|------|---------------|
| 위치 | Docker 관리 영역 | 호스트 임의 경로 |
| 관리 | Docker CLI로 관리 | 직접 관리 |
| 이식성 | 높음 | 낮음 (경로 의존) |
| 용도 | 데이터베이스, 영구 데이터 | 개발 중 코드 동기화 |

### 네트워크 (Network)

컨테이너 간 통신을 위한 가상 네트워크입니다.

```bash
# 네트워크 생성
docker network create my-network

# 네트워크 목록
docker network ls

# 네트워크에 컨테이너 연결
docker run -d --name mysql --network my-network mysql:8.0
docker run -d --name backend --network my-network my-app

# 같은 네트워크 내에서 컨테이너 이름으로 접근 가능
# backend 컨테이너에서: jdbc:mysql://mysql:3306/mydb
```

**네트워크 드라이버**

- **bridge** (기본): 단일 호스트, 컨테이너 간 통신
- **host**: 호스트 네트워크 직접 사용 (포트 매핑 불필요)
- **overlay**: 여러 Docker 호스트 간 통신 (Swarm)
- **none**: 네트워크 없음 (완전 격리)

---

## 9. Docker 이미지 최적화 팁

### .dockerignore 사용

빌드 컨텍스트에서 불필요한 파일을 제외합니다.

```bash
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.DS_Store
build
dist
coverage
.vscode
.idea
*.log
```

### 레이어 캐싱 활용

변경이 적은 명령을 앞쪽에 배치합니다.

```dockerfile
# ❌ 비효율적 (소스 변경 시 의존성 재설치)
FROM node:18-alpine
COPY . .
RUN npm install
RUN npm run build

# ✅ 효율적 (의존성 캐싱)
FROM node:18-alpine
COPY package*.json ./
RUN npm ci                # package.json 변경 시에만 재실행
COPY . .
RUN npm run build         # 소스 변경 시에만 재실행
```

### 이미지 크기 줄이기

```dockerfile
# 1. Alpine 기반 이미지 사용
FROM node:18-alpine    # 18-alpine (40MB) vs 18 (300MB)

# 2. 멀티스테이지 빌드
FROM node:18 AS builder
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/build ./build   # 빌드 결과만 복사

# 3. RUN 명령 체이닝 (레이어 최소화)
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/*   # 캐시 정리

# 4. 불필요한 파일 제거
RUN npm ci --only=production && \
    npm cache clean --force

# 5. .dockerignore 적극 활용
```

### 보안 강화

```dockerfile
# 1. 최신 베이스 이미지 사용
FROM node:18-alpine   # 취약점 패치된 최신 버전

# 2. 루트 사용자 회피
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 3. 읽기 전용 파일시스템 (가능한 경우)
docker run --read-only -v /tmp my-app

# 4. 비밀정보 ARG 사용 (빌드 시에만)
ARG API_KEY
RUN curl -H "Authorization: $API_KEY" ...
# 환경변수 ENV는 이미지에 남으므로 비밀정보 부적합
```

### 이미지 크기 비교

```bash
# 이미지 크기 확인
docker images

# 레이어 확인
docker history my-app:1.0

# 이미지 분석 (dive 도구)
dive my-app:1.0
```

---

## 정리

### Docker 핵심 개념

- **이미지**: 읽기 전용 템플릿
- **컨테이너**: 이미지의 실행 인스턴스
- **레지스트리**: 이미지 저장소
- **레이어**: 이미지를 구성하는 읽기 전용 층

### 자주 쓰는 명령어

```bash
docker pull <image>              # 이미지 다운로드
docker run -d -p 8080:80 <image> # 컨테이너 실행
docker ps                        # 실행 중인 컨테이너
docker logs -f <container>       # 로그 확인
docker exec -it <container> bash # 내부 접속
docker-compose up -d             # Compose 서비스 시작
```

### 실전 팁

1. **개발 환경**: 바인드 마운트로 코드 동기화
2. **운영 환경**: 볼륨으로 데이터 영구 저장
3. **이미지 빌드**: 멀티스테이지 + .dockerignore
4. **보안**: 루트 사용자 회피, 최신 이미지 사용
5. **디버깅**: `docker logs`, `docker exec`, `docker inspect`

### 다음 단계

- **Kubernetes**: 컨테이너 오케스트레이션
- **CI/CD**: GitHub Actions + Docker 자동 배포
- **모니터링**: Prometheus + Grafana
- **보안**: Trivy로 이미지 취약점 스캔

Docker는 현대 개발/배포의 필수 도구입니다. 직접 Dockerfile을 작성하고 컨테이너를 실행하며 감을 익혀보세요!
