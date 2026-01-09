# 프로젝트 PDF 문서 생성 가이드

## 📄 프로젝트 개요 문서

프로젝트 전체를 파악할 수 있는 종합 문서가 생성되었습니다:

- **파일 위치**: `docs/PROJECT_OVERVIEW.md`
- **내용**: 프로젝트 소개, 기술 스택, 구조, 데이터베이스 설계, API 엔드포인트 등

## 🚀 빠른 시작: PDF 생성하기

### 방법 1: 자동 스크립트 사용 (가장 쉬움)

```bash
# 1. PDF 생성 패키지 설치
pnpm install

# 2. PDF 생성
pnpm pdf:overview
```

PDF 파일이 `docs/PROJECT_OVERVIEW.pdf`로 생성됩니다.

### 방법 2: VS Code 확장 프로그램 사용

1. VS Code에서 `docs/PROJECT_OVERVIEW.md` 파일 열기
2. 확장 프로그램 설치: "Markdown PDF" (yzane)
3. `Ctrl+Shift+P` → "Markdown PDF: Export (pdf)" 선택
4. PDF 파일이 같은 디렉토리에 생성됨

### 방법 3: 온라인 도구 사용

1. [Markdown to PDF](https://www.markdowntopdf.com/) 접속
2. `docs/PROJECT_OVERVIEW.md` 파일 내용 복사
3. 붙여넣기 후 "Convert to PDF" 클릭
4. PDF 다운로드

## 📋 문서 내용

프로젝트 개요 문서에는 다음 내용이 포함되어 있습니다:

1. **프로젝트 소개**
   - 핵심 가치
   - 타겟 사용자
   - 프로젝트 목표

2. **핵심 기능**
   - AI 자동 상품명 정리
   - 익명 도매점 최저가 비교
   - 공영도매시장 실시간 시세 조회
   - 간편 주문하기

3. **기술 스택**
   - 프론트엔드 (Next.js 15, React 19, TypeScript)
   - 백엔드/데이터베이스 (Supabase, Clerk)
   - AI & 공공 데이터 (Gemini API, 공공데이터포털 API)

4. **프로젝트 구조**
   - 디렉토리 구조
   - 주요 파일 설명

5. **데이터베이스 설계**
   - 주요 테이블 (users, products_raw, products_standard 등)
   - 뷰 (v_product_prices, v_lowest_prices 등)
   - Storage 버킷

6. **주요 API 엔드포인트**
   - 인증 관련
   - 상품 관련
   - 시세 관련
   - 주문 관련
   - 챗봇 관련

7. **인증 및 보안**
   - Clerk 인증 흐름
   - Row Level Security (RLS)
   - API 보안

8. **개발 환경 설정**
   - 필수 요구사항
   - 설치 및 실행 방법
   - 환경 변수 설정

9. **배포 및 운영**
   - 배포 플랫폼 (Vercel)
   - 배포 전 체크리스트
   - 비용 정보

10. **참고 문서**
    - 프로젝트 문서 링크
    - 외부 문서 링크

## 💡 챗봇 활용 팁

이 PDF 문서는 챗봇이 프로젝트를 이해하는 데 도움이 됩니다:

1. **프로젝트 구조 파악**: 챗봇이 파일 위치를 정확히 알 수 있습니다
2. **기술 스택 이해**: 사용된 기술과 라이브러리를 파악할 수 있습니다
3. **API 엔드포인트 참조**: API 구조와 사용법을 이해할 수 있습니다
4. **데이터베이스 스키마**: 테이블 구조와 관계를 파악할 수 있습니다

## 🔧 문제 해결

### PDF 생성이 안 되는 경우

1. **패키지 설치 확인**:

   ```bash
   pnpm install
   ```

2. **직접 실행**:

   ```bash
   npx md-to-pdf docs/PROJECT_OVERVIEW.md
   ```

3. **VS Code 확장 프로그램 사용**: 방법 2 참고

4. **온라인 도구 사용**: 방법 3 참고

### 한글이 깨지는 경우

PDF에 한글이 제대로 표시되지 않으면:

- 시스템에 한글 폰트가 설치되어 있는지 확인
- VS Code 확장 프로그램의 폰트 설정 확인
- 온라인 도구 사용 시 UTF-8 인코딩 확인

## 📚 추가 문서

- `docs/PDF_GENERATION_GUIDE.md`: 상세한 PDF 생성 가이드
- `docs/PRD.md`: 제품 요구사항 문서
- `docs/TODO.md`: 작업 목록
- `docs/Design.md`: 디자인 문서

---

**문서 생성일**: 2025년 11월  
**문서 버전**: 1.0
