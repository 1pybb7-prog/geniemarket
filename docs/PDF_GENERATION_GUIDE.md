# PDF 생성 가이드

이 가이드는 프로젝트 문서를 PDF로 변환하는 방법을 설명합니다.

## 방법 1: md-to-pdf 패키지 사용 (권장)

### 1. 패키지 설치

```bash
pnpm add -D md-to-pdf
```

### 2. PDF 생성 스크립트 실행

```bash
# 프로젝트 개요 문서를 PDF로 변환
pnpm pdf:overview

# 또는 직접 실행
npx md-to-pdf docs/PROJECT_OVERVIEW.md
```

### 3. package.json에 스크립트 추가

`package.json`의 `scripts` 섹션에 다음을 추가:

```json
{
  "scripts": {
    "pdf:overview": "md-to-pdf docs/PROJECT_OVERVIEW.md --pdf-options '{\"format\": \"A4\", \"margin\": {\"top\": \"20mm\", \"right\": \"20mm\", \"bottom\": \"20mm\", \"left\": \"20mm\"}}'"
  }
}
```

## 방법 2: 온라인 도구 사용

### Markdown to PDF 온라인 변환기

1. [Markdown to PDF](https://www.markdowntopdf.com/) 접속
2. `docs/PROJECT_OVERVIEW.md` 파일 내용 복사
3. 붙여넣기 후 "Convert to PDF" 클릭
4. PDF 다운로드

### 기타 온라인 도구

- [Dillinger](https://dillinger.io/) - 마크다운 에디터 + PDF 내보내기
- [StackEdit](https://stackedit.io/) - 마크다운 에디터 + PDF 내보내기

## 방법 3: VS Code 확장 프로그램 사용

### Markdown PDF 확장 프로그램

1. VS Code에서 확장 프로그램 설치:
   - 확장 프로그램 검색: "Markdown PDF"
   - "Markdown PDF" (yzane) 설치

2. PDF 생성:
   - `docs/PROJECT_OVERVIEW.md` 파일 열기
   - `Ctrl+Shift+P` (또는 `Cmd+Shift+P` on Mac)
   - "Markdown PDF: Export (pdf)" 선택
   - PDF 파일이 같은 디렉토리에 생성됨

## 방법 4: Pandoc 사용 (고급)

### 1. Pandoc 설치

Windows:

```powershell
# Chocolatey 사용
choco install pandoc

# 또는 직접 다운로드
# https://pandoc.org/installing.html
```

### 2. PDF 생성

```bash
pandoc docs/PROJECT_OVERVIEW.md -o docs/PROJECT_OVERVIEW.pdf --pdf-engine=wkhtmltopdf
```

또는 LaTeX 사용:

```bash
pandoc docs/PROJECT_OVERVIEW.md -o docs/PROJECT_OVERVIEW.pdf
```

## 권장 방법

**초보자**: 방법 2 (온라인 도구) 또는 방법 3 (VS Code 확장 프로그램)  
**개발자**: 방법 1 (md-to-pdf 패키지)

## PDF 커스터마이징

### md-to-pdf 옵션

PDF 스타일을 커스터마이징하려면 `md-to-pdf.config.js` 파일 생성:

```javascript
module.exports = {
  pdf_options: {
    format: "A4",
    margin: {
      top: "20mm",
      right: "20mm",
      bottom: "20mm",
      left: "20mm",
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate:
      '<div style="font-size: 10px; text-align: center; width: 100%;">도소매 가격비교 플랫폼 - 프로젝트 개요</div>',
    footerTemplate:
      '<div style="font-size: 10px; text-align: center; width: 100%;">페이지 <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  },
  stylesheet: "path/to/custom.css", // 선택적 CSS 파일
};
```

## 문제 해결

### 한글 폰트 문제

PDF에 한글이 제대로 표시되지 않는 경우:

1. 시스템에 한글 폰트 설치 확인
2. md-to-pdf 설정에서 폰트 지정:

```javascript
module.exports = {
  pdf_options: {
    // ...
  },
  stylesheet: `
    @page {
      font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
    }
    body {
      font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
    }
  `,
};
```

### 이미지가 표시되지 않는 경우

마크다운 파일의 이미지 경로가 상대 경로인 경우, 절대 경로로 변경하거나 이미지를 인라인으로 포함해야 합니다.
