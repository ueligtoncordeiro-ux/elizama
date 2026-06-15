/* Módulo compartilhado de autenticação e utilitários do painel admin */

const API = '/api/admin';

export function getToken() { return sessionStorage.getItem('elizama_token'); }
export function setToken(t) { sessionStorage.setItem('elizama_token', t); }
export function clearToken() { sessionStorage.removeItem('elizama_token'); }

export function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` };
}

export function guardAuth() {
  if (!getToken()) { window.location.href = '/admin/login.html'; return false; }
  return true;
}

export async function api(mod, method = 'GET', body = null, extra = '') {
  const opts = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${API}?mod=${mod}${extra}`, opts);
  if (r.status === 401) { clearToken(); window.location.href = '/admin/login.html'; return null; }
  return r.json();
}

export function fmt(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

export function dataFmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function badge(status) {
  const map = {
    approved:  ['#D1FAE5','#065F46','Aprovada'],
    pending:   ['#FEF3C7','#92400E','Pendente'],
    rejected:  ['#FEE2E2','#991B1B','Recusada'],
    ativo:     ['#D1FAE5','#065F46','Ativo'],
    em_breve:  ['#DBEAFE','#1E40AF','Em breve'],
    encerrado: ['#F3F4F6','#374151','Encerrado'],
  };
  const [bg, color, label] = map[status] || ['#F3F4F6','#374151', status];
  return `<span style="background:${bg};color:${color};padding:2px 10px;border-radius:100px;font-size:0.75rem;font-weight:600;">${label}</span>`;
}

export function toast(msg, ok = true) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;background:${ok?'#065F46':'#991B1B'};color:white;padding:0.75rem 1.25rem;border-radius:12px;font-size:0.875rem;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:fadeIn .2s ease`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

export const NAV = [
  { href: '/admin/',               icon: '📊', label: 'Dashboard'     },
  { href: '/admin/doacoes.html',   icon: '💳', label: 'Doações'       },
  { href: '/admin/embaixadores.html', icon: '📣', label: 'Embaixadores' },
  { href: '/admin/slides.html',    icon: '🖼️', label: 'Slides'        },
  { href: '/admin/conteudo.html',  icon: '✏️', label: 'Conteúdo'      },
  { href: '/admin/depoimentos.html', icon: '💬', label: 'Depoimentos'  },
  { href: '/admin/alternativas.html', icon: '🎟️', label: 'Rifas/Eventos'},
];

export function renderLayout(titulo, conteudo) {
  const path = window.location.pathname;
  const navHtml = NAV.map(n =>
    `<a href="${n.href}" class="nav-item${path === n.href || (n.href !== '/admin/' && path.startsWith(n.href.replace('.html',''))) ? ' active' : ''}">${n.icon} ${n.label}</a>`
  ).join('');

  document.body.innerHTML = `
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;background:#F8F9FB;color:#1a1a2e;display:flex;min-height:100vh}
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
    .sidebar{width:220px;background:#1A3560;min-height:100vh;padding:1.5rem 0;display:flex;flex-direction:column;flex-shrink:0}
    .sidebar-logo{color:white;font-weight:700;font-size:1.2rem;padding:0 1.25rem 1.5rem;border-bottom:1px solid rgba(255,255,255,0.1)}
    .sidebar-logo span{color:#E07070}
    .nav-item{display:flex;align-items:center;gap:0.6rem;padding:0.7rem 1.25rem;color:rgba(255,255,255,0.7);text-decoration:none;font-size:0.875rem;font-weight:500;transition:all .15s;border-left:3px solid transparent}
    .nav-item:hover{background:rgba(255,255,255,0.08);color:white}
    .nav-item.active{background:rgba(255,255,255,0.12);color:white;border-left-color:#E07070}
    .nav-logout{margin-top:auto;padding:0.7rem 1.25rem;color:rgba(255,255,255,0.4);font-size:0.8rem;cursor:pointer;border:none;background:none;text-align:left;width:100%}
    .nav-logout:hover{color:white}
    .main{flex:1;display:flex;flex-direction:column;overflow:hidden}
    .topbar{background:white;border-bottom:1px solid #E5E7EB;padding:1rem 1.5rem;display:flex;align-items:center;justify-content:space-between}
    .topbar h1{font-size:1.1rem;font-weight:600}
    .page-body{padding:1.5rem;overflow-y:auto;flex:1}
    .card{background:white;border-radius:16px;padding:1.5rem;border:1px solid #E5E7EB;margin-bottom:1rem}
    .card-title{font-weight:600;font-size:0.9rem;color:#6B7280;margin-bottom:1rem;text-transform:uppercase;letter-spacing:.05em}
    .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem}
    .stat-card{background:white;border-radius:16px;padding:1.25rem;border:1px solid #E5E7EB}
    .stat-val{font-size:1.8rem;font-weight:700;color:#1A3560;margin-bottom:0.25rem}
    .stat-lbl{font-size:0.8rem;color:#9CA3AF;font-weight:500}
    table{width:100%;border-collapse:collapse;font-size:0.875rem}
    th{text-align:left;padding:0.6rem 0.75rem;color:#6B7280;font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #E5E7EB}
    td{padding:0.75rem;border-bottom:1px solid #F3F4F6;vertical-align:middle}
    tr:last-child td{border:none}
    tr:hover td{background:#FAFAFA}
    .btn{padding:0.5rem 1rem;border-radius:8px;border:none;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all .15s}
    .btn-primary{background:#1A3560;color:white}.btn-primary:hover{background:#0f2340}
    .btn-danger{background:#FEE2E2;color:#991B1B}.btn-danger:hover{background:#FECACA}
    .btn-success{background:#D1FAE5;color:#065F46}.btn-success:hover{background:#A7F3D0}
    .btn-sm{padding:0.3rem 0.7rem;font-size:0.75rem}
    input,textarea,select{width:100%;padding:0.6rem 0.8rem;border:1px solid #E5E7EB;border-radius:8px;font-size:0.875rem;font-family:inherit;outline:none;transition:border .15s}
    input:focus,textarea:focus,select:focus{border-color:#1A3560}
    label{font-size:0.8rem;font-weight:600;color:#374151;margin-bottom:0.3rem;display:block}
    .form-group{margin-bottom:1rem}
    .actions{display:flex;gap:0.5rem}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100;display:flex;align-items:center;justify-content:center}
    .modal{background:white;border-radius:20px;padding:2rem;width:min(520px,94vw);max-height:90vh;overflow-y:auto}
    .modal h3{font-size:1.1rem;font-weight:700;margin-bottom:1.25rem}
    .modal-close{float:right;background:none;border:none;font-size:1.2rem;cursor:pointer;color:#9CA3AF}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .empty{text-align:center;padding:3rem;color:#9CA3AF;font-size:0.9rem}
    .search-bar{display:flex;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap}
    .search-bar input,.search-bar select{width:auto;flex:1;min-width:140px}
    .pagination{display:flex;gap:0.5rem;justify-content:center;margin-top:1rem}
    .pagination button{padding:0.4rem 0.9rem;border:1px solid #E5E7EB;border-radius:8px;background:white;cursor:pointer;font-size:0.8rem}
    .pagination button.active{background:#1A3560;color:white;border-color:#1A3560}
    .progress-bar{height:8px;background:#E5E7EB;border-radius:100px;overflow:hidden;margin-top:0.5rem}
    .progress-fill{height:100%;background:linear-gradient(90deg,#1A3560,#C0392B);border-radius:100px;transition:width 1s ease}
  </style>
  <aside class="sidebar">
    <div class="sidebar-logo">ELIZ<span>AMA</span><div style="font-size:0.65rem;font-weight:400;opacity:.5;margin-top:2px">Painel Admin</div></div>
    ${navHtml}
    <button class="nav-logout" onclick="logout()">⎋ Sair</button>
  </aside>
  <div class="main">
    <div class="topbar"><h1>${titulo}</h1><span style="font-size:0.8rem;color:#9CA3AF;">elizama-pied.vercel.app</span></div>
    <div class="page-body" id="pageBody">${conteudo}</div>
  </div>
  <script>
    function logout(){ sessionStorage.removeItem('elizama_token'); window.location.href='/admin/login.html'; }
  </script>`;
}
