# Controle de Produção, Processos e Estoque — Reciclagem Plástica

Sistema web (PWA) de controle de produção, processo e estoque para uma
indústria de reciclagem de plástico, acessado do celular do gestor, dos
computadores do escritório e de tablets no chão de fábrica, com os mesmos
dados em tempo real.

Nenhum polímero, cor, máquina, etapa, turno, motivo de perda/parada ou
parâmetro de processo fica fixo no código — tudo é cadastrado pela própria
interface (Central de Cadastros), pelo usuário administrador.

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS** — componentes de
  UI no estilo shadcn/ui (Radix + Tailwind), em `src/components/ui`
- **Supabase** — PostgreSQL, Auth, Row Level Security, Realtime, Storage
- **TanStack Query** para dados, **Zod** + **React Hook Form** para
  formulários e validação
- **PWA** instalável (manifest + service worker do app shell)
- Todo o sistema em português do Brasil

> A fila offline de apontamentos (Dexie/IndexedDB) entra na Fase 2, junto
> com o apontamento de produção no chão de fábrica.

## Status do projeto — Fase 0 (Fundação)

Entregue nesta fase:

- Autenticação (Supabase Auth) e perfis de acesso via RLS (Operador,
  Líder de turno, Gestor, Admin)
- Central de Cadastros completa: parceiros, tipos de polímero, cores,
  materiais, etapas de processo, máquinas, turnos, locais de estoque,
  motivos de perda/parada, unidades de embalagem e parâmetros de processo
- Gestão de usuários pelo admin (inclusive login vinculado a uma máquina,
  para o operador de chão de fábrica)
- Layout responsivo (celular/tablet/desktop) e PWA instalável

As fases seguintes (estoque, produção com balanço de massa, metas e
painéis, industrialização por encomenda, qualidade/custo/expedição) estão
descritas no briefing do projeto e serão implementadas por fases, cada
uma parando para teste antes de seguir.

## 1. Pré-requisitos

- Node.js 20+ e npm
- Uma conta e um projeto no [Supabase](https://supabase.com)
- (Opcional, recomendado) [Supabase CLI](https://supabase.com/docs/guides/cli)
  para rodar as migrations com `supabase db push`

## 2. Configurar o banco (Supabase)

As migrations ficam em `supabase/migrations/`, na ordem em que devem ser
aplicadas:

1. `0001_init.sql` — todas as tabelas do modelo de dados
2. `0002_rls.sql` — Row Level Security (isolamento por empresa + regras
   por perfil de acesso)
3. `0003_bootstrap.sql` — os 4 perfis fixos (Operador, Líder de turno,
   Gestor, Admin) e uma empresa padrão (renomeável depois, pela tela)

**Com a Supabase CLI** (recomendado):

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

**Sem CLI:** abra o SQL Editor do painel do Supabase e rode o conteúdo de
cada arquivo, na ordem acima, colando um de cada vez.

### Dados de exemplo (opcional)

`supabase/seed.sql` cadastra materiais, etapas, máquinas, turnos, locais,
motivos e parâmetros de processo típicos de reciclagem, só para você
testar sem digitar tudo na mão. Ele **não** cria parceiros (fornecedores,
clientes, proprietários de terceiro) — isso fica para você cadastrar de
verdade. É totalmente opcional e removível (veja o comentário no final do
próprio arquivo); o sistema funciona normalmente com a base zerada.

Rode-o do mesmo jeito (CLI ou colando no SQL Editor) depois das migrations.

### Criar o primeiro usuário administrador

A tela de "Usuários" já permite ao admin criar novos logins — mas o
**primeiro** admin precisa ser criado manualmente uma única vez, porque
ainda não existe nenhum admin para usar a tela:

1. No painel do Supabase, vá em **Authentication → Users → Add user** e
   crie o usuário com e-mail/senha (marque "Auto Confirm").
2. Copie o UUID do usuário criado.
3. No **SQL Editor**, rode (troque o UUID e o nome):

   ```sql
   insert into usuarios (id, empresa_id, nome, perfil_id)
   select
     'UUID-DO-USUARIO-CRIADO-NO-AUTH',
     '00000000-0000-0000-0000-000000000001', -- empresa padrão do bootstrap
     'Seu Nome',
     id
   from perfis where codigo = 'ADMIN';
   ```

Depois disso, logue normalmente pela tela `/login` — os próximos usuários
já podem ser criados pela tela "Usuários".

## 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os dados do seu
projeto (**Project Settings → API** no painel do Supabase):

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

A `SUPABASE_SERVICE_ROLE_KEY` é usada só em código de servidor (criação de
usuário pelo admin) — nunca é enviada ao navegador. Trate-a como senha.

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.

## 5. Deploy

- **Front-end:** [Vercel](https://vercel.com) — conecte o repositório e
  configure as mesmas três variáveis de ambiente do `.env.local` nas
  configurações do projeto (Environment Variables).
- **Banco:** o próprio projeto Supabase já criado acima; não precisa de
  servidor adicional.
- A instalação como PWA (ícone na tela inicial) só funciona em produção,
  servida por HTTPS (Vercel já entrega isso por padrão).

## Estrutura do projeto

```
src/
  app/
    login/              tela e server action de login
    (app)/               área autenticada (sidebar, central de cadastros, usuários)
  components/
    ui/                  primitivos de interface (botão, input, tabela, diálogo...)
    cadastros/           componente genérico de CRUD usado pela Central de Cadastros
    layout/              shell da aplicação (sidebar/topbar) e config de navegação
  lib/
    supabase/            clientes Supabase (browser, server, middleware, admin)
    auth.ts              usuário logado + perfil + checagem de acesso mínimo
supabase/
  migrations/            modelo de dados e RLS, em ordem
  seed.sql               dados de exemplo (removível)
```
