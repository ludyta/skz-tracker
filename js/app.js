// ══ CONFIG ═══════════════════════════════════════
const CONFIG = {
  CLIENT_ID:  '866600271883-9gmf20e4aqr5gimnbic80hg9ojd56o0a.apps.googleusercontent.com',
  SHEET_ID:   '1WXAYkDfD3DPtPawQBOtUmbw5uhH1oxpJ-0cc-JjMHeo',
  SCOPES:     'https://www.googleapis.com/auth/spreadsheets',
  SHEETS: {
    ITEMS:       'Itens',
    PAYMENTS:    'Pagamentos',
    COMMUNITIES: 'Comunidades',
  },
  RANGES: {
    ITEMS:       'Itens!A4:AB',
    COMMUNITIES: 'Comunidades!A3:F',
    PAYMENTS:    'Pagamentos!A3:F',
  },
};

// ══ COL MAP ══════════════════════════════════════
const COL = {
  TIPO:0, COMEBACK:1, SET_POB:2, NUM_SET:3, IMG_LINK:4,
  CLAIM_TYPE:5, MEMBRO:6, NUM_CLAIM:7, COMUNIDADE:8, GOM:9, LINK_CEG:10,
  VL_ITEM:11, ST_ITEM:12, VL_FI1:13, ST_FI1:14, VL_FI2:15, ST_FI2:16,
  STATUS:17, ETAPA:18, DATA_CLAIM:19, NOTAS:20, DATA_REC:21,
  VL_ALF:22, ST_ALF:23, VL_FNAC:24, ST_FNAC:25, TOTAL_PAGO:26, PENDENTE:27,
};

// ══ AUTH ═════════════════════════════════════════
const Auth = {
  isSignedIn: false,
  user: null,
  tokenClient: null,
  accessToken: null,

  async init() {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        Auth.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CONFIG.CLIENT_ID,
          scope: CONFIG.SCOPES,
          callback: (response) => {
            if (response.error) { Auth._onSignOut(); return; }
            Auth.accessToken = response.access_token;
            Auth._onSignIn();
          },
        });
        resolve();
      };
      document.head.appendChild(script);
    });
  },

  signIn() {
    if (!Auth.tokenClient) return;
    Auth.tokenClient.requestAccessToken({ prompt: 'consent' });
  },

  signOut() {
    if (Auth.accessToken) google.accounts.oauth2.revoke(Auth.accessToken);
    Auth.accessToken = null;
    Auth.isSignedIn = false;
    Auth.user = null;
    localStorage.removeItem('skz_token');
    // Redirect to login
    const isPages = window.location.pathname.includes('/pages/');
    window.location.href = isPages ? '../index.html' : 'index.html';
  },

  async tryRestore() {
    const saved = localStorage.getItem('skz_token');
    if (saved) { Auth.accessToken = saved; Auth.isSignedIn = true; return true; }
    return false;
  },

  _onSignIn() {
    Auth.isSignedIn = true;
    localStorage.setItem('skz_token', Auth.accessToken);
    document.dispatchEvent(new CustomEvent('auth:signin'));
  },

  _onSignOut() {
    Auth.isSignedIn = false;
    localStorage.removeItem('skz_token');
    document.dispatchEvent(new CustomEvent('auth:signout'));
  },
};

// ══ SHEETS ═══════════════════════════════════════
const Sheets = {
  _headers() {
    return {
      'Authorization': `Bearer ${Auth.accessToken}`,
      'Content-Type': 'application/json',
    };
  },

  async get(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, { headers: Sheets._headers() });
    if (res.status === 401) { Auth._onSignOut(); return null; }
    const data = await res.json();
    return data.values || [];
  },

  async set(range, values) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: Sheets._headers(),
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    });
    if (res.status === 401) { Auth._onSignOut(); return null; }
    return await res.json();
  },

  async append(range, values) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: 'POST',
      headers: Sheets._headers(),
      body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
    });
    if (res.status === 401) { Auth._onSignOut(); return null; }
    return await res.json();
  },

  async setCell(cell, value) {
    return Sheets.set(cell, [[value]]);
  },
};

// ══ HELPERS ══════════════════════════════════════
function statusClass(status) {
  if (!status) return 'waiting';
  if (status.includes('pendente'))  return 'pending';
  if (status.includes('trânsito'))  return 'transit';
  if (status.includes('Recebido'))  return 'done';
  if (status.includes('Cancelado')) return 'cancelled';
  return 'waiting';
}

function statusIcon(status) {
  const icons = { pending:'ti-alert-triangle', transit:'ti-truck', done:'ti-circle-check', cancelled:'ti-x', waiting:'ti-clock' };
  return icons[statusClass(status)] || 'ti-clock';
}

function statusLabel(status) {
  if (!status) return 'Aguardando';
  return status.replace('💰 ','').replace('🚢 ','').replace('⏳ ','').replace('✅ ','').replace('❌ ','');
}

function formatBRL(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function indexToCol(idx) {
  if (idx < 26) return String.fromCharCode(65 + idx);
  return String.fromCharCode(64 + Math.floor(idx/26)) + String.fromCharCode(65 + (idx%26));
}
