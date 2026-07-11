// ===== App shell: routing, nav, drawer, onboarding, motion helpers =====

const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 4l8 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 20v-6h4v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  entry: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" stroke-width="1.8"/><path d="M12 8.5v7M8.5 12h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  history: '<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8 3v4M16 3v4M4.5 10h15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19V11M11 19V5M17 19v-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3.5 19h17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  team: '<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="17.5" cy="8.5" r="2.2" stroke="currentColor" stroke-width="1.8"/><path d="M15.2 19c.2-2.6 1.6-4.3 3.8-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h9M17 7h3M4 17h3M11 17h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="14.5" cy="7" r="2.3" stroke="currentColor" stroke-width="1.8"/><circle cx="7.5" cy="17" r="2.3" stroke="currentColor" stroke-width="1.8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'หน้าหลัก', primary: true },
  { key: 'entry', label: 'บันทึกงาน', primary: true },
  { key: 'history', label: 'ปฏิทิน', primary: true },
  { key: 'reports', label: 'รายงาน', primary: true },
  { key: 'team', label: 'ทีม', roles: ['admin', 'super_admin'] },
  { key: 'settings', label: 'ตั้งค่า' },
];

const UI = {
  entryDate: toDateStr(new Date()),
  entryCat: 'Laser',
  entryQuery: '',
  historyYear: new Date().getFullYear(),
  historyMonth: new Date().getMonth(),
  historySelectedDay: toDateStr(new Date()),
  reportsYear: new Date().getFullYear(),
  reportsMonth: new Date().getMonth(),
};

let lastRenderedView = null;

function currentView() {
  const h = location.hash.replace('#/', '');
  return h || 'dashboard';
}

function navigate(view) {
  location.hash = '#/' + view;
}

// ===== Overlay helpers (modal / drawer) — ใช้ .open ควบคุม transition, ไม่ต้องง้อ display:none =====
function openOverlay(el) { el.classList.add('open'); }
function closeOverlay(el) { el.classList.remove('open'); }

function openDrawer() {
  openOverlay(document.getElementById('drawer-backdrop'));
  openOverlay(document.getElementById('drawer'));
  document.getElementById('drawer').setAttribute('aria-hidden', 'false');
}
function closeDrawer() {
  closeOverlay(document.getElementById('drawer-backdrop'));
  closeOverlay(document.getElementById('drawer'));
  document.getElementById('drawer').setAttribute('aria-hidden', 'true');
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 1800);
}

// ===== Animated money figures — คงค่าก่อนหน้าไว้ข้ามการ render เพื่อนับวิ่งขึ้น/ลงอย่างนุ่มนวล =====
const NumberAnim = { prev: {} };
function moneySpan(key, value) {
  const from = key in NumberAnim.prev ? NumberAnim.prev[key] : value;
  NumberAnim.prev[key] = value;
  return `<span data-anim-key="${escapeHtml(key)}" data-anim-to="${value}">${fmtMoney(from)}</span>`;
}
function runNumberAnimations(root) {
  root.querySelectorAll('[data-anim-key]').forEach(el => {
    const to = parseFloat(el.getAttribute('data-anim-to'));
    const from = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
    if (from === to) { el.textContent = fmtMoney(to); return; }
    const start = performance.now();
    const duration = 450;
    (function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmtMoney(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  });
}

function boot() {
  if (Store.isFirebase) {
    // โหมด Firebase: การรันเว็บจะทำงานผ่าน onAuthStateChanged ด้านล่างโดยอัตโนมัติ
    return;
  }
  const user = Store.getActiveUser();
  const onboarding = document.getElementById('onboarding');
  const app = document.getElementById('app');
  if (!user) {
    onboarding.classList.remove('hidden');
    app.classList.add('hidden');
    renderOnboardingSwitch();
    return;
  }
  onboarding.classList.add('hidden');
  app.classList.remove('hidden');
  lastRenderedView = null;
  renderNav(user);
  renderProfileChip(user);
  renderDrawerProfile(user);
  render();
}

function renderOnboardingSwitch() {
  const users = Object.values(Store._db.users);
  const box = document.getElementById('onboarding-switch');
  if (users.length === 0) { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="section-label" style="text-align:left">บัญชีที่เคยใช้ในเครื่องนี้</div>' +
    users.map(u => `
      <div class="profile-pick-item">
        <span>${escapeHtml(u.displayName)} <span class="role-badge">${roleLabel(u.role)}</span></span>
        <button data-switch="${u.id}">เข้าใช้งาน</button>
      </div>`).join('');
  box.querySelectorAll('[data-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      Store._db.activeUserId = btn.getAttribute('data-switch');
      Store._persist();
      boot();
    });
  });
}

function roleLabel(role) {
  return { assistant: 'Assistant', admin: 'Admin', super_admin: 'Super Admin' }[role] || role;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderNav(user) {
  const items = NAV_ITEMS.filter(it => !it.roles || it.roles.includes(user.role));
  const view = currentView();

  document.getElementById('topnav').innerHTML = items.map(it =>
    `<button class="${it.key === view ? 'active' : ''}" data-nav="${it.key}">${it.label}</button>`
  ).join('');

  const primaryItems = items.filter(it => it.primary);
  document.getElementById('bottomnav').innerHTML =
    primaryItems.map(it => `
      <button class="${it.key === view ? 'active' : ''}" data-nav="${it.key}">
        <span class="icon">${ICONS[it.key]}</span>${it.label}
      </button>`).join('') +
    `<button data-open-drawer><span class="icon">${ICONS.menu}</span>เมนู</button>`;

  document.getElementById('drawer-nav').innerHTML = items.map(it =>
    `<button class="${it.key === view ? 'active' : ''}" data-nav="${it.key}"><span class="icon">${ICONS[it.key]}</span>${it.label}</button>`
  ).join('');

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => { navigate(btn.getAttribute('data-nav')); closeDrawer(); });
  });
  const openBtn = document.querySelector('[data-open-drawer]');
  if (openBtn) openBtn.addEventListener('click', openDrawer);
}

function renderProfileChip(user) {
  const chip = document.getElementById('btn-profile');
  const initial = (user.displayName || '?').trim().charAt(0).toUpperCase();
  chip.innerHTML = `<span class="avatar">${initial}</span><span>${escapeHtml(user.displayName)}</span>`;
  chip.onclick = () => navigate('settings');
}

function renderDrawerProfile(user) {
  const box = document.getElementById('drawer-profile');
  box.innerHTML = `<div class="drawer-profile-name">${escapeHtml(user.displayName)}</div><div class="drawer-profile-role"><span class="role-badge">${roleLabel(user.role)}</span></div>`;
}

function render() {
  const user = Store.getActiveUser();
  if (!user) { boot(); return; }
  renderNav(user);
  const root = document.getElementById('view-root');
  const view = currentView();
  const changedView = view !== lastRenderedView;
  lastRenderedView = view;

  if (view === 'entry') renderEntry(root, user);
  else if (view === 'history') renderHistory(root, user);
  else if (view === 'reports') renderReports(root, user);
  else if (view === 'team') renderTeam(root, user);
  else if (view === 'settings') renderSettings(root, user);
  else renderDashboard(root, user);

  runNumberAnimations(root);

  const fab = document.getElementById('btn-fab');
  if (fab) fab.classList.toggle('hidden-fab', view === 'entry');

  if (changedView) {
    root.classList.remove('view-enter');
    void root.offsetWidth; // reflow เพื่อรีสตาร์ท animation
    root.classList.add('view-enter');
    window.scrollTo(0, 0);
  }
}

window.addEventListener('hashchange', render);

// ลิควิดกลาส: topbar เข้มขึ้น/ทึบขึ้นเล็กน้อยเมื่อเลื่อนหน้าจอ (เหมือน nav bar แบบ iOS)
window.addEventListener('scroll', () => {
  document.querySelector('.topbar')?.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

// ===== Drawer wiring =====
document.getElementById('btn-hamburger').addEventListener('click', openDrawer);
document.getElementById('btn-drawer-close').addEventListener('click', closeDrawer);
document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);
document.getElementById('btn-drawer-logout').addEventListener('click', () => { closeDrawer(); Store.logout(); boot(); });

// ===== FAB wiring =====
document.getElementById('btn-fab').addEventListener('click', () => { UI.entryDate = toDateStr(new Date()); navigate('entry'); });

// ===== Onboarding wiring =====
document.getElementById('btn-google-login').addEventListener('click', () => {
  if (Store.isFirebase) {
    const loader = document.getElementById('loader');
    loader.classList.remove('hidden');
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
      console.error("Google Auth error:", err);
      showToast("ล็อกอินล้มเหลว: " + err.message);
      loader.classList.add('hidden');
    });
  } else {
    openOverlay(document.getElementById('name-modal'));
  }
});
document.getElementById('btn-cancel-name').addEventListener('click', () => {
  closeOverlay(document.getElementById('name-modal'));
});
document.getElementById('btn-confirm-name').addEventListener('click', () => {
  const name = document.getElementById('input-name').value.trim();
  const role = document.getElementById('input-role').value;
  if (!name) { showToast('กรอกชื่อก่อนนะ'); return; }
  Store.createUser(name, role);
  closeOverlay(document.getElementById('name-modal'));
  document.getElementById('input-name').value = '';
  location.hash = '#/dashboard';
  boot();
});

boot();

// การผูก Auth Event Listener ของ Firebase (ทำงานเฉพาะเมื่อใส่ Config)
if (Store.isFirebase) {
  const loader = document.getElementById('loader');
  loader.classList.remove('hidden');

  auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        loader.classList.remove('hidden');
        // โหลดข้อมูลจาก Firestore
        await Store.fetchUserFromCloud(
          firebaseUser.uid, 
          firebaseUser.email, 
          firebaseUser.displayName
        );
        document.getElementById('onboarding').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        lastRenderedView = null;
        const user = Store.getActiveUser();
        renderNav(user);
        renderProfileChip(user);
        renderDrawerProfile(user);
        render();
      } catch (error) {
        console.error("Error fetching user on state change:", error);
        showToast("โหลดข้อมูลล้มเหลว กำลังรันแบบออฟไลน์");
      } finally {
        loader.classList.add('hidden');
      }
    } else {
      loader.classList.add('hidden');
      document.getElementById('onboarding').classList.remove('hidden');
      document.getElementById('app').classList.add('hidden');
      renderOnboardingSwitch();
    }
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support optional */ });
  });
}
