# LLM 프롬프트 외부 파일 분리 + 회의 요약 프롬프트 개편

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (권장) 또는 superpowers:executing-plans. 각 Step은 체크박스(`- [ ]`)로 추적.

**Goal:** `assets/js/translation.js`에 흩어진 5개의 LLM 프롬프트를 `assets/js/prompts.js`로 분리하고, 회의 요약 프롬프트를 "주제 기반 상세 정리" 스타일로 교체한다.

**Architecture:**
- 새 전역 객체 `PROMPTS`를 `assets/js/prompts.js`에 선언. 함수는 `{ instruction }` (필요 시 구성용 필드 포함) 반환.
- Provider adapter(OpenAI/Anthropic)가 `instruction`을 자신에게 맞는 메시지 구조(system+user / user 합성)로 감싼다.
- 번들러/ES Module 도입 없음 — `<script>` 태그 순서만 조정 (`translation.js` 앞에서 로드).
- 로케일은 기존처럼 전역 `currentLocale`을 prompts 함수가 직접 참조.

**Tech Stack:** Vanilla JS (전역 namespace), 기존 script 태그 로딩 방식 유지, LLM provider = OpenAI Chat Completions / Anthropic Messages.

---

## 0. 프로젝트 제약 요약

| 항목 | 제약 |
|---|---|
| 빌드/번들러 | 없음. `index.html` + CDN 1개 (`lz-string`). **여전히 번들러 금지** |
| 모듈 시스템 | **ES Module import/export 금지** — `file://` 로컬 실행 호환, 전역 `window.*` 네임스페이스 |
| 스크립트 로드 순서 | `<script>` 태그 순서가 의존성 순서. `prompts.js`는 `translation.js` **앞**에 와야 함 |
| 테스트 | 단위 테스트 프레임워크 없음 — 수동 브라우저 검증 |
| 로케일 | `currentLocale` 전역 (`'ko'` \| `'en'`), `I18N` 객체 참조 |
| 커밋 | `/command-toybox:commit` 사용, Co-Authored-By 구문 금지 |

---

## 1. 변경 대상 요약

### 기존 프롬프트 위치 (`assets/js/translation.js`)
| ID | 위치 | 용도 | provider |
|---|---|---|---|
| T-OAI | 62~64행 | 번역 system prompt | OpenAI |
| T-ANT | 138행 | 번역 inline user prompt | Anthropic |
| S-OAI | 97~103행 | 요약 system prompt | OpenAI |
| S-ANT | 170~178행 | 요약 inline user prompt | Anthropic |
| E-OAI | 803~804행 | Whisper enhanced 오디오 system prompt | OpenAI |

### 새 파일 구조
- **Create:** `assets/js/prompts.js` — 전역 `PROMPTS` 객체 선언
- **Modify:** `assets/js/translation.js` — 위 5개 프롬프트 자리를 `PROMPTS.*` 호출로 대체
- **Modify:** `index.html` — `<script src="assets/js/prompts.js">`를 `state.js` 다음, `translation.js` 앞에 삽입

### API 형태 (전역 `PROMPTS`)
```js
PROMPTS.translate({ from, to })             // { instruction }
PROMPTS.summarize({ locale })               // { instruction }
PROMPTS.enhancedAudio({ targetLangNames })  // { instruction }
```

Provider가 instruction을 어떻게 쓰는지는 adapter 책임:
- **OpenAI**: `messages: [{role:'system', content: instruction}, {role:'user', content: <data>}]`
- **Anthropic**: `messages: [{role:'user', content: \`${instruction}\n\n${<data>}\`}]`
  - 단 summarize는 기존 format 유지 위해 `\`${instruction}\n\nTranscript:\n${text}\`` (Task 1 한정, Task 2에서 사라짐)

---

## Task 1: 프롬프트 순수 추출 (동작 변화 없음)

**Files:**
- Create: `assets/js/prompts.js`
- Modify: `assets/js/translation.js` (49~119행, 121~189행, 784~867행)
- Modify: `index.html` (266~271행 부근 script 태그 섹션)

### Step 1: `assets/js/prompts.js` 신설

- [ ] `assets/js/prompts.js`를 아래 내용으로 생성:

```js
/* prompts.js — LLM provider에 주입하는 프롬프트 중앙 관리소.
 * PROMPTS 전역을 제공. translation.js보다 먼저 로드되어야 함.
 * 각 함수는 { instruction } 을 반환하고, caller가 provider 포맷으로 감싼다. */

const PROMPTS = {
  translate({ from, to }) {
    return {
      instruction: `You are a professional translator. Translate the following ${LANG_NAMES[from]} text to ${LANG_NAMES[to]}. Return ONLY the translation, no explanations.`,
    };
  },

  summarize({ locale }) {
    const lang = locale === 'ko' ? 'Korean' : 'English';
    return {
      instruction: `You are a meeting assistant. Summarize the following meeting transcript.
Format your response in ${lang} with these sections:
## Key Topics
## Decisions
## Action Items

Keep it concise. Use bullet points.`,
    };
  },

  enhancedAudio({ targetLangNames }) {
    return {
      instruction: `You are a professional meeting transcriber and translator. Listen to the audio and respond with ONLY valid JSON (no markdown): {"text": "<original transcription>", "lang": "<detected language code: en, ja, or ko>", "translations": {"<target_lang_code>": "<translation>"}}\nTarget languages: ${targetLangNames}. Translate to all requested target languages.`,
    };
  },
};
```

### Step 2: `index.html` 스크립트 태그 추가

- [ ] `index.html` 266~271행의 script 섹션에서 `state.js`와 `tabs.js` 사이에 `prompts.js` 추가:

**Before:**
```html
<script src="assets/js/state.js"></script>
<script src="assets/js/tabs.js"></script>
<script src="assets/js/translation.js"></script>
```

**After:**
```html
<script src="assets/js/state.js"></script>
<script src="assets/js/prompts.js"></script>
<script src="assets/js/tabs.js"></script>
<script src="assets/js/translation.js"></script>
```

> **Why state.js 다음?** `prompts.js`는 `LANG_NAMES` 전역을 참조하는데 `LANG_NAMES`는 `state.js`에 정의되어 있음.

### Step 3: `translation.js` — T-OAI (OpenAI 번역) 교체

- [ ] 62~64행의 system content를 `PROMPTS.translate` 호출로 교체:

**Before (49~71행 중 해당 부분):**
```js
body: JSON.stringify({
  model: 'gpt-4o-mini',
  messages: [{
    role: 'system',
    content: `You are a professional translator. Translate the following ${LANG_NAMES[from]} text to ${LANG_NAMES[to]}. Return ONLY the translation, no explanations.`
  }, {
    role: 'user',
    content: text
  }],
```

**After:**
```js
body: JSON.stringify({
  model: 'gpt-4o-mini',
  messages: [{
    role: 'system',
    content: PROMPTS.translate({ from, to }).instruction
  }, {
    role: 'user',
    content: text
  }],
```

### Step 4: `translation.js` — T-ANT (Anthropic 번역) 교체

- [ ] 138행의 inline user content를 `PROMPTS.translate` 호출 + text 합성으로 교체:

**Before (130~140행 중 해당 부분):**
```js
body: JSON.stringify({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1000,
  messages: [{
    role: 'user',
    content: `Translate the following ${LANG_NAMES[from]} text to ${LANG_NAMES[to]}. Return ONLY the translation, no explanations.\n\n${text}`
  }],
}),
```

**After:**
```js
body: JSON.stringify({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1000,
  messages: [{
    role: 'user',
    content: `${PROMPTS.translate({ from, to }).instruction}\n\n${text}`
  }],
}),
```

> T-OAI의 system prompt는 "You are a professional translator." 한 문장을 접두사로 갖는 반면, T-ANT는 가지지 않는 차이가 원래 존재했다. 이 refactor에서 **양쪽 다 "You are a professional translator." 접두사를 갖도록 통일**되는 미세한 동작 변화가 발생한다 (Anthropic 요약품질이 살짝 개선될 여지만 있고 역행 가능성은 없음). 이 차이는 의도된 통일임을 PR/커밋 메시지에 명시할 것.

### Step 5: `translation.js` — S-OAI (OpenAI 요약) 교체

- [ ] 93~110행의 system content를 `PROMPTS.summarize` 호출로 교체:

**Before (93~110행):**
```js
body: JSON.stringify({
  model: 'gpt-4o-mini',
  messages: [{
    role: 'system',
    content: `You are a meeting assistant. Summarize the following meeting transcript.
Format your response in ${currentLocale === 'ko' ? 'Korean' : 'English'} with these sections:
## Key Topics
## Decisions
## Action Items

Keep it concise. Use bullet points.`
  }, {
    role: 'user',
    content: text
  }],
  temperature: 0.2,
  max_tokens: 2000,
}),
```

**After:**
```js
body: JSON.stringify({
  model: 'gpt-4o-mini',
  messages: [{
    role: 'system',
    content: PROMPTS.summarize({ locale: currentLocale }).instruction
  }, {
    role: 'user',
    content: text
  }],
  temperature: 0.2,
  max_tokens: 2000,
}),
```

### Step 6: `translation.js` — S-ANT (Anthropic 요약) 교체

- [ ] 165~180행의 inline user content를 `PROMPTS.summarize` 호출 + "Transcript:" 레이블 + text 합성으로 교체:

**Before (165~180행):**
```js
body: JSON.stringify({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 2000,
  messages: [{
    role: 'user',
    content: `Summarize the following meeting transcript. Format your response in ${currentLocale === 'ko' ? 'Korean' : 'English'} with these sections:
## Key Topics
## Decisions
## Action Items

Keep it concise. Use bullet points.

Transcript:
${text}`
  }],
}),
```

**After:**
```js
body: JSON.stringify({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 2000,
  messages: [{
    role: 'user',
    content: `${PROMPTS.summarize({ locale: currentLocale }).instruction}\n\nTranscript:\n${text}`
  }],
}),
```

> Anthropic은 원래 "You are a meeting assistant." 접두사가 없었고, OpenAI에만 있었다. 이 refactor에서 **양쪽 다 동일 instruction을 사용**하므로 Anthropic에도 동 접두사가 추가된다 (T-ANT와 동일한 의도된 통일).

### Step 7: `translation.js` — E-OAI (Whisper enhanced) 교체

- [ ] 800~811행의 system content를 `PROMPTS.enhancedAudio` 호출로 교체:

**Before (800~811행):**
```js
const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${settings.openaiKey}`,
  },
  body: JSON.stringify({
    model: settings.enhancedModel || 'gpt-4o-audio-preview',
    messages: [{
      role: 'system',
      content: `You are a professional meeting transcriber and translator. Listen to the audio and respond with ONLY valid JSON (no markdown): {"text": "<original transcription>", "lang": "<detected language code: en, ja, or ko>", "translations": {"<target_lang_code>": "<translation>"}}\nTarget languages: ${targets}. Translate to all requested target languages.`
    }, {
```

**After:**
```js
const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${settings.openaiKey}`,
  },
  body: JSON.stringify({
    model: settings.enhancedModel || 'gpt-4o-audio-preview',
    messages: [{
      role: 'system',
      content: PROMPTS.enhancedAudio({ targetLangNames: targets }).instruction
    }, {
```

> 기존 코드의 `const targets = state.targetLangs.map(l => LANG_NAMES[l] || l).join(', ');` (787행)는 그대로 유지.

### Step 8: 수동 검증 — 번역/요약 회귀 테스트

- [ ] 로컬에서 `index.html`을 브라우저로 열고 DevTools 콘솔에 에러가 없는지 확인
- [ ] 콘솔에서 `PROMPTS`가 정의되어 있는지 확인:
  ```js
  console.log(typeof PROMPTS, Object.keys(PROMPTS));
  // 기대: "object" ["translate", "summarize", "enhancedAudio"]
  ```
- [ ] OpenAI 키 설정 후 한국어 → 일본어 번역 1회 수행. 번역 결과가 정상적으로 나오는지 확인
- [ ] Anthropic 키 설정 후 동일 번역 수행. 결과 정상 확인
- [ ] 녹음 2~3문장 후 "요약" 버튼 클릭 — 기존과 유사한 3섹션(Key Topics/Decisions/Action Items) 요약이 OpenAI/Anthropic 각각에서 나오는지 확인
- [ ] (선택) Enhanced 모드(자동 언어 감지 + OpenAI 번역) 녹음 1회 — 번역·전사가 여전히 작동하는지 확인

> 출력 내용이 refactor 전과 **완전히 동일할 필요는 없음** (Anthropic에 "You are a meeting assistant." 접두사가 추가되었으므로 사소한 차이 가능). "작동 중단 없음 + 결과물이 합리적"만 확인.

### Step 9: Task 1 커밋

- [ ] `/command-toybox:commit`으로 커밋. 변경 파일: `assets/js/prompts.js` (신규), `assets/js/translation.js`, `index.html`.

권장 메시지 한 줄:
```
refactor(prompts): LLM 프롬프트 5개를 assets/js/prompts.js로 분리
```

---

## Task 2: 회의 요약 프롬프트를 주제 기반 상세 정리 스타일로 교체

**Files:**
- Modify: `assets/js/prompts.js` (`PROMPTS.summarize`)

> `translation.js` 변경 없음 — instruction 문자열만 교체.

### Step 1: `PROMPTS.summarize` 본문 교체

- [ ] `assets/js/prompts.js`의 `summarize` 함수를 아래 내용으로 교체:

**Before:**
```js
summarize({ locale }) {
  const lang = locale === 'ko' ? 'Korean' : 'English';
  return {
    instruction: `You are a meeting assistant. Summarize the following meeting transcript.
Format your response in ${lang} with these sections:
## Key Topics
## Decisions
## Action Items

Keep it concise. Use bullet points.`,
  };
},
```

**After:**
```js
summarize({ locale }) {
  if (locale === 'ko') {
    return {
      instruction: `당신은 회의록 정리 전문가입니다. 아래 속기록을 주제별로 구조화해 정리하세요.

규칙:
- 내용에 등장한 주제마다 \`### 주제명\` 섹션을 자유롭게 만든다 (사전에 정해진 카테고리 없음).
- 각 섹션은 관련 맥락 불릿(\`- \`)과 할 일 불릿(\`- [ ]\`)을 섞어서 나열한다.
- 고유명사(인명·회사명·제품명·날짜·숫자·금액·기간)는 원문 그대로 보존한다.
- 추상화·일반화하지 말고, 누가/언제/무엇을/왜 를 구체적으로 남긴다.
- 요약하지 말고 *정리*한다. 세부사항은 버리지 말고 축약하지 말 것.
- 마크다운만 사용. 인사말·총평·결론 문단 없음.`,
    };
  }
  return {
    instruction: `You are a meeting notes organizer. Structure the transcript below by topic.

Rules:
- Create \`### TopicName\` sections freely based on topics that appear (no predetermined categories).
- Each section mixes context bullets (\`- \`) and action items (\`- [ ]\`) inline in the same list.
- Preserve proper nouns (people, companies, products, dates, numbers, amounts, durations) verbatim from the source.
- Do not abstract or generalize — keep specifics: who, when, what, why.
- Do not summarize — *organize*. Never drop or compress details.
- Markdown only. No greetings, no overall commentary, no conclusion paragraphs.`,
  };
},
```

> **주의:** `###` 섹션 헤더의 경우 이미 있는 `markdownToHtml`(translation.js 1299행)이 `#{2,3}` 두 레벨 헤딩을 지원한다 — `h3`로 렌더링되므로 그대로 사용 가능. `- [ ]` 체크박스 문법은 현재 `markdownToHtml`이 일반 `<li>`로만 렌더링하므로 `[ ]` 텍스트가 그대로 보인다. 원시 표기가 그대로 노출되는 것은 현재 수용 가능한 동작이며, 체크박스 HTML 변환은 본 Task 범위 외이다.

### Step 2: `translation.js`의 Anthropic 요약 — "Transcript:" 레이블 제거 여부 결정

- [ ] 새 프롬프트는 "아래 속기록을" / "transcript below"로 자체 레퍼런스하므로 "Transcript:\n" 레이블은 **중복이자 노이즈**. 제거 권장.

**Modify `translation.js`의 S-ANT (Task 1의 Step 6에서 만든 상태):**

**Before (Task 1 결과):**
```js
content: `${PROMPTS.summarize({ locale: currentLocale }).instruction}\n\nTranscript:\n${text}`
```

**After:**
```js
content: `${PROMPTS.summarize({ locale: currentLocale }).instruction}\n\n${text}`
```

> OpenAI 쪽은 원래 user 메시지에 `text`만 넣었으므로 변경 없음 — 양쪽 adapter가 동일한 format으로 수렴.

### Step 3: 수동 검증 — 새 요약 스타일 확인

- [ ] 실제 회의 녹음 데이터(또는 기존 테스트 세션)에서 "요약" 버튼 실행
- [ ] 출력이 다음 기준을 만족하는지 확인:
  - [ ] `### 주제명` 형식의 섹션이 내용에 맞게 자유롭게 생성됨 (고정 "Key Topics/Decisions/Action Items"가 아님)
  - [ ] 각 섹션 안에 맥락 불릿(`- `)과 할 일 불릿(`- [ ]`)이 섞여 있음
  - [ ] 인명·회사명·날짜 등 고유명사가 원문 그대로 보존됨
  - [ ] 요약이 **지나치게 간결하지 않고** 구체 디테일이 살아 있음
- [ ] OpenAI / Anthropic 양쪽에서 동일하게 확인
- [ ] 영문 로케일 (`localStorage.rt_locale = 'en'` 설정 후 새로고침)에서도 영문 규칙이 적용되는지 1회 확인
- [ ] UI에 렌더된 결과(`markdownToHtml` 경유)에서 `### 주제`가 `<h3>`로, `- [ ]`는 raw text로 나타나는지 확인 (사전 공지한 기대 동작)

### Step 4: Task 2 커밋

- [ ] `/command-toybox:commit`으로 커밋. 변경 파일: `assets/js/prompts.js`, `assets/js/translation.js`.

권장 메시지:
```
feat(prompts): 회의 요약을 주제 기반 상세 정리 스타일로 교체
```

---

## 3. 완료 조건 (Definition of Done)

- [ ] `assets/js/prompts.js`가 존재하고 `PROMPTS.translate` / `PROMPTS.summarize` / `PROMPTS.enhancedAudio` 3개 함수를 전역으로 노출
- [ ] `assets/js/translation.js`에 프롬프트 문자열 리터럴이 남아있지 않음 (grep으로 "You are a"/"Summarize the following"/"meeting assistant" 등이 translation.js에서 잡히지 않음)
- [ ] 번역/요약/enhanced audio 3개 경로가 회귀 없이 작동
- [ ] 요약 결과가 이슈에 첨부된 스타일(주제별 `###` + 맥락/할 일 혼합 불릿)과 유사
- [ ] `index.html` 스크립트 로드 순서가 `state.js → prompts.js → tabs.js → translation.js → ...`

---

## 4. 롤백 전략

- **Task 2만 롤백**: `PROMPTS.summarize` 본문과 S-ANT 한 줄만 되돌리면 원래 3섹션 스타일 복귀. 커밋이 분리되어 있으므로 `git revert <task2-sha>`로 가능.
- **Task 1까지 롤백**: `git revert <task1-sha> <task2-sha>` (역순). `prompts.js` 파일은 삭제됨.

---

## 5. 비작업 (Out of Scope)

- `max_tokens` 조정 (사용자 지시로 불필요)
- `- [ ]` 체크박스 마크다운을 HTML `<input type=checkbox>`로 변환하는 `markdownToHtml` 개선
- `PROMPTS.translate`의 instruction을 provider별로 다르게 분기하는 기능
- 프롬프트의 i18n 외부화 (현재는 prompts.js 내부 분기로 충분)
- 번역 프롬프트의 톤/스타일 변경
