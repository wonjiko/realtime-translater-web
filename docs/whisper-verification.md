# Whisper Auto-Detect 기능 검증 체크리스트

총점: **100점**

---

## 1. UI 표시 (20점)

| # | 항목 | 조건 | 배점 | 결과 |
|---|------|------|------|------|
| 1-1 | OpenAI 키 미설정 시 Auto-detect 옵션 숨김 | Settings에 OpenAI 키 없이 Voice 드롭다운 확인 → "Auto-detect (Whisper)" 안 보임 | 5 | |
| 1-2 | OpenAI 키 설정 후 Auto-detect 옵션 노출 | Settings에서 OpenAI 키 입력 → Save → Voice 드롭다운에 "Auto-detect (Whisper)" 나타남 | 5 | |
| 1-3 | OpenAI 키 제거 시 Auto-detect 해제 | Auto-detect 선택 상태에서 키 삭제 → Save → English로 복귀, 옵션 숨김 | 5 | |
| 1-4 | Whisper 상태 텍스트 표시 | Auto-detect로 녹음 시작 → "Listening..." 표시, API 호출 중 "Processing..." 표시 | 5 | |

## 2. Web Speech API 기존 동작 (20점)

| # | 항목 | 조건 | 배점 | 결과 |
|---|------|------|------|------|
| 2-1 | English 선택 녹음 | Voice=English, 영어로 말하기 → 정상 인식 + 번역 | 5 | |
| 2-2 | Japanese 선택 녹음 | Voice=Japanese, 일본어로 말하기 → 정상 인식 + 번역 | 5 | |
| 2-3 | Korean 선택 녹음 | Voice=Korean, 한국어로 말하기 → 정상 인식 + 번역 | 5 | |
| 2-4 | Interim text 표시 | 수동 모드에서 말하는 중 중간 텍스트 실시간 표시 | 5 | |

## 3. Whisper 자동 감지 핵심 기능 (30점)

| # | 항목 | 조건 | 배점 | 결과 |
|---|------|------|------|------|
| 3-1 | 한국어 자동 감지 | Auto-detect 선택 → 한국어로 말하기 → 언어 태그 KO로 표시 + 번역 실행 | 10 | |
| 3-2 | 일본어 자동 감지 | Auto-detect 선택 → 일본어로 말하기 → 언어 태그 JA로 표시 + 번역 실행 | 10 | |
| 3-3 | 혼합 언어 전환 | 한국어 → 일본어 순서로 말하기 → 각 entry의 언어 태그가 올바르게 다름 | 10 | |

## 4. Target 체크박스 연동 (10점)

| # | 항목 | 조건 | 배점 | 결과 |
|---|------|------|------|------|
| 4-1 | Auto-detect 시 전체 활성화 | Auto-detect 선택 → EN/JA/KO 체크박스 모두 활성화 (disabled 없음) | 5 | |
| 4-2 | 수동 선택 시 소스 비활성화 | Korean 선택 → KO 체크박스 비활성화, EN/JA만 체크 가능 | 5 | |

## 5. 모드 전환 (10점)

| # | 항목 | 조건 | 배점 | 결과 |
|---|------|------|------|------|
| 5-1 | 녹음 중 Auto → 수동 전환 | Auto-detect로 녹음 중 → Korean 선택 → Whisper 중단, Web Speech API로 전환 | 5 | |
| 5-2 | 녹음 중 수동 → Auto 전환 | Korean으로 녹음 중 → Auto-detect 선택 → Web Speech 중단, Whisper로 전환 | 5 | |

## 6. 에러 처리 및 엣지 케이스 (10점)

| # | 항목 | 조건 | 배점 | 결과 |
|---|------|------|------|------|
| 6-1 | 잘못된 API 키 | 유효하지 않은 OpenAI 키로 Auto-detect 녹음 → 에러 토스트 표시, 앱 크래시 없음 | 3 | |
| 6-2 | 무음 청크 스킵 | Auto-detect 녹음 중 아무 말 없이 대기 → 불필요한 API 호출 없음 (콘솔 확인) | 3 | |
| 6-3 | URL 공유 복원 | Auto-detect로 생성한 transcript → URL 복사 → 새 탭에서 열기 → 정상 복원 | 4 | |

---

## 점수 산정

| 등급 | 점수 | 판정 |
|------|------|------|
| PASS | 80점 이상 | 배포 가능 |
| CONDITIONAL | 60-79점 | 핵심 기능(섹션 3) 만점 시 조건부 배포 |
| FAIL | 60점 미만 | 수정 필요 |

**총점: _____ / 100**
