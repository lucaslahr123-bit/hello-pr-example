-- =====================================================================
-- Migration 0002: Row Level Security
-- =====================================================================
-- Estratégia:
--   1. Toda tabela fica isolada por empresa_id = empresa do usuário logado.
--   2. Dentro da empresa, granularidade de escrita por perfil:
--        OPERADOR (vinculado a máquina): só grava apontamento de produção
--          (ordens_producao/op_consumos/op_producoes/paradas). Sem acesso a
--          cadastro, preço, meta ou aprovação.
--        LIDER_TURNO: + fecha OP dentro da faixa esperada.
--        GESTOR: + metas, custos, relatórios, aprova OP fora da faixa,
--          libera lote bloqueado.
--        ADMIN: tudo + cadastros, parâmetros, preços de serviço, usuários.
--   As políticas de escrita para estoque/produção detalhadas (Fase 1/2)
--   ainda serão refinadas; aqui ficam as bases de leitura por empresa e
--   escrita de cadastro (Fase 0).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Funções auxiliares (security definer para evitar recursão de RLS)
-- ---------------------------------------------------------------------
create or replace function current_empresa_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select empresa_id from usuarios where id = auth.uid()
$$;

create or replace function current_perfil_codigo()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select p.codigo
  from usuarios u
  join perfis p on p.id = u.perfil_id
  where u.id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select current_perfil_codigo() = 'ADMIN'
$$;

create or replace function is_gestor_ou_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select current_perfil_codigo() in ('GESTOR','ADMIN')
$$;

create or replace function is_lider_ou_acima()
returns boolean language sql security definer stable set search_path = public as $$
  select current_perfil_codigo() in ('LIDER_TURNO','GESTOR','ADMIN')
$$;

-- ---------------------------------------------------------------------
-- empresas: cada usuário só enxerga a própria empresa
-- ---------------------------------------------------------------------
alter table empresas enable row level security;
create policy empresas_select on empresas for select using (id = current_empresa_id());
create policy empresas_update_admin on empresas for update using (id = current_empresa_id() and is_admin());

-- ---------------------------------------------------------------------
-- perfis: leitura liberada (lookup fixo), sem escrita pela aplicação
-- ---------------------------------------------------------------------
alter table perfis enable row level security;
create policy perfis_select on perfis for select using (true);

-- ---------------------------------------------------------------------
-- usuarios
-- ---------------------------------------------------------------------
alter table usuarios enable row level security;
create policy usuarios_select on usuarios for select using (empresa_id = current_empresa_id());
create policy usuarios_insert_admin on usuarios for insert with check (empresa_id = current_empresa_id() and is_admin());
create policy usuarios_update_admin on usuarios for update using (empresa_id = current_empresa_id() and is_admin());

-- ---------------------------------------------------------------------
-- Cadastros de configuração: leitura para todos da empresa,
-- escrita (insert/update) só ADMIN. Nunca há DELETE via RLS
-- (inativação é update de `ativo`).
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  cadastros text[] := array[
    'parceiros','tipos_polimero','cores','etapas_processo','materiais',
    'maquinas','turnos','locais_estoque','motivos_perda','motivos_parada',
    'unidades_embalagem','parametros_processo'
  ];
begin
  foreach t in array cadastros loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_select on %I for select using (empresa_id = current_empresa_id())',
      t, t
    );
    execute format(
      'create policy %I_insert_admin on %I for insert with check (empresa_id = current_empresa_id() and is_admin())',
      t, t
    );
    execute format(
      'create policy %I_update_admin on %I for update using (empresa_id = current_empresa_id() and is_admin())',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Estoque e produção: leitura por empresa para todo mundo autenticado;
-- escrita detalhada será revisitada nas Fases 1/2 (apontamento por
-- OPERADOR vinculado à máquina, fechamento por LIDER_TURNO, aprovação
-- de desvio por GESTOR). Por ora, insert/update liberado para
-- LIDER_TURNO/GESTOR/ADMIN e bloqueado para OPERADOR direto na tabela
-- (o apontamento de chão de fábrica passará por rotina/servidor dedicada).
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  movimento text[] := array[
    'lotes','movimentacoes_estoque','recebimentos','inventarios',
    'expedicoes','expedicao_itens','tabela_precos_servico','prestacao_contas',
    'ordens_producao','op_consumos','op_producoes','op_perdas','paradas',
    'leituras_energia','analises_qualidade','nao_conformidades',
    'metas','anexos'
  ];
begin
  foreach t in array movimento loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_select on %I for select using (empresa_id = current_empresa_id())',
      t, t
    );
    execute format(
      'create policy %I_write on %I for insert with check (empresa_id = current_empresa_id() and is_lider_ou_acima())',
      t, t
    );
    execute format(
      'create policy %I_update on %I for update using (empresa_id = current_empresa_id() and is_lider_ou_acima())',
      t, t
    );
  end loop;
end $$;

-- op_consumos / op_producoes / op_perdas / expedicao_itens não têm empresa_id
-- própria (empresa vem da OP/expedição pai) — política via join.
alter table op_consumos enable row level security;
create policy op_consumos_select on op_consumos for select using (
  exists (select 1 from ordens_producao o where o.id = op_id and o.empresa_id = current_empresa_id())
);
create policy op_consumos_write on op_consumos for insert with check (
  is_lider_ou_acima() and exists (select 1 from ordens_producao o where o.id = op_id and o.empresa_id = current_empresa_id())
);

alter table op_producoes enable row level security;
create policy op_producoes_select on op_producoes for select using (
  exists (select 1 from ordens_producao o where o.id = op_id and o.empresa_id = current_empresa_id())
);
create policy op_producoes_write on op_producoes for insert with check (
  is_lider_ou_acima() and exists (select 1 from ordens_producao o where o.id = op_id and o.empresa_id = current_empresa_id())
);

alter table op_perdas enable row level security;
create policy op_perdas_select on op_perdas for select using (
  exists (select 1 from ordens_producao o where o.id = op_id and o.empresa_id = current_empresa_id())
);
create policy op_perdas_write on op_perdas for insert with check (
  is_lider_ou_acima() and exists (select 1 from ordens_producao o where o.id = op_id and o.empresa_id = current_empresa_id())
);

alter table paradas enable row level security;
create policy paradas_select on paradas for select using (
  exists (select 1 from ordens_producao o where o.id = op_id and o.empresa_id = current_empresa_id())
);
create policy paradas_write on paradas for insert with check (
  is_lider_ou_acima() and exists (select 1 from ordens_producao o where o.id = op_id and o.empresa_id = current_empresa_id())
);

alter table expedicao_itens enable row level security;
create policy expedicao_itens_select on expedicao_itens for select using (
  exists (select 1 from expedicoes e where e.id = expedicao_id and e.empresa_id = current_empresa_id())
);
create policy expedicao_itens_write on expedicao_itens for insert with check (
  is_lider_ou_acima() and exists (select 1 from expedicoes e where e.id = expedicao_id and e.empresa_id = current_empresa_id())
);

-- ---------------------------------------------------------------------
-- log_auditoria: só leitura para GESTOR/ADMIN; escrita feita por
-- triggers/servidor (security definer), não diretamente pelo cliente.
-- ---------------------------------------------------------------------
alter table log_auditoria enable row level security;
create policy log_auditoria_select on log_auditoria for select using (
  empresa_id = current_empresa_id() and is_gestor_ou_admin()
);
