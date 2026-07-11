// ===== View render functions =====

function proceduresIndex(user) {
  const map = {};
  for (const p of Store.getProcedures()) map[p.id] = p;
  return map;
}

function rerender() {
  render();
}

// ---------- Dashboard ----------
function renderDashboard(root, user) {
  const logs = Store.getAllLogs();
  const today = new Date();
  const todayStr = toDateStr(today);
  const weekStart = startOfWeek(today, user.settings.weekStart);
  const weekEnd = addDays(weekStart, 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const todayTotal = sumRange(logs, today, today);
  const weekTotal = sumRange(logs, weekStart, weekEnd);
  const monthTotal = sumRange(logs, monthStart, monthEnd);
  const todayLog = logs[todayStr];
  const todayCount = todayLog ? todayLog.entries.length : 0;

  const { tier, next, progressPct } = currentTier(monthTotal, TIERS);
  const remainLabel = next ? `อีก ${fmtMoney(next.min - monthTotal)} ถึง ${next.th}` : 'ระดับสูงสุด ✦';

  const recentDays = dailySeries(logs, addDays(today, -6), today).reverse();

  root.innerHTML = `
    <div class="dash-grid">
      <div class="dash-main">
        <div class="card hero-card">
          <div class="hero-tier">
            <div class="tier-head">
              <div>
                <div class="kicker">ระดับเดือนนี้ · Tier</div>
                <div class="tier-name">${tier.th} <span class="en">· ${tier.en}</span></div>
              </div>
              <div class="tier-badge">${tier.badge}</div>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${progressPct}%"></div></div>
            <div class="progress-meta"><span>${moneySpan('dash-tier-month', monthTotal)} · เดือนนี้</span><span>${remainLabel}</span></div>
          </div>
          <div class="hero-today card-dark">
            <div class="kicker">รายได้วันนี้ · Today</div>
            <div class="today-amount">${moneySpan('dash-today', todayTotal)}</div>
            <div class="kicker" style="margin-top:3px">${todayCount > 0 ? todayCount + ' หัตถการวันนี้' : 'ยังไม่มีรายการ'}</div>
          </div>
        </div>

        <div class="card stat-strip">
          <div class="stat-seg"><div class="label">วันนี้</div><div class="value">${moneySpan('dash-stat-today', todayTotal)}</div></div>
          <div class="stat-seg"><div class="label">สัปดาห์นี้</div><div class="value">${moneySpan('dash-stat-week', weekTotal)}</div></div>
          <div class="stat-seg"><div class="label">เดือนนี้</div><div class="value">${moneySpan('dash-stat-month', monthTotal)}</div></div>
        </div>

        <button class="btn btn-primary btn-block" id="btn-go-entry">+ เพิ่มรายการวันนี้</button>
      </div>

      <div class="dash-side">
        <div class="section-label">7 วันล่าสุด</div>
        <div class="card">
          ${recentDays.map(d => `
            <div class="ledger-item">
              <div class="ledger-name">${THAI_DAYS_SHORT[d.date.getDay()]} ${d.date.getDate()} ${THAI_MONTHS[d.date.getMonth()]}${d.dateStr === todayStr ? ' · วันนี้' : ''}</div>
              <div class="ledger-sub">${d.count > 0 ? fmtMoney(d.total) : '—'}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  `;
  document.getElementById('btn-go-entry').addEventListener('click', () => { UI.entryDate = todayStr; navigate('entry'); });
}

// ---------- Daily Entry ----------
function renderEntry(root, user) {
  const dateObj = parseDateStr(UI.entryDate);
  const log = Store.getLog(UI.entryDate) || { entries: [] };
  const procIndex = proceduresIndex(user);
  const q = UI.entryQuery.trim().toLowerCase();

  let list;
  if (q) {
    list = Store.getProcedures().filter(p => (p.name + ' ' + p.categoryKey).toLowerCase().includes(q));
  } else {
    list = Store.getProcedures().filter(p => p.categoryKey === UI.entryCat);
  }

  const yesterdayStr = toDateStr(addDays(dateObj, -1));
  const yesterdayLog = Store.getLog(yesterdayStr);
  const canDuplicate = log.entries.length === 0 && yesterdayLog && yesterdayLog.entries.length > 0;

  const dailyTotal = log.entries.reduce((s, e) => s + e.subtotal, 0);
  const hasItems = log.entries.length > 0;

  root.innerHTML = `
    <div class="date-row">
      <button class="btn btn-ghost btn-sm" id="btn-prev-day">‹</button>
      <input type="date" class="date-input" id="date-picker" value="${UI.entryDate}">
      <button class="btn btn-ghost btn-sm" id="btn-next-day">›</button>
      <button class="btn btn-secondary btn-sm" id="btn-today">วันนี้</button>
      ${canDuplicate ? '<button class="btn btn-ghost btn-sm" id="btn-duplicate">↺ ทำซ้ำเมื่อวาน</button>' : ''}
    </div>
    <div style="font-size:13px;color:var(--c-brown);margin-bottom:10px">${thaiDateLabel(dateObj)}</div>

    <div class="entry-layout">
      <section>
        <input class="search-field" id="search-proc" placeholder="ค้นหาหัตถการ · Search treatment" value="${escapeHtml(UI.entryQuery)}">
        <div class="cat-tabs">
          ${CATEGORIES.map(c => `<button class="pill${(!q && c.key === UI.entryCat) ? ' active' : ''}" data-cat="${c.key}">${c.th}</button>`).join('')}
        </div>
        <div class="section-label">${q ? `ผลการค้นหา · ${list.length} รายการ` : (CATEGORIES.find(c => c.key === UI.entryCat).th + ' · เลือกหัตถการ')}</div>
        <div class="proc-list">
          ${list.length === 0 ? '<div class="empty-state">ไม่พบหัตถการ</div>' : list.map(p => {
            const e = log.entries.find(x => x.procId === p.id);
            const qty = e ? e.quantity : 0, mins = e ? e.minutes : 0;
            const has = p.isHourly ? mins > 0 : qty > 0;
            const countLabel = p.isHourly ? (mins + '′') : String(qty);
            const feeLabel = p.isHourly ? `฿${p.fee} · ต่อชั่วโมง` : `฿${p.fee} · ${p.unit}`;
            return `
              <div class="proc-row">
                <div class="proc-info">
                  <div class="proc-name">${escapeHtml(p.name)}</div>
                  <div class="proc-fee">${feeLabel}</div>
                </div>
                ${has ? `
                  <div class="stepper">
                    <button data-dec="${p.id}">−</button>
                    <span class="count" data-qty="${p.id}" title="แตะเพื่อพิมพ์จำนวนเอง">${countLabel}</span>
                    <button class="plus" data-inc="${p.id}">+</button>
                  </div>` : `<button class="add-btn" data-add="${p.id}">เพิ่ม +</button>`}
              </div>`;
          }).join('')}
        </div>
      </section>

      <aside class="entry-aside">
        <div class="card">
          <div class="tier-head" style="margin-bottom:6px">
            <div style="font-family:var(--font-heading-en);font-size:18px;color:var(--c-dark)">รายการวันนี้</div>
          </div>
          ${!hasItems ? '<div class="ledger-empty">ยังไม่มีรายการ<br>เลือกหัตถการที่ทำวันนี้เพื่อเริ่มบันทึก</div>' : log.entries.map(e => {
            const p = procIndex[e.procId]; if (!p) return '';
            const detail = p.isHourly ? `${Math.round(e.minutes)} นาที · ฿${e.feeSnapshot}/ชม` : `${e.quantity} × ฿${e.feeSnapshot}`;
            return `
              <div class="ledger-item">
                <div style="min-width:0;flex:1">
                  <div class="ledger-name">${escapeHtml(p.name)}</div>
                  <div class="ledger-detail" data-qty="${p.id}" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted" title="แตะเพื่อพิมพ์จำนวนเอง">${detail}</div>
                </div>
                <div class="ledger-controls">
                  <button data-dec="${p.id}">−</button>
                  <button class="plus" data-inc="${p.id}">+</button>
                  <span class="ledger-sub">${moneySpan('entry-item-' + p.id, e.subtotal)}</span>
                </div>
              </div>`;
          }).join('')}
          <div class="ledger-total-row">
            <span style="font-size:13px;color:var(--c-brown)">รวมวันนี้ · Total</span>
            <span class="amount">${moneySpan('entry-total', dailyTotal)}</span>
          </div>
          <button class="btn btn-primary btn-block" id="btn-save-day" style="margin-top:14px" ${!hasItems ? 'disabled' : ''}>บันทึกวันนี้ · Save day</button>
        </div>
      </aside>
    </div>
  `;

  function stepValue(procId, delta) {
    const p = procIndex[procId];
    const e = log.entries.find(x => x.procId === procId);
    if (p.isHourly) {
      const cur = e ? e.minutes : 0;
      const next = Math.max(0, cur + delta * 30);
      Store.setEntry(UI.entryDate, procId, 0, next);
    } else {
      const cur = e ? e.quantity : 0;
      const next = Math.max(0, roundQty(cur + delta));
      Store.setEntry(UI.entryDate, procId, next, 0);
    }
    rerender();
  }

  function promptQty(procId, { blankIfEmpty } = {}) {
    const p = procIndex[procId];
    const e = log.entries.find(x => x.procId === procId);
    const cur = p.isHourly ? (e ? e.minutes : 0) : (e ? e.quantity : 0);
    const defaultVal = blankIfEmpty && cur === 0 ? '' : String(cur);
    const label = p.isHourly ? `จำนวนนาที (${p.name}):` : `จำนวน — รองรับทศนิยม เช่น 1.5, 2.5 cc (${p.name} · ${p.unit}):`;
    const input = prompt(label, defaultVal);
    if (input === null) return;
    const val = parseFloat(input);
    if (isNaN(val) || val < 0) { showToast('กรอกตัวเลขไม่ถูกต้อง'); return; }
    if (p.isHourly) Store.setEntry(UI.entryDate, procId, 0, val);
    else Store.setEntry(UI.entryDate, procId, val, 0);
    rerender();
  }

  root.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => stepValue(b.getAttribute('data-inc'), 1)));
  root.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => stepValue(b.getAttribute('data-dec'), -1)));
  root.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
    const procId = b.getAttribute('data-add');
    const p = procIndex[procId];
    // cc/unit (และ OR รายชั่วโมง) พิมพ์จำนวนเองได้เลย — ส่วนหน่วยนับเป็นชิ้น (เคส/ครั้ง/กล่อง/ขวด) ใช้ +1 แบบเดิม
    if (p.isHourly || p.preciseQty) promptQty(procId, { blankIfEmpty: true });
    else stepValue(procId, 1);
  }));
  root.querySelectorAll('[data-qty]').forEach(el => el.addEventListener('click', () => promptQty(el.getAttribute('data-qty'))));

  document.getElementById('search-proc').addEventListener('input', (e) => { UI.entryQuery = e.target.value; rerender(); });
  root.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => { UI.entryCat = b.getAttribute('data-cat'); UI.entryQuery = ''; rerender(); }));
  document.getElementById('date-picker').addEventListener('change', (e) => { UI.entryDate = e.target.value; rerender(); });
  document.getElementById('btn-prev-day').addEventListener('click', () => { UI.entryDate = toDateStr(addDays(dateObj, -1)); rerender(); });
  document.getElementById('btn-next-day').addEventListener('click', () => { UI.entryDate = toDateStr(addDays(dateObj, 1)); rerender(); });
  document.getElementById('btn-today').addEventListener('click', () => { UI.entryDate = toDateStr(new Date()); rerender(); });
  const dupBtn = document.getElementById('btn-duplicate');
  if (dupBtn) dupBtn.addEventListener('click', () => {
    for (const e of yesterdayLog.entries) Store.setEntry(UI.entryDate, e.procId, e.quantity, e.minutes);
    showToast('ทำซ้ำเมื่อวานแล้ว');
    rerender();
  });
  const saveBtn = document.getElementById('btn-save-day');
  if (hasItems) saveBtn.addEventListener('click', () => { showToast('✓ บันทึกแล้ว · Saved'); navigate('dashboard'); });
}

function roundQty(n) { return Math.round(n * 100) / 100; }

// ---------- History / Calendar ----------
function weekGroupsOfMonth(year, month, logs) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const groups = [];
  for (let start = 1; start <= daysInMonth; start += 7) {
    const end = Math.min(start + 6, daysInMonth);
    const s = new Date(year, month, start), e = new Date(year, month, end);
    groups.push({ label: `สัปดาห์ที่ ${groups.length + 1} (วันที่ ${start}-${end})`, total: sumRange(logs, s, e) });
  }
  return groups;
}

function renderHistory(root, user) {
  const logs = Store.getAllLogs();
  const year = UI.historyYear, month = UI.historyMonth;
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadOffset = first.getDay();
  const todayStr = toDateStr(new Date());

  let cells = '';
  for (let i = 0; i < leadOffset; i++) cells += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = toDateStr(new Date(year, month, d));
    const log = logs[ds];
    const total = log ? log.entries.reduce((s, e) => s + e.subtotal, 0) : 0;
    const cls = ['cal-day'];
    if (total > 0) cls.push('has-data');
    if (ds === todayStr) cls.push('today');
    if (ds === UI.historySelectedDay) cls.push('active');
    cells += `<div class="${cls.join(' ')}" data-day="${ds}"><span class="d-num">${d}</span>${total > 0 ? `<span class="d-amt">${fmtMoney(total)}</span>` : ''}</div>`;
  }

  const weeks = weekGroupsOfMonth(year, month, logs);
  const selected = UI.historySelectedDay;
  const selectedLog = Store.getLog(selected) || (function () {
    const u = Store.getActiveUser(); return u.logs[selected] || { entries: [] };
  })();
  const procIndex = proceduresIndex(user);
  const selectedTotal = selectedLog.entries.reduce((s, e) => s + e.subtotal, 0);

  root.innerHTML = `
    <div class="month-nav">
      <button id="btn-prev-month">‹</button>
      <div class="month-label">${THAI_MONTHS[month]} ${year + 543}</div>
      <button id="btn-next-month">›</button>
    </div>
    <div class="calendar-grid">
      ${THAI_DAYS_SHORT.map(d => `<div class="cal-dow">${d}</div>`).join('')}
      ${cells}
    </div>

    <div class="section-label">สรุปรายสัปดาห์</div>
    <div class="card">
      ${weeks.map(w => `<div class="ledger-item"><div class="ledger-name">${w.label}</div><div class="ledger-sub">${fmtMoney(w.total)}</div></div>`).join('')}
    </div>

    <div class="section-label">${thaiDateLabel(parseDateStr(selected))}</div>
    <div class="card day-detail">
      ${selectedLog.entries.length === 0 ? '<div class="ledger-empty">ไม่มีรายการในวันนี้</div>' : selectedLog.entries.map(e => {
        const p = procIndex[e.procId]; if (!p) return '';
        const detail = p.isHourly ? `${Math.round(e.minutes)} นาที · ฿${e.feeSnapshot}/ชม` : `${e.quantity} × ฿${e.feeSnapshot}`;
        return `<div class="ledger-item">
          <div style="min-width:0;flex:1"><div class="ledger-name">${escapeHtml(p.name)}</div><div class="ledger-detail">${detail}</div></div>
          <div class="ledger-controls"><span class="ledger-sub">${fmtMoney(e.subtotal)}</span><button data-remove="${e.procId}">✕</button></div>
        </div>`;
      }).join('')}
      <div class="ledger-total-row"><span style="font-size:13px;color:var(--c-brown)">รวมวันนี้</span><span class="amount">${fmtMoney(selectedTotal)}</span></div>
      <button class="btn btn-secondary btn-block" id="btn-edit-day" style="margin-top:14px">แก้ไขในหน้าบันทึกงาน</button>
    </div>
  `;

  root.querySelectorAll('[data-day]').forEach(el => el.addEventListener('click', () => { UI.historySelectedDay = el.getAttribute('data-day'); rerender(); }));
  document.getElementById('btn-prev-month').addEventListener('click', () => {
    UI.historyMonth--; if (UI.historyMonth < 0) { UI.historyMonth = 11; UI.historyYear--; } rerender();
  });
  document.getElementById('btn-next-month').addEventListener('click', () => {
    UI.historyMonth++; if (UI.historyMonth > 11) { UI.historyMonth = 0; UI.historyYear++; } rerender();
  });
  root.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
    Store.setEntry(selected, b.getAttribute('data-remove'), 0, 0); rerender();
  }));
  document.getElementById('btn-edit-day').addEventListener('click', () => { UI.entryDate = selected; navigate('entry'); });
}

// ---------- Reports ----------
function renderReports(root, user) {
  const logs = Store.getAllLogs();
  const year = UI.reportsYear, month = UI.reportsMonth;
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const procIndex = proceduresIndex(user);

  const monthTotal = sumRange(logs, monthStart, monthEnd);
  const series = dailySeries(logs, monthStart, monthEnd);
  const activeDays = series.filter(d => d.count > 0).length;
  const avgPerActiveDay = activeDays ? monthTotal / activeDays : 0;

  // เฉลี่ยตามวันในสัปดาห์ เพื่อดูว่าวันไหนทำรายได้ดีที่สุด
  const byWeekday = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
  for (const d of series) { if (d.count > 0) { byWeekday[d.date.getDay()].sum += d.total; byWeekday[d.date.getDay()].count++; } }
  let bestWeekday = -1, bestAvg = -1;
  byWeekday.forEach((w, i) => { const avg = w.count ? w.sum / w.count : 0; if (avg > bestAvg) { bestAvg = avg; bestWeekday = i; } });

  const catTotals = categoryBreakdown(logs, monthStart, monthEnd, procIndex);
  const catList = CATEGORIES.map(c => ({ ...c, total: catTotals[c.key] || 0 })).sort((a, b) => b.total - a.total);
  const maxCat = Math.max(1, ...catList.map(c => c.total));

  const weeks = weekGroupsOfMonth(year, month, logs);
  const insights = [];
  if (bestAvg > 0) insights.push(`วัน${THAI_DAYS[bestWeekday]}เป็นวันที่คุณทำรายได้เฉลี่ยดีที่สุด (${fmtMoney(bestAvg)}/วัน)`);
  if (catList[0] && catList[0].total > 0) insights.push(`หมวดที่ทำเงินให้มากที่สุดเดือนนี้คือ “${catList[0].th}” (${fmtMoney(catList[0].total)}, ${Math.round(catList[0].total / (monthTotal || 1) * 100)}% ของยอดรวม)`);
  const nonZeroWeeks = weeks.filter(w => w.total > 0);
  if (nonZeroWeeks.length >= 2) {
    const last = weeks[weeks.length - 1], prev = weeks[weeks.length - 2];
    if (prev.total > 0) {
      const diff = Math.round((last.total - prev.total) / prev.total * 100);
      insights.push(`${last.label} ${diff >= 0 ? 'ทำได้มากกว่า' : 'ทำได้น้อยกว่า'}${prev.label} ${Math.abs(diff)}%`);
    }
  }
  // หาหัตถการที่ทำแล้วให้ค่ามือ/ครั้งสูงสุดในเดือนนี้ เพื่อแนะนำว่าเลือกทำเพิ่มจะได้เงินไวขึ้น
  const usedProcFees = {};
  for (const d of series) {
    const log = logs[d.dateStr]; if (!log) continue;
    for (const e of log.entries) { const p = procIndex[e.procId]; if (p && !p.isHourly) usedProcFees[p.id] = p; }
  }
  const topFeeProc = Object.values(usedProcFees).sort((a, b) => b.fee - a.fee)[0];
  if (topFeeProc) insights.push(`ถ้าอยากได้ค่ามือเพิ่มไว ลองรับเคส “${topFeeProc.name}” เพิ่ม (฿${topFeeProc.fee} · ${topFeeProc.unit})`);

  root.innerHTML = `
    <div class="month-nav">
      <button id="btn-prev-month">‹</button>
      <div class="month-label">${THAI_MONTHS[month]} ${year + 543}</div>
      <button id="btn-next-month">›</button>
    </div>

    <div class="stat-row">
      <div class="card stat-card"><div class="label">ยอดรวมเดือนนี้</div><div class="value">${moneySpan('reports-total', monthTotal)}</div></div>
      <div class="card stat-card"><div class="label">เฉลี่ย/วันที่ทำงาน</div><div class="value">${moneySpan('reports-avg', avgPerActiveDay)}</div><div class="sub">${activeDays} วันที่มีงาน</div></div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div style="font-family:var(--font-heading-en);font-size:18px;color:var(--c-dark);margin-bottom:8px">สัดส่วนตามหมวด</div>
        ${catList.map(c => `
          <div class="bar-row">
            <div class="bar-label">${c.th}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.round(c.total / maxCat * 100)}%"></div></div>
            <div class="bar-value">${fmtMoney(c.total)}</div>
          </div>`).join('')}
      </div>
      <div class="card">
        <div style="font-family:var(--font-heading-en);font-size:18px;color:var(--c-dark);margin-bottom:8px">สรุปรายสัปดาห์</div>
        ${weeks.map(w => `<div class="ledger-item"><div class="ledger-name">${w.label}</div><div class="ledger-sub">${fmtMoney(w.total)}</div></div>`).join('')}
      </div>
    </div>

    <div class="section-label">ข้อสังเกต · Insight</div>
    <div class="insight-list">
      ${insights.length === 0 ? '<div class="insight-item">ยังไม่มีข้อมูลพอสำหรับสรุปผลเดือนนี้</div>' : insights.map(i => `<div class="insight-item">${i}</div>`).join('')}
    </div>

    <div class="section-label">ส่งออกรายงาน</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-secondary" id="btn-export-csv">⬇ Export CSV</button>
      <button class="btn btn-ghost" id="btn-print">🖨 พิมพ์ / บันทึกเป็น PDF</button>
    </div>
  `;

  document.getElementById('btn-prev-month').addEventListener('click', () => {
    UI.reportsMonth--; if (UI.reportsMonth < 0) { UI.reportsMonth = 11; UI.reportsYear--; } rerender();
  });
  document.getElementById('btn-next-month').addEventListener('click', () => {
    UI.reportsMonth++; if (UI.reportsMonth > 11) { UI.reportsMonth = 0; UI.reportsYear++; } rerender();
  });
  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-export-csv').addEventListener('click', () => exportMonthCsv(year, month, logs, procIndex));
}

function exportMonthCsv(year, month, logs, procIndex) {
  const monthStart = new Date(year, month, 1), monthEnd = new Date(year, month + 1, 0);
  const rows = [['วันที่', 'หมวด', 'หัตถการ', 'จำนวน', 'นาที', 'ค่ามือ/หน่วย', 'รวม']];
  let cur = new Date(monthStart);
  while (cur <= monthEnd) {
    const log = logs[toDateStr(cur)];
    if (log) for (const e of log.entries) {
      const p = procIndex[e.procId];
      rows.push([toDateStr(cur), p ? p.categoryKey : '', p ? p.name : e.procId, e.quantity, e.minutes, e.feeSnapshot, e.subtotal]);
    }
    cur = addDays(cur, 1);
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ค่ามือ-${year}-${String(month + 1).padStart(2, '0')}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- Team (Admin/Super Admin only, local-demo aggregate) ----------
function renderTeam(root, user) {
  if (user.role !== 'admin' && user.role !== 'super_admin') { navigate('dashboard'); return; }
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const rows = Object.values(Store._db.users).map(u => {
    const total = sumRange(u.logs, monthStart, monthEnd);
    const count = Object.values(u.logs).reduce((s, l) => s + l.entries.length, 0);
    return { ...u, monthTotal: total, entryCount: count };
  }).sort((a, b) => b.monthTotal - a.monthTotal);

  root.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div style="font-family:var(--font-heading-en);font-size:18px;color:var(--c-dark)">ภาพรวมทีม · เดือนนี้</div>
      <div style="font-size:12.5px;color:var(--c-brown);margin-top:4px">แสดงข้อมูลผู้ใช้ในเครื่องนี้เท่านั้น (เดโม) — เมื่อเชื่อม Supabase จริงจะเห็นข้อมูลทุกคนจากทุกอุปกรณ์</div>
    </div>
    ${rows.map(r => `
      <div class="card" style="margin-bottom:10px">
        <div class="ledger-item" style="border:none;padding:0">
          <div class="ledger-name">${escapeHtml(r.displayName)} <span class="role-badge">${roleLabel(r.role)}</span></div>
          <div class="ledger-sub">${fmtMoney(r.monthTotal)}</div>
        </div>
        <div style="font-size:12px;color:var(--c-brown);margin-top:4px">${r.entryCount} รายการสะสมทั้งหมด</div>
      </div>`).join('')}
  `;
}

// ---------- Settings ----------
function renderSettings(root, user) {
  const procs = Store.getProcedures();
  const grouped = CATEGORIES.map(c => ({ ...c, items: procs.filter(p => p.categoryKey === c.key) }));

  root.innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-family:var(--font-heading-en);font-size:20px;color:var(--c-dark)">${escapeHtml(user.displayName)}</div>
          <span class="role-badge">${roleLabel(user.role)}</span>
        </div>
      </div>
      ${Store.isFirebase ? `
        <div style="font-size:12px;color:var(--c-brown);margin-top:10px;display:flex;flex-direction:column;gap:4px">
          <span>เชื่อมต่อ Cloud Firestore แล้ว</span>
          <span style="opacity:0.8">อีเมล: ${escapeHtml(user.email || '')}</span>
        </div>
      ` : `
        <div style="font-size:12px;color:var(--c-brown);margin-top:10px">ตอนนี้เข้าสู่ระบบแบบเดโม (ยังไม่เชื่อม Google) — บันทึกข้อมูลบนเครื่องนี้เท่านั้น</div>
      `}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="settings-row"><span class="label">เป้าหมายรายเดือน (บาท)</span><input class="fee-input" style="width:110px" id="input-goal" type="number" min="0" value="${user.settings.monthlyGoal || ''}" placeholder="ไม่กำหนด"></div>
      <div class="settings-row">
        <span class="label">วันเริ่มต้นสัปดาห์</span>
        <select class="fee-input" style="width:110px;text-align:left" id="input-weekstart">
          <option value="mon" ${user.settings.weekStart === 'mon' ? 'selected' : ''}>วันจันทร์</option>
          <option value="sun" ${user.settings.weekStart === 'sun' ? 'selected' : ''}>วันอาทิตย์</option>
        </select>
      </div>
    </div>

    <div class="section-label">อัตราค่ามือของฉัน · แก้ไขได้</div>
    ${grouped.map(g => `
      <div class="card" style="margin-bottom:10px">
        <div style="font-size:13px;font-weight:600;color:var(--c-brown);margin-bottom:6px">${g.th}</div>
        ${g.items.map(p => `
          <div class="settings-row">
            <span class="label">${escapeHtml(p.name)} <span style="color:var(--c-accent)">(${p.unit})</span></span>
            <input class="fee-input" type="number" min="0" step="0.01" data-fee="${p.id}" value="${p.fee}">
          </div>`).join('')}
      </div>`).join('')}

    <div class="section-label">บัญชี</div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <button class="btn btn-ghost btn-block" id="btn-add-profile">+ เพิ่มผู้ใช้ใหม่ในเครื่องนี้</button>
      <button class="btn btn-ghost btn-block" id="btn-logout">ออกจากระบบ</button>
    </div>
  `;

  document.getElementById('input-goal').addEventListener('change', (e) => {
    Store.setSettings({ monthlyGoal: e.target.value ? parseFloat(e.target.value) : null }); showToast('บันทึกแล้ว');
  });
  document.getElementById('input-weekstart').addEventListener('change', (e) => { Store.setSettings({ weekStart: e.target.value }); showToast('บันทึกแล้ว'); });
  root.querySelectorAll('[data-fee]').forEach(inp => inp.addEventListener('change', () => {
    const val = parseFloat(inp.value); if (isNaN(val) || val < 0) return;
    Store.updateProcedureFee(inp.getAttribute('data-fee'), val); showToast('อัปเดตค่ามือแล้ว');
  }));
  document.getElementById('btn-add-profile').addEventListener('click', () => {
    Store.logout(); document.getElementById('name-modal').classList.remove('hidden'); boot();
  });
  document.getElementById('btn-logout').addEventListener('click', () => { Store.logout(); boot(); });
}
