-- =====================================================================
-- BELA SUL - Complemento do ajuste que você já rodou
-- Execute este script UMA VEZ no SQL Editor do Supabase.
-- Ele NÃO mexe em nada do que você já criou (observacao/status em
-- pedidos, quantidade_unidades em pedido_itens) — só adiciona o que
-- ainda falta pro app funcionar com as melhorias do carrinho.
-- =====================================================================

-- 1) Observação POR ITEM do pedido (além da observação geral do
--    pedido que você já criou em "pedidos"). Ex: "esse aqui pesar
--    na entrega", "embalagem trocada" — específico de cada produto
--    dentro do carrinho.
alter table public.pedido_itens
  add column if not exists observacao text;

-- 2) Permite salvar o item com quantidade 0/em branco. Isso é o que
--    deixa uma pessoa lançar a venda e outra preencher o peso/qtd
--    depois (ex: produto que só é pesado na hora da entrega).
alter table public.pedido_itens
  drop constraint if exists pedido_itens_quantidade_check;

alter table public.pedido_itens
  add constraint pedido_itens_quantidade_check check (quantidade >= 0);

-- =====================================================================
-- FIM
-- =====================================================================
