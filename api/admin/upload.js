import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!await requireAdmin(req, res)) return;

  const { nome, tipo, dados_base64 } = req.body;
  if (!nome || !tipo || !dados_base64) {
    return res.status(400).json({ error: 'nome, tipo e dados_base64 são obrigatórios.' });
  }

  const buffer = Buffer.from(dados_base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  const caminho = `${Date.now()}-${nome.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;

  const { error } = await supabase.storage
    .from('elizama-media')
    .upload(caminho, buffer, { contentType: tipo, upsert: false });

  if (error) return res.status(500).json({ error: error.message });

  const { data: { publicUrl } } = supabase.storage
    .from('elizama-media')
    .getPublicUrl(caminho);

  return res.status(200).json({ url: publicUrl });
}
