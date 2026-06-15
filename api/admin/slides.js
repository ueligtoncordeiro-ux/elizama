import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (!await requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('slides').select('*').order('ordem');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { kicker, titulo, texto, btn1_texto, btn1_link, btn2_texto, btn2_link, cor_fundo, foto_url, ordem } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título obrigatório.' });
    const { data, error } = await supabase.from('slides').insert({ kicker, titulo, texto, btn1_texto, btn1_link, btn2_texto, btn2_link, cor_fundo, foto_url, ordem }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, ...campos } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const { data, error } = await supabase.from('slides').update(campos).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID obrigatório.' });
    const { error } = await supabase.from('slides').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
