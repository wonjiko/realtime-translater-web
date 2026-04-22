/* tabs.js — 탭 관리 (섹션 3b) */
// ============================================================
// 3b. Tab Management
// ============================================================
function switchTab(tab) {
  const validTabs = ['meeting', 'notes', 'translate'];
  if (!validTabs.includes(tab)) tab = 'translate';
  state.activeTab = tab;
  try { localStorage.setItem('rt_active_tab', tab); } catch(e) { /* quota */ }

  // Update panels
  $$('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.tab === tab);
  });
  // Update buttons
  $$('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  // Show/hide recording badge on non-translate tabs
  updateRecordingBadges();
}

function updateRecordingBadges() {
  const meetingBadge = $('#meetingRecBadge');
  const translateBadge = $('#translateRecBadge');
  if (meetingBadge) meetingBadge.classList.toggle('visible', state.isRecording && state.recordingSurface === 'meeting' && state.activeTab !== 'meeting');
  if (translateBadge) translateBadge.classList.toggle('visible', state.isRecording && state.recordingSurface === 'translate' && state.activeTab !== 'translate');
}

function initTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      switchTab(btn.dataset.tab);
    });
  });

  // Keyboard navigation (WAI-ARIA tablist pattern)
  const tabBar = $('#tabBar');
  if (tabBar) {
    tabBar.addEventListener('keydown', (e) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (!keys.includes(e.key)) return;
      const btns = Array.from(tabBar.querySelectorAll('.tab-btn:not(:disabled)'));
      if (btns.length === 0) return;
      const current = btns.indexOf(document.activeElement);
      let next;
      if (e.key === 'ArrowLeft') next = current <= 0 ? btns.length - 1 : current - 1;
      else if (e.key === 'ArrowRight') next = current === btns.length - 1 ? 0 : current + 1;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = btns.length - 1;
      btns[next].focus();
      btns[next].click();
      e.preventDefault();
    });
  }

  // Restore last active tab
  const savedTab = localStorage.getItem('rt_active_tab') || 'translate';
  switchTab(savedTab);
}
