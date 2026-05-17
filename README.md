# SKZ Tracker

Web app para gestão de compras e coleção Stray Kids.
Conectado ao Google Sheets via API — gratuito, privado, sem dependências externas.

---

## Configuração inicial (fazer 1x só)

### 1. Google Cloud Console

1. Acesse https://console.cloud.google.com
2. Clique em **"Select a project"** → **"New Project"**
   - Nome: `skz-tracker` (ou o que preferir)
   - Clique em **Create**

3. No menu lateral: **"APIs & Services"** → **"Library"**
   - Busque **"Google Sheets API"** → Enable
   - Busque **"Google Drive API"** → Enable

4. **"APIs & Services"** → **"Credentials"**
   - **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
   - Application type: **Web application**
   - Name: `SKZ Tracker`
   - Authorized JavaScript origins:
     ```
     https://SEU_USUARIO.github.io
     http://localhost:3000
     ```
   - Clique em **Create**
   - **Copie o Client ID** (formato: `xxxx.apps.googleusercontent.com`)

5. Ainda em Credentials → **"OAuth consent screen"**
   - User Type: **External**
   - App name: `SKZ Tracker`
   - User support email: seu email
   - Salve e publique

### 2. Configure o app

Abra o arquivo `js/auth.js` e preencha:

```js
const CONFIG = {
  CLIENT_ID: 'COLE_SEU_CLIENT_ID_AQUI.apps.googleusercontent.com',
  SHEET_ID:  'COLE_O_ID_DA_SUA_PLANILHA_AQUI',
  // ...
};
```

O **SHEET_ID** está na URL da sua planilha:
```
https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
```

### 3. GitHub Pages

1. Crie um repositório no GitHub (ex: `skz-tracker`)
2. Faça upload de todos os arquivos deste projeto
3. Nas configurações do repositório: **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** → **/ (root)**
   - Salve

Seu app estará em: `https://SEU_USUARIO.github.io/skz-tracker`

### 4. Acesso local para testes

Para testar antes de publicar, use um servidor local simples:

```bash
# Python 3
python -m http.server 3000

# Node.js
npx serve .
```

Acesse: `http://localhost:3000`

---

## Estrutura de arquivos

```
skz-tracker/
├── index.html              # Dashboard (tela principal)
├── css/
│   ├── tokens.css          # Design tokens (cores, tipografia)
│   ├── base.css            # Componentes base
│   └── dashboard.css       # Estilos do dashboard
├── js/
│   ├── auth.js             # Google OAuth + Sheets API
│   └── dashboard.js        # Lógica do dashboard
└── pages/
    ├── items.html          # Lista de itens (fase 2)
    ├── item-detail.html    # Detalhe do item (fase 2)
    ├── portfolio.html      # Portfólio público (fase 2)
    └── communities.html    # Comunidades (fase 2)
```

---

## Design System

- **Paleta:** Crows & Roses (grafite neutro + rosa antigo)
- **Tipografia:** Playfair Display (títulos) + DM Sans (interface) + Courier New (números)
- **Ícones:** Tabler Icons (outline)

---

## Segurança

- Login via Google OAuth 2.0 — só sua conta acessa os dados
- O app não armazena nenhuma informação além do token de sessão (localStorage)
- Os dados ficam 100% no seu Google Sheets
- Para modo visualização pública (fase 2): chave de API read-only separada
