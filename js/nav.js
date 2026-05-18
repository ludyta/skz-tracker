// ══ NAV.JS — navbar injetada automaticamente ════
(function() {
  const path = window.location.pathname;
  const isRoot = !path.includes('/pages/');
  const base = isRoot ? 'pages/' : '';
  const rootBase = isRoot ? '' : '../';

  const PAGES = [
    { id: 'dashboard',   href: rootBase + 'index.html',                    icon: 'ti-layout-dashboard', label: 'Dashboard' },
    { id: 'items',       href: base + 'items.html',                         icon: 'ti-package',          label: 'Itens' },
    { id: 'portfolio',   href: base + 'portfolio.html',                     icon: 'ti-grid-dots',        label: 'Portfólio' },
    { id: 'communities', href: base + 'communities.html',                   icon: 'ti-building-community',label: 'Comunidades' },
  ];

  function getActivePage() {
    if (path.endsWith('index.html') || path.endsWith('/')) return 'dashboard';
    if (path.includes('item')) return 'items';
    if (path.includes('portfolio') || path.includes('wishlist')) return 'portfolio';
    if (path.includes('communit')) return 'communities';
    return '';
  }

  const activePage = getActivePage();
  const active = PAGES.find(p => p.id === activePage) || PAGES[0];

  const style = document.createElement('style');
  style.textContent = `
    .skz-navbar { position:sticky; top:0; z-index:200; background:var(--bg-base); border-bottom:1px solid var(--border); padding:10px 16px; display:flex; align-items:center; gap:10px; }
    .skz-brand { font-family:var(--font-display); font-size:13px; font-weight:500; color:var(--text-primary); text-decoration:none; display:flex; align-items:center; gap:7px; flex-shrink:0; }
    .skz-brand-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); flex-shrink:0; }

    /* Desktop nav */
    .skz-desktop-nav { display:flex; align-items:center; gap:2px; margin-left:8px; }
    .skz-desktop-nav a { display:flex; align-items:center; gap:5px; padding:6px 10px; border-radius:var(--radius-md); font-size:12px; color:var(--text-muted); text-decoration:none; transition:all var(--transition); }
    .skz-desktop-nav a:hover { color:var(--text-primary); background:var(--bg-elevated); }
    .skz-desktop-nav a.active { color:var(--accent-deep); background:var(--accent-muted); }
    .skz-desktop-nav a i { font-size:15px; }

    /* Mobile pill */
    .skz-pill-wrap { display:none; flex:1; justify-content:center; }
    .skz-pill { display:flex; align-items:center; gap:7px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:100px; padding:6px 14px; font-size:13px; color:var(--text-primary); cursor:pointer; transition:all var(--transition); user-select:none; }
    .skz-pill:hover { border-color:var(--accent-border); }
    .skz-pill i.icon { font-size:15px; color:var(--accent-deep); }
    .skz-pill i.chev { font-size:12px; color:var(--text-faint); transition:transform 0.2s; }
    .skz-pill.open i.chev { transform:rotate(180deg); }

    /* Dropdown */
    .skz-dropdown { display:none; position:fixed; top:52px; left:50%; transform:translateX(-50%); background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:6px; z-index:300; min-width:200px; box-shadow:0 8px 24px rgba(0,0,0,0.3); }
    .skz-dropdown.open { display:block; }
    .skz-dropdown a { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius-md); font-size:13px; color:var(--text-muted); text-decoration:none; transition:all var(--transition); }
    .skz-dropdown a:hover { background:var(--bg-elevated); color:var(--text-primary); }
    .skz-dropdown a.active { background:var(--accent-muted); color:var(--accent-deep); }
    .skz-dropdown a i { font-size:16px; }
    .skz-dropdown-overlay { display:none; position:fixed; inset:0; z-index:250; }
    .skz-dropdown-overlay.open { display:block; }

    /* Actions */
    .skz-actions { display:flex; gap:4px; margin-left:auto; }
    .skz-action-btn { width:30px; height:30px; border-radius:var(--radius-sm); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:14px; text-decoration:none; background:transparent; cursor:pointer; transition:all var(--transition); }
    .skz-action-btn:hover { border-color:var(--border-hover); color:var(--text-primary); }

    @media (max-width:768px) {
      .skz-desktop-nav { display:none; }
      .skz-pill-wrap { display:flex; }
      .skz-brand span { display:none; }
    }
  `;
  document.head.appendChild(style);

  const navbar = document.createElement('nav');
  navbar.className = 'skz-navbar';
  navbar.innerHTML = `
    <a href="${rootBase}index.html" class="skz-brand">
      <div class="skz-brand-dot"></div>
      <span>SKZ Tracker</span>
    </a>

    <div class="skz-desktop-nav">
      ${PAGES.map(p => `<a href="${p.href}" class="${p.id === activePage ? 'active' : ''}">
        <i class="ti ${p.icon}"></i>${p.label}
      </a>`).join('')}
    </div>

    <div class="skz-pill-wrap">
      <div class="skz-pill" id="skz-pill" onclick="toggleDropdown()">
        <i class="ti ${active.icon} icon"></i>
        ${active.label}
        <i class="ti ti-chevron-down chev"></i>
      </div>
    </div>

    <div class="skz-actions">
      <a href="${base}settings.html" class="skz-action-btn" title="Configurações"><i class="ti ti-settings"></i></a>
      <button class="skz-action-btn" onclick="Auth.signOut()" title="Sair"><i class="ti ti-logout"></i></button>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'skz-dropdown-overlay';
  overlay.onclick = closeDropdown;

  const dropdown = document.createElement('div');
  dropdown.className = 'skz-dropdown';
  dropdown.id = 'skz-dropdown';
  dropdown.innerHTML = PAGES.map(p => `
    <a href="${p.href}" class="${p.id === activePage ? 'active' : ''}">
      <i class="ti ${p.icon}"></i>${p.label}
    </a>`).join('');

  function toggleDropdown() {
    const pill = document.getElementById('skz-pill');
    const dd = document.getElementById('skz-dropdown');
    const isOpen = dd.classList.contains('open');
    if (isOpen) { closeDropdown(); } else {
      pill.classList.add('open');
      dd.classList.add('open');
      overlay.classList.add('open');
    }
  }

  function closeDropdown() {
    document.getElementById('skz-pill')?.classList.remove('open');
    document.getElementById('skz-dropdown')?.classList.remove('open');
    overlay.classList.remove('open');
  }

  window.toggleDropdown = toggleDropdown;
  window.closeDropdown = closeDropdown;

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertBefore(overlay, document.body.firstChild);
    document.body.insertBefore(dropdown, document.body.firstChild);
    document.body.insertBefore(navbar, document.body.firstChild);
  });
})();
