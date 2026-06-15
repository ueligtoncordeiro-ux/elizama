-- ═══════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 002 — Schema completo da Campanha Elizama
-- Executar no SQL Editor do Supabase APÓS a migração 001 (schema básico)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- FUNÇÃO AUXILIAR: atualizado_em automático
-- (já existe se rodou a migração 001, recriamos com IF NOT EXISTS)
-- ─────────────────────────────────────────────
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;


-- ─────────────────────────────────────────────
-- TABELA: configuracoes
-- Valores globais da campanha (meta, PIX, redes sociais)
-- ─────────────────────────────────────────────
create table if not exists configuracoes (
  chave       text primary key,
  valor       text,
  descricao   text,
  atualizado_em timestamptz not null default now()
);

insert into configuracoes (chave, valor, descricao) values
  ('meta_campanha',     '50000',          'Meta de arrecadação em reais'),
  ('pix_chave',         '',               'Chave PIX do beneficiário'),
  ('pix_nome',          'Elizama',        'Nome do beneficiário no PIX'),
  ('instagram',         '',               'URL do Instagram'),
  ('whatsapp',          '',               'Número WhatsApp com DDI (ex: 5565999999999)'),
  ('titulo_campanha',   'Eu amo, tu amas, Elizama', 'Título principal da campanha'),
  ('descricao_campanha','Uma comunidade unida em torno de uma pessoa especial.', 'Subtítulo da campanha')
on conflict (chave) do nothing;

alter table configuracoes enable row level security;
create policy "leitura publica configuracoes"
  on configuracoes for select using (true);


-- ─────────────────────────────────────────────
-- TABELA: slides
-- Slides do hero da landing page
-- ─────────────────────────────────────────────
create table if not exists slides (
  id            uuid primary key default gen_random_uuid(),
  ordem         int not null default 0,
  ativo         boolean not null default true,
  kicker        text,
  titulo        text not null,
  texto         text,
  btn1_texto    text,
  btn1_link     text,
  btn2_texto    text,
  btn2_link     text,
  cor_fundo     text default '#1a3560',
  foto_url      text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger trg_slides_atualizado
  before update on slides
  for each row execute function set_atualizado_em();

insert into slides (ordem, kicker, titulo, texto, btn1_texto, btn1_link, btn2_texto, btn2_link, cor_fundo) values
  (1, 'Movimento em Apoio a Elizama',      'Eu amo, tu amas, ELIZAMA.',        'Uma comunidade unida em torno de uma pessoa especial. Cada ato de amor transforma a jornada dela.', 'Quero doe agora',   '#doe',          'Conhecer a história', '#historia',    '#1a3560'),
  (2, 'Juntos somos o amor que transforma','Ela luta. Nós amamos.',             'A Elizama enfrenta o câncer com coragem. Mas nenhuma jornada precisa ser solitária.',              'Fazer minha parte', '#doe',          'Formas de ajudar',    '#como-ajudar', '#5a1210'),
  (3, 'Sistema de Embaixadores',           'Você pode multiplicar o amor.',     'Seja embaixador. Crie seu link, compartilhe com sua rede e veja o impacto real da sua participação.','Ser embaixador',   '#embaixadores', 'Ou doe agora',        '#doe',         '#0d2950'),
  (4, 'Rifa · Eventos · Leilão',           'Doe, concorra, celebre.',           'Participe de eventos solidários, rifas e leilões. Há muitos caminhos para o amor se manifestar.',   'Ver eventos e rifas','#alternativas','Doe agora',           '#doe',         '#6b1a17');

alter table slides enable row level security;
create policy "leitura publica slides"
  on slides for select using (ativo = true);


-- ─────────────────────────────────────────────
-- TABELA: conteudo
-- Blocos de texto editáveis da landing
-- ─────────────────────────────────────────────
create table if not exists conteudo (
  chave         text primary key,
  titulo        text,
  corpo         text,
  imagem_url    text,
  secao         text,
  atualizado_em timestamptz not null default now()
);

insert into conteudo (chave, secao, titulo, corpo) values
  ('historia_titulo',     'historia',     'A história de Elizama',  'Escreva aqui a história de Elizama...'),
  ('historia_texto1',     'historia',     null,                     'Primeiro parágrafo da história...'),
  ('historia_texto2',     'historia',     null,                     'Segundo parágrafo da história...'),
  ('historia_citacao',    'historia',     null,                     'Uma citação inspiradora de ou sobre Elizama.'),
  ('como_ajudar_titulo',  'como-ajudar',  'Como você pode ajudar',  null),
  ('cta_final_titulo',    'cta-final',    'Junte-se ao movimento',  null),
  ('cta_final_texto',     'cta-final',    null,                     'Cada doação, cada partilha, cada gesto de amor faz diferença real na vida de Elizama.')
on conflict (chave) do nothing;

alter table conteudo enable row level security;
create policy "leitura publica conteudo"
  on conteudo for select using (true);


-- ─────────────────────────────────────────────
-- TABELA: embaixadores
-- Pessoas que divulgam a campanha com link próprio
-- ─────────────────────────────────────────────
create table if not exists embaixadores (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  nome          text not null,
  foto_url      text,
  ativo         boolean not null default true,
  meta_propria  numeric(10,2),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger trg_embaixadores_atualizado
  before update on embaixadores
  for each row execute function set_atualizado_em();

alter table embaixadores enable row level security;
create policy "leitura publica embaixadores ativos"
  on embaixadores for select using (ativo = true);


-- ─────────────────────────────────────────────
-- TABELA: depoimentos
-- Depoimentos de apoiadores exibidos na landing
-- ─────────────────────────────────────────────
create table if not exists depoimentos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  texto         text not null,
  foto_url      text,
  aprovado      boolean not null default false,
  ordem         int default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger trg_depoimentos_atualizado
  before update on depoimentos
  for each row execute function set_atualizado_em();

alter table depoimentos enable row level security;
create policy "leitura publica depoimentos aprovados"
  on depoimentos for select using (aprovado = true);


-- ─────────────────────────────────────────────
-- TABELA: alternativas
-- Rifas, eventos, leilões
-- ─────────────────────────────────────────────
create table if not exists alternativas (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in ('rifa','evento','leilao')),
  titulo        text not null,
  descricao     text,
  valor         numeric(10,2),
  vagas_total   int,
  vagas_usadas  int not null default 0,
  status        text not null default 'ativo' check (status in ('ativo','encerrado','em_breve')),
  link_externo  text,
  imagem_url    text,
  data_evento   timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger trg_alternativas_atualizado
  before update on alternativas
  for each row execute function set_atualizado_em();

alter table alternativas enable row level security;
create policy "leitura publica alternativas"
  on alternativas for select using (status != 'encerrado');


-- ─────────────────────────────────────────────
-- VIEWS úteis para o admin e a landing
-- ─────────────────────────────────────────────

-- Já existe da migração 001 — recriar com dados extras
create or replace view vw_meta_campanha as
select
  coalesce(sum(d.valor), 0)                                    as total_arrecadado,
  count(d.id)                                                  as total_doacoes_aprovadas,
  (select valor::numeric from configuracoes where chave = 'meta_campanha') as meta,
  case
    when (select valor::numeric from configuracoes where chave = 'meta_campanha') > 0
    then round(
      coalesce(sum(d.valor), 0) /
      (select valor::numeric from configuracoes where chave = 'meta_campanha') * 100, 1
    )
    else 0
  end as percentual
from doacoes d
where d.status = 'approved';

-- Ranking de embaixadores
create or replace view vw_ranking_embaixadores as
select
  e.id,
  e.slug,
  e.nome,
  e.foto_url,
  coalesce(sum(d.valor), 0) as total_arrecadado,
  count(d.id)               as total_doacoes
from embaixadores e
left join doacoes d on d.embaixador = e.slug and d.status = 'approved'
where e.ativo = true
group by e.id, e.slug, e.nome, e.foto_url
order by total_arrecadado desc;

-- Resumo diário para gráfico do admin
create or replace view vw_doacoes_por_dia as
select
  date_trunc('day', criado_em at time zone 'America/Cuiaba')::date as dia,
  count(*)                                                           as total_doacoes,
  coalesce(sum(valor), 0)                                           as total_valor
from doacoes
where status = 'approved'
  and criado_em >= now() - interval '30 days'
group by 1
order by 1;
