-- =====================================================================
-- Migration 0001: modelo de dados inicial
-- Sistema de Produção, Processo e Estoque — Reciclagem plástica
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- 0. TENANT (preparação para multi-empresa futura; hoje só 1 registro)
-- =====================================================================
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- =====================================================================
-- 1. PERFIS
-- =====================================================================
create table perfis (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique check (codigo in ('OPERADOR','LIDER_TURNO','GESTOR','ADMIN')),
  nome_exibicao text not null
);

-- =====================================================================
-- 2. CADASTROS BÁSICOS (tudo editável pela interface, nada fixo no código)
-- =====================================================================
create table parceiros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  documento text,
  eh_fornecedor boolean not null default false,
  eh_cliente boolean not null default false,
  eh_proprietario_terceiro boolean not null default false,
  eh_transportadora boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index idx_parceiros_empresa on parceiros(empresa_id);

create table tipos_polimero (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  ativo boolean not null default true,
  unique (empresa_id, nome)
);

create table cores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  ativo boolean not null default true,
  unique (empresa_id, nome)
);

create table etapas_processo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  ordem int not null,
  gera_perda boolean not null default true,
  ativo boolean not null default true,
  unique (empresa_id, nome)
);

create table materiais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  tipo_polimero_id uuid not null references tipos_polimero(id),
  cor_id uuid references cores(id),
  estagio text not null check (estagio in ('MP','WIP','PA','INSUMO','EMBALAGEM')),
  nome text not null,
  estoque_minimo_kg numeric(12,3) default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index idx_materiais_empresa on materiais(empresa_id);

create table maquinas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  etapa_id uuid not null references etapas_processo(id),
  capacidade_nominal_kg_h numeric(10,2),
  ativo boolean not null default true
);

create table turnos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  hora_inicio time,
  hora_fim time,
  ativo boolean not null default true
);

create table locais_estoque (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  tipo text check (tipo in ('GALPAO','AREA','BOX')),
  ativo boolean not null default true
);

create table motivos_perda (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  ativo boolean not null default true
);

create table motivos_parada (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  ativo boolean not null default true
);

create table unidades_embalagem (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nome text not null,
  fator_kg numeric(10,3),
  ativo boolean not null default true
);

-- =====================================================================
-- 3. USUÁRIOS (depende de perfis e maquinas)
-- =====================================================================
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id),
  nome text not null,
  perfil_id uuid not null references perfis(id),
  maquina_vinculada_id uuid references maquinas(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index idx_usuarios_empresa on usuarios(empresa_id);

-- =====================================================================
-- 4. PARAMETRIZAÇÃO DE PROCESSO
-- =====================================================================
create table parametros_processo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  material_id uuid not null references materiais(id),
  etapa_id uuid not null references etapas_processo(id),
  perda_min_pct numeric(5,2) not null,
  perda_max_pct numeric(5,2) not null,
  rendimento_alvo_pct numeric(5,2),
  capacidade_kg_h numeric(10,2),
  unique (material_id, etapa_id),
  check (perda_min_pct <= perda_max_pct)
);

-- =====================================================================
-- 5. ESTOQUE
-- =====================================================================
create table lotes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  codigo text not null unique,
  material_id uuid not null references materiais(id),
  qtd_atual_kg numeric(14,3) not null default 0,
  local_id uuid references locais_estoque(id),
  status text not null check (status in ('DISPONIVEL','BLOQUEADO','CONSUMIDO','EXPEDIDO')) default 'DISPONIVEL',
  lote_pai_id uuid references lotes(id),
  tipo_propriedade text not null check (tipo_propriedade in ('PROPRIO','TERCEIRO')),
  proprietario_id uuid references parceiros(id),
  criado_em timestamptz not null default now(),
  check (
    (tipo_propriedade = 'TERCEIRO' and proprietario_id is not null)
    or (tipo_propriedade = 'PROPRIO' and proprietario_id is null)
  )
);
create index idx_lotes_material on lotes(material_id);
create index idx_lotes_proprietario on lotes(proprietario_id);
create index idx_lotes_empresa on lotes(empresa_id);

create table movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  tipo text not null check (tipo in (
    'ENTRADA_RECEBIMENTO','SAIDA_EXPEDICAO','TRANSFERENCIA',
    'AJUSTE_POSITIVO','AJUSTE_NEGATIVO','CONSUMO_OP','PRODUCAO_OP','ESTORNO'
  )),
  lote_id uuid not null references lotes(id),
  local_origem_id uuid references locais_estoque(id),
  local_destino_id uuid references locais_estoque(id),
  kg numeric(14,3) not null check (kg > 0),
  motivo_id uuid,
  documento_referencia text,
  estorno_de_id uuid references movimentacoes_estoque(id),
  usuario_id uuid not null references usuarios(id),
  observacao text,
  criado_em timestamptz not null default now()
);
create index idx_mov_lote on movimentacoes_estoque(lote_id);
create index idx_mov_criado_em on movimentacoes_estoque(criado_em);
create index idx_mov_empresa on movimentacoes_estoque(empresa_id);

create table recebimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  natureza text not null check (natureza in ('COMPRA','REMESSA_INDUSTRIALIZACAO')),
  parceiro_id uuid not null references parceiros(id),
  material_id uuid not null references materiais(id),
  local_id uuid not null references locais_estoque(id),
  transportadora_id uuid references parceiros(id),
  nf_numero text,
  peso_bruto_kg numeric(14,3) not null,
  tara_kg numeric(14,3) not null default 0,
  peso_liquido_kg numeric(14,3) generated always as (peso_bruto_kg - tara_kg) stored,
  desconto_percentual numeric(5,2) default 0,
  preco_kg numeric(10,4),
  custo_total numeric(14,2),
  lote_gerado_id uuid references lotes(id),
  usuario_id uuid not null references usuarios(id),
  data_recebimento timestamptz not null default now(),
  -- preço/custo só fazem sentido em COMPRA; REMESSA de industrialização não vira custo de MP (ver briefing)
  check (
    (natureza = 'COMPRA')
    or (natureza = 'REMESSA_INDUSTRIALIZACAO' and preco_kg is null and custo_total is null)
  )
);
create index idx_recebimentos_empresa on recebimentos(empresa_id);

create table inventarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  data date not null default current_date,
  local_id uuid references locais_estoque(id),
  material_id uuid references materiais(id),
  lote_id uuid references lotes(id),
  saldo_sistema_kg numeric(14,3) not null,
  saldo_contado_kg numeric(14,3) not null,
  divergencia_kg numeric(14,3) generated always as (saldo_contado_kg - saldo_sistema_kg) stored,
  ajuste_gerado_id uuid references movimentacoes_estoque(id),
  status text not null check (status in ('PENDENTE','APROVADO')) default 'PENDENTE',
  usuario_id uuid not null references usuarios(id),
  criado_em timestamptz not null default now()
);

create table expedicoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  natureza text not null check (natureza in ('VENDA','RETORNO_INDUSTRIALIZACAO')),
  parceiro_id uuid not null references parceiros(id),
  transportadora_id uuid references parceiros(id),
  romaneio_numero text,
  status text not null check (status in ('RESERVADO','EXPEDIDO','CANCELADO')) default 'RESERVADO',
  usuario_id uuid not null references usuarios(id),
  data timestamptz not null default now()
);

create table expedicao_itens (
  id uuid primary key default gen_random_uuid(),
  expedicao_id uuid not null references expedicoes(id) on delete cascade,
  lote_id uuid not null references lotes(id),
  kg numeric(14,3) not null check (kg > 0)
);

-- =====================================================================
-- 6. INDUSTRIALIZAÇÃO POR ENCOMENDA (TOLLING)
-- =====================================================================
create table tabela_precos_servico (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  proprietario_id uuid not null references parceiros(id),
  etapa_id uuid not null references etapas_processo(id),
  material_id uuid references materiais(id),
  preco_por_kg numeric(10,4) not null,
  vigente_desde date not null default current_date,
  ativo boolean not null default true,
  unique (proprietario_id, etapa_id, material_id)
);

create table prestacao_contas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  proprietario_id uuid not null references parceiros(id),
  recebimento_id uuid not null references recebimentos(id),
  kg_recebido numeric(14,3) not null,
  kg_processado numeric(14,3) not null default 0,
  kg_devolvido numeric(14,3) not null default 0,
  kg_perda numeric(14,3) not null default 0,
  rendimento_pct numeric(5,2),
  valor_servico numeric(14,2),
  status text not null check (status in ('ABERTA','FECHADA')) default 'ABERTA',
  pdf_url text,
  gerado_em timestamptz not null default now()
);

-- =====================================================================
-- 7. PRODUÇÃO E PROCESSO
-- =====================================================================
create table ordens_producao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  etapa_id uuid not null references etapas_processo(id),
  maquina_id uuid not null references maquinas(id),
  turno_id uuid not null references turnos(id),
  operador_id uuid not null references usuarios(id),
  lider_turno_id uuid references usuarios(id),
  tipo_propriedade text not null check (tipo_propriedade in ('PROPRIO','TERCEIRO','MISTA')),
  proprietario_id uuid references parceiros(id),
  status text not null check (status in ('ABERTA','PENDENTE_APROVACAO','FECHADA','CANCELADA')) default 'ABERTA',
  justificativa_perda text,
  aprovado_por_id uuid references usuarios(id),
  aprovado_em timestamptz,
  inicio timestamptz not null default now(),
  fim timestamptz
);
create index idx_op_empresa on ordens_producao(empresa_id);
create index idx_op_maquina on ordens_producao(maquina_id);
create index idx_op_status on ordens_producao(status);

create table op_consumos (
  id uuid primary key default gen_random_uuid(),
  op_id uuid not null references ordens_producao(id) on delete cascade,
  lote_id uuid not null references lotes(id),
  kg numeric(14,3) not null check (kg > 0),
  proprietario_origem_id uuid references parceiros(id)
);
create index idx_op_consumos_op on op_consumos(op_id);
create index idx_op_consumos_lote on op_consumos(lote_id);

create table op_producoes (
  id uuid primary key default gen_random_uuid(),
  op_id uuid not null references ordens_producao(id) on delete cascade,
  lote_id uuid not null references lotes(id),
  kg numeric(14,3) not null check (kg > 0),
  proprietario_destino_id uuid references parceiros(id)
);
create index idx_op_producoes_op on op_producoes(op_id);
create index idx_op_producoes_lote on op_producoes(lote_id);

create table op_perdas (
  id uuid primary key default gen_random_uuid(),
  op_id uuid not null references ordens_producao(id) on delete cascade,
  motivo_id uuid not null references motivos_perda(id),
  kg numeric(14,3) not null check (kg > 0),
  proprietario_id uuid references parceiros(id)
);
create index idx_op_perdas_op on op_perdas(op_id);

create table paradas (
  id uuid primary key default gen_random_uuid(),
  op_id uuid not null references ordens_producao(id) on delete cascade,
  motivo_id uuid not null references motivos_parada(id),
  inicio timestamptz not null,
  fim timestamptz,
  minutos numeric(8,1) generated always as (
    case when fim is null then null
    else extract(epoch from (fim - inicio)) / 60 end
  ) stored,
  observacao text
);
create index idx_paradas_op on paradas(op_id);

create table leituras_energia (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  op_id uuid references ordens_producao(id),
  maquina_id uuid not null references maquinas(id),
  periodo_inicio timestamptz not null,
  periodo_fim timestamptz not null,
  kwh numeric(10,3) not null
);

-- =====================================================================
-- 8. QUALIDADE
-- =====================================================================
create table analises_qualidade (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  lote_id uuid not null references lotes(id),
  mfi numeric(8,2),
  densidade numeric(8,4),
  umidade_pct numeric(5,2),
  cor_medida text,
  contaminacao_pct numeric(5,2),
  aprovado boolean not null,
  laudo_pdf_url text,
  usuario_id uuid not null references usuarios(id),
  data timestamptz not null default now()
);
create index idx_analises_lote on analises_qualidade(lote_id);

create table nao_conformidades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  lote_id uuid references lotes(id),
  op_id uuid references ordens_producao(id),
  descricao text not null,
  foto_url text,
  acao_tomada text,
  usuario_id uuid not null references usuarios(id),
  data timestamptz not null default now()
);

-- =====================================================================
-- 9. GESTÃO
-- =====================================================================
create table metas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  escopo text not null check (escopo in ('EMPRESA','MAQUINA','MATERIAL')),
  maquina_id uuid references maquinas(id),
  material_id uuid references materiais(id),
  periodo text not null check (periodo in ('DIA','SEMANA','MES')),
  data_referencia date not null,
  alvo_kg numeric(14,3) not null
);
create index idx_metas_empresa on metas(empresa_id);

create table anexos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  entidade_tipo text not null,
  entidade_id uuid not null,
  url text not null,
  tipo_arquivo text,
  usuario_id uuid not null references usuarios(id),
  criado_em timestamptz not null default now()
);
create index idx_anexos_entidade on anexos(entidade_tipo, entidade_id);

create table log_auditoria (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('INSERT','UPDATE','DELETE')),
  dados_antes jsonb,
  dados_depois jsonb,
  usuario_id uuid,
  criado_em timestamptz not null default now()
);
create index idx_log_tabela_registro on log_auditoria(tabela, registro_id);
