/* notes.js — 노트 탭: 단일 textarea가 state.note와 바인딩.
   state.note는 serializeState()에 포함되어 URL 해시로 공유되고 rt_session_backup에도 저장됨.
   (멀티 노트로 `rt_notes_v1` 별도 키에 저장하던 방식은 공유 룰 위반이라 단일 메모로 되돌림) */

function initNotes() {
  // 1회성 마이그레이션: 이전 멀티-노트 구조에서 텍스트 끌어오기
  migrateLegacyNotes();

  // textarea 레퍼런스를 dom에 늦바인딩 — state.js 모듈 로드 시점에는 `#noteTextarea`가 없었을 수 있음
  dom.noteTextarea = $('#noteTextarea');
  if (!dom.noteTextarea) return;

  dom.noteTextarea.value = state.note || '';
  dom.noteTextarea.readOnly = state.isReadOnly;
  dom.noteTextarea.placeholder = state.isReadOnly ? '' : t('notePlaceholder');

  dom.noteTextarea.addEventListener('input', () => {
    if (state.isReadOnly) return;
    state.note = dom.noteTextarea.value;
    scheduleHashUpdate();
  });
}

function migrateLegacyNotes() {
  const raw = localStorage.getItem('rt_notes_v1');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const notes = Array.isArray(parsed.notes) ? parsed.notes : [];
    if (notes.length > 0 && !state.note) {
      const merged = notes
        .map(n => {
          const title = (n.title || '').trim();
          const body = (n.body || '').trim();
          return title ? `# ${title}\n${body}` : body;
        })
        .filter(Boolean)
        .join('\n\n');
      if (merged) state.note = merged;
    }
  } catch(e) { /* ignore */ }
  try { localStorage.removeItem('rt_notes_v1'); } catch(e) { /* ignore */ }
}
