/* ─── data-loader.js ───────────────────────────────────────────────
   Carrega dados reais da API e preenche a landing page dinamicamente.
   Incluso antes de </body> no index.html
──────────────────────────────────────────────────────────────────── */

const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

async function carregarMeta() {
  try {
    const r = await fetch('/api/meta');
    if (!r.ok) return;
    const d = await r.json();

    const arrecadado = Number(d.total_arrecadado || 0);
    const meta       = Number(d.meta || 50000);
    const pct        = Number(d.percentual || 0);
    const doadores   = Number(d.total_doacoes_aprovadas || 0);

    // Infobar
    const el = id => document.getElementById(id);
    if (el('stat-arrecadado')) el('stat-arrecadado').textContent = fmt(arrecadado);
    if (el('stat-doadores'))   el('stat-doadores').textContent   = doadores;
    if (el('infobar-fill'))    el('infobar-fill').style.width    = Math.min(pct, 100) + '%';

    // Dias de campanha (a partir de 15/06/2026 — data de lançamento)
    const lancamento = new Date('2026-06-15');
    const dias = Math.floor((Date.now() - lancamento) / 86400000);
    if (el('stat-dias')) el('stat-dias').textContent = dias > 0 ? dias : 1;

    // Crowdfunding card
    if (el('meta-valor')) el('meta-valor').textContent = fmt(arrecadado);
    if (el('meta-de'))    el('meta-de').innerHTML =
      `arrecadado de ${fmt(meta)} · <strong>${pct}%</strong>`;
    if (el('meta-fill'))  {
      el('meta-fill').style.transition = 'width 1.4s ease-out';
      setTimeout(() => el('meta-fill').style.width = Math.min(pct, 100) + '%', 300);
    }
    if (el('mstat-doadores')) el('mstat-doadores').textContent = doadores;
    if (el('mstat-pct'))      el('mstat-pct').textContent      = pct + '%';

    // Dias restantes (meta sem data definida = mostra dias de campanha)
    if (el('mstat-dias')) el('mstat-dias').textContent = dias > 0 ? dias : 1;

  } catch (e) { console.warn('meta:', e); }
}

async function carregarConteudo() {
  try {
    const r = await fetch('/api/conteudo');
    if (!r.ok) return;
    const { conteudo, configuracoes } = await r.json();

    const el = id => document.getElementById(id);

    if (conteudo?.historia_corpo?.corpo && el('historia-corpo'))
      el('historia-corpo').textContent = conteudo.historia_corpo.corpo;

    if (conteudo?.historia_citacao?.corpo && el('historia-citacao'))
      el('historia-citacao').textContent = conteudo.historia_citacao.corpo;

    // Rodapé com redes sociais
    if (configuracoes?.instagram) {
      const ig = document.querySelector('.footer-links');
      if (ig && !ig.querySelector('[data-ig]')) {
        const a = document.createElement('a');
        a.href = configuracoes.instagram;
        a.target = '_blank';
        a.textContent = 'Instagram';
        a.dataset.ig = '1';
        ig.prepend(a);
      }
    }

    // WhatsApp flutuante
    if (configuracoes?.whatsapp) {
      const wa = document.createElement('a');
      wa.href = `https://wa.me/${configuracoes.whatsapp}`;
      wa.target = '_blank';
      wa.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999;background:#25D366;color:white;border-radius:50%;width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 4px 16px rgba(0,0,0,0.2);text-decoration:none;';
      wa.innerHTML = '💬';
      wa.title = 'Fale conosco no WhatsApp';
      document.body.appendChild(wa);
    }

  } catch (e) { console.warn('conteudo:', e); }
}

async function carregarEmbaixadores() {
  try {
    // Ranking público via vw_ranking_embaixadores — chamado via meta
    // (embaixadores ativos ficam no admin; contagem pública vem da meta)
  } catch (e) { console.warn('embaixadores:', e); }
}

// Inicializar
Promise.all([carregarMeta(), carregarConteudo()]);

// Atualizar meta a cada 60s (tempo real suave)
setInterval(carregarMeta, 60000);
