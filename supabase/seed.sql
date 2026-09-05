-- =====================================================================
-- SEED DE EXEMPLO — dados técnicos para testar o sistema sem digitar
-- tudo na mão. NÃO é necessário para o sistema funcionar (a base
-- funciona zerada) e é totalmente removível.
--
-- O que este arquivo NÃO inclui, de propósito: parceiros (fornecedores,
-- clientes, proprietários de material terceiro) — ficam para o admin
-- cadastrar de verdade pela Central de Cadastros.
--
-- Para remover o exemplo depois de testar, apague as linhas cujo
-- registro tenha entrado por aqui (todas usam a empresa padrão criada
-- em 0003_bootstrap.sql) ou rode a query no final deste arquivo.
-- =====================================================================

do $$
declare
  v_empresa_id uuid := '00000000-0000-0000-0000-000000000001';
begin

  -- Tipos de polímero -----------------------------------------------
  insert into tipos_polimero (empresa_id, nome) values
    (v_empresa_id, 'PEAD'),
    (v_empresa_id, 'PEBD'),
    (v_empresa_id, 'PP'),
    (v_empresa_id, 'PET'),
    (v_empresa_id, 'PS'),
    (v_empresa_id, 'PVC')
  on conflict (empresa_id, nome) do nothing;

  -- Cores --------------------------------------------------------------
  insert into cores (empresa_id, nome) values
    (v_empresa_id, 'Natural'),
    (v_empresa_id, 'Branco'),
    (v_empresa_id, 'Preto'),
    (v_empresa_id, 'Colorido/Misto')
  on conflict (empresa_id, nome) do nothing;

  -- Etapas de processo (ordem = sequência do fluxo) ---------------------
  insert into etapas_processo (empresa_id, nome, ordem, gera_perda) values
    (v_empresa_id, 'Triagem', 1, true),
    (v_empresa_id, 'Moagem', 2, true),
    (v_empresa_id, 'Lavagem e Secagem', 3, true),
    (v_empresa_id, 'Extrusão/Granulação', 4, true),
    (v_empresa_id, 'Ensacamento', 5, false)
  on conflict (empresa_id, nome) do nothing;

  -- Máquinas -------------------------------------------------------------
  insert into maquinas (empresa_id, nome, etapa_id, capacidade_nominal_kg_h)
  select v_empresa_id, m.nome, e.id, m.cap
  from (values
    ('Moinho 01', 'Moagem', 800),
    ('Lavadora 01', 'Lavagem e Secagem', 600),
    ('Extrusora 01', 'Extrusão/Granulação', 400)
  ) as m(nome, etapa_nome, cap)
  join etapas_processo e on e.empresa_id = v_empresa_id and e.nome = m.etapa_nome
  where not exists (
    select 1 from maquinas mq where mq.empresa_id = v_empresa_id and mq.nome = m.nome
  );

  -- Turnos -----------------------------------------------------------
  insert into turnos (empresa_id, nome, hora_inicio, hora_fim)
  select v_empresa_id, t.nome, t.ini::time, t.fim::time
  from (values
    ('Turno 1', '06:00', '14:00'),
    ('Turno 2', '14:00', '22:00')
  ) as t(nome, ini, fim)
  where not exists (
    select 1 from turnos tu where tu.empresa_id = v_empresa_id and tu.nome = t.nome
  );

  -- Locais de estoque --------------------------------------------------
  insert into locais_estoque (empresa_id, nome, tipo) values
    (v_empresa_id, 'Galpão MP', 'GALPAO'),
    (v_empresa_id, 'Área de Processo', 'AREA'),
    (v_empresa_id, 'Box Produto Acabado', 'BOX'),
    (v_empresa_id, 'Área Material de Terceiros', 'AREA')
  on conflict do nothing;

  -- Motivos de perda -----------------------------------------------------
  insert into motivos_perda (empresa_id, nome) values
    (v_empresa_id, 'Umidade residual'),
    (v_empresa_id, 'Contaminação/Impureza'),
    (v_empresa_id, 'Refile de extrusão'),
    (v_empresa_id, 'Troca de tela'),
    (v_empresa_id, 'Quebra/Descarte de qualidade')
  on conflict do nothing;

  -- Motivos de parada ----------------------------------------------------
  insert into motivos_parada (empresa_id, nome) values
    (v_empresa_id, 'Troca de tela'),
    (v_empresa_id, 'Manutenção corretiva'),
    (v_empresa_id, 'Manutenção preventiva'),
    (v_empresa_id, 'Falta de matéria-prima'),
    (v_empresa_id, 'Troca de turno'),
    (v_empresa_id, 'Limpeza')
  on conflict do nothing;

  -- Unidades de embalagem (fator é referência; pesagem real prevalece) --
  insert into unidades_embalagem (empresa_id, nome, fator_kg) values
    (v_empresa_id, 'Big Bag', 1000),
    (v_empresa_id, 'Saco 25kg', 25),
    (v_empresa_id, 'Fardo', null)
  on conflict do nothing;

  -- Materiais (MP, WIP e PA de PEAD e PP natural, + 1 insumo/embalagem) --
  insert into materiais (empresa_id, tipo_polimero_id, cor_id, estagio, nome, estoque_minimo_kg)
  select v_empresa_id, tp.id, c.id, mm.estagio, mm.nome, mm.minimo
  from (values
    ('PEAD', 'Natural', 'MP',  'Fardo PEAD Natural',    500),
    ('PEAD', 'Natural', 'WIP', 'Moído PEAD Natural',    200),
    ('PEAD', 'Natural', 'PA',  'Grão PEAD Natural',     300),
    ('PP',   'Natural', 'MP',  'Fardo PP Natural',      500),
    ('PP',   'Natural', 'WIP', 'Moído PP Natural',      200),
    ('PP',   'Natural', 'PA',  'Grão PP Natural',       300)
  ) as mm(polimero, cor, estagio, nome, minimo)
  join tipos_polimero tp on tp.empresa_id = v_empresa_id and tp.nome = mm.polimero
  join cores c on c.empresa_id = v_empresa_id and c.nome = mm.cor
  where not exists (
    select 1 from materiais mt where mt.empresa_id = v_empresa_id and mt.nome = mm.nome
  );

  -- Parâmetros de processo (faixa de perda esperada por material+etapa) --
  insert into parametros_processo (empresa_id, material_id, etapa_id, perda_min_pct, perda_max_pct, rendimento_alvo_pct, capacidade_kg_h)
  select v_empresa_id, mt.id, e.id, pp.perda_min, pp.perda_max, pp.rend_alvo, pp.capacidade
  from (values
    ('Fardo PEAD Natural', 'Moagem', 2.0, 6.0, 95.0, 800),
    ('Moído PEAD Natural', 'Lavagem e Secagem', 3.0, 8.0, 93.0, 600),
    ('Moído PEAD Natural', 'Extrusão/Granulação', 2.0, 5.0, 96.0, 400),
    ('Fardo PP Natural', 'Moagem', 2.0, 6.0, 95.0, 800),
    ('Moído PP Natural', 'Lavagem e Secagem', 3.0, 8.0, 93.0, 600),
    ('Moído PP Natural', 'Extrusão/Granulação', 2.0, 5.0, 96.0, 400)
  ) as pp(material_nome, etapa_nome, perda_min, perda_max, rend_alvo, capacidade)
  join materiais mt on mt.empresa_id = v_empresa_id and mt.nome = pp.material_nome
  join etapas_processo e on e.empresa_id = v_empresa_id and e.nome = pp.etapa_nome
  where not exists (
    select 1 from parametros_processo par where par.material_id = mt.id and par.etapa_id = e.id
  );

end $$;

-- ---------------------------------------------------------------------
-- Para remover todo o exemplo acima (mantendo perfis/empresa do
-- bootstrap), rode, nesta ordem:
--
--   delete from parametros_processo where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from materiais where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from unidades_embalagem where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from motivos_parada where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from motivos_perda where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from locais_estoque where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from turnos where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from maquinas where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from etapas_processo where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from cores where empresa_id = '00000000-0000-0000-0000-000000000001';
--   delete from tipos_polimero where empresa_id = '00000000-0000-0000-0000-000000000001';
-- ---------------------------------------------------------------------
