/* notes.js — 노트 탭 로직 (섹션 13b) */
// ============================================================
// 13b. Notes Tab Logic
// ============================================================
let noteSaveTimer = null;

function initNotes() {
  // Load from localStorage
  try {
    const raw = localStorage.getItem('rt_notes_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      state.notes = Array.isArray(parsed.notes) ? parsed.notes : [];
      state.activeNoteId = parsed.activeNoteId || null;
    }
  } catch(e) { state.notes = []; state.activeNoteId = null; }

  // Migrate legacy state.note
  if (state.notes.length === 0 && state.note) {
    const migratedNote = {
      id: 'note_' + Date.now(),
      title: t('untitledNote') || '이전 메모',
      body: state.note,
      updatedAt: Date.now(),
    };
    state.notes = [migratedNote];
    state.activeNoteId = migratedNote.id;
    saveNotes();
  }

  renderNotesList();
  if (state.activeNoteId) {
    selectNote(state.activeNoteId);
  }

  // Event listeners
  const btnNewNote = $('#btnNewNote');
  if (btnNewNote) {
    btnNewNote.addEventListener('click', createNote);
  }
  const noteTitleInput = $('#noteTitleInput');
  if (noteTitleInput) {
    noteTitleInput.addEventListener('input', () => {
      const note = state.notes.find(n => n.id === state.activeNoteId);
      if (!note) return;
      note.title = noteTitleInput.value;
      note.updatedAt = Date.now();
      // Update list item title
      const listItem = document.querySelector(`.note-list-item[data-note-id="${note.id}"] .note-item-title`);
      if (listItem) listItem.textContent = note.title || t('untitledNote');
      saveNotesDebounced();
    });
  }
  const noteBodyTextarea = $('#noteBodyTextarea');
  if (noteBodyTextarea) {
    noteBodyTextarea.addEventListener('input', () => {
      const note = state.notes.find(n => n.id === state.activeNoteId);
      if (!note) return;
      note.body = noteBodyTextarea.value;
      note.updatedAt = Date.now();
      saveNotesDebounced();
    });
  }

  // Mobile: back button (toggle list/editor)
  const notesLayout = $('.notes-layout');
  const notesList = $('#notesList');
  const notesEditor = $('#notesEditor');
  if (notesLayout && notesList && notesEditor) {
    // On mobile, clicking a note hides the list
    notesList.addEventListener('click', (e) => {
      if (window.innerWidth <= 480 && e.target.closest('.note-list-item')) {
        notesList.classList.add('mobile-hidden');
        notesEditor.classList.remove('mobile-hidden');
      }
    });
  }
}

function saveNotes() {
  try {
    localStorage.setItem('rt_notes_v1', JSON.stringify({
      notes: state.notes,
      activeNoteId: state.activeNoteId,
    }));
  } catch(e) { /* quota */ }
}

function saveNotesDebounced() {
  clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(saveNotes, 500);
}

function renderNotesList() {
  const listEl = $('#notesListItems');
  if (!listEl) return;
  listEl.innerHTML = '';
  if (state.notes.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:16px 12px;color:var(--text-tertiary);font-size:13px;';
    empty.textContent = t('notesEmpty');
    listEl.appendChild(empty);
    return;
  }
  // Sort by updatedAt desc
  const sorted = [...state.notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  sorted.forEach(note => {
    const item = document.createElement('div');
    item.className = 'note-list-item';
    item.dataset.noteId = note.id;
    if (note.id === state.activeNoteId) item.classList.add('active');

    const titleEl = document.createElement('div');
    titleEl.className = 'note-item-title';
    titleEl.textContent = note.title || t('untitledNote');

    const dateEl = document.createElement('div');
    dateEl.className = 'note-item-date';
    dateEl.textContent = note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : '';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'note-item-delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = t('deleteNote');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(t('deleteNoteConfirm'))) {
        deleteNote(note.id);
      }
    });

    item.appendChild(deleteBtn);
    item.appendChild(titleEl);
    item.appendChild(dateEl);
    item.addEventListener('click', () => selectNote(note.id));
    listEl.appendChild(item);
  });
}

function selectNote(id) {
  state.activeNoteId = id;
  const note = state.notes.find(n => n.id === id);

  // Update list highlight
  $$('.note-list-item').forEach(el => {
    el.classList.toggle('active', el.dataset.noteId === id);
  });

  const emptyState = $('#notesEmptyState');
  const editorContent = $('#notesEditorContent');
  const titleInput = $('#noteTitleInput');
  const bodyTextarea = $('#noteBodyTextarea');

  if (!note) {
    if (emptyState) emptyState.style.display = '';
    if (editorContent) editorContent.style.display = 'none';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';
  if (editorContent) editorContent.style.display = 'flex';
  if (titleInput) titleInput.value = note.title || '';
  if (bodyTextarea) bodyTextarea.value = note.body || '';

  saveNotes();
}

function createNote() {
  const note = {
    id: 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    title: '',
    body: '',
    updatedAt: Date.now(),
  };
  state.notes.unshift(note);
  saveNotes();
  renderNotesList();
  selectNote(note.id);

  // Mobile: show editor
  const notesList = $('#notesList');
  const notesEditor = $('#notesEditor');
  if (window.innerWidth <= 480 && notesList && notesEditor) {
    notesList.classList.add('mobile-hidden');
    notesEditor.classList.remove('mobile-hidden');
  }
  // Focus title
  const titleInput = $('#noteTitleInput');
  if (titleInput) titleInput.focus();
}

function deleteNote(id) {
  const idx = state.notes.findIndex(n => n.id === id);
  if (idx === -1) return;
  state.notes.splice(idx, 1);
  if (state.activeNoteId === id) {
    state.activeNoteId = state.notes[0]?.id || null;
  }
  saveNotes();
  renderNotesList();
  selectNote(state.activeNoteId);
}
