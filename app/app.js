// ===== App shell: routing, nav, drawer, onboarding, motion helpers =====

// กันซูมด้วยนิ้ว (pinch) และดับเบิลแตะซูม ให้ใช้งานรู้สึกเหมือนแอปจริงเวลาเปิดผ่านเบราว์เซอร์มือถือ
// meta viewport (user-scalable=no) + CSS touch-action กันได้ส่วนใหญ่แล้ว แต่ Safari บน iOS ใช้ gesture event
// ของตัวเองสำหรับ pinch ที่ไม่ฟังค่า touch-action จึงต้องดักเพิ่มตรงนี้ — ไม่กระทบการปัดสกอลปกติ
['gesturestart', 'gesturechange', 'gestureend'].forEach(evt => {
  document.addEventListener(evt, e => e.preventDefault());
});
document.addEventListener('touchmove', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

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
  { key: 'team', label: 'ทีม', roles: ['super_admin'] },
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
// แอปถูก mount (โชว์หน้าจอหลัก) ไปแล้วหรือยัง — ใช้กันไม่ให้เอฟเฟกต์เข้าหน้าเล่นซ้ำตอน Firebase sync เบื้องหลัง
let appMounted = false;

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

// ===== ปุ่มซ่อน/แสดงรายได้ในหน้า Dashboard — เผื่อเปิดจอตอนมีทีมงานอยู่ใกล้ๆ ค่าเก็บไว้ข้าม session ผ่าน localStorage =====
const INCOME_HIDDEN_KEY = 'feeapp-income-hidden';
function isIncomeHidden() {
  return localStorage.getItem(INCOME_HIDDEN_KEY) === '1';
}
function toggleIncomeHidden() {
  localStorage.setItem(INCOME_HIDDEN_KEY, isIncomeHidden() ? '0' : '1');
  render();
}

// ===== Animated money figures — คงค่าก่อนหน้าไว้ข้ามการ render เพื่อนับวิ่งขึ้น/ลงอย่างนุ่มนวล =====
const NumberAnim = { prev: {} };
function moneySpan(key, value) {
  const from = key in NumberAnim.prev ? NumberAnim.prev[key] : value;
  NumberAnim.prev[key] = value;
  return `<span class="baht">฿</span><span data-anim-key="${escapeHtml(key)}" data-anim-to="${value}">${fmtNumber(from)}</span>`;
}
function runNumberAnimations(root) {
  root.querySelectorAll('[data-anim-key]').forEach(el => {
    const to = parseFloat(el.getAttribute('data-anim-to'));
    const from = parseFloat(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
    if (from === to) { el.textContent = fmtNumber(to); return; }
    const start = performance.now();
    const duration = 450;
    (function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmtNumber(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    })(start);
  });
}

function boot() {
  const user = Store.getActiveUser();
  const onboarding = document.getElementById('onboarding');
  const app = document.getElementById('app');
  if (!user) {
    onboarding.classList.remove('hidden');
    app.classList.add('hidden');
    appMounted = false;
    renderOnboardingSwitch();
    return;
  }
  onboarding.classList.add('hidden');
  app.classList.remove('hidden');
  lastRenderedView = null;
  appMounted = true;
  renderNav(user);
  renderProfileChip(user);
  renderDrawerProfile(user);
  render();
}

function renderOnboardingSwitch() {
  const users = Object.values(Store._db.users);
  const box = document.getElementById('onboarding-switch');
  if (users.length === 0) { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="section-label" style="text-align:left;font-size:11.5px;letter-spacing:0.04em;text-transform:uppercase;color:var(--c-brown);margin-top:24px;margin-bottom:8px;font-weight:600;">Recent Logins</div>' +
    users.map(u => `
      <div class="profile-pick-item">
        <span>${escapeHtml(u.displayName)} ${roleBadgeHtml(u.role)}</span>
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

const VERIFIED_ICON = '<svg viewBox="0 0 24 24" fill="none" style="width:12px;height:12px;margin-right:3px;vertical-align:-1.5px"><path d="M9 12.3l2.1 2.1 4.2-4.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9.3" stroke="currentColor" stroke-width="1.7"/></svg>';

function roleBadgeHtml(role) {
  const isVerified = role === 'super_admin';
  return `<span class="role-badge${isVerified ? ' role-badge-verified' : ''}">${isVerified ? VERIFIED_ICON : ''}${roleLabel(role)}</span>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// เก็บ element ตัวเดียวไว้ข้ามการ render เพื่อให้ transform ของมัน "เลื่อน" จากตำแหน่งเดิมไปตำแหน่งใหม่ได้จริง
// (ถ้าสร้าง element ใหม่ทุกครั้งจะไม่มีตำแหน่งเก่าให้ transition ไล่จากไป กลายเป็นการ "เด้งโผล่" แทนที่จะ "เลื่อน")
let navIndicatorEl = null;
function positionNavIndicator() {
  const nav = document.getElementById('bottomnav');
  if (!nav) return;
  const active = nav.querySelector('button.active');
  if (!navIndicatorEl) {
    navIndicatorEl = document.createElement('span');
    navIndicatorEl.className = 'nav-indicator';
    navIndicatorEl.setAttribute('aria-hidden', 'true');
  }
  if (!active) { navIndicatorEl.style.opacity = '0'; return; }
  nav.insertBefore(navIndicatorEl, nav.firstChild);
  const navRect = nav.getBoundingClientRect();
  const btnRect = active.getBoundingClientRect();
  navIndicatorEl.style.opacity = '1';
  navIndicatorEl.style.width = btnRect.width + 'px';
  navIndicatorEl.style.height = btnRect.height + 'px';
  navIndicatorEl.style.transform = `translate(${btnRect.left - navRect.left}px, ${btnRect.top - navRect.top}px)`;
}
window.addEventListener('resize', () => positionNavIndicator());

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
  positionNavIndicator();

  document.getElementById('drawer-nav').innerHTML = items.map(it =>
    `<button class="${it.key === view ? 'active' : ''}" data-nav="${it.key}"><span class="icon">${ICONS[it.key]}</span>${it.label}</button>`
  ).join('');

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => { navigate(btn.getAttribute('data-nav')); closeDrawer(); });
  });
  // ลูกเล่นตอนแตะ: ปุ่มเด้งเข้าเป็นวงแหวนจางๆ แล้วหายไป — ให้ความรู้สึกตอบสนองชัดเจนกว่า scale เฉยๆ โดยเฉพาะแตะไวๆ
  document.querySelectorAll('.bottomnav button').forEach(btn => {
    btn.addEventListener('pointerdown', () => {
      btn.classList.remove('tap-pulse');
      void btn.offsetWidth;
      btn.classList.add('tap-pulse');
    });
  });
  const openBtn = document.querySelector('[data-open-drawer]');
  if (openBtn) openBtn.addEventListener('click', openDrawer);
}

function getAnimalAvatar(name) {
  const animals = [
    // Cat
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;color:#D4A373"><path d="M12 21c-4.4 0-8-3.6-8-8 0-1.8.6-3.5 1.7-4.9L4 3l4.6 2C9.6 4.4 10.8 4 12 4s2.4.4 3.4 1l4.6-2-1.7 5.1c1.1 1.4 1.7 3.1 1.7 4.9 0 4.4-3.6 8-8 8z"/><path d="M9 12h.01M15 12h.01M12 14.5l-1-1h2l-1 1z"/></svg>',
    // Fox
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;color:#E07A5F"><path d="M12 21c-4.4 0-8-3.6-8-8 0-1.8.6-3.5 1.7-4.9L3 3l5.1 2.7C9.5 4.6 10.7 4 12 4s2 1.2 3.4 2.3L21 3l-2.7 5.1c1.1 1.4 1.7 3.1 1.7 4.9 0 4.4-3.6 8-8 8z"/><path d="M9.5 12h.01M14.5 12h.01M12 15l-1-1h2l-1 1z"/></svg>',
    // Panda
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;color:#3D405B"><path d="M12 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/><path d="M6 5c-.8.8-1.3 2-1 3 .5 1.5 2 2.5 3.5 2M18 5c.8.8 1.3 2 1 3-.5 1.5-2 2.5-3.5 2M9 12.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zM15 12.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zM12 15l-1-1h2l-1 1z"/></svg>',
    // Koala
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;color:#9EAFB8"><path d="M12 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/><path d="M4 10c-1.2 0-2.2-.8-2.2-1.8s1-1.8 2.2-1.8c.6 0 1.1.2 1.5.6M20 10c1.2 0 2.2-.8 2.2-1.8s-1-1.8-2.2-1.8c-.6 0-1.1.2-1.5.6M9 12.5h.01M15 12.5h.01M12 14.5c-.6 0-1 .4-1 1h2c0-.6-.4-1-1-1z"/></svg>',
    // Rabbit
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;color:#E0AFA0"><path d="M12 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/><path d="M8 5C8 3 9 1 10 1s2 2 2 4v4H8V5zM12 9v-4c0-2 1-4 2-4s2 2 2 4v4h-4zM9 13h.01M15 13h.01M12 15.5l-1-.5h2l-1 .5z"/></svg>',
    // Bear
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;color:#8C654B"><path d="M12 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/><path d="M5.5 7.5C4.7 7.5 4 6.8 4 6s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM18.5 7.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5S19.3 7.5 18.5 7.5zM9 12h.01M15 12h.01M12 15c-.6 0-1-.4-1-1s.4-.5 1-.5 1 .1 1 .5-.4 1-1 1z"/></svg>',
    // Lion
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;color:#E29578"><path d="M12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/><path d="M12 2v3M12 19v3M5 12H2M22 12h-3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1M9.5 11h.01M14.5 11h.01M12 13.5l-1-1h2l-1 1z"/></svg>',
    // Dog
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;color:#C5A880"><path d="M12 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/><path d="M5 8c-.6 0-1 .4-1 1v4c0 1 .5 2 1.5 2.5M19 8c.6 0 1 .4 1 1v4c0 1-.5 2-1.5 2.5M9 12h.01M15 12h.01M12 16c-.6 0-1-.4-1-1h2c0 .6-.4 1-1 1z"/></svg>'
  ];
  let sum = 0;
  const cleanName = (name || '?').trim();
  for (let i = 0; i < cleanName.length; i++) {
    sum += cleanName.charCodeAt(i);
  }
  return animals[sum % animals.length];
}

function renderProfileChip(user) {
  const chip = document.getElementById('btn-profile');
  const avatarSvg = getAnimalAvatar(user.displayName);
  chip.innerHTML = `<span class="avatar">${avatarSvg}</span><span>${escapeHtml(user.displayName)}</span>`;
  chip.onclick = () => navigate('settings');
}

function renderDrawerProfile(user) {
  const box = document.getElementById('drawer-profile');
  box.innerHTML = `<div class="drawer-profile-name">${escapeHtml(user.displayName)}</div><div class="drawer-profile-role">${roleBadgeHtml(user.role)}</div>`;
}

// ===== Scroll reveal: กรอบ (.card) เด้งเข้าจอทีละใบตอนเลื่อนผ่าน — แทนที่ hover ที่มือถือไม่มี =====
// เรียกเฉพาะตอนเปลี่ยนหน้า (changedView) ไม่ใช่ทุกครั้งที่ rerender() ภายในหน้าเดิม กันไม่ให้กรอบกะพริบซ้ำตอนพิมพ์/กด +/-
let revealObserver = null;
function initScrollReveal(root) {
  if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }
  if (!('IntersectionObserver' in window)) return;
  // เคารพผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหว — ไม่ซ่อน/ไม่เด้ง
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const vh = window.innerHeight || document.documentElement.clientHeight;
  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-init');
      entry.target.classList.add('revealed');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  root.querySelectorAll('.card, .card-dark').forEach(el => {
    // ข้ามกรอบที่ซ่อนอยู่ (เช่นอยู่ใน <details> ที่ยังไม่เปิด) — ให้มันโผล่เต็มตัวตอนกางเอง
    if (el.offsetParent === null) return;
    // กรอบที่อยู่ในจอตั้งแต่แรก ปล่อยให้ view-enter เฟดจัดการ ไม่ต้องเด้งซ้อน (กันกระพริบตอนโหลด)
    if (el.getBoundingClientRect().top < vh * 0.9) return;
    el.classList.add('reveal-pop', 'reveal-init');
    revealObserver.observe(el);
  });
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
    initScrollReveal(root);
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

// แสดงหน้าจอหลักให้ผู้ใช้ — ถ้าเพิ่ง mount ครั้งแรก (appMounted=false) ให้เล่นเอฟเฟกต์เข้าหน้า
// ถ้า mount ไปแล้ว (เช่น boot() เรนเดอร์จาก cache ไปก่อน) ให้อัปเดตเนื้อหาเงียบๆ ตัวเลขวิ่งนุ่ม ไม่เล่นเอฟเฟกต์ซ้ำ = ไม่กระพริบ
function showUser(user) {
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  if (!appMounted) { appMounted = true; lastRenderedView = null; }
  renderNav(user);
  renderProfileChip(user);
  renderDrawerProfile(user);
  render();
}

// การผูก Auth Event Listener ของ Firebase (ทำงานเฉพาะเมื่อใส่ Config)
if (Store.isFirebase) {
  const loader = document.getElementById('loader');

  auth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      // โชว์ loader เฉพาะ cold start (ยังไม่มีอะไรบนจอ) — ถ้า boot() เรนเดอร์จาก cache ไปแล้ว ให้ซิงค์เบื้องหลังเงียบๆ ไม่บังจอ
      const coldStart = !appMounted;
      if (coldStart) loader.classList.remove('hidden');
      try {
        await Store.fetchUserFromCloud(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName
        );
        showUser(Store.getActiveUser());
      } catch (error) {
        console.error("Error fetching user on state change:", error);
        showToast("โหลดข้อมูลล้มเหลว กำลังรันแบบออฟไลน์");
      } finally {
        if (coldStart) loader.classList.add('hidden');
      }
    } else {
      loader.classList.add('hidden');
      const activeUser = Store.getActiveUser();
      if (activeUser) {
        showUser(activeUser);
      } else {
        document.getElementById('onboarding').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        appMounted = false;
        renderOnboardingSwitch();
      }
    }
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support optional */ });
  });
}
