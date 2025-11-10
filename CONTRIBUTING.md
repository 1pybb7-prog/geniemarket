# 기여 가이드 (Contributing Guide)

도소매 가격비교 플랫폼 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하기 위한 가이드라인을 제공합니다.

## 📋 목차

1. [코드 컨벤션](#코드-컨벤션)
2. [Git 워크플로우](#git-워크플로우)
3. [브랜치 전략](#브랜치-전략)
4. [커밋 메시지 컨벤션](#커밋-메시지-컨벤션)
5. [코드 리뷰 규칙](#코드-리뷰-규칙)
6. [Pull Request 가이드](#pull-request-가이드)

---

## 코드 컨벤션

### TypeScript

- 모든 코드는 TypeScript로 작성합니다
- 타입은 명시적으로 정의합니다
- `interface`를 `type`보다 선호합니다
- `enum` 대신 `const` 객체를 사용합니다

### React & Next.js

- React Server Components를 우선적으로 사용합니다
- `'use client'`는 필요한 경우에만 사용합니다
- 컴포넌트는 재사용 가능하도록 설계합니다
- 파일명은 `kebab-case`로 작성합니다

### 스타일링

- Tailwind CSS를 사용합니다
- 모든 스타일은 Tailwind 유틸리티 클래스로 작성합니다

자세한 내용은 [AGENTS.md](../AGENTS.md)와 [.cursor/rules](../.cursor/rules)를 참고하세요.

---

## Git 워크플로우

### 브랜치 전략

프로젝트는 **GitFlow**를 기반으로 합니다:

- **`main`**: 프로덕션 배포용 브랜치 (보호됨)
- **`dev`**: 개발 통합 브랜치
- **`feature/기능명`**: 새로운 기능 개발 브랜치
- **`fix/버그명`**: 버그 수정 브랜치
- **`docs/문서명`**: 문서 작업 브랜치

### 브랜치 네이밍 규칙

형식: `type/[branch/]description[-#issue]`

**예시:**

- `feature/product-search` - 상품 검색 기능
- `fix/login-button-#123` - 로그인 버튼 버그 수정 (이슈 #123)
- `docs/api-documentation` - API 문서 작성
- `refactor/auth-service` - 인증 서비스 리팩토링

**브랜치 타입:**

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 작업
- `style`: 코드 스타일 수정
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드 설정, 패키지 업데이트 등

### 작업 흐름

1. **최신 코드 가져오기**

   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **기능 브랜치 생성**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **작업 및 커밋**

   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

4. **브랜치 푸시**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Pull Request 생성**
   - GitHub에서 `dev` 브랜치로 PR 생성
   - 코드 리뷰 요청

6. **리뷰 후 병합**
   - 리뷰 승인 후 `dev` 브랜치로 병합
   - 정기적으로 `dev` → `main` 병합

---

## 커밋 메시지 컨벤션

커밋 메시지는 **Conventional Commits** 형식을 따릅니다:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 예시

```bash
# 기능 추가
feat(products): add product search functionality

# 버그 수정
fix(auth): resolve login button click issue

# 문서 작업
docs(readme): update installation guide

# 리팩토링
refactor(api): improve error handling in product API
```

### 커밋 메시지 템플릿 설정

```bash
git config --local commit.template .github/.gitmessage
```

---

## 코드 리뷰 규칙

### 리뷰어 가이드

1. **긍정적인 피드백 제공**
   - 건설적인 비판을 제공합니다
   - 좋은 점도 언급합니다

2. **명확한 의견 제시**
   - "이 부분이 좋지 않다"보다 "이렇게 수정하면 더 좋을 것 같다" 형식으로 제안

3. **우선순위 명시**
   - 필수 수정 사항과 선택 사항을 구분

4. **빠른 응답**
   - PR 생성 후 24시간 이내에 초기 리뷰 제공

### PR 작성자 가이드

1. **명확한 설명 제공**
   - PR 템플릿을 모두 작성
   - 변경 사항을 명확히 설명

2. **리뷰 피드백 수용**
   - 리뷰어의 의견을 존중하고 적극적으로 반영
   - 의견이 다를 경우 토론을 통해 해결

3. **충분한 테스트**
   - 로컬에서 충분히 테스트 후 PR 제출
   - 가능한 경우 테스트 코드 추가

---

## Pull Request 가이드

### PR 생성 전 체크리스트

- [ ] 코드가 프로젝트의 코딩 컨벤션을 따릅니다
- [ ] 자체적으로 코드 리뷰를 수행했습니다
- [ ] 코드에 적절한 주석을 추가했습니다
- [ ] 관련 문서를 업데이트했습니다
- [ ] 로컬에서 빌드가 성공적으로 완료됩니다
- [ ] 새로운 의존성을 추가한 경우 `package.json`을 업데이트했습니다

### PR 작성 가이드

1. **제목**: 변경 사항을 명확하게 요약
2. **설명**: PR 템플릿을 모두 작성
3. **관련 이슈**: 관련된 이슈 번호 연결
4. **스크린샷**: UI 변경인 경우 스크린샷 첨부

---

## 협업 규칙

### 일일 스탠드업

- **시간**: 매일 오전 10분 (팀원 간 협의)
- **내용**:
  - 어제 한 작업
  - 오늘 할 작업
  - 막히는 부분이나 도움이 필요한 부분

### 할 일 관리

- **Notion** 또는 **Trello**를 사용하여 할 일 관리
- 각 작업은 명확한 설명과 우선순위를 가집니다
- 완료된 작업은 체크 표시

### 커뮤니케이션

- 기술적 질문은 GitHub Issues 또는 팀 채팅에서 논의
- 긴급한 문제는 팀원에게 직접 연락

---

## 질문이 있으신가요?

프로젝트에 대한 질문이나 제안사항이 있으시면 GitHub Issues를 통해 문의해주세요.

---

**감사합니다! 좋은 기여를 기대합니다! 🚀**
