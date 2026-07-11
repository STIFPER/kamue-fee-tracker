// ฟังก์ชันคำนวณล้วน (pure functions) — ตรงตามสูตรใน calculations.md

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const THAI_DAYS_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function fmtNumber(n) {
  return Math.round(n || 0).toLocaleString('en-US');
}

// ฿ ห่อด้วย <span class="baht"> เพราะฟอนต์ระบบบางตัว (เช่น Sukhumvit Set บน iOS) ไม่มีสัญลักษณ์นี้
// ทำให้เบราว์เซอร์ fallback ไปฟอนต์อื่นที่ขนาด/สัดส่วนไม่เข้าชุดกับตัวเลข จึงต้องล็อกฟอนต์ของ ฿ ไว้ตายตัว
function fmtMoney(n) {
  return '<span class="baht">฿</span>' + fmtNumber(n);
}

function toDateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateStr(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function thaiDateLabel(d) {
  const buddhistYear = d.getFullYear() + 543;
  return `วัน${THAI_DAYS[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${buddhistYear}`;
}

function startOfWeek(d, weekStart) {
  const day = d.getDay(); // 0=Sun
  const offset = weekStart === 'mon' ? (day === 0 ? 6 : day - 1) : day;
  const s = new Date(d);
  s.setDate(d.getDate() - offset);
  s.setHours(0, 0, 0, 0);
  return s;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function logTotal(log, proceduresById) {
  if (!log) return 0;
  let t = 0;
  for (const e of log.entries) t += e.subtotal;
  return t;
}

// รวมยอดของช่วงวันที่ [startDate, endDate] แบบ inclusive
function sumRange(logs, startDate, endDate) {
  let total = 0;
  let cur = new Date(startDate);
  while (cur <= endDate) {
    const log = logs[toDateStr(cur)];
    if (log) total += logTotal(log);
    cur = addDays(cur, 1);
  }
  return total;
}

function currentTier(monthIncome, tiers) {
  let cur = tiers[0];
  for (const t of tiers) if (monthIncome >= t.min) cur = t;
  const idx = tiers.indexOf(cur);
  const next = tiers[idx + 1] || null;
  const progressPct = next ? Math.min(100, Math.round(((monthIncome - cur.min) / (next.min - cur.min)) * 100)) : 100;
  return { tier: cur, next, progressPct };
}

// สรุปยอดรวมตามหมวดหมู่ ในช่วงวันที่กำหนด
function categoryBreakdown(logs, startDate, endDate, proceduresById) {
  const byCat = {};
  let cur = new Date(startDate);
  while (cur <= endDate) {
    const log = logs[toDateStr(cur)];
    if (log) {
      for (const e of log.entries) {
        const proc = proceduresById[e.procId];
        const cat = proc ? proc.categoryKey : 'อื่นๆ';
        byCat[cat] = (byCat[cat] || 0) + e.subtotal;
      }
    }
    cur = addDays(cur, 1);
  }
  return byCat;
}

// ยอดรายวันในช่วงหนึ่ง ใช้ทำกราฟ/ค่าเฉลี่ย/หา best-worst day
function dailySeries(logs, startDate, endDate) {
  const days = [];
  let cur = new Date(startDate);
  while (cur <= endDate) {
    const log = logs[toDateStr(cur)];
    days.push({ date: new Date(cur), dateStr: toDateStr(cur), total: log ? logTotal(log) : 0, count: log ? log.entries.length : 0 });
    cur = addDays(cur, 1);
  }
  return days;
}
