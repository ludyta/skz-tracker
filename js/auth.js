const CONFIG = {
  CLIENT_ID:  '866600271883-9gmf20e4aqr5gimnbic80hg9ojd56o0a.apps.googleusercontent.com',
  SHEET_ID:   '1TdQGVXt9dTZGgkDi0jENVtNCl03puUuv',
  SCOPES:     'https://www.googleapis.com/auth/spreadsheets',
  DISCOVERY:  'https://sheets.googleapis.com/$discovery/rest?version=v4',
  SHEETS: {
    ITEMS:       '📦 Itens',
    PAYMENTS:    '💸 Pagamentos',
    COMMUNITIES: '🏘️ Comunidades',
  },
  RANGES: {
    ITEMS:       '📦 Itens!A4:AB503',
    COMMUNITIES: '🏘️ Comunidades!A4:F103',
    PAYMENTS:    '💸 Pagamentos!A4:F1003',
  },
};

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
    Auth._onSignOut();
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

const COL = {
  TIPO:        0,
  COMEBACK:    1,
  SET_POB:     2,
  NUM_SET:     3,
  IMG_LINK:    4,
  CLAIM_TYPE:  5,
  MEMBRO:      6,
  NUM_CLAIM:   7,
  COMUNIDADE:  8,
  GOM:         9,
  LINK_CEG:   10,
  VL_ITEM:    11,
  ST_ITEM:    12,
  VL_FI1:     13,
  ST_FI1:     14,
  VL_FI2:     15,
  ST_FI2:     16,
  STATUS:     17,
  ETAPA:      18,
  DATA_CLAIM: 19,
  VL_ALF:     21,
  ST_ALF:     22,
  VL_FNAC:    23,
  ST_FNAC:    24,
  TOTAL_PAGO: 25,
  PENDENTE:   26,
  DATA_REC:   27,
};

const STATUS = {
  PENDING:   '💰 Pgto pendente',
  TRANSIT:   '🚢 Em trânsito',
  WAITING:   '⏳ Aguardando',
  DONE:      '✅ Recebido',
  CANCELLED: '❌ Cancelado',
};

function statusClass(status) {
  if (!status) return 'waiting';
  if (status.includes('pendente'))  return 'pending';
  if (status.includes('trânsito'))  return 'transit';
  if (status.includes('Recebido'))  return 'done';
  if (status.includes('Cancelado')) return 'cancelled';
  return 'waiting';
}

function statusIcon(status) {
  const cls = statusClass(status);
  const icons = {
    pending:   'ti-alert-triangle',
    transit:   'ti-truck',
    done:      'ti-circle-check',
    cancelled: 'ti-x',
    waiting:   'ti-clock',
  };
  return icons[cls] || 'ti-clock';
}

function statusLabel(status) {
  if (!status) return 'Aguardando';
  return status
    .replace('💰 ', '')
    .replace('🚢 ', '')
    .replace('⏳ ', '')
    .replace('✅ ', '')
    .replace('❌ ', '');
}

function formatBRL(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  if (!value) return '—';
  return value;
}
