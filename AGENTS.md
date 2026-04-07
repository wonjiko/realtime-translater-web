# AGENTS.md

이 파일은 AI 에이전트(LLM)가 이 프로젝트에서 작업할 때 따라야 하는 지침이다.

## 프로젝트 개요

- **제품**: 서버 없이 브라우저에서 동작하는 실시간 회의 번역 웹 앱
- **아키텍처**: `index.html` 단일 파일 (HTML + CSS + JS 인라인), 프레임워크 없음
- **외부 의존성**: lz-string CDN 1개만
- **보조 파일**: `gas-proxy.js` (Google Apps Script 프록시)

## 코드 규칙

### 단일 파일 원칙

- 모든 프론트엔드 코드는 `index.html` 하나에 유지한다
- 별도 `.js`, `.css` 파일로 분리하지 않는다
- 빌드 시스템, 번들러, 패키지 매니저를 도입하지 않는다

### 스타일

- CSS는 `<style>` 태그 내에 CSS 변수 기반으로 작성한다
- 다크 모드는 `[data-theme="dark"]` 셀렉터로 CSS 변수를 오버라이드한다
- JavaScript는 `<script>` 태그 내에 작성하며, ES6+ 문법을 사용한다
- 전역 `state` 객체를 통해 상태를 관리한다

### 보안 필수사항

- 사용자 입력이나 외부 API 응답을 `innerHTML`에 삽입할 때 반드시 HTML 이스케이프 처리
- API Key는 localStorage에만 저장, URL 해시에 절대 포함하지 않는다
- fetch 호출에는 반드시 timeout을 적용한다

## 문서 기반 워크플로우

이 프로젝트는 문서 기반 개발 사이클을 따른다. 작업 유형에 따라 아래 워크플로우를 수행한다.

### 워크플로우 개요

```
PRD → 구현 → TESTING → TESTING-REPORT → PLAN → 구현 (반복)
```

문서 작성 규칙: [docs/RULES.md](docs/RULES.md)
템플릿: [docs/templates/](docs/templates/)
예시: [docs/v1/](docs/v1/)

### 작업별 지침

#### 1. 새 기능 구현

**입력**: `docs/features/{feature-name}/PRD.md`

1. PRD.md의 모든 기능 요구사항을 읽는다
2. 비기능 요구사항(호환성, 반응형, 성능, 보안)을 확인한다
3. 데이터 스키마를 확인하고 기존 `state` 객체와의 호환성을 검토한다
4. `index.html`에 구현한다
5. PRD의 제한사항을 넘지 않는지 확인한다

**주의사항**:
- PRD에 명시되지 않은 기능을 추가하지 않는다
- 기존 기능을 깨뜨리지 않도록 기존 코드의 동작을 먼저 파악한다
- 새로운 외부 의존성을 추가하기 전에 정말 필요한지 검토한다

#### 2. 테스트 검증

**입력**: `docs/features/{feature-name}/TESTING.md` + 소스 코드

1. TESTING.md의 사전 준비 항목을 확인한다
2. 각 테스트 시나리오를 코드 레벨에서 검증한다:
   - 해당 동작이 코드에 구현되어 있는가?
   - 확인사항의 기대 결과가 실제로 발생하는가?
   - 에러 핸들링이 명시대로 동작하는가?
3. 코드를 읽으며 TESTING.md에 없는 엣지 케이스도 식별한다

**출력 형식**: 각 시나리오별 PASS/FAIL + 발견 이슈 목록

#### 3. 테스트 리포트 작성

**입력**: 검증 결과 + `docs/features/{feature-name}/PRD.md`

1. `docs/templates/TESTING-REPORT.template.md`를 복사한다
2. [docs/RULES.md](docs/RULES.md)의 TESTING-REPORT 규칙을 따른다:
   - 10점 만점으로 카테고리별 스코어링
   - Severity 4단계(Critical/High/Medium/Low) 분류
   - 이슈마다 코드 위치(Line 번호) 명시
   - Critical/High 이슈는 문제 코드 + 수정 제안 코드 포함
3. Priority Roadmap(P0/P1/P2)을 도출한다

#### 4. 개선 계획 수립

**입력**: `docs/features/{feature-name}/TESTING-REPORT.md`

1. `docs/templates/PLAN.template.md`를 복사한다
2. [docs/RULES.md](docs/RULES.md)의 PLAN 규칙을 따른다:
   - Phase 3단계(P0/P1/P2)로 분류
   - 각 항목에 문제-위치-해결 구조
   - 코드 변경 예시 포함
3. Out of Scope 항목을 이유와 함께 명시한다

#### 5. 개선 구현

**입력**: `docs/features/{feature-name}/PLAN.md`

1. Phase 순서(P0 → P1 → P2)대로 구현한다
2. 각 항목의 "해결" 섹션에 기술된 방법을 따른다
3. 코드 변경 예시가 있으면 이를 기반으로 구현한다
4. 하나의 Phase를 완료하면 해당 항목들을 검증한 뒤 다음 Phase로 진행한다

## 코드 수정 시 체크리스트

`index.html` 수정 후 아래 항목을 확인한다:

- [ ] 기존 기능이 깨지지 않았는가 (음성 인식, 번역, 공유, 다운로드)
- [ ] `innerHTML` 삽입 시 HTML 이스케이프가 적용되어 있는가
- [ ] 새로운 fetch 호출에 timeout이 적용되어 있는가
- [ ] 다크 모드에서 새 UI 요소가 정상 표시되는가
- [ ] 모바일 뷰에서 레이아웃이 깨지지 않는가
- [ ] 읽기 전용 모드(해시 데이터 URL)에서 새 기능이 적절히 동작하는가
- [ ] API Key가 URL 해시에 포함되지 않는가
