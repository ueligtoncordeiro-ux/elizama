-- ═══════════════════════════════════════════════════════════
-- Esquema mínimo para persistência de doações — Campanha Elizama
-- Executar no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════

create table if not exists doacoes (
  id              uuid primary key default gen_random_uuid(),
  external_ref    uuid not null unique,        -- gerado em create-preference.js
  mp_payment_id   text,                         -- id do pagamento no Mercado Pago
  valor           numeric(10,2) not null,
  status          text not null default 'pending', -- pending | approved | rejected
  metodo          text,                         -- pix | credit_card | bolbradesco | etc.
  doador_nome     text,
  doador_email    text,
  embaixador      text,                         -- slug/identificador do embaixador, se houver
  origem          text default 'landing',       -- landing | rifa | evento | leilao
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index if not exists idx_doacoes_status on doacoes (status);
create index if not exists idx_doacoes_embaixador on doacoes (embaixador);

-- Trigger simples para atualizado_em
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_doacoes_atualizado on doacoes;
create trigger trg_doacoes_atualizado
  before update on doacoes
  for each row execute function set_atualizado_em();

-- ── View para a barra de progresso (total arrecadado aprovado) ──
create or replace view vw_meta_campanha as
select
  coalesce(sum(valor), 0) as total_arrecadado,
  count(*) as total_doacoes_aprovadas
from doacoes
where status = 'approved';

-- ── RLS: leitura pública apenas da view (não da tabela bruta) ──
alter table doacoes enable row level security;
-- Nenhuma policy de SELECT pública = tabela só acessível via service_role (backend).
-- A view pode ser exposta separadamente via função RPC ou endpoint próprio,
-- se desejar exibir "R$ X arrecadado" no frontend sem expor e-mails/nomes.
