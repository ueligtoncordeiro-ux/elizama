// /api/create-preference.js
//
// Recebe { amount, donorName?, donorEmail?, embaixador? } via POST
// Cria uma Preference no Mercado Pago (Checkout Pro) e retorna init_point
// para redirecionamento do doador.
//
// IMPORTANTE: este endpoint roda no servidor (Vercel Function).
// O Access Token NUNCA é exposto ao navegador.

import { MercadoPagoConfig, Preference } from 'mercadopago';
import { randomUUID } from 'crypto';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { amount, donorName, donorEmail, embaixador } = req.body;

    // ── Validação básica ──────────────────────────────
    const valor = Number(amount);
    if (!valor || valor < 5) {
      return res.status(400).json({ error: 'Valor da doação inválido. Mínimo R$ 5,00.' });
    }
    if (valor > 50000) {
      return res.status(400).json({ error: 'Valor acima do limite permitido para este formulário.' });
    }

    // Referência única para rastrear esta doação (usada no webhook)
    const externalReference = randomUUID();

    // ── (Opcional, recomendado) Gravar doação "pendente" no Supabase ──
    // await registrarDoacaoPendente({ externalReference, valor, donorEmail, embaixador });
    // Ver supabase-schema.sql + lib/supabase.js neste projeto.

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: 'doacao-elizama',
            title: 'Doação — Campanha Elizama',
            description: 'Eu amo, tu amas, Elizama — Movimento de apoio',
            quantity: 1,
            unit_price: valor,
            currency_id: 'BRL',
          },
        ],
        payer: {
          name: donorName || undefined,
          email: donorEmail || undefined,
        },
        back_urls: {
          success: `${SITE_URL}/sucesso.html`,
          pending: `${SITE_URL}/pendente.html`,
          failure: `${SITE_URL}/erro.html`,
        },
        auto_return: 'approved',
        notification_url: `${SITE_URL}/api/webhook`,
        external_reference: externalReference,
        statement_descriptor: 'CAMPANHA ELIZAMA',
        metadata: {
          embaixador: embaixador || null,
        },
      },
    });

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,           // produção
      sandbox_init_point: result.sandbox_init_point, // testes
      external_reference: externalReference,
    });

  } catch (err) {
    console.error('Erro ao criar preferência MP:', err);
    return res.status(500).json({ error: 'Falha ao iniciar pagamento. Tente novamente.' });
  }
}
