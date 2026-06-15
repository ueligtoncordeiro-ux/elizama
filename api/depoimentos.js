import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });

  const { data, error } = await supabase
    .from('depoimentos')
    .select('id, nome, texto, foto_url, ordem')
    .eq('aprovado', true)
    .order('ordem')
    .order('criado_em', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  return res.status(200).json(data);
}
