// ชั้นเก็บข้อมูล (Repository layer) — เก็บลง localStorage ของเครื่อง
// โครงสร้าง key/table ตั้งใจให้ตรงกับ database.md เพื่อย้ายไป Supabase ได้ตรง ๆ ในอนาคต
// users / user_procedures / daily_logs+log_entries / user_settings

const DB_KEY = 'soo_ma_v1';

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupt data — start fresh */ }
  return { users: {}, activeUserId: null };
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

const Store = {
  _db: loadDB(),

  _persist() { saveDB(this._db); },

  getActiveUser() {
    const id = this._db.activeUserId;
    return id ? this._db.users[id] : null;
  },

  // เข้าสู่ระบบครั้งแรก = สร้างบัญชีอัตโนมัติ Role: Assistant (ตรงกับ project.md > เมื่อ Login ครั้งแรก)
  createUser(displayName, role) {
    const id = uid();
    const now = new Date().toISOString();
    this._db.users[id] = {
      id, displayName, role: role || 'assistant', email: null,
      createdAt: now, updatedAt: now,
      procedures: PROCEDURE_MASTER.map((p, i) => ({
        id: uid(), masterId: p.id, categoryKey: p.cat, name: p.name,
        unit: p.unit, fee: p.fee, isHourly: !!p.hourly, preciseQty: !!p.preciseQty, isCustom: false,
        isActive: true, sort: i,
      })),
      logs: {},          // { 'YYYY-MM-DD': { entries: [...], note, updatedAt } }
      settings: { monthlyGoal: null, weekStart: 'mon', currency: 'THB' },
    };
    this._db.activeUserId = id;
    this._persist();
    return this._db.users[id];
  },

  updateUser(patch) {
    const u = this.getActiveUser(); if (!u) return;
    Object.assign(u, patch, { updatedAt: new Date().toISOString() });
    this._persist();
  },

  logout() {
    this._db.activeUserId = null;
    this._persist();
  },

  getProcedures() {
    const u = this.getActiveUser(); if (!u) return [];
    return u.procedures.filter(p => p.isActive);
  },

  getProcedureById(id) {
    const u = this.getActiveUser(); if (!u) return null;
    return u.procedures.find(p => p.id === id) || null;
  },

  updateProcedureFee(procId, fee) {
    const u = this.getActiveUser(); if (!u) return;
    const p = u.procedures.find(x => x.id === procId);
    if (p) { p.fee = fee; this._persist(); }
  },

  getLog(dateStr) {
    const u = this.getActiveUser(); if (!u) return null;
    return u.logs[dateStr] || null;
  },

  getAllLogs() {
    const u = this.getActiveUser(); if (!u) return {};
    return u.logs;
  },

  // บันทึกจำนวนของหัตถการหนึ่งตัวในวันที่กำหนด (0 = ลบรายการ)
  // เก็บ fee_snapshot ตอนบันทึก เพื่อไม่ให้ยอดย้อนหลังเปลี่ยนถ้าแก้ค่ามือทีหลัง (calculations.md / database.md)
  setEntry(dateStr, procId, quantity, minutes) {
    const u = this.getActiveUser(); if (!u) return;
    const proc = u.procedures.find(p => p.id === procId);
    if (!proc) return;
    if (!u.logs[dateStr]) u.logs[dateStr] = { entries: [], note: '', updatedAt: null };
    const log = u.logs[dateStr];
    const qty = quantity || 0, mins = minutes || 0;
    const idx = log.entries.findIndex(e => e.procId === procId);
    if (qty <= 0 && mins <= 0) {
      if (idx >= 0) log.entries.splice(idx, 1);
    } else {
      const subtotal = proc.isHourly ? (mins / 60) * proc.fee : qty * proc.fee;
      const entry = { procId, quantity: qty, minutes: mins, feeSnapshot: proc.fee, subtotal };
      if (idx >= 0) log.entries[idx] = entry; else log.entries.push(entry);
    }
    log.updatedAt = new Date().toISOString();
    if (log.entries.length === 0) delete u.logs[dateStr];
    this._persist();
  },

  clearDay(dateStr) {
    const u = this.getActiveUser(); if (!u) return;
    delete u.logs[dateStr];
    this._persist();
  },

  getSettings() {
    const u = this.getActiveUser();
    return u ? u.settings : { monthlyGoal: null, weekStart: 'mon', currency: 'THB' };
  },

  setSettings(patch) {
    const u = this.getActiveUser(); if (!u) return;
    Object.assign(u.settings, patch);
    this._persist();
  },
};
