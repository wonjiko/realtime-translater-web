/* tabs.js — 탭 관리 (meeting / translate / summary) */

const VALID_TABS = ['meeting', 'translate', 'summary'];

function switchTab(tab) {
  if (!VALID_TABS.includes(tab)) tab = 'translate';
  state.activeTab = tab;
  try { localStorage.setItem('rt_active_tab', tab); } catch(e) { /* quota */ }

  $$('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.tab === tab);
  });
  $$('.tab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (tab === 'meeting' && typeof renderMeetingProse === 'function') {
    renderMeetingProse();
  } else if (tab === 'summary' && typeof renderSummary === 'function') {
    renderSummary();
  }
}

function initTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      switchTab(btn.dataset.tab);
    });
  });

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

  // 레거시 'notes' 저장값은 translate로 정규화
  const saved = localStorage.getItem('rt_active_tab');
  const initial = VALID_TABS.includes(saved) ? saved : 'translate';
  switchTab(initial);
}
