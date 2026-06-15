import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });

  const [conteudo, configuracoes] = await Promise.all([
    supabase.from('conteudo').select('*'),
    supabase.from('configuracoes').select('*'),
  ]);

  if (conteudo.error) return res.status(500).json({ error: conteudo.error.message });
  if (configuracoes.error) return res.status(500).json({ error: configuracoes.error.message });

  const cfg = Object.fromEntries(configuracoes.data.map(r => [r.chave, r.valor]));
  const cnt = Object.fromEntries(conteudo.data.map(r => [r.chave, r]));

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  return res.status(200).json({ conteudo: cnt, configuracoes: cfg });
}
