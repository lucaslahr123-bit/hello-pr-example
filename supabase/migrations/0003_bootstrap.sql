-- =====================================================================
-- Migration 0003: bootstrap estrutural
-- =====================================================================
-- Diferente do supabase/seed.sql (dados de EXEMPLO, removíveis), este
-- arquivo cria o mínimo para o sistema funcionar com a base zerada:
--   - os 4 perfis fixos de acesso (não são cadastro livre do usuário)
--   - 1 empresa padrão, para o primeiro admin poder ser vinculado a algo
--     (renomeie pela Central de Cadastros depois de logar)
-- =====================================================================

insert into perfis (codigo, nome_exibicao) values
  ('OPERADOR', 'Operador'),
  ('LIDER_TURNO', 'Líder de turno'),
  ('GESTOR', 'Gestor'),
  ('ADMIN', 'Administrador')
on conflict (codigo) do nothing;

insert into empresas (id, nome)
select '00000000-0000-0000-0000-000000000001', 'Minha Empresa'
where not exists (select 1 from empresas);
