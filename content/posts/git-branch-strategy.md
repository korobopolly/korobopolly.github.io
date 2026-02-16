---
title: "Git 브랜치 전략과 협업 워크플로우 - 팀 개발의 핵심"
date: 2026-02-16T13:25:00+09:00
draft: false
tags: ["Git", "브랜치전략", "협업", "GitHub"]
categories: ["Git"]
series: "Git"
description: "Git 브랜치 전략과 팀 협업을 위한 워크플로우를 실전 중심으로 알아봅니다"
---

## 1. 브랜치란?

### 브랜치의 개념

브랜치(Branch)는 독립적인 작업 공간을 만들어주는 Git의 핵심 기능입니다. 마치 평행세계처럼 원본 코드에 영향을 주지 않고 새로운 기능을 개발할 수 있습니다.

```bash
# 현재 브랜치 확인
git branch

# 모든 브랜치 확인 (원격 포함)
git branch -a
```

### HEAD 포인터

HEAD는 현재 작업 중인 브랜치를 가리키는 포인터입니다.

```bash
# HEAD가 가리키는 위치 확인
cat .git/HEAD
# 출력: ref: refs/heads/main

# 특정 커밋으로 HEAD 이동 (detached HEAD 상태)
git checkout <commit-hash>
```

**브랜치 구조 시각화:**
```
main     A --- B --- C
              \
feature        D --- E
```

---

## 2. 브랜치 기본 명령어

### 브랜치 생성 및 이동

```bash
# 브랜치 생성
git branch feature/login

# 브랜치 이동 (checkout, 구버전)
git checkout feature/login

# 브랜치 생성 + 이동 (checkout)
git checkout -b feature/signup

# 브랜치 이동 (switch, Git 2.23+)
git switch feature/login

# 브랜치 생성 + 이동 (switch)
git switch -c feature/signup
```

**권장:** `switch`가 더 명확하므로 최신 Git에서는 `switch`를 사용하세요.

### 브랜치 병합

```bash
# main 브랜치로 이동
git switch main

# feature 브랜치를 main에 병합
git merge feature/login
```

### 브랜치 삭제

```bash
# 로컬 브랜치 삭제 (병합 완료된 경우)
git branch -d feature/login

# 강제 삭제 (병합 안 됐어도)
git branch -D feature/login

# 원격 브랜치 삭제
git push origin --delete feature/login
```

---

## 3. Merge vs Rebase

### Merge: 합치기

Merge는 두 브랜치의 변경사항을 합쳐 **새로운 커밋**을 만듭니다.

```bash
git switch main
git merge feature/login
```

**Before:**
```
main     A --- B --- C
              \
feature        D --- E
```

**After (Merge):**
```
main     A --- B --- C --- M
              \           /
feature        D ------- E
```

**장점:**
- 커밋 히스토리가 있는 그대로 보존됨
- 브랜치가 언제 병합되었는지 명확

**단점:**
- 히스토리가 복잡해짐 (Merge 커밋이 계속 생김)
- 그래프가 지저분해질 수 있음

### Rebase: 재배치하기

Rebase는 커밋을 다른 브랜치 위로 **재배치**합니다.

```bash
git switch feature/login
git rebase main
```

**Before:**
```
main     A --- B --- C
              \
feature        D --- E
```

**After (Rebase):**
```
main     A --- B --- C
                      \
feature                D' --- E'
```

**장점:**
- 깔끔한 선형 히스토리
- 그래프가 단순하고 읽기 쉬움

**단점:**
- 커밋 히스토리가 재작성됨 (커밋 해시 변경)
- **공유된 브랜치에 사용하면 위험** (다른 팀원과 충돌)

### 언제 무엇을 쓸까?

| 상황 | 권장 방법 |
|------|----------|
| 개인 feature 브랜치 정리 | `rebase` |
| main 브랜치에 병합 | `merge` (또는 squash merge) |
| 공개/공유된 브랜치 | **절대 rebase 금지**, `merge` 사용 |
| 히스토리 정리가 중요한 프로젝트 | `rebase` |
| 병합 기록이 중요한 프로젝트 | `merge` |

**황금률:** 푸시된 커밋은 rebase 하지 않는다!

---

## 4. 충돌(Conflict) 해결

### 충돌이 발생하는 이유

두 브랜치가 같은 파일의 같은 부분을 다르게 수정했을 때 Git은 자동으로 병합할 수 없습니다.

```bash
# merge 시도 시 충돌 발생
git merge feature/login
# Auto-merging src/auth.js
# CONFLICT (content): Merge conflict in src/auth.js
```

### 충돌 확인

```bash
# 충돌 파일 확인
git status

# Unmerged paths:
#   both modified:   src/auth.js
```

### 충돌 파일 내용

```javascript
// src/auth.js
function login(username, password) {
<<<<<<< HEAD
  // main 브랜치의 코드
  return validateUser(username, password);
=======
  // feature 브랜치의 코드
  return authenticateUser(username, password);
>>>>>>> feature/login
}
```

- `<<<<<<< HEAD`: 현재 브랜치(main)의 내용
- `=======`: 구분선
- `>>>>>>> feature/login`: 병합하려는 브랜치의 내용

### 충돌 해결 과정

```bash
# 1. 충돌 파일 수동 수정 (마커 제거 + 원하는 코드 선택)
# src/auth.js를 다음과 같이 수정:
function login(username, password) {
  return authenticateUser(username, password);
}

# 2. 수정한 파일 스테이징
git add src/auth.js

# 3. 병합 완료
git commit -m "Merge feature/login - resolve auth.js conflict"
```

### 도구 활용

```bash
# VSCode, IntelliJ, Sublime Merge 등 GUI 도구 사용
git mergetool

# 병합 취소 (충돌 해결 포기)
git merge --abort
```

---

## 5. Git Flow 전략

Git Flow는 Vincent Driessen이 제안한 브랜치 전략으로, 복잡한 릴리즈 관리에 적합합니다.

### 브랜치 종류

```
main (production)
  ↓
develop (개발 베이스)
  ↓
feature/* (기능 개발)
release/* (릴리즈 준비)
hotfix/* (긴급 수정)
```

### 1) main 브랜치

- 프로덕션 배포용
- 항상 안정적인 상태 유지
- 태그로 버전 관리

### 2) develop 브랜치

- 다음 릴리즈를 위한 개발 베이스
- feature 브랜치들이 여기로 병합됨

### 3) feature 브랜치

```bash
# feature 브랜치 생성 (develop에서 분기)
git switch develop
git switch -c feature/user-profile

# 개발 완료 후 develop에 병합
git switch develop
git merge feature/user-profile
git branch -d feature/user-profile
```

**네이밍:** `feature/login`, `feature/payment-integration`

### 4) release 브랜치

```bash
# release 브랜치 생성 (develop에서 분기)
git switch develop
git switch -c release/1.2.0

# 버그 수정, 문서 업데이트 등
# 완료 후 main과 develop에 모두 병합
git switch main
git merge release/1.2.0
git tag v1.2.0

git switch develop
git merge release/1.2.0
git branch -d release/1.2.0
```

### 5) hotfix 브랜치

```bash
# hotfix 브랜치 생성 (main에서 분기)
git switch main
git switch -c hotfix/security-patch

# 긴급 수정 후 main과 develop에 병합
git switch main
git merge hotfix/security-patch
git tag v1.2.1

git switch develop
git merge hotfix/security-patch
git branch -d hotfix/security-patch
```

### Git Flow 전체 흐름

```
main        o-------o-------o (v1.0)    (v1.1)
             \       \       \
develop       o---o---o---o---o
               \   \     /   /
feature/A       o---o---o   /
                 \         /
feature/B         o-------o
```

**적합한 경우:**
- 명확한 릴리즈 주기가 있는 프로젝트
- 여러 버전을 동시에 유지보수해야 하는 경우
- 대규모 팀 프로젝트

---

## 6. GitHub Flow

GitHub Flow는 Git Flow보다 단순하며, 지속적 배포(CD)에 최적화되어 있습니다.

### 핵심 원칙

1. `main` 브랜치는 항상 배포 가능한 상태
2. 새 기능은 `main`에서 브랜치를 만들어 작업
3. Pull Request로 코드 리뷰 후 병합
4. 병합 즉시 배포

### 워크플로우

```bash
# 1. main에서 feature 브랜치 생성
git switch main
git pull origin main
git switch -c feature/add-comment

# 2. 커밋 및 푸시
git add .
git commit -m "Add comment feature"
git push origin feature/add-comment

# 3. GitHub에서 Pull Request 생성

# 4. 코드 리뷰 후 main에 병합 (GitHub에서 처리)

# 5. 로컬에서 정리
git switch main
git pull origin main
git branch -d feature/add-comment
```

### 브랜치 전략 시각화

```
main    A --- B --- C --- D --- E
         \         /     /
feature/1 o-------o     /
           \           /
feature/2   o---------o
```

**적합한 경우:**
- 웹 서비스, SaaS 등 지속적 배포가 필요한 경우
- 작은 팀, 빠른 릴리즈 주기
- CI/CD가 잘 갖춰진 환경

---

## 7. Trunk-Based Development

트렁크 기반 개발은 **하나의 메인 브랜치**(trunk/main)를 중심으로 모든 개발자가 작업하는 방식입니다.

### 핵심 원칙

- 브랜치 수명이 매우 짧음 (1~2일 이내)
- 작은 단위로 자주 커밋 및 병합
- Feature Flag로 미완성 기능 숨김
- 자동화된 테스트 필수

### 워크플로우

```bash
# 1. main에서 짧은 브랜치 생성
git switch main
git pull origin main
git switch -c feature/button-style

# 2. 작은 변경사항 커밋 (몇 시간 내)
git add .
git commit -m "Update button primary color"

# 3. 빠르게 main에 병합
git switch main
git merge feature/button-style
git push origin main
git branch -d feature/button-style
```

### Feature Flag 예시

```javascript
// 미완성 기능을 플래그로 숨김
if (featureFlags.newCheckout) {
  return <NewCheckoutFlow />;
} else {
  return <OldCheckoutFlow />;
}
```

**장점:**
- 병합 충돌 최소화 (브랜치가 짧아서)
- 지속적 통합(CI)과 궁합이 좋음
- 배포 주기가 빨라짐

**단점:**
- 강력한 CI/CD 인프라 필요
- 높은 테스트 커버리지 필요
- 개발자 간 긴밀한 협업 필요

---

## 8. Pull Request 활용

### PR 작성법

**좋은 PR 제목:**
```
✅ feat: 사용자 프로필 편집 기능 추가
✅ fix: 로그인 시 토큰 만료 버그 수정
❌ update
❌ 작업 완료
```

**PR 설명 템플릿:**
```markdown
## 변경 사항
- 사용자 프로필 편집 API 추가
- 프로필 이미지 업로드 기능 구현

## 테스트
- [ ] 유닛 테스트 추가
- [x] 수동 테스트 완료
- [x] 기존 테스트 통과

## 스크린샷
(UI 변경이 있다면 첨부)

## 관련 이슈
Closes #123
```

### 코드 리뷰 문화

**리뷰어:**
- 코드 품질, 로직 오류, 보안 이슈 확인
- 건설적인 피드백 제공

```
✅ "여기서 null 체크를 추가하면 더 안전할 것 같습니다."
❌ "이 코드는 완전히 잘못됐네요."
```

**작성자:**
- 피드백을 받아들이고 코드 수정
- 논의가 필요한 부분은 댓글로 토론

### PR 템플릿 설정

프로젝트 루트에 `.github/PULL_REQUEST_TEMPLATE.md` 파일 생성:

```markdown
## 변경 사항
<!-- 이 PR에서 무엇을 변경했는지 설명해주세요 -->

## 테스트
- [ ] 유닛 테스트 추가
- [ ] 통합 테스트 추가
- [ ] 수동 테스트 완료

## 체크리스트
- [ ] 코드 스타일 가이드 준수
- [ ] 주석 및 문서 업데이트
- [ ] Breaking Change 없음

## 관련 이슈
<!-- Closes #이슈번호 -->
```

---

## 9. Cherry-pick 활용

Cherry-pick은 다른 브랜치의 **특정 커밋만** 가져오는 기능입니다.

### 사용 시나리오

1. hotfix 커밋을 여러 브랜치에 적용
2. 실수로 잘못된 브랜치에 커밋한 경우
3. feature 브랜치의 일부 커밋만 main에 적용

### 기본 사용법

```bash
# 1. 가져올 커밋 해시 확인
git log feature/payment
# commit abc1234 - "Add payment validation"

# 2. main 브랜치로 이동
git switch main

# 3. 특정 커밋만 가져오기
git cherry-pick abc1234

# 성공 시 새 커밋이 main에 생성됨
```

### 여러 커밋 가져오기

```bash
# 연속된 커밋 범위 가져오기
git cherry-pick abc1234..def5678

# 여러 개별 커밋 가져오기
git cherry-pick abc1234 def5678 ghi9012
```

### 충돌 처리

```bash
# cherry-pick 중 충돌 발생 시
git status
# 충돌 파일 수정 후
git add .
git cherry-pick --continue

# 포기하고 취소
git cherry-pick --abort
```

### 실전 예시: hotfix를 여러 브랜치에 적용

```bash
# main에서 hotfix 커밋
git switch main
git commit -m "Fix critical security bug" # commit: xyz7890

# develop 브랜치에도 동일한 수정 적용
git switch develop
git cherry-pick xyz7890

# release 브랜치에도 적용
git switch release/2.0
git cherry-pick xyz7890
```

**주의사항:**
- Cherry-pick은 커밋을 **복사**하는 것 (해시가 달라짐)
- 같은 커밋을 여러 곳에 cherry-pick하면 나중에 merge 충돌 발생 가능
- 가능하면 merge를 사용하고, cherry-pick은 예외적인 상황에만 사용

---

## 10. 실전 시나리오: 팀 프로젝트 브랜치 운영

### 상황: 5명이서 쇼핑몰 프로젝트 개발

**팀 구성:**
- A: 팀장 (리뷰 총괄)
- B, C: 백엔드 개발
- D, E: 프론트엔드 개발

**전략: GitHub Flow 채택**

### 1단계: 프로젝트 초기 설정

```bash
# 팀장 A가 레포지토리 생성 및 초기 세팅
git init
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin https://github.com/team/shopping-mall.git
git push -u origin main
```

### 2단계: 팀원들이 작업 시작

**백엔드 개발자 B - 상품 API 개발:**
```bash
# 1. 레포지토리 클론
git clone https://github.com/team/shopping-mall.git
cd shopping-mall

# 2. 브랜치 생성
git switch -c feature/product-api

# 3. 작업 + 커밋
git add src/api/product.js
git commit -m "feat: Add product CRUD API"

# 4. 원격에 푸시
git push origin feature/product-api

# 5. GitHub에서 Pull Request 생성
```

**프론트엔드 개발자 D - 상품 목록 UI:**
```bash
git switch -c feature/product-list-ui
git add src/components/ProductList.jsx
git commit -m "feat: Add product list component"
git push origin feature/product-list-ui
# PR 생성
```

### 3단계: 코드 리뷰 및 병합

**팀장 A가 PR 리뷰:**
```
Review Comment:
"ProductList 컴포넌트에서 API 호출 시 에러 핸들링이 없는데,
try-catch로 감싸주시겠어요?"
```

**개발자 D가 수정:**
```bash
# 같은 브랜치에서 수정 작업
git add src/components/ProductList.jsx
git commit -m "fix: Add error handling for API calls"
git push origin feature/product-list-ui
# PR에 자동으로 반영됨
```

**팀장 A가 승인 및 병합:**
- GitHub에서 "Merge pull request" 클릭
- Squash and merge 선택 (여러 커밋을 하나로 합침)

### 4단계: 동기화 및 다음 작업

**모든 팀원이 최신 main 가져오기:**
```bash
git switch main
git pull origin main
```

**개발자 B가 다음 작업 시작:**
```bash
# 최신 main에서 새 브랜치 생성
git switch -c feature/order-api
# 작업 계속...
```

### 5단계: 긴급 버그 발생

**프로덕션에서 결제 버그 발견! (개발자 C가 처리)**

```bash
# main에서 hotfix 브랜치 생성
git switch main
git pull origin main
git switch -c hotfix/payment-bug

# 수정
git add src/api/payment.js
git commit -m "fix: Resolve payment calculation error"

# 긴급 PR 생성 및 빠른 리뷰
git push origin hotfix/payment-bug

# 병합 후 즉시 배포
```

### 6단계: 주간 스프린트 마무리

**금요일 오후, 모든 feature 브랜치 병합 완료:**
```bash
# 각 팀원이 로컬 정리
git switch main
git pull origin main

# 병합된 브랜치 삭제
git branch -d feature/product-api
git branch -d feature/product-list-ui

# 원격 브랜치도 정리 (이미 GitHub에서 삭제됐다면)
git fetch --prune
```

### 브랜치 네이밍 규칙 (팀 컨벤션)

```
feature/기능명      # feature/login, feature/user-profile
bugfix/버그명       # bugfix/cart-total-calculation
hotfix/긴급수정명   # hotfix/security-patch
refactor/리팩토링명 # refactor/auth-service
```

### 커밋 메시지 규칙

```bash
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 설정, 패키지 업데이트 등
```

**예시:**
```bash
git commit -m "feat: Add user authentication API"
git commit -m "fix: Resolve CORS issue in payment endpoint"
git commit -m "refactor: Extract validation logic to util"
```

---

## 마무리

### 브랜치 전략 선택 가이드

| 프로젝트 특성 | 추천 전략 |
|--------------|----------|
| 스타트업 웹 서비스 | GitHub Flow |
| 대규모 엔터프라이즈 소프트웨어 | Git Flow |
| CI/CD가 잘 갖춰진 프로젝트 | Trunk-Based Development |
| 오픈소스 프로젝트 | GitHub Flow + Fork & PR |
| 레거시 시스템 유지보수 | Git Flow |

### 체크리스트

**브랜치 관리:**
- [ ] 브랜치 이름은 의미 있게 짓기
- [ ] 작업 완료 후 브랜치 삭제
- [ ] main 브랜치는 항상 안정적인 상태 유지
- [ ] 푸시된 커밋은 rebase 하지 않기

**협업:**
- [ ] PR에 명확한 설명 작성
- [ ] 코드 리뷰는 건설적으로
- [ ] 충돌은 신중하게 해결
- [ ] 팀 컨벤션 준수

**습관:**
- [ ] 자주 커밋, 자주 푸시
- [ ] main에서 브랜치 생성 전 항상 `git pull`
- [ ] 작은 단위로 PR 올리기
- [ ] 테스트는 필수

Git 브랜치 전략은 팀의 규모, 프로젝트 특성, 배포 주기에 따라 달라집니다. 무조건 복잡한 전략이 좋은 것이 아니라, **팀에 맞는 전략**을 선택하고 일관되게 적용하는 것이 중요합니다. 작게 시작해서 필요에 따라 확장하세요!
