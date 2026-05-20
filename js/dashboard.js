/* ══ DASHBOARD.JS ══════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();
  const restored = await Auth.tryRestore();
  if (!restored) { window.location.href = '../index.html'; return; }
  await loadDashboard();
});

async function loadDashboard() {
  const el = document.getElementById('dash-content');

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning,' : hour < 18 ? 'Good Afternoon,' : 'Good Evening,';
  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Load data in parallel
  const [itemRows, commRows] = await Promise.all([
    Sheets.get(CONFIG.RANGES.ITEMS),
    Sheets.get(CONFIG.RANGES.COMMUNITIES),
  ]);

  const items = (itemRows||[]).filter(r => r[COL.TIPO]);
  const comms = (commRows||[]).filter(r => r[0]);

  // Metrics
  let pendingCount = 0, pendingValue = 0, transitCount = 0, doneCount = 0, wishCount = 0;
  items.forEach(row => {
    const cls = statusClass(row[COL.STATUS]||'');
    const pend = parseFloat(row[COL.PENDENTE])||0;
    if (cls === 'pending') { pendingCount++; pendingValue += pend; }
    if (cls === 'transit') transitCount++;
    if (cls === 'done') doneCount++;
  });

  // Wishlist count
  try {
    const wishRows = await Sheets.get('Wishlist!A2:P');
    wishCount = (wishRows||[]).filter(r => r[0]).length;
  } catch(e) {}

  // Recent items (last 3, combined with wishlist)
  const recentItems = [...items].reverse().slice(0, 3).map(row => ({
    type: 'comprado',
    name: [row[COL.TIPO], row[COL.MEMBRO], row[COL.COMEBACK]].filter(Boolean).join(' · '),
    sub: row[COL.SET_POB] || '—',
    info: [row[COL.COMUNIDADE], row[COL.GOM]].filter(Boolean).join(' · ') || '—',
    img: row[COL.IMG_LINK] || '',
    status: row[COL.STATUS] || '',
  }));

  // Community stats
  const commStats = comms.map(comm => {
    const commName = comm[0];
    const commItems = items.filter(r => r[COL.COMUNIDADE] === commName);
    const pendItems = commItems.filter(r => statusClass(r[COL.STATUS]||'') === 'pending');
    return { name: commName, gom: comm[1]||'', total: commItems.length, pending: pendItems.length };
  });

  // Comeback stats
  const comebackMap = {};
  items.forEach(row => {
    const cb = row[COL.COMEBACK];
    if (cb) comebackMap[cb] = (comebackMap[cb]||0) + 1;
  });
  const comebacks = Object.entries(comebackMap).sort((a,b) => b[1]-a[1]).slice(0,8);
  const maxCb = comebacks[0]?.[1] || 1;

  // Relative date
  function relDate(idx) {
    if (idx === 0) return 'hoje';
    if (idx === 1) return 'ontem';
    return `${idx + 1} dias`;
  }

  el.innerHTML = `
    <!-- Greeting -->
    <div class="greeting">
      <div class="greeting-text">${greeting}<br><span class="greeting-name">Stay!</span></div>
      <div class="greeting-icon">🌸</div>
    </div>

    <!-- CTA -->
    <a href="item-form.html" class="cta-btn">
      <i class="ti ti-plus" style="font-size:14px;color:#fff;"></i>
      <span>Adicionar novo item</span>
    </a>

    <!-- Resumo -->
    <div>
      <div class="sec-hdr"><span class="sec-title">Resumo</span></div>
      <div class="resumo-grid">
        <a href="items.html?filter=pending" class="r-card r-card-dark">
          <i class="ti ti-arrow-right r-arr"></i>
          <div class="r-num">${pendingCount}</div>
          <div class="r-label">Pgto Pendentes</div>
          <div class="r-sub">${formatBRL(pendingValue)} devidos</div>
        </a>
        <a href="items.html" class="r-card r-card-lilac">
          <i class="ti ti-arrow-right r-arr"></i>
          <div class="r-num">${items.length}</div>
          <div class="r-label">Total de Itens</div>
          <div class="r-sub">${transitCount} em trânsito</div>
        </a>
        <a href="items.html?filter=done" class="r-card r-card-lilac">
          <i class="ti ti-arrow-right r-arr"></i>
          <div class="r-num">${doneCount}</div>
          <div class="r-label">Recebidos</div>
          <div class="r-sub">${items.length ? Math.round(doneCount/items.length*100) : 0}% da coleção</div>
        </a>
        <a href="portfolio.html?tab=wishlist" class="r-card r-card-lilac">
          <i class="ti ti-arrow-right r-arr"></i>
          <div class="r-num">${wishCount}</div>
          <div class="r-label">Na Wishlist</div>
          <div class="r-sub">planejados</div>
        </a>
      </div>
      ${pendingCount > 0 ? `
      <a href="items.html?filter=pending" class="alert-bar">
        <i class="ti ti-alert-triangle alert-icon"></i>
        <span class="alert-txt">${pendingCount} pagamento${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''}</span>
        <span class="alert-val">· ${formatBRL(pendingValue)}</span>
        <i class="ti ti-arrow-right alert-arr"></i>
      </a>` : ''}
    </div>

    <!-- Comunidades -->
    ${commStats.length ? `
    <div>
      <div class="sec-hdr">
        <span class="sec-title">Comunidades</span>
        <button class="ver-mais" onclick="location.href='communities.html'">ver mais</button>
      </div>
      <div class="comm-list">
        ${commStats.map(c => `
          <a href="items.html?community=${encodeURIComponent(c.name)}" class="comm-item ${c.pending > 0 ? 'pending' : 'ok'}">
            <div class="comm-avatar">${c.name.charAt(0).toUpperCase()}</div>
            <div style="flex:1;min-width:0;">
              <div class="comm-name">${c.name}</div>
              <div class="comm-meta">
                <span class="comm-items-txt"><i class="ti ti-package" style="font-size:11px;"></i> ${c.total} ${c.total === 1 ? 'item' : 'itens'}</span>
                ${c.pending > 0 ? `<span class="comm-pend-txt"><i class="ti ti-alert-triangle" style="font-size:11px;"></i> ${c.pending} pagamento${c.pending > 1 ? 's' : ''} pendente${c.pending > 1 ? 's' : ''}</span>` : ''}
              </div>
            </div>
            <i class="ti ti-arrow-right comm-arr"></i>
          </a>`).join('')}
      </div>
    </div>` : ''}

    <!-- Recentes -->
    ${recentItems.length ? `
    <div>
      <div class="sec-hdr">
        <span class="sec-title">Recentes</span>
        <button class="ver-mais" onclick="location.href='items.html'">ver mais</button>
      </div>
      <div class="recent-list">
        ${recentItems.map((item, idx) => `
          <a href="items.html" class="recent-item">
            <div class="recent-thumb">
              ${item.img ? `<img src="${item.img}" alt="${item.name}" onerror="this.parentNode.innerHTML='<i class=\\'ti ti-photo\\'></i>'">` : '<i class="ti ti-photo"></i>'}
            </div>
            <div class="recent-body">
              <span class="recent-badge ${item.type === 'comprado' ? 'badge-comprado' : 'badge-wishlist'}">${item.type === 'comprado' ? 'Comprado' : 'Wishlist'}</span>
              <div class="recent-name">${item.name}</div>
              <div class="recent-subtitle">${item.sub}</div>
              <div class="recent-info">${item.info}</div>
            </div>
            <div class="recent-date">${relDate(idx)}</div>
          </a>`).join('')}
      </div>
    </div>` : ''}

    <!-- Total de itens -->
    ${comebacks.length ? `
    <div>
      <div class="sec-hdr">
        <span class="sec-title">Total de itens</span>
        <button class="ver-mais" onclick="location.href='items.html'">ver mais</button>
      </div>
      <div class="filter-pills">
        <button class="filter-pill active">Comeback</button>
        <button class="filter-pill">Membro</button>
        <button class="filter-pill">Tipo de item</button>
        <button class="filter-pill">Comunidade</button>
      </div>
      <div class="bars">
        ${comebacks.map(([cb, count]) => `
          <div class="bar-row">
            <div class="bar-label">${cb}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${Math.round(count/maxCb*100)}%;"></div></div>
            <div class="bar-num">${count}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- Meus binders -->
    <div>
      <div class="sec-hdr">
        <span class="sec-title">Meus binders</span>
        <button class="ver-mais" onclick="location.href='portfolio.html'">ver mais</button>
      </div>
      <div class="binders-grid">
        <div class="binder-card" onclick="location.href='portfolio.html'">
          <div class="binder-cover" style="background:#e8c4d4;display:flex;align-items:center;justify-content:center;"><i class="ti ti-book" style="font-size:28px;color:#bd607c;opacity:0.4;"></i></div>
          <div class="binder-num">N° 001</div>
          <div class="binder-name">Stray Kids</div>
          <div class="binder-sub">Regulares</div>
        </div>
        <div class="binder-card" onclick="location.href='portfolio.html'">
          <div class="binder-cover" style="background:#c4c8e8;display:flex;align-items:center;justify-content:center;"><i class="ti ti-book" style="font-size:28px;color:#7e79bb;opacity:0.4;"></i></div>
          <div class="binder-num">N° 002</div>
          <div class="binder-name">Stray Kids</div>
          <div class="binder-sub">Regulares</div>
        </div>
        <div class="binder-card" onclick="location.href='portfolio.html'">
          <div class="binder-cover" style="background:#3a3a3a;display:flex;align-items:center;justify-content:center;"><i class="ti ti-book" style="font-size:28px;color:#fff;opacity:0.2;"></i></div>
          <div class="binder-num">N° 003</div>
          <div class="binder-name">Stray Kids</div>
          <div class="binder-sub">POBs & LDs</div>
        </div>
      </div>
    </div>
  `;
}
