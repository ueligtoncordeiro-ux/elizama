import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (!await requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('alternativas').select('*').order('tipo').order('criado_em', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { tipo, titulo, descricao, valor, vagas_total, status, link_externo, imagem_url, data_evento } = req.body;
    if (!tipo || !titulo) return res.status(400).json({ error: 'Tipo e título obrigatórios.' });
    const { data, error } = await supabase.from('alternativas').insert({ tipo, titulo, descricao, valor, vagas_total, status, link_externo, imagem_url, data_evento }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...campos } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const { data, error } = await supabase.from('alternativas').update(campos).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const { error } = await supabase.from('alternativas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
