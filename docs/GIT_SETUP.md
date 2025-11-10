# Git 협업 환경 구축 가이드

이 문서는 프로젝트의 Git 협업 환경을 구축하는 방법을 안내합니다.

## 📋 목차

1. [GitHub 저장소 설정](#github-저장소-설정)
2. [브랜치 생성](#브랜치-생성)
3. [브랜치 보호 설정](#브랜치-보호-설정)
4. [PR 템플릿 설정](#pr-템플릿-설정)
5. [커밋 메시지 템플릿 설정](#커밋-메시지-템플릿-설정)
6. [이슈 라벨 설정](#이슈-라벨-설정)

---

## GitHub 저장소 설정

### 1. 저장소 생성

GitHub에서 새 저장소를 생성하거나 기존 저장소를 사용합니다.

### 2. 로컬 저장소 초기화

```bash
# 저장소 클론
git clone <repository-url>
cd geniemarket

# 또는 기존 프로젝트를 저장소에 연결
git init
git remote add origin <repository-url>
```

---

## 브랜치 생성

### 1. `dev` 브랜치 생성

```bash
# dev 브랜치 생성 및 전환
git checkout -b dev

# 원격 저장소에 푸시
git push -u origin dev
```

### 2. GitHub에서 기본 브랜치 설정

1. GitHub 저장소 → Settings → Branches
2. Default branch를 `dev`로 변경
3. `main` 브랜치는 프로덕션 배포용으로 유지

---

## 브랜치 보호 설정

### `main` 브랜치 보호

1. GitHub 저장소 → Settings → Branches
2. "Add branch protection rule" 클릭
3. Branch name pattern: `main` 입력
4. 다음 옵션 활성화:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (최소 1명)
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators

### `dev` 브랜치 보호 (선택사항)

`dev` 브랜치도 보호 규칙을 설정할 수 있습니다 (권장):

1. Branch name pattern: `dev` 입력
2. 다음 옵션 활성화:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (최소 1명)

---

## PR 템플릿 설정

### 1. `.github` 폴더 생성

```bash
mkdir -p .github
```

### 2. PR 템플릿 파일 생성

`.github/PULL_REQUEST_TEMPLATE.md` 파일을 생성하고 다음 내용을 추가:

```markdown
# Pull Request

## 📋 변경 사항

<!-- 이 PR에서 변경된 내용을 간단히 설명해주세요 -->

-

## 🎯 관련 이슈

<!-- 관련된 이슈 번호를 입력해주세요 (예: #123) -->

Closes #

## ✅ 체크리스트

<!-- PR을 제출하기 전에 다음 사항들을 확인해주세요 -->

- [ ] 코드가 프로젝트의 코딩 컨벤션을 따릅니다
- [ ] 자체적으로 코드 리뷰를 수행했습니다
- [ ] 코드에 적절한 주석을 추가했습니다 (특히 복잡한 로직의 경우)
- [ ] 관련 문서를 업데이트했습니다 (README, API 문서 등)
- [ ] 변경 사항에 대한 테스트를 추가했습니다 (가능한 경우)
- [ ] 로컬에서 빌드가 성공적으로 완료됩니다
- [ ] 새로운 의존성을 추가한 경우, `package.json`을 업데이트했습니다

## 📸 스크린샷 (UI 변경인 경우)

<!-- UI 변경이 있는 경우 스크린샷을 첨부해주세요 -->

## 🔍 리뷰 포인트

<!-- 리뷰어가 특히 확인해주길 원하는 부분이 있다면 적어주세요 -->

## 📝 추가 정보

<!-- 기타 리뷰어가 알아야 할 정보가 있다면 적어주세요 -->
```

### 3. 커밋 및 푸시

```bash
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "docs: add pull request template"
git push origin dev
```

---

## 커밋 메시지 템플릿 설정

### 1. 커밋 메시지 템플릿 파일 생성

`.github/.gitmessage` 파일을 생성하고 다음 내용을 추가:

```bash
# commit message template
#=================#
# <type>(<scope>): <subject>
# <BLANK LINE>
# <body>
# <BLANK LINE>
# <footer>
#=================#


# Any line of the commit message cannot be longer 100 characters! This allows the message to be easier to read on github as well as in various git tools.

## Subject line
# Subject line contains succinct description of the change.

# Allowed `<type>`
# feat (feature): 새로운 기능 추가
# fix (bug fix): 버그 수정
# docs (documentation): 문서 작업
# style (formatting, missing semi colons, …): 코드 스타일 수정
# refactor: 기능 변경 없이 코드 구조 개선
# test (when adding missing tests): 테스트 코드 추가 또는 기존 테스트 수정
# chore (maintain): 빌드, 패키지 매니저 설정 등 코드 수정이 없는 작업

# Allowed `<scope>`
# Scope could be anything specifying place of the commit change. For example layout, products, orders, auth, etc...

# `<subject>` text
# - use imperative, present tense: "change" not "changed" nor "changes"
# - don't capitalize first letter
# - no dot (.) at the end

## Message body
# - just as in <subject> use imperative, present tense: "change" not "changed" nor "changes"
# - includes motivation for the change and contrasts with previous behavior
```

### 2. Git 설정

```bash
# 로컬 저장소에 커밋 템플릿 설정
git config --local commit.template .github/.gitmessage
```

### 3. 커밋 및 푸시

```bash
git add .github/.gitmessage
git commit -m "docs: add commit message template"
git push origin dev
```

---

## 이슈 라벨 설정

### 1. 라벨 JSON 파일 생성

`.github/labels.json` 파일을 생성하고 다음 내용을 추가:

```json
[
  {
    "name": "bug",
    "color": "d73a4a",
    "description": "버그 또는 예상치 못한 동작"
  },
  {
    "name": "enhancement",
    "color": "a2eeef",
    "description": "새로운 기능 또는 개선 사항"
  },
  {
    "name": "documentation",
    "color": "0075ca",
    "description": "문서 관련 작업"
  },
  {
    "name": "question",
    "color": "d876e3",
    "description": "질문 또는 도움이 필요한 사항"
  },
  {
    "name": "help wanted",
    "color": "008672",
    "description": "외부 기여를 환영하는 이슈"
  },
  {
    "name": "good first issue",
    "color": "7057ff",
    "description": "신규 기여자에게 좋은 첫 이슈"
  },
  {
    "name": "priority: high",
    "color": "b60205",
    "description": "높은 우선순위"
  },
  {
    "name": "priority: medium",
    "color": "fbca04",
    "description": "중간 우선순위"
  },
  {
    "name": "priority: low",
    "color": "0e8a16",
    "description": "낮은 우선순위"
  },
  {
    "name": "status: in progress",
    "color": "f9d0c4",
    "description": "작업 진행 중"
  },
  {
    "name": "status: blocked",
    "color": "d93f0b",
    "description": "작업이 막힌 상태"
  },
  {
    "name": "status: needs review",
    "color": "fbca04",
    "description": "리뷰 필요"
  },
  {
    "name": "type: feature",
    "color": "0e8a16",
    "description": "새로운 기능"
  },
  {
    "name": "type: bugfix",
    "color": "d73a4a",
    "description": "버그 수정"
  },
  {
    "name": "type: refactor",
    "color": "a2eeef",
    "description": "코드 리팩토링"
  },
  {
    "name": "type: test",
    "color": "bfe5bf",
    "description": "테스트 관련"
  },
  {
    "name": "type: chore",
    "color": "c5def5",
    "description": "빌드, 설정 등"
  }
]
```

### 2. GitHub Label Sync 설치 및 사용

```bash
# GitHub Label Sync 설치
npm install -g github-label-sync

# 라벨 동기화 (GitHub Personal Access Token 필요)
github-label-sync --access-token <YOUR_TOKEN> --labels .github/labels.json <owner>/<repo>
```

또는 GitHub 웹 인터페이스에서 수동으로 라벨을 생성할 수 있습니다.

---

## 완료 체크리스트

- [ ] GitHub 저장소 생성 완료
- [ ] `dev` 브랜치 생성 및 기본 브랜치로 설정
- [ ] `main` 브랜치 보호 규칙 설정
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` 생성
- [ ] `.github/.gitmessage` 생성 및 Git 설정
- [ ] `.github/labels.json` 생성 (선택사항)
- [ ] `CONTRIBUTING.md` 확인

---

## 참고 자료

- [CONTRIBUTING.md](../CONTRIBUTING.md) - 기여 가이드
- [Git Convention](../.cursor/rules/common/git-convention.mdc) - Git 컨벤션 상세 문서
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Label Sync](https://github.com/Financial-Times/github-label-sync)

---

**설정이 완료되면 팀원들에게 공유하세요! 🚀**
