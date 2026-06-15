import { MercadoPagoConfig, Payment } from 'mercadopago';
import crypto from 'crypto';
import { atualizarDoacao } from '../lib/supabase.js';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

function validarAssinatura(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
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

      const status = payment.status;
      const valor = payment.transaction_amount;
      const externalRef = payment.external_reference;
      const mpPaymentId = String(data.id);
      const metodo = payment.payment_type_id || null;
      const embaixador = payment.metadata?.embaixador || null;

      console.log('Pagamento recebido:', { externalRef, status, valor, metodo, embaixador });

      await atualizarDoacao({ externalRef, status, valor, mpPaymentId, metodo, embaixador });
    }

    return res.status(200).send('OK');

  } catch (err) {
    console.error('Erro no webhook MP:', err);
    return res.status(200).send('OK');
  }
}
