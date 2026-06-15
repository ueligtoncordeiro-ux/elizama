import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios.' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) return res.status(401).json({ error: 'Credenciais inválidas.' });

  return res.status(200).json({
    token: data.session.access_token,
    expira_em: data.session.expires_at,
  });
}
