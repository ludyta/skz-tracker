/* ══ DASHBOARD.JS ══════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();

  const restored = await Auth.tryRestore();
  if (!restored) { window.location.href = '../index.html'; return; }

  // Data de hoje
  document.getElementById('dash-date').textContent =
    new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  await loadDashboard();
});

async function loadDashboard() {
  const rows = await Sheets.get(CONFIG.RANGES.ITEMS);
  if (!rows) return;

  const items = rows.filter(row => row[COL.TIPO]);
  const counts = { pending:0, transit:0, done:0, waiting:0 };
  let totalPendingValue = 0;
  const pendingItems = [], transitItems = [];

  items.forEach((row, idx) => {
    const cls = statusClass(row[COL.STATUS] || '');
    const pendente = parseFloat(row[COL.PENDENTE]) || 0;
    counts[cls] = (counts[cls] || 0) + 1;
    totalPendingValue += pendente;
    if (cls === 'pending') pendingItems.push({ row, idx: idx + 4 });
    if (cls === 'transit') transitItems.push({ row, idx: idx + 4 });
  });

  document.getElementById('metric-pending').textContent = counts.pending || 0;
  document.getElementById('metric-transit').textContent = counts.transit || 0;
  document.getElementById('metric-done').textContent    = counts.done    || 0;
  document.getElementById('metric-total').textContent   = items.length;
  document.getElementById('metric-pending-value').textContent = formatBRL(totalPendingValue);

  if (counts.pending > 0) {
    const banner = document.getElementById('alert-banner');
    banner.style.display = 'flex';
    document.getElementById('alert-title').textContent =
      `${counts.pending} ${counts.pending === 1 ? 'item com pagamento pendente' : 'itens com pagamento pendente'}`;
    document.getElementById('alert-sub').textContent =
      `Total: ${formatBRL(totalPendingValue)} — verifique antes de atrasar!`;
  }

  renderItemList('list-pending', pendingItems, 'pending', 'Nenhum pagamento pendente', 'ti-circle-check');
  renderItemList('list-transit', transitItems, 'transit', 'Nenhum item em trânsito no momento', 'ti-truck');
}

function renderItemList(containerId, items, statusCls, emptyMsg, emptyIcon) {
  const el = document.getElementById(containerId);
  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ${emptyIcon}"></i>${emptyMsg}</div>`;
    return;
  }
  el.innerHTML = items.map(({ row, idx }) => {
    const nome = [row[COL.TIPO],row[COL.MEMBRO],row[COL.COMEBACK],row[COL.SET_POB]].filter(Boolean).join(' · ') || 'Item sem nome';
    const meta = [row[COL.COMUNIDADE],row[COL.GOM]].filter(Boolean).join(' · ') || '—';
    const pendente = parseFloat(row[COL.PENDENTE]) || 0;
    const imgLink = row[COL.IMG_LINK] || '';
    return `<a class="item-card is-${statusCls} mb-4" href="item-detail.html?row=${idx}" style="text-decoration:none;display:flex;">
      <div class="item-thumb">${imgLink ? `<img src="${imgLink}" alt="${nome}" onerror="this.parentNode.innerHTML='<i class=\\'ti ti-photo\\'></i>'">` : '<i class="ti ti-photo"></i>'}</div>
      <div class="item-body">
        <div class="item-name">${nome}</div>
        <div class="item-meta">${meta}</div>
      </div>
      <div style="flex-shrink:0;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <span class="badge badge-${statusCls}"><i class="ti ${statusIcon(row[COL.STATUS])}"></i>${statusLabel(row[COL.STATUS])}</span>
        ${pendente > 0 ? `<span style="font-family:var(--font-mono);font-size:12px;color:var(--status-pending-color);">${formatBRL(pendente)}</span>` : ''}
      </div>
    </a>`;
  }).join('');
}
