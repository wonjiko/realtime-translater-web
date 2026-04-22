/* state.js — 전역 상수/상태/DOM 레퍼런스 (섹션 1, 1b, 2, 3) */
// ============================================================
// 1. Constants & Language Mappings
// ============================================================
const LANG_MAP = {
  'en-US': { code: 'en', label: 'EN', name: 'English' },
  'ja-JP': { code: 'ja', label: 'JA', name: 'Japanese' },
  'ko-KR': { code: 'ko', label: 'KO', name: 'Korean' },
};
const LANG_NAMES = { en: 'English', ja: 'Japanese', ko: 'Korean' };
const WHISPER_LANG_TO_APP = {
  'english': 'en', 'japanese': 'ja', 'korean': 'ko',
  'en': 'en', 'ja': 'ja', 'ko': 'ko',
};
const WHISPER_CHUNK_DURATION_MS = 4000;
const HASH_UPDATE_DEBOUNCE = 2000;
const SUMMARY_ENTRY_THRESHOLD = 10;

// ============================================================
// 1b. i18n
// ============================================================
const I18N = {
  ko: {
    pageTitle: '실시간 회의 번역기',
    appTitle: '실시간 번역기',
    settings: '설정',
    browserWarning: '이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge를 사용해주세요.',
    offlineWarning: '오프라인 상태입니다. 녹음과 번역에는 인터넷 연결이 필요합니다.',
    sharedTranscript: '공유된 회의록',
    readOnly: '읽기 전용',
    newSession: '새 세션',
    voice: '음성 언어',
    autoDetect: '자동 감지 (OpenAI Whisper 필요)',
    translate: '번역 대상',
    emptyTitle: '회의 번역 준비 완료',
    emptySteps: '1. 위에서 <b>음성 언어</b>와 <b>번역 대상</b>을 선택하세요<br>2. <b>REC</b>을 눌러 시작 — 실시간으로 번역됩니다<br>3. <b>공유</b> 또는 <b>다운로드</b>로 회의록을 저장하세요',
    notes: '메모',
    notePlaceholder: '회의 메모, 할 일, 기억할 내용을 적어두세요...',
    meetingSummary: '회의 요약',
    refresh: '새로고침',
    summaryDisabled: 'AI로 회의를 자동 요약합니다.<br><b>설정</b>에서 <b>OpenAI</b> 또는 <b>Anthropic</b> API 키를 설정하세요.',
    rec: 'REC',
    stop: 'STOP',
    share: '공유',
    download: '다운로드',
    translationProvider: '번역 제공자',
    mymemoryName: 'MyMemory (무료)',
    mymemoryDesc: '설정 불필요. 하루 5,000자 무료.',
    openaiName: 'OpenAI GPT (추천)',
    openaiDesc: '최고 품질. 회의 시간당 ~$0.05.',
    anthropicName: 'Anthropic Claude',
    anthropicDesc: '우수한 품질. API 키 필요.',
    gasName: 'Google Apps Script',
    gasDesc: 'Google 번역 품질. 무료, 설정 필요.',
    openaiKeyLabel: 'OpenAI API Key',
    anthropicKeyLabel: 'Anthropic API Key',
    gasUrlLabel: 'Google Apps Script 웹 앱 URL',
    storedLocally: '로컬에 저장됩니다. URL로 공유되지 않습니다.',
    gasHint: 'GAS 프록시 스크립트를 배포하고 URL을 붙여넣으세요.',
    testConnection: '연결 테스트',
    theme: '테마',
    light: '라이트',
    dark: '다크',
    system: '시스템',
    translating: '번역 중...',
    listening: '듣는 중...',
    processing: '처리 중...',
    loading: '로딩 중...',
    summaryUpdated: '요약이 업데이트되었습니다',
    summaryRequiresLLM: 'LLM 제공자가 필요합니다',
    noTranscript: '요약할 회의록이 없습니다',
    startRecordingForSummary: '녹음을 시작하면 AI가 회의를 요약합니다.',
    urlCopied: 'URL이 클립보드에 복사되었습니다!',
    urlTooLong: 'URL이 매우 깁니다. 일부 플랫폼에서 잘릴 수 있습니다. JSON 다운로드를 권장합니다.',
    noTranscriptToShare: '공유할 회의록이 없습니다',
    noTranscriptToDownload: '다운로드할 회의록이 없습니다',
    downloaded: '다운로드 완료!',
    micError: '마이크 오류',
    speechStopped: '음성 인식이 예기치 않게 중단되었습니다. 녹음을 다시 시작해주세요.',
    restartFailed: '음성 인식 재시작에 실패했습니다',
    cannotRecordOffline: '오프라인에서는 녹음할 수 없습니다',
    translationFailed: '번역 실패',
    translationError: '번역 오류',
    mymemoryLimit: 'MyMemory 일일 한도를 초과했습니다. 설정에서 다른 제공자로 전환하세요.',
    textTruncated: '500자 제한을 초과하여 텍스트가 잘렸습니다',
    micAccessFailed: '마이크 접근에 실패했습니다',
    unsupportedLang: '지원하지 않는 언어가 감지되었습니다',
    gasUrlRequired: 'GAS URL을 먼저 입력해주세요',
    gasSuccess: 'GAS 연결 성공!',
    gasFailed: 'GAS 연결 실패',
    gasNotOk: 'GAS가 응답했지만 상태가 ok가 아닙니다',
    restoreSession: '이전 세션이 있습니다. 복원하시겠습니까?',
    hashLoadFailed: '공유 데이터를 불러오는데 실패했습니다',
    autoDetectRequiresKey: '자동 감지에는 OpenAI API Key가 필요합니다. 설정에서 입력해주세요.',
    summaryFailed: '요약 실패',
    translationMode: '번역 모드',
    standardMode: '트랜스크립션',
    enhancedMode: '멀티모달',
    standardModeHint: '음성 → Whisper(원문) → 번역 API(번역) · 2단계 처리',
    enhancedModeHint: '음성 → Audio 모델(원문+번역 동시 반환) · 1단계 처리',
    enhancedModel: '번역 모델',
    enhancedModelCustom: '직접 입력',
    enhancedFallback: '멀티모달 모드 실패, 트랜스크립션으로 전환합니다',
    chunkSettings: '음성 분할',
    chunkDesc: '연속 음성을 일정 단위로 잘라 번역합니다. 짧으면 빠르게, 길면 문맥을 더 잘 이해합니다.',
    timeBased: '시간 기반',
    timeBasedHint: '일정 시간마다 자동으로 잘라서 번역합니다.',
    silenceBased: '무음 감지',
    silenceBasedHint: '말이 끊기는 순간을 감지해서 자연스럽게 잘라 번역합니다.',
    chunkDuration: '분할 간격',
    silenceThreshold: '무음 감도',
    silenceHint: '낮을수록 민감 (조용한 환경), 높을수록 둔감 (시끄러운 환경)',
    maxChunkDuration: '최대 분할 시간',
    enhancedModelPlaceholder: 'audio input 지원 모델명 입력',
    chunkHint: 'Whisper 모드(자동 감지/시스템 오디오)에만 적용 · 녹음 중에는 변경 불가',
    open: '열기',
    invalidJsonFile: '유효하지 않은 회의록 파일입니다',
    fileLoaded: '파일을 불러왔습니다',
    sysAudio: '시스템 오디오',
    sysAudioDesc: '녹음 전 활성화 · 상대방/영상 소리도 번역',
    sysAudioNotSupported: '이 브라우저는 시스템 오디오 캡처를 지원하지 않습니다.',
    displayShareCancelled: '화면 공유가 취소되었습니다.',
    noTabAudio: "선택한 탭에 오디오가 없습니다. '탭 오디오 공유'를 체크했는지 확인하세요.",
    sysAudioRequiresKey: '시스템 오디오는 OpenAI API 키가 필요합니다. Settings에서 키를 설정하세요.',
    displayShareEnded: '탭 공유가 중단되었습니다. 마이크만 캡처됩니다.',
    langChangedRestart: '언어가 변경되어 녹음을 재시작합니다',
    tabMeeting: '회의 기록',
    tabNotes: '노트',
    tabTranslate: '대화 번역',
    newNote: '+ 새 노트',
    deleteNote: '삭제',
    untitledNote: '제목 없는 노트',
    notesEmpty: '노트를 선택하거나 새로 만드세요',
    notesListTitle: '노트 목록',
    noteTitlePlaceholder: '제목',
    noteBodyPlaceholder: '내용을 입력하세요...',
    meetingTitlePlaceholder: '회의 제목 (선택)',
    summarizeMeeting: '요약하기',
    downloadTxt: 'TXT 다운로드',
    clearMeeting: '클리어',
    meetingClearConfirm: '회의 기록을 모두 삭제하시겠습니까?',
    meetingNothingToDownload: '다운로드할 회의 기록이 없습니다',
    meetingNothingToSummarize: '요약할 회의 기록이 없습니다',
    deleteNoteConfirm: '이 노트를 삭제하시겠습니까?',
    meetingEmptyPlaceholder: '회의 기록이 없습니다. REC 버튼으로 시작하세요.',
  },
  en: {
    pageTitle: 'Real-Time Meeting Translator',
    appTitle: 'Real-Time Translator',
    settings: 'Settings',
    browserWarning: 'This browser does not support Speech Recognition. Please use Chrome or Edge.',
    offlineWarning: 'You are offline. Recording and translation require an internet connection.',
    sharedTranscript: 'Shared transcript',
    readOnly: 'Read only',
    newSession: 'New Session',
    voice: 'Voice',
    autoDetect: 'Auto-detect (requires OpenAI Whisper)',
    translate: 'Translate',
    emptyTitle: 'Ready to translate your meeting',
    emptySteps: '1. Choose your <b>voice language</b> and <b>target languages</b> above<br>2. Press <b>REC</b> to start — speech will be translated in real time<br>3. Use <b>Share</b> or <b>Download</b> to save the transcript',
    notes: 'Notes',
    notePlaceholder: 'Meeting notes, action items, or anything you want to remember...',
    meetingSummary: 'Meeting Summary',
    refresh: 'Refresh',
    summaryDisabled: 'Auto-summarize your meeting with AI.<br>Set up an <b>OpenAI</b> or <b>Anthropic</b> API key in <b>Settings</b> to enable.',
    rec: 'REC',
    stop: 'STOP',
    share: 'Share',
    download: 'Download',
    translationProvider: 'Translation Provider',
    mymemoryName: 'MyMemory (Free)',
    mymemoryDesc: 'No setup needed. 5,000 chars/day free.',
    openaiName: 'OpenAI GPT (Recommended)',
    openaiDesc: 'Best quality. ~$0.05/hour meeting.',
    anthropicName: 'Anthropic Claude',
    anthropicDesc: 'Excellent quality. API key required.',
    gasName: 'Google Apps Script',
    gasDesc: 'Google Translate quality. Free, requires setup.',
    openaiKeyLabel: 'OpenAI API Key',
    anthropicKeyLabel: 'Anthropic API Key',
    gasUrlLabel: 'Google Apps Script Web App URL',
    storedLocally: 'Stored locally. Never shared via URL.',
    gasHint: 'Deploy the GAS proxy script and paste the URL here.',
    testConnection: 'Test Connection',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    translating: 'Translating...',
    listening: 'Listening...',
    processing: 'Processing...',
    loading: 'Loading...',
    summaryUpdated: 'Summary updated',
    summaryRequiresLLM: 'Summary requires LLM provider',
    noTranscript: 'No transcript to summarize',
    startRecordingForSummary: 'Start recording to generate an AI summary of your meeting.',
    urlCopied: 'URL copied to clipboard!',
    urlTooLong: 'URL is very long and may be truncated on some platforms. Consider downloading JSON instead.',
    noTranscriptToShare: 'No transcript to share',
    noTranscriptToDownload: 'No transcript to download',
    downloaded: 'Downloaded!',
    micError: 'Mic error',
    speechStopped: 'Speech recognition stopped unexpectedly. Please restart recording.',
    restartFailed: 'Failed to restart speech recognition',
    cannotRecordOffline: 'Cannot start recording while offline',
    translationFailed: 'Translation failed',
    translationError: 'Translation error',
    mymemoryLimit: 'MyMemory daily limit exceeded. Consider switching to another provider in Settings.',
    textTruncated: 'Text exceeded 500-char limit and was truncated',
    micAccessFailed: 'Microphone access failed',
    unsupportedLang: 'Unsupported language detected',
    gasUrlRequired: 'Please enter a GAS URL first',
    gasSuccess: 'GAS connection successful!',
    gasFailed: 'GAS connection failed',
    gasNotOk: 'GAS responded but status is not ok',
    restoreSession: 'A previous session was found. Would you like to restore it?',
    hashLoadFailed: 'Failed to load shared data',
    autoDetectRequiresKey: 'Auto-detect requires an OpenAI API Key. Please set it up in Settings.',
    summaryFailed: 'Summary failed',
    translationMode: 'Translation Mode',
    standardMode: 'Transcription',
    enhancedMode: 'Multimodal',
    standardModeHint: 'Audio → Whisper (transcript) → Translation API (translate) · 2-step',
    enhancedModeHint: 'Audio → Audio model (transcript + translation at once) · 1-step',
    enhancedModel: 'Translation Model',
    enhancedModelCustom: 'Custom',
    enhancedFallback: 'Multimodal mode failed, falling back to transcription mode',
    chunkSettings: 'Audio Splitting',
    chunkDesc: 'Splits continuous audio into chunks for translation. Shorter = faster, longer = better context.',
    timeBased: 'Time-based',
    timeBasedHint: 'Splits audio at fixed time intervals.',
    silenceBased: 'Silence Detection',
    silenceBasedHint: 'Detects pauses in speech and splits naturally at silence.',
    chunkDuration: 'Split Interval',
    silenceThreshold: 'Silence Sensitivity',
    silenceHint: 'Lower = more sensitive (quiet environment), Higher = less sensitive (noisy environment)',
    maxChunkDuration: 'Max Split Duration',
    enhancedModelPlaceholder: 'Enter audio-input compatible model name',
    chunkHint: 'Whisper mode only (auto-detect / system audio) · Locked during recording',
    open: 'Open',
    invalidJsonFile: 'Invalid transcript file',
    fileLoaded: 'File loaded',
    sysAudio: 'System Audio',
    sysAudioDesc: 'Enable before REC · Translate meeting/video audio',
    sysAudioNotSupported: 'This browser does not support system audio capture.',
    displayShareCancelled: 'Screen sharing was cancelled.',
    noTabAudio: "The selected tab has no audio. Make sure 'Share tab audio' is checked.",
    sysAudioRequiresKey: 'System audio requires an OpenAI API key. Set it up in Settings.',
    displayShareEnded: 'Tab sharing has stopped. Only microphone audio is being captured.',
    langChangedRestart: 'Language changed — restarting recording',
    tabMeeting: 'Meeting Notes',
    tabNotes: 'Notes',
    tabTranslate: 'Translation',
    newNote: '+ New Note',
    deleteNote: 'Delete',
    untitledNote: 'Untitled Note',
    notesEmpty: 'Select a note or create a new one',
    notesListTitle: 'Notes',
    noteTitlePlaceholder: 'Title',
    noteBodyPlaceholder: 'Start typing...',
    meetingTitlePlaceholder: 'Meeting title (optional)',
    summarizeMeeting: 'Summarize',
    downloadTxt: 'Download TXT',
    clearMeeting: 'Clear',
    meetingClearConfirm: 'Clear all meeting entries?',
    meetingNothingToDownload: 'No meeting entries to download',
    meetingNothingToSummarize: 'No meeting entries to summarize',
    deleteNoteConfirm: 'Delete this note?',
    meetingEmptyPlaceholder: 'No meeting transcript yet. Press REC to start.',
  }
};

let currentLocale = localStorage.getItem('rt_locale') || 'ko';

function t(key) {
  return I18N[currentLocale]?.[key] || I18N.en[key] || key;
}

function setLocale(locale) {
  currentLocale = locale;
  localStorage.setItem('rt_locale', locale);
  document.documentElement.lang = locale;
  document.title = t('pageTitle');

  // Update all data-i18n elements
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  $$('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });

  // Update empty state steps (innerHTML)
  const stepsEl = $('#emptySteps');
  if (stepsEl) stepsEl.innerHTML = t('emptySteps');

  // Update locale toggle button text
  const localeBtn = $('#btnLocale');
  if (localeBtn) localeBtn.textContent = locale === 'ko' ? 'EN' : 'KO';

  // Update note placeholder for readonly mode (null-guard: note textarea 탭으로 승격됨)
  if (!state.isReadOnly && dom.noteTextarea) {
    dom.noteTextarea.placeholder = t('notePlaceholder');
  }

  // Update meeting empty placeholder if visible
  const meetingEmpty = document.querySelector('#meetingEntries div[style*="text-align:center"]');
  if (meetingEmpty) meetingEmpty.textContent = t('meetingEmptyPlaceholder');
}

// ============================================================
// 2. State
// ============================================================
function safeParseJSON(raw, fallback) {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

const state = {
  isRecording: false,
  isReadOnly: false,
  sourceLang: localStorage.getItem('rt_source_lang') || 'ko-KR',
  targetLangs: safeParseJSON(localStorage.getItem('rt_target_langs'), null) || ['en', 'ja'],
  entries: [],
  interimText: '',
  note: '',
  summary: '',
  summaryEntryCount: 0,
  useWhisper: false,
  useSystemAudio: localStorage.getItem('rt_use_sys_audio') === 'true',
  // Tab state (NEW)
  activeTab: localStorage.getItem('rt_active_tab') || 'translate',
  recordingSurface: 'translate', // 'translate' | 'meeting'
  // Meeting tab (NEW)
  meetingEntries: [],
  meetingTitle: '',
  // Notes tab (NEW)
  notes: [],
  activeNoteId: null,
};

// ============================================================
// 3. DOM References
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  transcriptArea: $('#transcriptArea'),
  emptyState: $('#emptyState'),
  noteTextarea: null, // 노트 탭으로 승격 — renderNote()에서 안전하게 처리
  summaryContent: $('#summaryContent'),
  summaryDisabled: $('#summaryDisabled'),
  btnRec: $('#btnRec'),
  btnSysAudio: $('#btnSysAudio'),
  btnShare: $('#btnShare'),
  btnDownload: $('#btnDownload'),
  btnLocale: $('#btnLocale'),
  btnSettings: $('#btnSettings'),
  btnCloseSettings: $('#btnCloseSettings'),
  btnNewSession: $('#btnNewSession'),
  btnRefreshSummary: $('#btnRefreshSummary'),
  btnTestGas: $('#btnTestGas'),
  btnOpen: $('#btnOpen'),
  fileInput: $('#fileInput'),
  settingsModal: $('#settingsModal'),
  readonlyBanner: $('#readonlyBanner'),
  browserWarning: $('#browserWarning'),
  sourceLang: $('#sourceLang'),
  noteSection: null, // 탭으로 승격
  summarySection: $('#summarySection'),
  noteToggle: null,  // 탭으로 승격
  summaryToggle: $('#summaryToggle'),
  noteHeader: null,  // 탭으로 승격
  summaryHeader: $('#summaryHeader'),
  resizer: $('#resizer'),
  langBar: $('#langBar'),
  controlBar: $('#controlBar'),
  toastContainer: $('#toastContainer'),
};
