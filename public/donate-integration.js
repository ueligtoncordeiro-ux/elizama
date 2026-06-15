// ═══════════════════════════════════════════════════════════
// INTEGRAÇÃO FRONTEND — substitui a função doareRedir() existente
// na landing page (elizama-landing.html)
// ═══════════════════════════════════════════════════════════

// 1) Ler o valor selecionado nos botões de quantia
function getValorSelecionado() {
  const ativo = document.querySelector('.abtn.active');
  const custom = document.querySelector('.acustom').value.trim();

  if (custom) {
    const v = Number(custom.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (v > 0) return v;
  }
  if (ativo && ativo.textContent !== 'Outro') {
    return Number(ativo.textContent.replace('R$', '').trim());
  }
  return null;
}

// 2) Substituir a função antiga doareRedir()
async function doareRedir() {
  const valor = getValorSelecionado();
  if (!valor) {
    alert('Selecione ou informe um valor de doação válido.');
    return;
  }

  const recorrente = document.querySelector('.tgl').classList.contains('on');
  if (recorrente) {
    // Doação recorrente requer fluxo de assinatura (Preapproval API),
    // que usa tokenização de cartão via Mercado Pago Bricks — fora do
    // escopo deste MVP. Bloquear ou redirecionar para fluxo dedicado.
    alert('Doação recorrente ainda não disponível neste formulário. Em breve.');
    return;
  }

  const btn = document.querySelector('.btn-doe-card');
  const textoOriginal = btn.textContent;
  btn.textContent = 'Processando…';
  btn.disabled = true;

  try {
    const params = new URLSearchParams(window.location.search);
    const embaixador = params.get('emb') || null; // ex: ?emb=seulink

    const resp = await fetch('/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: valor, embaixador }),
    });

    if (!resp.ok) {
      const erro = await resp.json();
      throw new Error(erro.error || 'Erro ao iniciar pagamento.');
    }

    const data = await resp.json();

    // Use init_point em produção, sandbox_init_point durante testes
    // com credenciais TEST-
    window.location.href = data.init_point || data.sandbox_init_point;

  } catch (err) {
    console.error(err);
    alert('Não foi possível iniciar o pagamento. Tente novamente em alguns instantes.');
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
}
