/**
 * Roteador único para todos os endpoints do admin.
 * Rota via query param: /api/admin?mod=login&acao=...
 *
 * Módulos: login | dashboard | doacoes | embaixadores |
 *          slides | conteudo | depoimentos | alternativas | upload
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Auth ────────────────────────────────────────────────────────
async function requireAdmin(req, res) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) { res.status(401).json({ error: 'Não autorizado.' }); return false; }
  const { data: { user }, error } = await supabase.auth.getUser(auth.slice(7));
  if (error || !user) { res.status(401).json({ error: 'Token inválido ou expirado.' }); return false; }
  return user;
}

// ─── Módulos ─────────────────────────────────────────────────────

async function modLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha obrigatórios.' });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return res.status(401).json({ error: 'Credenciais inválidas.' });
  return res.status(200).json({ token: data.session.access_token, expira_em: data.session.expires_at });
}

async function modDashboard(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
  if (!await requireAdmin(req, res)) return;
  const [meta, porDia, ranking, recentes] = await Promise.all([
    supabase.from('vw_meta_campanha').select('*').single(),
    supabase.from('vw_doacoes_por_dia').select('*'),
    supabase.from('vw_ranking_embaixadores').select('*').limit(5),
    supabase.from('doacoes').select('*').order('criado_em', { ascending: false }).limit(10),
  ]);
  const { data: todas } = await supabase.from('doacoes').select('status');
  const por_status = { approved: 0, pending: 0, rejected: 0 };
  todas?.forEach(d => { if (por_status[d.status] !== undefined) por_status[d.status]++; });
  return res.status(200).json({ meta: meta.data, doacoes_por_dia: porDia.data, top_embaixadores: ranking.data, recentes: recentes.data, por_status });
}

async function modDoacoes(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET.' });
  if (!await requireAdmin(req, res)) return;
  const { status, embaixador, de, ate, pagina = 1, por_pagina = 50 } = req.query;
  const offset = (Number(pagina) - 1) * Number(por_pagina);
  let q = supabase.from('doacoes').select('*', { count: 'exact' }).order('criado_em', { ascending: false }).range(offset, offset + Number(por_pagina) - 1);
  if (status)     q = q.eq('status', status);
  if (embaixador) q = q.eq('embaixador', embaixador);
  if (de)         q = q.gte('criado_em', de);
  if (ate)        q = q.lte('criado_em', ate);
  const { data, error, count } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data, total: count, pagina: Number(pagina), por_pagina: Number(por_pagina) });
}

async function modEmbaixadores(req, res) {
  if (!await requireAdmin(req, res)) return;
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('vw_ranking_embaixadores').select('*');
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
    const { error } = await supabase.from('embaixadores').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Método não permitido.' });
}

async function modSlides(req, res) {
  if (!await requireAdmin(req, res)) return;
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('slides').select('*').order('ordem');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { titulo, ...resto } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título obrigatório.' });
    const { data, error } = await supabase.from('slides').insert({ titulo, ...resto }).select().single();
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
    const { error } = await supabase.from('slides').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Método não permitido.' });
}

async function modConteudo(req, res) {
  if (!await requireAdmin(req, res)) return;
  if (req.method === 'GET') {
    const [cnt, cfg] = await Promise.all([
      supabase.from('conteudo').select('*').order('secao'),
      supabase.from('configuracoes').select('*').order('chave'),
    ]);
    return res.status(200).json({ conteudo: cnt.data, configuracoes: cfg.data });
  }
  if (req.method === 'PUT') {
    const { tipo, chave, ...campos } = req.body;
    if (!chave) return res.status(400).json({ error: 'Chave obrigatória.' });
    const tabela = tipo === 'configuracao' ? 'configuracoes' : 'conteudo';
    const { data, error } = await supabase.from(tabela).update({ ...campos, atualizado_em: new Date().toISOString() }).eq('chave', chave).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  return res.status(405).json({ error: 'Método não permitido.' });
}

async function modDepoimentos(req, res) {
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
    const { error } = await supabase.from('depoimentos').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Método não permitido.' });
}

async function modAlternativas(req, res) {
  if (!await requireAdmin(req, res)) return;
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('alternativas').select('*').order('tipo').order('criado_em', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const { tipo, titulo, ...resto } = req.body;
    if (!tipo || !titulo) return res.status(400).json({ error: 'Tipo e título obrigatórios.' });
    const { data, error } = await supabase.from('alternativas').insert({ tipo, titulo, ...resto }).select().single();
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
    const { error } = await supabase.from('alternativas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Método não permitido.' });
}

async function modUpload(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!await requireAdmin(req, res)) return;
  const { nome, tipo, dados_base64 } = req.body;
  if (!nome || !tipo || !dados_base64) return res.status(400).json({ error: 'nome, tipo e dados_base64 são obrigatórios.' });
  const buffer = Buffer.from(dados_base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  const caminho = `${Date.now()}-${nome.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const { error } = await supabase.storage.from('elizama-media').upload(caminho, buffer, { contentType: tipo, upsert: false });
  if (error) return res.status(500).json({ error: error.message });
  const { data: { publicUrl } } = supabase.storage.from('elizama-media').getPublicUrl(caminho);
  return res.status(200).json({ url: publicUrl });
}

// Upload grande (vídeo): gera URL assinada para upload direto browser→Supabase
async function modUploadUrl(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!await requireAdmin(req, res)) return;
  const { nome } = req.body;
  if (!nome) return res.status(400).json({ error: 'nome obrigatório.' });
  const caminho = `videos/${Date.now()}-${nome.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const { data, error } = await supabase.storage.from('elizama-media').createSignedUploadUrl(caminho);
  if (error) return res.status(500).json({ error: error.message });
  const { data: { publicUrl } } = supabase.storage.from('elizama-media').getPublicUrl(caminho);
  return res.status(200).json({ signedUrl: data.signedUrl, publicUrl });
}

// ─── Router principal ─────────────────────────────────────────────
const modulos = {
  login:        modLogin,
  dashboard:    modDashboard,
  doacoes:      modDoacoes,
  embaixadores: modEmbaixadores,
  slides:       modSlides,
  conteudo:     modConteudo,
  depoimentos:  modDepoimentos,
  alternativas: modAlternativas,
  upload:       modUpload,
  'upload-url': modUploadUrl,
};

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { mod } = req.query;
  const fn = modulos[mod];
  if (!fn) return res.status(404).json({ error: `Módulo "${mod}" não encontrado.` });

  return fn(req, res);
}
