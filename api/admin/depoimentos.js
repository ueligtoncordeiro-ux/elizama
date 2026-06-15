import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (!await requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('depoimentos').select('*').order('aprovado').order('criado_em', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { nome, texto, foto_url, aprovado = false, ordem = 0 } = req.body;
    if (!nome || !texto) return res.status(400).json({ error: 'Nome e texto obrigatórios.' });
    const { data, error } = await supabase.from('depoimentos').insert({ nome, texto, foto_url, aprovado, ordem }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...campos } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const { data, error } = await supabase.from('depoimentos').update(campos).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const { error } = await supabase.from('depoimentos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
