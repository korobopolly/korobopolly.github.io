---
title: "Git 핵심 개념 - 버전 관리의 기초부터 실전까지"
date: 2026-02-16T13:24:00+09:00
draft: false
tags: ["Git", "버전관리", "개발도구", "협업"]
categories: ["Git"]
series: "Git"
description: "Git의 핵심 개념과 실무에서 자주 사용하는 명령어를 마스터합니다"
---

## Git이란?

Git은 **분산 버전 관리 시스템**(Distributed Version Control System)으로, 파일의 변경 이력을 추적하고 여러 개발자가 협업할 수 있도록 도와줍니다.

### SVN과의 주요 차이점

| 특징 | Git (분산) | SVN (중앙집중) |
|------|-----------|---------------|
| 저장소 위치 | 로컬에 전체 이력 저장 | 중앙 서버에만 이력 저장 |
| 오프라인 작업 | 가능 (커밋, 브랜치 등) | 제한적 |
| 속도 | 빠름 (로컬 작업) | 느림 (서버 통신 필요) |
| 브랜치 생성 | 빠르고 가벼움 | 무겁고 비용이 큼 |

## Git 핵심 개념: 3가지 영역

Git은 파일을 3가지 상태로 관리합니다.

```
Working Directory → Staging Area → Repository
   (작업 디렉토리)    (스테이징 영역)    (저장소)
        ↓                ↓              ↓
    git add         git commit      git push
```

1. **Working Directory**: 실제 파일을 수정하는 공간
2. **Staging Area** (Index): 커밋할 변경사항을 준비하는 공간
3. **Repository**: 커밋된 스냅샷이 저장되는 공간

## 기본 명령어

### 저장소 초기화 및 복제

```bash
# 새 Git 저장소 생성
git init

# 원격 저장소 복제
git clone https://github.com/username/repository.git

# 특정 브랜치만 복제
git clone -b develop https://github.com/username/repository.git
```

### 변경사항 추적 및 커밋

```bash
# 파일 상태 확인
git status

# 파일을 Staging Area에 추가
git add file.txt              # 특정 파일
git add .                     # 현재 디렉토리 모든 변경사항
git add -p                    # 대화형 모드 (부분 커밋 가능)

# 커밋 생성
git commit -m "커밋 메시지"

# add + commit 한 번에 (추적 중인 파일만)
git commit -am "커밋 메시지"

# 커밋 메시지 수정
git commit --amend
```

### 변경사항 확인

```bash
# Working Directory vs Staging Area
git diff

# Staging Area vs Repository
git diff --staged

# 특정 파일의 변경사항
git diff file.txt

# 두 커밋 간 차이
git diff commit1 commit2
```

## 커밋 히스토리 관리

### 로그 확인

```bash
# 기본 로그
git log

# 한 줄로 보기
git log --oneline

# 그래프로 보기
git log --graph --oneline --all

# 최근 3개 커밋만
git log -3

# 특정 날짜 범위
git log --since="2 weeks ago" --until="yesterday"

# 특정 작성자
git log --author="홍길동"

# 파일별 로그
git log -- file.txt

# 커밋 메시지 검색
git log --grep="버그 수정"
```

### 특정 커밋 상세 보기

```bash
# 커밋 상세 내용
git show commit-hash

# 특정 파일의 특정 커밋
git show commit-hash:path/to/file.txt

# 각 줄을 마지막으로 수정한 사람 확인
git blame file.txt

# 특정 줄 범위만
git blame -L 10,20 file.txt
```

## 되돌리기

### reset vs revert vs checkout

```bash
# reset: 커밋 히스토리 변경 (로컬 작업에만 사용)
git reset --soft HEAD~1    # 커밋만 취소 (Staging Area 유지)
git reset --mixed HEAD~1   # 커밋 + add 취소 (기본값)
git reset --hard HEAD~1    # 모든 변경사항 삭제 (위험!)

# revert: 새로운 커밋으로 되돌림 (안전, 공유된 브랜치에 사용)
git revert commit-hash

# checkout: 특정 커밋 상태로 이동 (읽기 전용)
git checkout commit-hash

# restore: 파일 되돌리기 (Git 2.23+)
git restore file.txt              # Working Directory에서 되돌림
git restore --staged file.txt     # Staging Area에서 되돌림
```

### reset 옵션 비교

| 옵션 | HEAD 이동 | Staging Area | Working Directory |
|------|-----------|--------------|-------------------|
| --soft | O | 유지 | 유지 |
| --mixed | O | 초기화 | 유지 |
| --hard | O | 초기화 | 초기화 |

### 실수 복구

```bash
# 실수로 reset --hard 했을 때
git reflog                  # 모든 HEAD 이동 이력 확인
git reset --hard HEAD@{2}   # 특정 시점으로 복구

# 삭제된 브랜치 복구
git reflog
git checkout -b recovered-branch HEAD@{3}
```

## .gitignore 작성법

### 기본 문법

```gitignore
# 주석

# 특정 파일
secret.txt

# 특정 디렉토리
logs/

# 와일드카드
*.log           # 모든 .log 파일
*.log.*         # .log.로 시작하는 파일

# 예외 처리
*.log
!important.log  # important.log는 추적

# 특정 디렉토리의 파일만
/config.json    # 루트의 config.json만
**/temp/        # 모든 경로의 temp 디렉토리
```

### 언어별 예시

**Node.js 프로젝트**
```gitignore
node_modules/
npm-debug.log*
.env
dist/
build/
.DS_Store
```

**Java/Spring Boot 프로젝트**
```gitignore
*.class
*.jar
*.war
target/
.gradle/
build/
.idea/
*.iml
```

**Python 프로젝트**
```gitignore
__pycache__/
*.py[cod]
*$py.class
venv/
.env
.pytest_cache/
*.egg-info/
```

### 이미 추적 중인 파일 제외하기

```bash
# .gitignore에 추가한 후
git rm --cached file.txt
git rm -r --cached directory/

# 커밋
git commit -m "gitignore 적용"
```

## 원격 저장소

### 원격 저장소 관리

```bash
# 원격 저장소 목록
git remote -v

# 원격 저장소 추가
git remote add origin https://github.com/username/repo.git

# 원격 저장소 URL 변경
git remote set-url origin https://github.com/username/new-repo.git

# 원격 저장소 삭제
git remote remove origin
```

### push, pull, fetch 차이

```bash
# push: 로컬 → 원격
git push origin main

# 강제 push (위험! 팀 작업 시 주의)
git push --force origin main

# fetch: 원격 → 로컬 (병합 안 함)
git fetch origin

# pull: fetch + merge
git pull origin main
# = git fetch origin + git merge origin/main

# pull with rebase (깔끔한 히스토리)
git pull --rebase origin main
```

### 원격 브랜치 작업

```bash
# 원격 브랜치 목록
git branch -r

# 원격 브랜치 추적
git checkout -b local-branch origin/remote-branch

# 원격 브랜치 삭제
git push origin --delete feature-branch
```

## Stash 활용법

Stash는 작업 중인 변경사항을 임시 저장하는 기능입니다.

```bash
# 현재 변경사항 임시 저장
git stash

# 메시지와 함께 저장
git stash save "WIP: 로그인 기능 작업 중"

# untracked 파일도 포함
git stash -u

# stash 목록
git stash list
# stash@{0}: WIP on main: 1a2b3c4 커밋 메시지
# stash@{1}: WIP on develop: 5d6e7f8 이전 작업

# stash 적용 (stash 유지)
git stash apply stash@{0}

# stash 적용 + 삭제
git stash pop

# stash 내용 확인
git stash show -p stash@{0}

# 특정 stash 삭제
git stash drop stash@{0}

# 모든 stash 삭제
git stash clear
```

### Stash 실전 활용

```bash
# 시나리오: 급하게 다른 브랜치로 이동해야 할 때
git stash                      # 현재 작업 임시 저장
git checkout hotfix-branch     # 브랜치 이동
# ... hotfix 작업 ...
git checkout main              # 원래 브랜치로 복귀
git stash pop                  # 작업 복원

# stash를 새 브랜치로 만들기
git stash branch new-feature-branch stash@{0}
```

## 태그 관리

태그는 특정 커밋에 이름을 붙여 버전을 관리합니다.

### Lightweight vs Annotated 태그

```bash
# Lightweight 태그 (단순 포인터)
git tag v1.0.0

# Annotated 태그 (권장: 메타데이터 포함)
git tag -a v1.0.0 -m "첫 번째 정식 릴리즈"

# 태그 목록
git tag
git tag -l "v1.*"     # 패턴 검색

# 태그 상세 정보
git show v1.0.0

# 특정 커밋에 태그
git tag -a v0.9.0 commit-hash -m "베타 릴리즈"
```

### 태그 원격 저장소 관리

```bash
# 특정 태그 push
git push origin v1.0.0

# 모든 태그 push
git push origin --tags

# 태그 삭제
git tag -d v1.0.0                    # 로컬
git push origin --delete v1.0.0      # 원격

# 태그로 체크아웃
git checkout v1.0.0
```

### 시맨틱 버저닝(Semantic Versioning)

```bash
# 버전 형식: MAJOR.MINOR.PATCH
git tag -a v1.0.0 -m "Major: 첫 정식 릴리즈"
git tag -a v1.1.0 -m "Minor: 새 기능 추가"
git tag -a v1.1.1 -m "Patch: 버그 수정"

# 예시
v1.0.0  # 첫 릴리즈
v1.1.0  # 새 기능 (하위 호환)
v1.1.1  # 버그 수정
v2.0.0  # Breaking Changes
```

## 실전 팁: 좋은 커밋 메시지 작성법

### Conventional Commits 규칙

```bash
# 형식
<type>(<scope>): <subject>

<body>

<footer>
```

**타입 종류**
```bash
feat:     새로운 기능 추가
fix:      버그 수정
docs:     문서 수정
style:    코드 포맷팅 (세미콜론 등)
refactor: 코드 리팩토링
test:     테스트 코드 추가
chore:    빌드, 패키지 매니저 수정
```

### 좋은 예시

```bash
# 간단한 메시지
git commit -m "feat: 사용자 로그인 기능 추가"

# 상세한 메시지
git commit -m "fix(auth): JWT 토큰 만료 처리 오류 수정

- 만료된 토큰으로 요청 시 401 응답 반환
- 토큰 갱신 로직 개선
- 관련 테스트 추가

Closes #123"

# Breaking Change
git commit -m "feat!: API 응답 형식 변경

BREAKING CHANGE: API 응답이 { data, error } 형식으로 변경됨"
```

### 나쁜 예시 vs 좋은 예시

```bash
# ❌ 나쁜 예시
git commit -m "수정"
git commit -m "버그 고침"
git commit -m "WIP"

# ✅ 좋은 예시
git commit -m "fix(login): 빈 이메일 입력 시 에러 처리 추가"
git commit -m "refactor(user): 사용자 검증 로직을 별도 함수로 분리"
git commit -m "docs(readme): 설치 가이드 업데이트"
```

### 커밋 작성 가이드라인

1. **제목은 50자 이내**로 간결하게
2. **제목과 본문은 빈 줄로 구분**
3. **제목은 명령형**으로 작성 ("추가함" ❌ → "추가" ✅)
4. **본문은 "무엇을, 왜"** 중심으로 작성
5. **하나의 커밋은 하나의 논리적 변경**만 포함

## 마치며

Git은 현대 소프트웨어 개발의 필수 도구입니다. 이 글에서 다룬 기본 개념과 명령어를 익히면:

- ✅ 코드 변경 이력을 체계적으로 관리
- ✅ 실수를 안전하게 되돌리기
- ✅ 팀원과 원활한 협업
- ✅ 버전 관리를 통한 릴리즈 관리

**다음 단계**: 브랜치 전략(Git Flow), Merge vs Rebase, Conflict 해결, Git Hooks 등의 고급 주제를 학습하세요.

## 참고 자료

- [Pro Git Book (한글)](https://git-scm.com/book/ko/v2)
- [Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/)
- [Git 공식 문서](https://git-scm.com/doc)
