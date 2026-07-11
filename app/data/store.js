// ชั้นเก็บข้อมูล (Repository layer) — รองรับการทำงานแบบ Hybrid (Firestore + LocalStorage)
// หากใส่ Firebase Config จะใช้ระบบคลาวด์และ Google Login จริง หากไม่ใส่จะถอยกลับไปใช้ Local Storage เหมือนเดิม

const DB_KEY = 'soo_ma_v1';
let db = null;
let auth = null;

// ตรวจสอบว่าเปิดใช้งาน Firebase หรือไม่
const isFirebaseEnabled = 
  typeof firebase !== 'undefined' && 
  typeof FIREBASE_CONFIG !== 'undefined' && 
  FIREBASE_CONFIG.apiKey && 
  FIREBASE_CONFIG.apiKey.trim() !== '';

if (isFirebaseEnabled) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("Firebase initialized successfully! Running in Cloud Firestore mode.");
  } catch (e) {
    console.error("Firebase initialization failed, falling back to LocalStorage:", e);
  }
} else {
  console.log("No Firebase Config found. Running in local-only demo mode (LocalStorage).");
}

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ข้อมูลเสียหาย เริ่มสร้างใหม่ */ }
  return { users: {}, activeUserId: null };
}

function saveDB(dbData) {
  localStorage.setItem(DB_KEY, JSON.stringify(dbData));
}

const Store = {
  _db: loadDB(),
  isFirebase: !!(db && auth),

  _persist() { 
    saveDB(this._db); 
  },

  getActiveUser() {
    const id = this._db.activeUserId;
    return id ? this._db.users[id] : null;
  },

  // ดึงข้อมูลผู้ใช้จาก Firestore มาใส่ Cache
  async fetchUserFromCloud(userId, email, displayName) {
    if (!this.isFirebase) return this.getActiveUser();

    try {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();

      let userData;

      if (!userSnap.exists) {
        // ยังไม่มีบัญชีบน Firestore -> สร้างบัญชีใหม่เริ่มต้น (Role: assistant)
        const now = new Date().toISOString();
        userData = {
          id: userId,
          displayName: displayName || 'ผู้ใช้ Google',
          email: email || null,
          role: 'assistant',
          createdAt: now,
          updatedAt: now,
          procedures: PROCEDURE_MASTER.map((p, i) => ({
            id: uid(), masterId: p.id, categoryKey: p.cat, name: p.name,
            unit: p.unit, fee: p.fee, isHourly: !!p.hourly, preciseQty: !!p.preciseQty, isCustom: false,
            isActive: true, sort: i,
          })),
        };
        
        // เขียนข้อมูลหลักผู้ใช้
        await userRef.set(userData);

        // เขียนการตั้งค่าเริ่มต้น
        const settingsData = { monthlyGoal: null, weekStart: 'mon', currency: 'THB' };
        await userRef.collection('settings').doc('default').set(settingsData);
        userData.settings = settingsData;
        userData.logs = {};
      } else {
        // ดึงข้อมูลผู้ใช้ที่มีอยู่แล้ว
        userData = userSnap.data();
        
        // ดึง Settings ของผู้ใช้
        const settingsSnap = await userRef.collection('settings').doc('default').get();
        userData.settings = settingsSnap.exists ? settingsSnap.data() : { monthlyGoal: null, weekStart: 'mon', currency: 'THB' };

        // ดึง Logs ทั้งหมดของผู้ใช้
        const logsSnap = await userRef.collection('logs').get();
        userData.logs = {};
        logsSnap.forEach(doc => {
          userData.logs[doc.id] = doc.data();
        });
      }

      // บันทึกลง Local Cache
      this._db.users[userId] = userData;
      this._db.activeUserId = userId;
      this._persist();

      return userData;
    } catch (error) {
      console.error("Error syncing user with Firestore:", error);
      // หากเกิดข้อผิดพลาดในการโหลดจาก Cloud ให้พยายามใช้ cache เดิมในเครื่อง
      if (this._db.users[userId]) {
        this._db.activeUserId = userId;
        this._persist();
        return this._db.users[userId];
      }
      throw error;
    }
  },

  // ดึงข้อมูลสมาชิกทีมทั้งหมดจาก Firestore (สำหรับหน้า Team ของ Admin/Super Admin)
  // อ่านได้เพราะ firestore.rules อนุญาตให้ isStaff() อ่าน users/{userId} และ logs ของทุกคน
  async fetchTeamFromCloud() {
    if (!this.isFirebase) return Object.values(this._db.users);

    const snap = await db.collection('users').get();
    const team = await Promise.all(snap.docs.map(async (doc) => {
      const data = doc.data();
      const logsSnap = await doc.ref.collection('logs').get();
      const logs = {};
      logsSnap.forEach(logDoc => { logs[logDoc.id] = logDoc.data(); });
      return { ...data, id: doc.id, logs };
    }));
    return team;
  },

  // ใช้สร้างบัญชีผู้ใช้ในโหมด local demo (Mock)
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
      logs: {},
      settings: { monthlyGoal: null, weekStart: 'mon', currency: 'THB' },
    };
    this._db.activeUserId = id;
    this._persist();
    return this._db.users[id];
  },

  updateUser(patch) {
    const u = this.getActiveUser(); if (!u) return;
    const now = new Date().toISOString();
    Object.assign(u, patch, { updatedAt: now });
    this._persist();

    // เขียนลง Firestore ในเบื้องหลัง (Background sync)
    if (this.isFirebase) {
      db.collection('users').doc(u.id).update({
        ...patch,
        updatedAt: now
      }).catch(err => console.error("Firestore error updating user:", err));
    }
  },

  logout() {
    this._db.activeUserId = null;
    this._persist();
    if (this.isFirebase) {
      auth.signOut().catch(err => console.error("Sign out error:", err));
    }
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
    if (p) { 
      p.fee = fee; 
      this._persist(); 

      // ซิงค์การเปลี่ยน Rate หัตถการไปยัง Firestore
      if (this.isFirebase) {
        db.collection('users').doc(u.id).update({
          procedures: u.procedures,
          updatedAt: new Date().toISOString()
        }).catch(err => console.error("Firestore error updating procedure fee:", err));
      }
    }
  },

  getLog(dateStr) {
    const u = this.getActiveUser(); if (!u) return null;
    return u.logs[dateStr] || null;
  },

  getAllLogs() {
    const u = this.getActiveUser(); if (!u) return {};
    return u.logs;
  },

  // บันทึกรายการหัตถการ (Optimistic UI - อัปเดตฝั่ง client ทันที และซิงค์เบื้องหลัง)
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
    
    const now = new Date().toISOString();
    log.updatedAt = now;
    
    const isLogEmpty = log.entries.length === 0;
    if (isLogEmpty) {
      delete u.logs[dateStr];
    }
    
    this._persist();

    // ซิงค์ประวัติรายวันไปยัง Firestore ในเบื้องหลัง
    if (this.isFirebase) {
      const logRef = db.collection('users').doc(u.id).collection('logs').doc(dateStr);
      if (isLogEmpty) {
        logRef.delete().catch(err => console.error("Firestore error deleting log:", err));
      } else {
        logRef.set({
          entries: log.entries,
          note: log.note || '',
          updatedAt: now
        }).catch(err => console.error("Firestore error writing log:", err));
      }
    }
  },

  clearDay(dateStr) {
    const u = this.getActiveUser(); if (!u) return;
    delete u.logs[dateStr];
    this._persist();

    if (this.isFirebase) {
      db.collection('users').doc(u.id).collection('logs').doc(dateStr).delete()
        .catch(err => console.error("Firestore error clearing day log:", err));
    }
  },

  getSettings() {
    const u = this.getActiveUser();
    return u ? u.settings : { monthlyGoal: null, weekStart: 'mon', currency: 'THB' };
  },

  setSettings(patch) {
    const u = this.getActiveUser(); if (!u) return;
    Object.assign(u.settings, patch);
    this._persist();

    // ซิงค์การตั้งค่าไปยัง Firestore
    if (this.isFirebase) {
      db.collection('users').doc(u.id).collection('settings').doc('default').set(u.settings)
        .catch(err => console.error("Firestore error saving settings:", err));
    }
  },
};
