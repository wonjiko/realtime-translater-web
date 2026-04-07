# {{feature_name}} - Testing Quality Report

**Date**: {{YYYY-MM-DD}}
**Project**: {{project_name}}
**Based on**: [TESTING.md](./TESTING.md) + [PRD.md](./PRD.md)
**Evaluation**: {{평가 범위 설명}}

---

## Overall Score: {{X.X}} / 10

| # | Category | Score | Verdict |
|---|----------|-------|---------|
| 1 | 카테고리 1 | X.X | Good / Adequate / Needs Work / Critical |
| 2 | 카테고리 2 | X.X | Good / Adequate / Needs Work / Critical |
| **Avg** | | **X.X** | |

<!-- Verdict 기준:
  9-10 Excellent: 이슈 없음 또는 Low만 존재
  7-8 Good: Medium 이하 이슈만 존재
  5-6 Adequate/Needs Work: High 이슈 존재
  3-4 Critical: Critical 이슈 존재
  1-2 Broken: 핵심 기능 동작 불가
-->

---

## 1. {{카테고리명}} — {{X.X}} / 10

**Works well:**
- 잘 동작하는 항목

**Issues:**

| Severity | Issue | Location |
|----------|-------|----------|
| Critical/High/Medium/Low | 이슈 설명 | Line XXX |

<!-- Critical/High 이슈는 코드 예시 포함:
```javascript
// 문제 코드
problematic code here

// 수정 제안
fixed code here
```
-->

**Improvements:**
- 개선 제안

---

<!-- 카테고리별로 반복 -->

## Cross-cutting Concerns

### Security — Score: {{X}} / 10

| Severity | Issue |
|----------|-------|
| 레벨 | 이슈 설명 |

### Accessibility — Score: {{X}} / 10

| Severity | Issue |
|----------|-------|
| 레벨 | 이슈 설명 |

<!-- 해당하는 횡단 관심사만 포함 (Data Durability, Code Quality 등) -->

---

## Priority Improvement Roadmap

### P0 — Must Fix (Security / Data Integrity)

1. **항목명**: 설명

### P1 — Should Fix (Reliability / UX)

2. **항목명**: 설명

### P2 — Nice to Have (Polish / Accessibility)

3. **항목명**: 설명
