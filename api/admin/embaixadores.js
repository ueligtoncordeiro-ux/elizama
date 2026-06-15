import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (!await requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('vw_ranking_embaixadores')
      .select('*');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { nome, slug, foto_url, meta_propria } = req.body;
    if (!nome || !slug) return res.status(400).json({ error: 'Nome e slug obrigatórios.' });
    const { data, error } = await supabase.from('embaixadores').insert({ nome, slug, foto_url, meta_propria }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...campos } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const { data, error } = await supabase.from('embaixadores').update(campos).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const { error } = await supabase.from('embaixadores').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
