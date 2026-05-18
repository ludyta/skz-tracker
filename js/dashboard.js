/* ═══════════════════════════════════════════════
   SKZ TRACKER — Dashboard
   ═══════════════════════════════════════════════ */

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();

  // Auth check - redirect to login if not logged in
  const restored = await Auth.tryRestore();
  if (!restored) { window.location.href = '../index.html'; return; }

  // Data de hoje no header
  const now = new Date();
  document.getElementById('dash-date').textContent =
    now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Tenta restaurar sessão
  const restored = await Auth.tryRestore();
  if (restored) showApp();
  else           showAuth();
});

document.addEventListener('auth:signin',  showApp);
document.addEventListener('auth:signout', showAuth);

function showAuth() {
}

async function showApp() {
  await loadDashboard();
}

// ── Carrega dados e renderiza dashboard ─────────
async function loadDashboard() {
  const rows = await Sheets.get(CONFIG.RANGES.ITEMS);
  if (!rows) return;

  // Filtra linhas vazias
  const items = rows.filter(row => row[COL.TIPO]);

  // Contagens por status
  const counts = { pending: 0, transit: 0, done: 0, waiting: 0 };
  let totalPendingValue = 0;

  const pendingItems  = [];
  const transitItems  = [];

  items.forEach((row, idx) => {
    const status = row[COL.STATUS] || '';
    const cls    = statusClass(status);
    const pendente = parseFloat(row[COL.PENDENTE]) || 0;

    counts[cls] = (counts[cls] || 0) + 1;
    totalPendingValue += pendente;

    if (cls === 'pending') pendingItems.push({ row, idx: idx + 4 });
    if (cls === 'transit') transitItems.push({ row, idx: idx + 4 });
  });

  // Métricas
  document.getElementById('metric-pending').textContent = counts.pending || 0;
  document.getElementById('metric-transit').textContent = counts.transit || 0;
  document.getElementById('metric-done').textContent    = counts.done    || 0;
  document.getElementById('metric-total').textContent   = items.length;
  document.getElementById('metric-pending-value').textContent = formatBRL(totalPendingValue);

  // Banner de alerta
  if (counts.pending > 0) {
    const banner = document.getElementById('alert-banner');
    banner.style.display = 'flex';
    document.getElementById('alert-title').textContent =
      `${counts.pending} ${counts.pending === 1 ? 'item com pagamento pendente' : 'itens com pagamento pendente'}`;
    document.getElementById('alert-sub').textContent =
      `Total: ${formatBRL(totalPendingValue)} — verifique antes de atrasar!`;
  }

  // Lista de pendentes
  renderItemList('list-pending', pendingItems, 'pending',
    'Nenhum pagamento pendente', 'ti-circle-check');

  // Lista em trânsito
  renderItemList('list-transit', transitItems, 'transit',
    'Nenhum item em trânsito no momento', 'ti-truck');
}

// ── Renderiza lista de itens ─────────────────────
function renderItemList(containerId, items, statusCls, emptyMsg, emptyIcon) {
  const el = document.getElementById(containerId);

  if (!items.length) {
    el.innerHTML = `
      <div class="empty-state">
        <i class="ti ${emptyIcon}"></i>
        ${emptyMsg}
      </div>`;
    return;
  }

  el.innerHTML = items.map(({ row, idx }) => {
    const nome    = itemDisplayName(row);
    const meta    = itemMeta(row);
    const etapa   = statusLabel(row[COL.ETAPA]);
    const pendente = parseFloat(row[COL.PENDENTE]) || 0;
    const imgLink  = row[COL.IMG_LINK] || '';

    return `
      <a class="item-card is-${statusCls} mb-4"
         href="pages/item-detail.html?row=${idx}"
         style="text-decoration:none; display:flex;">
        <div class="item-thumb">
          ${imgLink
            ? `<img src="${imgLink}" alt="${nome}" onerror="this.parentNode.innerHTML='<i class=\\'ti ti-photo\\' style=\\'font-size:18px;\\'></i>'">`
            : `<i class="ti ti-photo"></i>`}
        </div>
        <div class="item-body">
          <div class="item-name">${nome}</div>
          <div class="item-meta">${meta} · ${etapa}</div>
        </div>
        <div style="flex-shrink:0; text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <span class="badge badge-${statusCls}">
            <i class="ti ${statusIcon(row[COL.STATUS])}"></i>
            ${statusLabel(row[COL.STATUS])}
          </span>
          ${pendente > 0
            ? `<span style="font-family:var(--font-mono); font-size:12px; color:var(--status-pending-color);">${formatBRL(pendente)}</span>`
            : ''}
        </div>
      </a>`;
  }).join('');
}

// ── Helpers de display ──────────────────────────
function itemDisplayName(row) {
  const parts = [];
  if (row[COL.TIPO])     parts.push(row[COL.TIPO]);
  if (row[COL.MEMBRO])   parts.push(row[COL.MEMBRO]);
  if (row[COL.COMEBACK]) parts.push(row[COL.COMEBACK]);
  if (row[COL.SET_POB])  parts.push(row[COL.SET_POB]);
  return parts.join(' · ') || 'Item sem nome';
}

function itemMeta(row) {
  const parts = [];
  if (row[COL.COMUNIDADE]) parts.push(row[COL.COMUNIDADE]);
  if (row[COL.GOM])        parts.push(row[COL.GOM]);
  return parts.join(' · ') || '—';
}
