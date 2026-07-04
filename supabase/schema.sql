-- =====================================================================
-- BELA SUL - Sistema de Controle de Pedidos
-- Script de criação do banco de dados para o Supabase (PostgreSQL)
-- Execute este script inteiro no SQL Editor do seu projeto Supabase.
-- =====================================================================

-- Extensão necessária para gerar UUIDs
create extension if not exists "pgcrypto";

-- Extensão de busca por similaridade de texto (usada nos índices de pesquisa rápida)
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- Tabela: clientes
-- ---------------------------------------------------------------------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  endereco text,
  observacoes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clientes_nome on public.clientes using gin (nome gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Tabela: produtos
-- ---------------------------------------------------------------------
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  imagem_url text,
  preco numeric(10,2) not null check (preco >= 0),
  tipo_venda text not null check (tipo_venda in ('quantidade', 'peso')),
  unidade text not null default 'un',
  created_at timestamptz not null default now()
);

create index if not exists idx_produtos_nome on public.produtos using gin (nome gin_trgm_ops);

-- ---------------------------------------------------------------------
-- Tabela: pedidos
-- ---------------------------------------------------------------------
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'finalizado',
  total numeric(10,2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_pedidos_created_at on public.pedidos (created_at);
create index if not exists idx_pedidos_cliente on public.pedidos (cliente_id);

-- ---------------------------------------------------------------------
-- Tabela: pedido_itens
-- ---------------------------------------------------------------------
create table if not exists public.pedido_itens (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null,
  nome_produto text not null,
  preco_unitario numeric(10,2) not null check (preco_unitario >= 0),
  tipo_venda text not null check (tipo_venda in ('quantidade', 'peso')),
  quantidade numeric(10,3) not null check (quantidade > 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  unidade text default 'un'
);

create index if not exists idx_pedido_itens_pedido on public.pedido_itens (pedido_id);

-- =====================================================================
-- SEGURANÇA (Row Level Security)
-- Regra de negócio: qualquer usuário autenticado do sistema (funcionário
-- da loja) pode ler e gerenciar todos os dados, pois é um sistema interno
-- compartilhado. Usuários não autenticados não têm nenhum acesso.
-- =====================================================================

alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

-- Clientes
create policy "Usuarios autenticados podem ver clientes"
  on public.clientes for select
  to authenticated
  using (true);

create policy "Usuarios autenticados podem inserir clientes"
  on public.clientes for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados podem atualizar clientes"
  on public.clientes for update
  to authenticated
  using (true)
  with check (true);

create policy "Usuarios autenticados podem excluir clientes"
  on public.clientes for delete
  to authenticated
  using (true);

-- Produtos
create policy "Usuarios autenticados podem ver produtos"
  on public.produtos for select
  to authenticated
  using (true);

create policy "Usuarios autenticados podem inserir produtos"
  on public.produtos for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados podem atualizar produtos"
  on public.produtos for update
  to authenticated
  using (true)
  with check (true);

create policy "Usuarios autenticados podem excluir produtos"
  on public.produtos for delete
  to authenticated
  using (true);

-- Pedidos
create policy "Usuarios autenticados podem ver pedidos"
  on public.pedidos for select
  to authenticated
  using (true);

create policy "Usuarios autenticados podem inserir pedidos"
  on public.pedidos for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados podem atualizar pedidos"
  on public.pedidos for update
  to authenticated
  using (true)
  with check (true);

create policy "Usuarios autenticados podem excluir pedidos"
  on public.pedidos for delete
  to authenticated
  using (true);

-- Itens do pedido
create policy "Usuarios autenticados podem ver itens"
  on public.pedido_itens for select
  to authenticated
  using (true);

create policy "Usuarios autenticados podem inserir itens"
  on public.pedido_itens for insert
  to authenticated
  with check (true);

create policy "Usuarios autenticados podem atualizar itens"
  on public.pedido_itens for update
  to authenticated
  using (true)
  with check (true);

create policy "Usuarios autenticados podem excluir itens"
  on public.pedido_itens for delete
  to authenticated
  using (true);

-- =====================================================================
-- STORAGE (bucket para imagens de produtos)
-- Rode isso depois de criar o bucket "produtos" manualmente no painel
-- Supabase (Storage > New Bucket > "produtos" > Public bucket = ON)
-- =====================================================================

-- Política para permitir upload de imagens por usuários autenticados
create policy "Usuarios autenticados podem enviar imagens"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'produtos');

create policy "Usuarios autenticados podem atualizar imagens"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'produtos');

create policy "Usuarios autenticados podem excluir imagens"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'produtos');

create policy "Qualquer pessoa pode visualizar imagens de produtos"
  on storage.objects for select
  to public
  using (bucket_id = 'produtos');

-- =====================================================================
-- FIM DO SCRIPT
-- =====================================================================
