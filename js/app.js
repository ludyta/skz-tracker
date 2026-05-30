// ══ CONFIG ═══════════════════════════════════════
const CONFIG = {
  CLIENT_ID:  '866600271883-9gmf20e4aqr5gimnbic80hg9ojd56o0a.apps.googleusercontent.com',
  SHEET_ID:   '1WXAYkDfD3DPtPawQBOtUmbw5uhH1oxpJ-0cc-JjMHeo',
  SCOPES:     'https://www.googleapis.com/auth/spreadsheets',
  SHEETS: {
    ITEMS:       'Itens',
    COMMUNITIES: 'Comunidades',
  },
  RANGES: {
    ITEMS:       'Itens!A4:AL',
    COMMUNITIES: 'Comunidades!A3:G',
  },
};

// ══ COL MAP ══════════════════════════════════════
const COL = {
  // Grupo 1 — Identificação
  TIPO:      0,  // A
  MEMBRO:    1,  // B
  COMEBACK:  2,  // C
  SET_POB:   3,  // D
  NUM_SET:   4,  // E
  NUM_CLAIM: 5,  // F
  IMG_LINK:  6,  // G

  // Grupo 2 — Origem / CEG
  TIPO_CEG:   7,  // H
  PLATAFORMA: 8,  // I
  MES_EDICAO: 9,  // J
  NOME_SET:   10, // K
  LINHA_GOM:  11, // L
  COMUNIDADE: 12, // M
  GOM:        13, // N
  CEG:        14, // O
  LINK_CEG:   15, // P
  DATA_CLAIM: 16, // Q

  // Grupo 3 — Trânsito
  ETAPA:    17, // R
  DATA_REC: 18, // S
  NOTAS:    19, // T

  // Grupo 4 — Pagamentos (triplas: valor + status + data limite)
  VL_ITEM: 20, ST_ITEM: 21, DT_ITEM: 22, // U V W
  VL_FI1:  23, ST_FI1:  24, DT_FI1:  25, // X Y Z
  VL_FI2:  26, ST_FI2:  27, DT_FI2:  28, // AA AB AC
  VL_ALF:  29, ST_ALF:  30, DT_ALF:  31, // AD AE AF
  VL_FNAC: 32, ST_FNAC: 33, DT_FNAC: 34, // AG AH AI

  // Grupo 5 — Totais calculados
  TOTAL_PAGO: 35, // AJ
  PENDENTE:   36, // AK
  STATUS:     37, // AL
};

// Etapas de trânsito
const ETAPAS = [
  'Em processo de compra',
  'Comprado',
  'Aguardando envio para seller',
  'Com a seller',
  'Em trânsito para warehouse',
  'Na warehouse',
  'Enviado para o Brasil',
  'No Brasil / Com a GOM',
  'Liberado envio nacional',
  'Aguardando cotação nacional',
  'Em trânsito para o joiner',
  'Recebido',
];

// ══ AUTH ═════════════════════════════════════════
const Auth = {
  isSignedIn: false,
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
    localStorage.removeItem('skz_token');
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
  if (status.includes('pendente') || status.includes('Pendente')) return 'pending';
  if (status.includes('atrasado') || status.includes('Atrasado')) return 'cancelled';
  if (status.includes('Recebido')) return 'done';
  return 'waiting';
}

function statusIcon(status) {
  const icons = { pending:'ti-alert-triangle', transit:'ti-truck', done:'ti-circle-check', cancelled:'ti-alert-circle', waiting:'ti-clock' };
  return icons[statusClass(status)] || 'ti-clock';
}

function statusLabel(status) {
  if (!status) return 'Aguardando';
  return status;
}

function formatBRL(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function indexToCol(idx) {
  if (idx < 26) return String.fromCharCode(65 + idx);
  return String.fromCharCode(64 + Math.floor(idx / 26)) + String.fromCharCode(65 + (idx % 26));
}

function formatMesAno(value) {
  if (!value) return '—';
  const [year, month] = value.split('-');
  if (!year || !month) return value;
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${meses[parseInt(month)-1]} ${year}`;
}

// Calcula status de pagamento de uma etapa considerando data limite
function calcPayStatus(st, dt) {
  if (!st || st === 'Pago') return st || 'Aguardando cobrança';
  if (st === 'Aguardando cobrança') return 'Aguardando cobrança';
  if (st === 'Cobrado — pendente' && dt) {
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const limite = new Date(dt); limite.setHours(0,0,0,0);
    if (hoje > limite) return 'Atrasado';
  }
  return st;
}

// Resumo de pagamentos pendentes/atrasados de um item
function paymentSummary(row) {
  const steps = [
    { name:'Item',           vl: COL.VL_ITEM, st: COL.ST_ITEM, dt: COL.DT_ITEM },
    { name:'Frete inter 1',  vl: COL.VL_FI1,  st: COL.ST_FI1,  dt: COL.DT_FI1  },
    { name:'Frete inter 2',  vl: COL.VL_FI2,  st: COL.ST_FI2,  dt: COL.DT_FI2  },
    { name:'Alfândega',      vl: COL.VL_ALF,  st: COL.ST_ALF,  dt: COL.DT_ALF  },
    { name:'Frete nacional', vl: COL.VL_FNAC, st: COL.ST_FNAC, dt: COL.DT_FNAC },
  ];
  const issues = [];
  steps.forEach(s => {
    const realSt = calcPayStatus(row[s.st], row[s.dt]);
    if (realSt === 'Cobrado — pendente' || realSt === 'Atrasado') {
      issues.push({ name: s.name, valor: parseFloat(row[s.vl])||0, status: realSt });
    }
  });
  return issues;
}
