# 문서 생성 룰

이 문서는 프로젝트 기능 개발 시 작성해야 하는 검증 루프 문서의 작성 규칙을 정의한다.

## 공통 규칙

### 파일 구조

```
docs/
├── RULES.md                           # 이 파일 (문서 생성 룰)
├── templates/                         # 빈 템플릿 (복사해서 사용)
│   ├── verification-plan.template.md  # 검증 루프 플랜
│   └── verification-result.template.md # 검증 루프 결과
├── workflows/                         # 워크플로우 프로토콜
│   └── verification-loop.md           # 검증 루프 오케스트레이션 상세
└── features/                          # 기능별 문서 (플랫 구조)
    ├── {feature-name}-verification-plan.md
    ├── {feature-name}-verification-result.md
    └── ...
```

### 네이밍 규칙

- **위치**: `docs/features/` 디렉토리에 플랫하게 배치
- **파일명**: `{feature-name}-verification-plan.md`, `{feature-name}-verification-result.md`
- feature-name은 kebab-case (예: `i18n`, `whisper`, `interim-translation`)

### 작성 원칙

1. **언어**: 한국어 기반 + 영어 기술 용어 혼용
2. **구조화**: LLM이 파싱 가능한 포맷 — 테이블, 코드블록, 번호 매긴 리스트, 체크리스트
3. **상호 참조**: 검증 결과에서 검증 플랜을 상대 경로로 링크 (예: `[검증 플랜](./i18n-verification-plan.md)`)
4. **구체성**: 모호한 표현("적절한", "빠른", "많은") 금지 → 구체적 수치/조건 사용
5. **독립성**: 각 문서는 단독으로 읽어도 맥락을 이해할 수 있어야 함

### 새 기능 문서 생성 절차

1. `docs/templates/verification-plan.template.md`를 `docs/features/{feature-name}-verification-plan.md`로 복사
2. 플레이스홀더(`{{...}}`)를 실제 값으로 교체
3. 구현 완료 후 검증 수행, 필요 시 `{feature-name}-verification-result.md` 작성

---

---

## Verification Plan

### 목적

개별 기능 추가/개선 시 구현 결과를 검증하기 위한 체크리스트를 정의한다.

### 필수 섹션

| # | 섹션 | 내용 | 비고 |
|---|---|---|---|
| 1 | **변경 사항 요약** | 이번 피처에서 변경된 항목 번호 리스트 | 3줄 이내 |
| 2 | **검증 항목** | 카테고리별 체크리스트 | `- [ ]` 형식 |
| 3 | **엣지 케이스** | 경계 조건, 예외 상황 검증 | 해당 항목만 포함 |

### 작성 규칙

- **제목 형식**: `# {피처명} — 검증 플랜`
- **카테고리별 분리**: `---` 구분선으로 섹션 구분
- **체크리스트 형식**: 모든 검증 항목은 `- [ ]`로 작성하여 실행 시 체크 가능
- **서브 카테고리**: 필요 시 `### N-M. 소제목`으로 구분
- **구체적 기대값**: "정상 동작" 같은 모호한 표현 대신 구체적 기대 결과 명시
- **상호 참조**: 검증 결과 문서에서는 검증 플랜을 상대 경로로 링크

### Verification Result (검증 결과)

검증 실행 후 결과를 기록할 때는 `{feature-name}-verification-result.md`로 작성한다.

- **메타데이터**: 검증 기준 문서 링크, 검증 일시, 검증 방법
- **결과 형식**: 테이블 (`| # | 항목 | 결과 | 비고 |`) 또는 체크리스트에 직접 체크
- **종합**: 총 항목 수 + PASS 수 기록

### 예시

> [docs/features/i18n-verification-plan.md](./features/i18n-verification-plan.md) 참조
> [docs/features/interim-translation-verification-result.md](./features/interim-translation-verification-result.md) 참조

---

## 체크리스트

새 기능 문서 작성 시 아래 체크리스트로 완성도를 확인한다:

### Verification Plan 체크리스트
- [ ] 제목 형식: `# {피처명} — 검증 플랜`
- [ ] 변경 사항 요약 포함 (번호 리스트)
- [ ] 카테고리별 `---` 구분
- [ ] 모든 항목이 `- [ ]` 체크리스트 형식
- [ ] 구체적 기대값 명시 (모호한 표현 없음)
- [ ] 파일명: `{feature-name}-verification-plan.md`
- [ ] 위치: `docs/features/`
