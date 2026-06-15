import { buscarMeta } from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Use GET.' });
  }

  try {
    const meta = await buscarMeta();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json(meta);
  } catch (err) {
    console.error('Erro ao buscar meta:', err);
    return res.status(500).json({ error: 'Não foi possível buscar a meta.' });
  }
}
