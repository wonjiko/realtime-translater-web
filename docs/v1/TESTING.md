> 📌 이 문서는 [docs/RULES.md](../RULES.md)의 **TESTING** 작성 규칙 예시입니다.

# Testing Guide

## 사전 준비

- **브라우저**: Chrome 또는 Edge (Web Speech API 필수)
- **마이크**: 내장 또는 외장 마이크 연결
- **인터넷**: 음성 인식 + 번역 API 모두 인터넷 필요

## 1. 기본 동작 검증

### 1.1 페이지 로드
1. `index.html`을 Chrome에서 열기 (더블클릭 또는 `file://` 프로토콜)
2. 확인사항:
   - 헤더, 언어 선택바, 트랜스크립트 영역, 노트, 회의록 요약, 컨트롤바가 모두 표시
   - 빈 상태 메시지 "Press the record button..." 표시
   - Firefox로 열면 "This browser does not support Speech Recognition" 경고 표시

### 1.2 음성 인식
1. Voice를 `English`로 설정
2. `● REC` 버튼 클릭
3. 마이크 권한 허용
4. 영어로 "Hello, how are you?" 말하기
5. 확인사항:
   - 말하는 동안 회색 이탤릭체로 interim 텍스트 표시
   - 말이 끝나면 확정된 텍스트가 `[EN]` 태그와 함께 항목으로 추가
   - 타임스탬프 표시
   - "Translating..." 표시 후 번역 결과로 대체

### 1.3 언어 전환
1. 녹음 중 Voice를 `Japanese`로 변경
2. 일본어로 말하기
3. 확인사항:
   - 인식 언어가 자동으로 전환
   - 새 항목에 `[JA]` 태그 표시
   - 타겟 언어(EN, KO)로 번역

### 1.4 녹음 정지
1. `■ Stop` 버튼 클릭
2. 확인사항:
   - REC 버튼 펄스 애니메이션 정지
   - interim 텍스트 제거
   - 기존 트랜스크립트 유지

## 2. 번역 제공자 검증

### 2.1 MyMemory (기본)
1. 설정에서 MyMemory 선택 (기본값)
2. 녹음 후 말하기
3. 확인사항:
   - API 키 없이 번역 동작
   - 번역 결과 표시 (품질은 보통)

### 2.2 OpenAI GPT
1. 설정(⚙) 열기 → OpenAI GPT 선택 → API Key 입력
2. 설정 닫기 → 녹음 후 말하기
3. 확인사항:
   - 고품질 번역 결과
   - 회의록 요약 영역 활성화 (비활성 안내 메시지 사라짐)
   - 잘못된 API Key 입력 시 에러 토스트 표시

### 2.3 Anthropic Claude
1. 설정에서 Anthropic Claude 선택 → API Key 입력
2. 녹음 후 말하기
3. 확인사항:
   - 번역 동작
   - 회의록 요약 활성화

### 2.4 Google Apps Script
1. `gas-proxy.js`를 script.google.com에 배포
2. 설정에서 GAS 선택 → Web App URL 입력
3. `⚡ Test Connection` 버튼 클릭
4. 확인사항:
   - 테스트 성공 토스트 표시
   - 녹음 후 Google 번역 품질의 번역 결과

## 3. 노트 영역 검증

1. 노트 영역에 텍스트 입력: "마케팅 예산 확인 필요"
2. 확인사항:
   - 타이핑한 내용이 표시
   - URL 해시에 반영 (주소창 확인)
3. 노트 헤더 클릭하여 접기/펼치기 동작 확인

## 4. 회의록 요약 검증

### 4.1 LLM 미연동 시
1. MyMemory 또는 GAS 제공자 사용
2. 확인사항:
   - "Meeting summary requires LLM provider" 안내 표시
   - Refresh 버튼 숨김

### 4.2 LLM 연동 시
1. OpenAI 또는 Anthropic 설정
2. 10개 이상의 문장을 녹음
3. 확인사항:
   - 자동으로 요약 생성 시작
   - "주요 안건 / 결정 사항 / Action Items" 형식으로 표시
4. `↻ Refresh` 버튼 클릭 → 수동 갱신 확인

## 5. URL 해시 공유 검증

### 5.1 URL 복사
1. 몇 개의 항목을 녹음한 후 `🔗 Share` 클릭
2. 확인사항:
   - "URL copied to clipboard!" 토스트 표시

### 5.2 읽기 전용 모드
1. 복사한 URL을 새 탭에 붙여넣기
2. 확인사항:
   - "Shared transcript — Read only" 배너 표시
   - 트랜스크립트, 노트, 요약이 모두 복원
   - 녹음 버튼, 언어 선택바 숨김
   - 노트 영역 편집 불가
   - `New Session` 버튼 클릭 시 빈 세션으로 초기화

### 5.3 JSON 다운로드
1. `↓ Download` 클릭
2. 확인사항:
   - `meeting-YYYY-MM-DD.json` 파일 다운로드
   - JSON에 트랜스크립트, 노트, 요약 포함

## 6. UI/UX 검증

### 6.1 다크 모드
1. 설정 → Theme에서 Dark 클릭
2. 확인사항:
   - 전체 UI가 다크 테마로 전환
3. System 클릭 → OS 설정에 따라 자동 전환

### 6.2 모바일 반응형
1. Chrome DevTools → 모바일 디바이스 모드 (iPhone, Galaxy 등)
2. 확인사항:
   - 모든 요소가 한 화면에 표시 (가로 스크롤 없음)
   - 버튼이 터치하기 충분한 크기
   - 컨트롤바 하단 고정
   - 설정 모달이 하단에서 슬라이드업

### 6.3 리사이저
1. 트랜스크립트와 노트 사이의 리사이즈 바를 드래그
2. 확인사항:
   - 노트 영역 높이 조절 가능
   - 최소 60px ~ 최대 400px 범위 제한

## 7. 에러 핸들링 검증

| 시나리오 | 예상 동작 |
|---|---|
| 마이크 권한 거부 | 에러 토스트 표시 |
| 잘못된 API Key | "Translation error" 메시지 + 에러 토스트 |
| 네트워크 끊김 | 번역 실패 메시지 표시 |
| 손상된 해시 데이터 URL | "Failed to load shared data" 토스트, 빈 세션 |
| MyMemory 일일 한도 초과 | 번역 에러 표시, 다른 제공자로 전환 안내 |
