// /api/webhook.js
//
// Endpoint chamado pelo Mercado Pago a cada mudança de status de pagamento.
// Configurar a URL https://SEU_DOMINIO/api/webhook no painel:
// Suas integrações > [sua aplicação] > Webhooks > Configurar notificações
//
// Eventos relevantes: "payment" (criado/atualizado)

import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ── Validação de assinatura (x-signature) ──────────────────────────
// Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks
// Confirma que a notificação realmente vem do Mercado Pago.
function validarAssinatura(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    // Sem secret configurado = validação desabilitada (apenas para desenvolvimento)
    console.warn('MP_WEBHOOK_SECRET não configurado — validação de assinatura ignorada.');
    return true;
  }

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  if (!xSignature || !xRequestId) return false;

  const parts = xSignature.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k.trim()] = v?.trim();
    return acc;
  }, {});

  const dataId = req.body?.data?.id || req.query['data.id'] || '';
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;

  const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return hmac === parts.v1;
}

export default async function handler(req, res) {
  // Mercado Pago espera resposta 200/201 rápida — qualquer outra coisa gera reenvio.
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    if (!validarAssinatura(req)) {
      console.warn('Assinatura inválida no webhook MP.');
      return res.status(401).send('Assinatura inválida');
    }

    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: data.id });

      const status = payment.status;               // approved | pending | rejected | etc.
      const valor = payment.transaction_amount;
      const externalRef = payment.external_reference;
      const embaixador = payment.metadata?.embaixador;

      console.log('Pagamento recebido:', { externalRef, status, valor, embaixador });

      // ── (Opcional, recomendado) Atualizar registro no Supabase ──
      // await atualizarDoacao({ externalRef, status, valor, mpPaymentId: data.id, embaixador });
      //
      // - status === 'approved'  → marcar doação como confirmada, somar à meta
      // - status === 'pending'   → manter como aguardando (ex.: boleto)
      // - status === 'rejected'  → marcar como falha
    }

    return res.status(200).send('OK');

  } catch (err) {
    console.error('Erro no webhook MP:', err);
    // Retornar 200 mesmo em erro evita reenvios infinitos durante debug;
    // ajuste para 500 quando a persistência estiver implementada e estável.
    return res.status(200).send('OK');
  }
}
