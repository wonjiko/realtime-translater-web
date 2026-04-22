/* app.js — 앱 초기화/설정/테마/토스트/리사이저/섹션토글/이벤트리스너 (섹션 4, 5, 6, 12, 13, 14, 16, 17) */
// ============================================================
// 4. Settings (localStorage)
// ============================================================
function loadSettings() {
  return {
    provider: localStorage.getItem('rt_provider') || 'mymemory',
    openaiKey: localStorage.getItem('rt_openai_key') || '',
    anthropicKey: localStorage.getItem('rt_anthropic_key') || '',
    gasUrl: localStorage.getItem('rt_gas_url') || '',
    theme: localStorage.getItem('rt_theme') || 'system',
    translationMode: localStorage.getItem('rt_translation_mode') || 'standard',
    enhancedModel: localStorage.getItem('rt_enhanced_model') || 'gpt-4o-audio-preview',
    chunkMode: localStorage.getItem('rt_chunk_mode') || 'time',
    chunkDuration: parseInt(localStorage.getItem('rt_chunk_duration') || '4000'),
    silenceThreshold: parseInt(localStorage.getItem('rt_silence_threshold') || '30'),
    maxChunkDuration: parseInt(localStorage.getItem('rt_max_chunk_duration') || '10000'),
  };
}

function saveSettings(settings) {
  localStorage.setItem('rt_provider', settings.provider);
  localStorage.setItem('rt_openai_key', settings.openaiKey);
  localStorage.setItem('rt_anthropic_key', settings.anthropicKey);
  localStorage.setItem('rt_gas_url', settings.gasUrl);
  localStorage.setItem('rt_theme', settings.theme);
  localStorage.setItem('rt_translation_mode', settings.translationMode);
  localStorage.setItem('rt_enhanced_model', settings.enhancedModel);
  localStorage.setItem('rt_chunk_mode', settings.chunkMode);
  localStorage.setItem('rt_chunk_duration', settings.chunkDuration);
  localStorage.setItem('rt_silence_threshold', settings.silenceThreshold);
  localStorage.setItem('rt_max_chunk_duration', settings.maxChunkDuration);
}

function getSettings() { return loadSettings(); }

// ============================================================
// 5. Theme
// ============================================================
function applyTheme(theme) {
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  $$('[data-theme-val]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const settings = getSettings();
  if (settings.theme === 'system') applyTheme('system');
});

// ============================================================
// 6. Toast Notifications
// ============================================================
function showToast(message, type = 'info', duration) {
  if (duration === undefined) duration = type === 'error' ? 6000 : 3000;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  if (type === 'error') {
    const closeBtn = document.createElement('span');
    closeBtn.textContent = ' ×';
    closeBtn.style.cssText = 'cursor:pointer;margin-left:8px;font-weight:bold;font-size:16px;';
    closeBtn.onclick = () => toast.remove();
    toast.appendChild(closeBtn);
  }
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// 12. Settings UI
// ============================================================
function initSettingsUI() {
  const settings = loadSettings();

  // Provider radio buttons
  const providerRadio = document.querySelector(`input[name="provider"][value="${settings.provider}"]`);
  if (providerRadio) providerRadio.checked = true;

  // API keys
  $('#inputOpenaiKey').value = settings.openaiKey;
  $('#inputAnthropicKey').value = settings.anthropicKey;
  $('#inputGasUrl').value = settings.gasUrl;

  updateProviderFields(settings.provider);
  applyTheme(settings.theme);
  updateWhisperAvailability();

  // Translation mode
  $$('[data-mode-val]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.modeVal === settings.translationMode);
  });
  $('#enhancedModelGroup').style.display = settings.translationMode === 'enhanced' ? '' : 'none';
  const hintKey = settings.translationMode === 'enhanced' ? 'enhancedModeHint' : 'standardModeHint';
  const hintEl = $('#translationModeHint');
  hintEl.dataset.i18n = hintKey;
  hintEl.textContent = t(hintKey);
  const modelSelect = $('#enhancedModelSelect');
  const customInput = $('#enhancedModelCustomInput');
  const presetValues = [...modelSelect.options].map(o => o.value).filter(v => v !== 'custom');
  if (presetValues.includes(settings.enhancedModel)) {
    modelSelect.value = settings.enhancedModel;
    customInput.style.display = 'none';
  } else {
    modelSelect.value = 'custom';
    customInput.value = settings.enhancedModel;
    customInput.style.display = '';
  }

  // Chunk settings
  $$('[data-chunk-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.chunkMode === settings.chunkMode);
  });
  const chunkHintKey = settings.chunkMode === 'silence' ? 'silenceBasedHint' : 'timeBasedHint';
  const chunkModeHint = $('#chunkModeHint');
  chunkModeHint.dataset.i18n = chunkHintKey;
  chunkModeHint.textContent = t(chunkHintKey);
  $('#chunkTimeOptions').style.display = settings.chunkMode === 'time' ? '' : 'none';
  $('#chunkSilenceOptions').style.display = settings.chunkMode === 'silence' ? '' : 'none';
  $$('[data-chunk-dur]').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.chunkDur) === settings.chunkDuration);
  });
  $('#silenceThresholdSlider').value = settings.silenceThreshold;
  $('#silenceThresholdValue').textContent = settings.silenceThreshold;
  $$('[data-max-dur]').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.maxDur) === settings.maxChunkDuration);
  });
}

function updateWhisperAvailability() {
  // 자동 언어 감지만 OpenAI Whisper에 실제로 종속됨 — 시스템 오디오 캡처는 브라우저 API라 키 불필요
  const settings = getSettings();
  const autoOption = $('#optAutoDetect');
  const hasKey = !!settings.openaiKey;

  if (autoOption) {
    autoOption.disabled = false;
    autoOption.title = hasKey ? '' : 'OpenAI API 키가 필요합니다';
  }
  if (!hasKey && state.sourceLang === 'auto') {
    state.sourceLang = localStorage.getItem('rt_source_lang') || 'ko-KR';
    if (state.sourceLang === 'auto') state.sourceLang = 'ko-KR';
    dom.sourceLang.value = state.sourceLang;
    localStorage.setItem('rt_source_lang', state.sourceLang);
    updateTargetCheckboxes();
  }
}

function updateProviderFields(provider) {
  $('#fieldsOpenai').classList.toggle('hidden', provider !== 'openai');
  $('#fieldsAnthropic').classList.toggle('hidden', provider !== 'anthropic');
  $('#fieldsGas').classList.toggle('hidden', provider !== 'gas');
  $('#fieldsTranslationMode').style.display = provider === 'openai' ? '' : 'none';
}

function saveCurrentSettings() {
  const provider = document.querySelector('input[name="provider"]:checked').value;
  const activeMode = document.querySelector('[data-mode-val].active');
  const activeChunkMode = document.querySelector('[data-chunk-mode].active');
  const activeChunkDur = document.querySelector('[data-chunk-dur].active');
  const activeMaxDur = document.querySelector('[data-max-dur].active');
  const modelSelect = $('#enhancedModelSelect');
  const customInput = $('#enhancedModelCustomInput');
  const enhancedModel = modelSelect.value === 'custom' ? customInput.value.trim() : modelSelect.value;
  const settings = {
    provider,
    openaiKey: $('#inputOpenaiKey').value.trim(),
    anthropicKey: $('#inputAnthropicKey').value.trim(),
    gasUrl: $('#inputGasUrl').value.trim(),
    theme: getSettings().theme,
    translationMode: activeMode?.dataset.modeVal || 'standard',
    enhancedModel: enhancedModel || 'gpt-4o-audio-preview',
    chunkMode: activeChunkMode?.dataset.chunkMode || 'time',
    chunkDuration: parseInt(activeChunkDur?.dataset.chunkDur || '4000'),
    silenceThreshold: parseInt($('#silenceThresholdSlider').value || '30'),
    maxChunkDuration: parseInt(activeMaxDur?.dataset.maxDur || '10000'),
  };
  saveSettings(settings);
  renderSummary();
  updateWhisperAvailability();
}

// ============================================================
// 13. Resizer — .main-split 안의 notes-pane 크기 조절 (row/column 양쪽 지원)
// ============================================================
function initResizer() {
  const split = $('#mainSplit');
  const pane = $('#notesPane');
  const resizer = $('#splitResizer');
  if (!split || !pane || !resizer) return;

  function isRow() {
    return getComputedStyle(split).flexDirection === 'row';
  }

  function applySize(px) {
    if (isRow()) {
      pane.style.width = px + 'px';
      pane.style.height = '';
    } else {
      pane.style.height = px + 'px';
      pane.style.width = '';
    }
    pane.style.flex = '0 0 auto';
  }

  const saved = parseInt(localStorage.getItem('rt_notes_pane_size') || '', 10);
  if (!isNaN(saved) && saved > 0) applySize(saved);

  let startPos, startSize;
  function onDown(e) {
    e.preventDefault();
    const cx = e.clientX ?? e.touches?.[0]?.clientX;
    const cy = e.clientY ?? e.touches?.[0]?.clientY;
    startPos = isRow() ? cx : cy;
    startSize = isRow() ? pane.offsetWidth : pane.offsetHeight;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  }
  function onMove(e) {
    e.preventDefault();
    const cx = e.clientX ?? e.touches?.[0]?.clientX;
    const cy = e.clientY ?? e.touches?.[0]?.clientY;
    const delta = isRow() ? (startPos - cx) : (startPos - cy);
    const limit = isRow() ? Math.max(240, window.innerWidth - 240) : Math.max(160, window.innerHeight - 240);
    const next = Math.max(140, Math.min(limit, startSize + delta));
    applySize(next);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
    const px = isRow() ? pane.offsetWidth : pane.offsetHeight;
    try { localStorage.setItem('rt_notes_pane_size', String(px)); } catch(e) { /* quota */ }
  }
  resizer.addEventListener('mousedown', onDown);
  resizer.addEventListener('touchstart', onDown, { passive: false });

  // 창 리사이즈로 row↔column 전환 시 저장값 재적용
  window.addEventListener('resize', () => {
    const s = parseInt(localStorage.getItem('rt_notes_pane_size') || '', 10);
    if (!isNaN(s) && s > 0) applySize(s);
  });
}

// ============================================================
// 14. Section Toggle (collapse/expand)
// ============================================================
function initSectionToggles() {
  function toggleSection(section, toggleBtn) {
    if (!section || !toggleBtn) return;
    const isCollapsed = section.classList.toggle('collapsed');
    toggleBtn.innerHTML = isCollapsed ? '&#9650;' : '&#9660;';
    if (isCollapsed) {
      section.dataset.prevHeight = section.style.height;
    } else {
      section.style.height = section.dataset.prevHeight || '120px';
    }
  }

  // Note section is now the Notes tab (승격됨) — skip
  if (dom.summaryHeader) {
    dom.summaryHeader.addEventListener('click', (e) => {
      if (e.target.closest('.section-header-actions')) return;
      toggleSection(dom.summarySection, dom.summaryToggle);
    });
  }
  if (dom.summaryToggle) {
    dom.summaryToggle.addEventListener('click', () => toggleSection(dom.summarySection, dom.summaryToggle));
  }
}

// ============================================================
// 16. Event Listeners
// ============================================================
function initEventListeners() {
  // Recording toggle
  dom.btnRec.addEventListener('click', () => {
    if (state.isReadOnly) return;
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  dom.btnSysAudio.addEventListener('click', () => {
    if (state.isReadOnly || state.isRecording) return;
    state.useSystemAudio = !state.useSystemAudio;
    localStorage.setItem('rt_use_sys_audio', state.useSystemAudio);
    updateSysAudioToggle();
  });

  // Mic device selector
  $('#micLabel').addEventListener('click', (e) => {
    e.stopPropagation();
    showDeviceDropdown();
  });
  document.addEventListener('click', (e) => {
    const dropdown = $('#deviceDropdown');
    if (dropdown && !e.target.closest('.mic-info')) dropdown.classList.remove('open');
  });

  // Share & Download & Open
  dom.btnShare.addEventListener('click', shareUrl);
  dom.btnDownload.addEventListener('click', downloadJson);
  dom.btnOpen.addEventListener('click', () => {
    dom.fileInput.value = '';
    dom.fileInput.click();
  });
  dom.fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) openJsonFile(file);
  });

  // Locale toggle
  $('#btnLocale').addEventListener('click', () => {
    setLocale(currentLocale === 'ko' ? 'en' : 'ko');
  });

  // Source language change
  dom.sourceLang.addEventListener('change', (e) => {
    const val = e.target.value;
    // Guard: auto-detect requires OpenAI key
    if (val === 'auto') {
      const settings = getSettings();
      if (!settings.openaiKey) {
        showToast(t('autoDetectRequiresKey'), 'error');
        e.target.value = state.sourceLang;
        return;
      }
    }
    state.sourceLang = val;
    localStorage.setItem('rt_source_lang', val);
    if (state.isRecording) {
      showToast(t('langChangedRestart'), 'info');
      stopRecording();
      startRecording();
    }
    updateTargetCheckboxes();
  });

  // Target language checkboxes
  $$('.target-langs input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.targetLangs = Array.from($$('.target-langs input:checked')).map(el => el.value);
      localStorage.setItem('rt_target_langs', JSON.stringify(state.targetLangs));
    });
  });

  // Note textarea (레거시 — 노트 탭으로 승격됨, 하위호환을 위해 null-guard)
  if (dom.noteTextarea) {
    dom.noteTextarea.addEventListener('input', () => {
      state.note = dom.noteTextarea.value;
      scheduleHashUpdate();
    });
  }

  // Settings modal
  dom.btnSettings.addEventListener('click', () => {
    dom.settingsModal.classList.add('visible');
  });
  dom.btnCloseSettings.addEventListener('click', () => {
    dom.settingsModal.classList.remove('visible');
    saveCurrentSettings();
  });
  dom.settingsModal.addEventListener('click', (e) => {
    if (e.target === dom.settingsModal) {
      dom.settingsModal.classList.remove('visible');
      saveCurrentSettings();
    }
  });

  // Provider change
  $$('input[name="provider"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const newProvider = e.target.value;
      updateProviderFields(newProvider);
      // Enhanced mode is only available for openai — reset to standard if switching away
      if (newProvider !== 'openai') {
        const activeMode = document.querySelector('[data-mode-val].active');
        if (activeMode && activeMode.dataset.modeVal === 'enhanced') {
          $$('[data-mode-val]').forEach(b => b.classList.remove('active'));
          document.querySelector('[data-mode-val="standard"]').classList.add('active');
          $('#enhancedModelGroup').style.display = 'none';
          const hint = $('#translationModeHint');
          hint.dataset.i18n = 'standardModeHint';
          hint.textContent = t('standardModeHint');
        }
      }
      saveCurrentSettings();
    });
  });

  // API key inputs — save on change
  ['#inputOpenaiKey', '#inputAnthropicKey', '#inputGasUrl'].forEach(sel => {
    $(sel).addEventListener('change', () => saveCurrentSettings());
  });

  // Theme buttons
  $$('[data-theme-val]').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeVal;
      const settings = getSettings();
      settings.theme = theme;
      saveSettings(settings);
      applyTheme(theme);
    });
  });

  // Translation mode toggle
  $$('[data-mode-val]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-mode-val]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isEnhanced = btn.dataset.modeVal === 'enhanced';
      $('#enhancedModelGroup').style.display = isEnhanced ? '' : 'none';
      const hint = $('#translationModeHint');
      const key = isEnhanced ? 'enhancedModeHint' : 'standardModeHint';
      hint.dataset.i18n = key;
      hint.textContent = t(key);
      saveCurrentSettings();
    });
  });

  // Enhanced model select
  $('#enhancedModelSelect').addEventListener('change', (e) => {
    $('#enhancedModelCustomInput').style.display = e.target.value === 'custom' ? '' : 'none';
    saveCurrentSettings();
  });
  $('#enhancedModelCustomInput').addEventListener('change', () => saveCurrentSettings());

  // Chunk mode toggle
  $$('[data-chunk-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-chunk-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isSilence = btn.dataset.chunkMode === 'silence';
      $('#chunkTimeOptions').style.display = isSilence ? 'none' : '';
      $('#chunkSilenceOptions').style.display = isSilence ? '' : 'none';
      const chunkHint = $('#chunkModeHint');
      const chunkKey = isSilence ? 'silenceBasedHint' : 'timeBasedHint';
      chunkHint.dataset.i18n = chunkKey;
      chunkHint.textContent = t(chunkKey);
      saveCurrentSettings();
    });
  });

  // Chunk duration buttons
  $$('[data-chunk-dur]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-chunk-dur]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveCurrentSettings();
    });
  });

  // Max chunk duration buttons
  $$('[data-max-dur]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-max-dur]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveCurrentSettings();
    });
  });

  // Silence threshold slider
  $('#silenceThresholdSlider').addEventListener('input', () => {
    $('#silenceThresholdValue').textContent = $('#silenceThresholdSlider').value;
    saveCurrentSettings();
  });

  // Test GAS connection
  dom.btnTestGas.addEventListener('click', async () => {
    const url = $('#inputGasUrl').value.trim();
    if (!url) {
      showToast(t('gasUrlRequired'), 'error');
      return;
    }
    try {
      const res = await fetchWithTimeout(url, {}, 10000);
      const data = await res.json();
      if (data.status === 'ok') {
        showToast(t('gasSuccess'), 'success');
      } else {
        showToast(t('gasNotOk'), 'error');
      }
    } catch (e) {
      showToast(`${t('gasFailed')}: ${e.message}`, 'error');
    }
  });

  // New session
  dom.btnNewSession.addEventListener('click', () => {
    history.replaceState(null, '', location.pathname);
    state.entries = [];
    state.note = '';
    state.summary = '';
    state.summaryEntryCount = 0;
    state.isReadOnly = false;
    setReadOnlyMode(false);
    renderAllEntries();
    renderNote();
    renderSummary();
  });

  // Summary refresh
  dom.btnRefreshSummary.addEventListener('click', refreshSummary);
}

function updateTargetCheckboxes() {
  if (state.sourceLang === 'auto') {
    $$('.target-langs input[type="checkbox"]').forEach(cb => { cb.disabled = false; });
    state.targetLangs = Array.from($$('.target-langs input:checked')).map(el => el.value);
    return;
  }
  const sourceCode = LANG_MAP[state.sourceLang].code;
  $$('.target-langs input[type="checkbox"]').forEach(cb => {
    if (cb.value === sourceCode) {
      cb.checked = false;
      cb.disabled = true;
    } else {
      cb.disabled = false;
    }
  });
  state.targetLangs = Array.from($$('.target-langs input:checked')).map(el => el.value);
}

// ============================================================
// 17. Initialization
// ============================================================
function init() {
  // Apply locale
  setLocale(currentLocale);

  // Restore source language & target languages from preferences
  dom.sourceLang.value = state.sourceLang;
  // Sync target checkboxes with saved state
  $$('.target-langs input[type="checkbox"]').forEach(cb => {
    cb.checked = state.targetLangs.includes(cb.value);
  });

  // Check for speech recognition support (don't create instance yet — defer to first REC press)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    dom.browserWarning.classList.add('visible');
    dom.btnRec.disabled = true;
  }

  // Load settings
  initSettingsUI();

  // Check for hash data (shared link)
  const hasData = loadFromHash();
  if (hasData) {
    setReadOnlyMode(true);
    renderAllEntries();
    renderNote();
    renderSummary();

    // Sync UI with loaded state
    if (state.sourceLang === 'auto') {
      dom.sourceLang.value = 'auto';
    } else {
      const slEntry = Object.entries(LANG_MAP).find(([, v]) => v.code === state.entries[0]?.s);
      if (slEntry) dom.sourceLang.value = slEntry[0];
    }
  } else {
    // Try recovering from localStorage backup
    const backup = localStorage.getItem('rt_session_backup');
    if (backup) {
      try {
        const data = JSON.parse(backup);
        if (data.v === 1 && data.t && data.t.length > 0) {
          if (confirm(t('restoreSession'))) {
            if (data.sl === 'auto') {
              state.sourceLang = 'auto';
            } else {
              const slEntry = Object.entries(LANG_MAP).find(([, v]) => v.code === data.sl);
              if (slEntry) state.sourceLang = slEntry[0];
            }
            state.targetLangs = data.tl || ['en', 'ja'];
            state.entries = data.t || [];
            state.note = data.n || '';
            state.summary = data.sum || '';
            renderAllEntries();
            renderNote();
          }
        }
      } catch(e) { /* corrupt backup, ignore */ }
    }
    setReadOnlyMode(false);
    renderSummary();
    updateTargetCheckboxes();
  }

  // Init UI components
  initTabs();
  // 읽기 전용 모드였다면 initTabs()가 localStorage 탭으로 복원하므로 재적용
  if (hasData) {
    switchTab('translate');
    $$('#tabBar .tab-btn').forEach(btn => { btn.disabled = true; });
  }
  initEventListeners();
  initNotes();
  initMeeting();
  updateSysAudioToggle();
  initResizer();

  // Warn before leaving if there's data
  window.addEventListener('beforeunload', (e) => {
    if (state.entries.length > 0 || state.isRecording) {
      e.preventDefault();
    }
  });

  // Mobile keyboard viewport handling
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      document.documentElement.style.setProperty('--vh', `${window.visualViewport.height}px`);
    });
    document.documentElement.style.setProperty('--vh', `${window.visualViewport.height}px`);
  }

  // Offline detection
  const offlineBanner = $('#offlineBanner');
  function updateOnlineStatus() {
    offlineBanner.classList.toggle('visible', !navigator.onLine);
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

init();
