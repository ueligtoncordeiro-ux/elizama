import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Grava uma doação como "pending" assim que a preference é criada.
 */
export async function registrarDoacaoPendente({ externalReference, valor, donorName, donorEmail, embaixador }) {
  const { error } = await supabase.from('doacoes').insert({
    external_ref: externalReference,
    valor,
    status: 'pending',
    doador_nome: donorName || null,
    doador_email: donorEmail || null,
    embaixador: embaixador || null,
  });

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
}

/**
 * Atualiza status da doação quando o webhook chega.
 */
export async function atualizarDoacao({ externalRef, status, valor, mpPaymentId, metodo, embaixador }) {
  const { error } = await supabase
    .from('doacoes')
    .update({
      status,
      mp_payment_id: mpPaymentId,
      metodo: metodo || null,
      embaixador: embaixador || null,
      ...(valor ? { valor } : {}),
    })
    .eq('external_ref', externalRef);

  if (error) throw new Error(`Supabase update error: ${error.message}`);
}

/**
 * Retorna total arrecadado e número de doações aprovadas.
 */
export async function buscarMeta() {
  const { data, error } = await supabase.from('vw_meta_campanha').select('*').single();
  if (error) throw new Error(`Supabase meta error: ${error.message}`);
  return data;
}
