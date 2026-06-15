import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
  if (!await requireAdmin(req, res)) return;

  const { status, embaixador, de, ate, pagina = 1, por_pagina = 50 } = req.query;
  const offset = (Number(pagina) - 1) * Number(por_pagina);

  let query = supabase
    .from('doacoes')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    .range(offset, offset + Number(por_pagina) - 1);

  if (status)      query = query.eq('status', status);
  if (embaixador)  query = query.eq('embaixador', embaixador);
  if (de)          query = query.gte('criado_em', de);
  if (ate)         query = query.lte('criado_em', ate);

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ data, total: count, pagina: Number(pagina), por_pagina: Number(por_pagina) });
}
