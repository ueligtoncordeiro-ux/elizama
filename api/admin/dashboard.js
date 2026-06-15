import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
  if (!await requireAdmin(req, res)) return;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const semana = new Date(hoje);
  semana.setDate(semana.getDate() - 7);

  const [meta, porDia, ranking, recentes, porStatus] = await Promise.all([
    supabase.from('vw_meta_campanha').select('*').single(),
    supabase.from('vw_doacoes_por_dia').select('*'),
    supabase.from('vw_ranking_embaixadores').select('*').limit(5),
    supabase.from('doacoes').select('*').order('criado_em', { ascending: false }).limit(10),
    supabase.from('doacoes').select('status').then(({ data }) => {
      const counts = { approved: 0, pending: 0, rejected: 0 };
      data?.forEach(d => { if (counts[d.status] !== undefined) counts[d.status]++; });
      return { data: counts };
    }),
  ]);

  return res.status(200).json({
    meta: meta.data,
    doacoes_por_dia: porDia.data,
    top_embaixadores: ranking.data,
    recentes: recentes.data,
    por_status: porStatus.data,
  });
}
