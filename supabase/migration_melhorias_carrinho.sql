-- =====================================================================
-- BELA SUL - Schema completo das melhorias do carrinho (versão final)
-- Use este script apenas se for configurar um banco NOVO do zero.
-- Se você já rodou o seu próprio ajuste (status pendente/feito +
-- observação em pedidos + quantidade_unidades em pedido_itens),
-- use migration_complementar.sql em vez deste.
-- =====================================================================

-- Observação geral do pedido
alter table public.pedidos
  add column if not exists observacao text;

-- Status do pedido: pendente ou feito (usado no check "Pedido Enviado")
alter table public.pedidos
  drop constraint if exists pedidos_status_check;

alter table public.pedidos
  alter column status set default 'pendente';

update public.pedidos
set status = 'feito'
where status = 'finalizado';

update public.pedidos
set status = 'pendente'
where status is null
   or status not in ('pendente', 'feito');

alter table public.pedidos
  add constraint pedidos_status_check
  check (status in ('pendente', 'feito'));

-- Campo "Quantia" aceita texto livre (ex: "1/2", "3 cx")
alter table public.pedido_itens
  add column if not exists quantidade_unidades text;

alter table public.pedido_itens
  alter column quantidade_unidades type text
  using quantidade_unidades::text;

alter table public.pedido_itens
  alter column quantidade_unidades drop not null;

-- Observação por item do pedido
alter table public.pedido_itens
  add column if not exists observacao text;

-- Permite quantidade 0/em branco (preenchida depois por outra pessoa)
alter table public.pedido_itens
  drop constraint if exists pedido_itens_quantidade_check;

alter table public.pedido_itens
  add constraint pedido_itens_quantidade_check check (quantidade >= 0);

-- =====================================================================
-- FIM
-- =====================================================================
