import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (!await requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const [conteudo, cfg] = await Promise.all([
      supabase.from('conteudo').select('*').order('secao'),
      supabase.from('configuracoes').select('*').order('chave'),
    ]);
    return res.status(200).json({ conteudo: conteudo.data, configuracoes: cfg.data });
  }

  if (req.method === 'PUT') {
    const { tipo, chave, ...campos } = req.body;
    if (!chave) return res.status(400).json({ error: 'Chave obrigatória.' });

    const tabela = tipo === 'configuracao' ? 'configuracoes' : 'conteudo';
    const campo_pk = tipo === 'configuracao' ? 'chave' : 'chave';

    const { data, error } = await supabase
      .from(tabela)
      .update({ ...campos, atualizado_em: new Date().toISOString() })
      .eq(campo_pk, chave)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Método não permitido.' });
}
