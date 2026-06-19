/* ─── data-loader.js ───────────────────────────────────────────────
   Carrega dados reais da API e preenche a landing page dinamicamente.
──────────────────────────────────────────────────────────────────── */

const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const el  = id => document.getElementById(id);

/* ── META / INFOBAR ─────────────────────────────────────────────── */
async function carregarMeta() {
  try {
    const r = await fetch('/api/meta');
    if (!r.ok) return;
    const d = await r.json();

    const arrecadado = Number(d.total_arrecadado || 0);
    const meta       = Number(d.meta || 50000);
    const pct        = Number(d.percentual || 0);
    const doadores   = Number(d.total_doacoes_aprovadas || 0);

    const lancamento = new Date('2026-06-15');
    const dias = Math.max(1, Math.floor((Date.now() - lancamento) / 86400000));

    if (el('stat-arrecadado')) el('stat-arrecadado').textContent = fmt(arrecadado);
    if (el('stat-doadores'))   el('stat-doadores').textContent   = doadores;
    if (el('stat-dias'))       el('stat-dias').textContent       = dias;
    if (el('infobar-fill'))    el('infobar-fill').style.width    = Math.min(pct, 100) + '%';

    if (el('meta-valor')) el('meta-valor').textContent = fmt(arrecadado);
    if (el('meta-de'))    el('meta-de').innerHTML =
      `arrecadado de ${fmt(meta)} · <strong>${pct}%</strong>`;
    if (el('meta-fill')) {
      el('meta-fill').style.transition = 'width 1.4s ease-out';
      setTimeout(() => el('meta-fill').style.width = Math.min(pct, 100) + '%', 300);
    }
    if (el('mstat-doadores')) el('mstat-doadores').textContent = doadores;
    if (el('mstat-pct'))      el('mstat-pct').textContent      = pct + '%';
    if (el('mstat-dias'))     el('mstat-dias').textContent      = dias;

  } catch (e) { console.warn('meta:', e); }
}

/* ── CONTEÚDO & CONFIGURAÇÕES ───────────────────────────────────── */
async function carregarConteudo() {
  try {
    const r = await fetch('/api/conteudo');
    if (!r.ok) return;
    const { conteudo, configuracoes } = await r.json();

    // História
    const texto1 = conteudo?.historia_texto1?.corpo;
    const texto2 = conteudo?.historia_texto2?.corpo;
    const corpoCombinado = [texto1, texto2].filter(Boolean).join('\n\n');
    if (corpoCombinado && el('historia-corpo'))
      el('historia-corpo').textContent = corpoCombinado;

    const citacao = conteudo?.historia_citacao?.corpo;
    if (citacao && el('historia-citacao'))
      el('historia-citacao').textContent = citacao;

    const tituloHistoria = conteudo?.historia_titulo?.titulo;
    if (tituloHistoria && el('historia-titulo'))
      el('historia-titulo').textContent = tituloHistoria;

    // CTA final
    const ctaTitulo = conteudo?.cta_final_titulo?.titulo;
    const ctaTexto  = conteudo?.cta_final_texto?.corpo;
    if (ctaTitulo && el('cta-titulo')) el('cta-titulo').textContent = ctaTitulo;
    if (ctaTexto  && el('cta-texto'))  el('cta-texto').textContent  = ctaTexto;

    // Título principal da campanha (nav)
    if (configuracoes?.titulo_campanha && el('titulo-campanha'))
      el('titulo-campanha').textContent = configuracoes.titulo_campanha;

    // WhatsApp flutuante
    const wa = configuracoes?.whatsapp;
    if (wa && !document.getElementById('wa-float')) {
      const btn = document.createElement('a');
      btn.id = 'wa-float';
      btn.href = `https://wa.me/${wa}`;
      btn.target = '_blank';
      btn.title = 'Fale conosco no WhatsApp';
      btn.innerHTML = '💬';
      btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999;background:#25D366;color:white;border-radius:50%;width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 4px 16px rgba(0,0,0,0.2);text-decoration:none;';
      document.body.appendChild(btn);
    }

    // Instagram no footer
    const ig = configuracoes?.instagram;
    if (ig) {
      const footer = document.querySelector('.footer-links');
      if (footer && !footer.querySelector('[data-ig]')) {
        const a = document.createElement('a');
        a.href = ig; a.target = '_blank';
        a.textContent = 'Instagram'; a.dataset.ig = '1';
        footer.prepend(a);
      }
    }

  } catch (e) { console.warn('conteudo:', e); }
}

/* ── SLIDES DINÂMICOS ───────────────────────────────────────────── */
async function carregarSlides() {
  try {
    const r = await fetch('/api/slides');
    if (!r.ok) return;
    const slides = await r.json();
    if (!slides?.length) return;

    const track = document.getElementById('slidesTrack');
    const dotsEl = document.getElementById('sDots');
    if (!track || !dotsEl) return;

    // Gradientes alternados
    const gradientes = [
      'linear-gradient(135deg, rgba(26,91,217,0.82) 0%, rgba(26,91,217,0.38) 55%, rgba(0,0,0,0.20) 100%)',
      'linear-gradient(135deg, rgba(184,30,26,0.80) 0%, rgba(26,91,217,0.32) 60%, rgba(0,0,0,0.18) 100%)',
    ];

    track.innerHTML = slides.map((s, i) => {
      const bg = s.foto_url
        ? `background-image:url('${s.foto_url}');background-size:cover;background-position:center;`
        : `background-color:${s.cor_fundo || '#1a3560'};`;
      const overlay = gradientes[i % 2];
      return `
      <div class="slide${i === 0 ? ' active' : ''}">
        <div class="slide-bg" style="${bg}"></div>
        <div class="slide-overlay" style="background:${overlay}">
          <div class="slide-content">
            ${s.kicker ? `<span class="slide-kicker">${s.kicker}</span>` : ''}
            <h1 class="slide-title">${s.titulo}</h1>
            ${s.texto ? `<p class="slide-text">${s.texto}</p>` : ''}
            <div class="slide-ctas">
              ${s.btn1_texto ? `<a href="${s.btn1_link || '#doe'}" class="btn-sp">${s.btn1_texto}</a>` : ''}
              ${s.btn2_texto ? `<a href="${s.btn2_link || '#historia'}" class="btn-sg">${s.btn2_texto}</a>` : ''}
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    dotsEl.innerHTML = slides.map((_, i) =>
      `<div class="sdot${i === 0 ? ' active' : ''}" data-i="${i}"></div>`
    ).join('');

    // Reinicializa o slider JS
    iniciarSlider();

  } catch (e) { console.warn('slides:', e); }
}

/* ── SLIDER (reiniciável) ───────────────────────────────────────── */
function iniciarSlider() {
  const track  = document.getElementById('slidesTrack');
  const spfill = document.getElementById('spfill');
  const slideEls = () => document.querySelectorAll('.slide');
  const dotEls   = () => document.querySelectorAll('.sdot');
  let cur = 0, timer;

  function goTo(n) {
    const s = slideEls(), d = dotEls();
    s[cur]?.classList.remove('active');
    d[cur]?.classList.remove('active');
    cur = (n + s.length) % s.length;
    s[cur]?.classList.add('active');
    d[cur]?.classList.add('active');
    track.style.transform = `translateX(-${cur * 100}%)`;
    if (spfill) {
      spfill.classList.remove('run');
      void spfill.offsetWidth;
      spfill.classList.add('run');
    }
    clearInterval(timer);
    timer = setInterval(() => goTo(cur + 1), 5000);
  }

  document.getElementById('sNext')?.addEventListener('click', () => goTo(cur + 1));
  document.getElementById('sPrev')?.addEventListener('click', () => goTo(cur - 1));
  document.getElementById('sDots')?.addEventListener('click', e => {
    if (e.target.dataset.i !== undefined) goTo(+e.target.dataset.i);
  });

  // Touch swipe
  let tx = 0;
  track.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  track.addEventListener('touchend', e => {
    const d = tx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 50) goTo(cur + (d > 0 ? 1 : -1));
  });

  timer = setInterval(() => goTo(cur + 1), 5000);
}

/* ── INICIALIZAR ────────────────────────────────────────────────── */
Promise.all([
  carregarMeta(),
  carregarConteudo(),
  carregarSlides(),
]);

setInterval(carregarMeta, 60000);
