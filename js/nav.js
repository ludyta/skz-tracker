(function() {
  function initNav() {
    // Don't show navbar on login screen
    const authScreen = document.getElementById('screen-auth');
    const appScreen = document.getElementById('screen-app');
    if (authScreen && appScreen) {
      // index.html with auth screen - wait for signin
      document.addEventListener('auth:signin', () => { initNav(); });
      document.addEventListener('auth:signout', () => {
        document.querySelector('.skz-navbar')?.remove();
        document.querySelector('.skz-dropdown')?.remove();
        document.querySelector('.skz-overlay')?.remove();
      });
      if (appScreen.style.display === 'none') return;
    }
    const path = window.location.pathname;
    const isRoot = !path.includes('/pages/');
    const base = isRoot ? 'pages/' : '';
    const rootBase = isRoot ? '' : '../';

    const PAGES = [
      { id: 'dashboard',   href: rootBase + 'index.html',         icon: 'ti-layout-dashboard',  label: 'Dashboard' },
      { id: 'items',       href: base + 'items.html',              icon: 'ti-package',           label: 'Itens' },
      { id: 'portfolio',   href: base + 'portfolio.html',          icon: 'ti-grid-dots',         label: 'Portfólio' },
      { id: 'communities', href: base + 'communities.html',        icon: 'ti-building-community', label: 'Comunidades' },
    ];

    function getActivePage() {
      if (path.endsWith('index.html') || path.endsWith('/skz-tracker/') || path === '/') return 'dashboard';
      if (path.includes('item')) return 'items';
      if (path.includes('portfolio') || path.includes('wishlist')) return 'portfolio';
      if (path.includes('communit')) return 'communities';
      return 'dashboard';
    }

    const activePage = getActivePage();
    const active = PAGES.find(p => p.id === activePage) || PAGES[0];

    // Inject styles
    if (!document.getElementById('skz-nav-style-v4')) {
      const style = document.createElement('style');
      style.id = 'skz-nav-style-v4';
      style.textContent = `
        .skz-navbar{position:sticky;top:0;z-index:200;background:var(--bg-base);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:center;gap:10px;}
        .skz-brand{font-size:9px;font-weight:500;color:var(--text-faint);text-decoration:none;display:flex;align-items:center;flex-shrink:0;letter-spacing:0.08em;text-transform:uppercase;line-height:1.3;}
        
        .skz-desktop-nav{display:flex;align-items:center;gap:2px;margin-left:8px;}
        .skz-desktop-nav a{display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:var(--radius-md);font-size:12px;color:var(--text-muted);text-decoration:none;transition:all var(--transition);}
        .skz-desktop-nav a:hover{color:var(--text-primary);background:var(--bg-elevated);}
        .skz-desktop-nav a.active{color:var(--accent-deep);background:var(--accent-muted);}
        .skz-desktop-nav a i{font-size:15px;}
        .skz-pill-wrap{display:none;position:absolute;left:50%;transform:translateX(-50%);}
        .skz-pill{display:flex;align-items:center;gap:7px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:100px;padding:6px 14px;font-size:13px;color:var(--text-primary);cursor:pointer;transition:all var(--transition);user-select:none;}
        .skz-pill:hover{border-color:var(--accent-border);}
        .skz-pill i.icon{font-size:15px;color:var(--accent-deep);}
        .skz-pill i.chev{font-size:12px;color:var(--text-faint);transition:transform 0.2s;}
        .skz-pill.open i.chev{transform:rotate(180deg);}
        .skz-dropdown{display:none;position:fixed;top:52px;left:50%;transform:translateX(-50%);background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:6px;z-index:300;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,0.3);}
        .skz-dropdown.open{display:block;}
        .skz-dropdown a{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius-md);font-size:13px;color:var(--text-muted);text-decoration:none;transition:all var(--transition);}
        .skz-dropdown a:hover{background:var(--bg-elevated);color:var(--text-primary);}
        .skz-dropdown a.active{background:var(--accent-muted);color:var(--accent-deep);}
        .skz-dropdown a i{font-size:16px;}
        .skz-overlay{display:none;position:fixed;inset:0;z-index:250;}
        .skz-overlay.open{display:block;}
        .skz-actions{display:flex;gap:4px;margin-left:auto;}
        .skz-btn{width:30px;height:30px;border-radius:var(--radius-sm);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:14px;text-decoration:none;background:transparent;cursor:pointer;transition:all var(--transition);}
        .skz-btn:hover{border-color:var(--border-hover);color:var(--text-primary);}
        @media(max-width:768px){
          .skz-desktop-nav{display:none;}
          .skz-pill-wrap{display:flex;}
          .skz-brand-label{display:none;}
        }
      `;
      document.head.appendChild(style);
    }

    // Build navbar
    const navbar = document.createElement('nav');
    navbar.className = 'skz-navbar';
    navbar.innerHTML = `
      <a href="${rootBase}index.html" class="skz-brand">
        <span class="skz-brand-label">Collection<br>Tracker</span>
      </a>
      <div class="skz-desktop-nav">
        ${PAGES.map(p => `<a href="${p.href}" class="${p.id===activePage?'active':''}"><i class="ti ${p.icon}"></i>${p.label}</a>`).join('')}
      </div>
      <div class="skz-pill-wrap">
        <div class="skz-pill" id="skz-pill" onclick="skzToggleNav()">
          <i class="ti ${active.icon} icon"></i>
          ${active.label}
          <i class="ti ti-chevron-down chev"></i>
        </div>
      </div>
      <div class="skz-actions">
        <a href="${base}settings.html" class="skz-btn" title="Configurações"><i class="ti ti-settings"></i></a>
        <button class="skz-btn" onclick="Auth.signOut()" title="Sair"><i class="ti ti-logout"></i></button>
      </div>
    `;

    const dropdown = document.createElement('div');
    dropdown.className = 'skz-dropdown';
    dropdown.id = 'skz-dropdown';
    dropdown.innerHTML = PAGES.map(p => `
      <a href="${p.href}" class="${p.id===activePage?'active':''}">
        <i class="ti ${p.icon}"></i>${p.label}
      </a>`).join('');

    const overlay = document.createElement('div');
    overlay.className = 'skz-overlay';
    overlay.id = 'skz-overlay';
    overlay.onclick = () => skzCloseNav();

    // Insert at top of body
    document.body.insertBefore(overlay, document.body.firstChild);
    document.body.insertBefore(dropdown, document.body.firstChild);
    document.body.insertBefore(navbar, document.body.firstChild);
  }

  window.skzToggleNav = function() {
    const pill = document.getElementById('skz-pill');
    const dd = document.getElementById('skz-dropdown');
    const ov = document.getElementById('skz-overlay');
    const isOpen = dd && dd.classList.contains('open');
    if (isOpen) {
      skzCloseNav();
    } else {
      pill && pill.classList.add('open');
      dd && dd.classList.add('open');
      ov && ov.classList.add('open');
    }
  };

  window.skzCloseNav = function() {
    document.getElementById('skz-pill')?.classList.remove('open');
    document.getElementById('skz-dropdown')?.classList.remove('open');
    document.getElementById('skz-overlay')?.classList.remove('open');
  };

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
