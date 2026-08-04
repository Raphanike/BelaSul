import { supabase } from './supabaseClient'

// Arredondamento seguro para 2 casas decimais
export function arredondar(valor) {
  return Math.round((Number(valor || 0) + Number.EPSILON) * 100) / 100
}

export function calcularSubtotal(precoUnitario, quantidade) {
  return arredondar(Number(precoUnitario || 0) * Number(quantidade || 0))
}

export function calcularTotalPedido(itens) {
  const total = itens.reduce((acc, item) => acc + Number(item.subtotal || 0), 0)
  return arredondar(total)
}

function normalizarNumero(valor) {
  if (valor === '' || valor === null || valor === undefined) return 0

  const numero = Number(String(valor).replace(',', '.'))
  return Number.isFinite(numero) ? numero : 0
}

function normalizarUnidades(valor) {
  // Campo informativo (Quantia): aceita texto livre,
  // como "1/2", "3 cx", etc. Não converte mais para número.
  if (valor === '' || valor === null || valor === undefined) return null

  const texto = String(valor).trim()
  return texto === '' ? null : texto
}

function normalizarObservacao(valor) {
  if (valor === '' || valor === null || valor === undefined) return null
  const texto = String(valor).trim()
  return texto === '' ? null : texto
}

function resolverTipoVenda(item) {
  return item.tipo_venda || item.produtos?.tipo_venda || 'peso'
}

function resolverUnidade(item, tipoVenda) {
  // Corrige casos antigos onde produto por peso ficou salvo como "un"
  if (!item.unidade || (tipoVenda === 'peso' && item.unidade === 'un')) {
    return item.produtos?.unidade || (tipoVenda === 'peso' ? 'kg' : 'un')
  }

  return item.unidade
}

function montarItemParaSalvar(item, pedidoId) {
  const tipoVenda = resolverTipoVenda(item)
  const unidade = resolverUnidade(item, tipoVenda)

  const precoUnitario = arredondar(normalizarNumero(item.preco_unitario))
  const quantidade = normalizarNumero(item.quantidade)
  const subtotal = calcularSubtotal(precoUnitario, quantidade)

  return {
    pedido_id: pedidoId,
    produto_id: item.produto_id,
    nome_produto: item.nome_produto,
    preco_unitario: precoUnitario,

    tipo_venda: tipoVenda,
    unidade,

    // Campo informativo. Pode ser null.
    // Não entra no cálculo. Aceita texto livre (ex: "1/2").
    quantidade_unidades: normalizarUnidades(item.quantidade_unidades),

    // Campo que calcula.
    // Se for kg, representa peso.
    // Se for unidade, representa quantidade vendida.
    // Pode ser 0 (fica pendente de pesagem/preenchimento posterior).
    quantidade,

    subtotal,

    // Observação livre do item, aparece no histórico.
    observacao: normalizarObservacao(item.observacao),
  }
}

function normalizarPedidoItens(pedido) {
  return {
    ...pedido,
    pedido_itens: (pedido.pedido_itens || []).map((item) => {
      const tipoVenda = resolverTipoVenda(item)
      const unidade = resolverUnidade(item, tipoVenda)

      return {
        ...item,
        tipo_venda: tipoVenda,
        unidade,
      }
    }),
  }
}

export async function criarPedido({ clienteId, itens, userId, observacao }) {
  if (!clienteId) throw new Error('Selecione um cliente para o pedido.')
  if (!itens || itens.length === 0) throw new Error('Adicione ao menos um produto ao pedido.')

  const itensSemPedido = itens.map((item) => {
    const tipoVenda = resolverTipoVenda(item)
    const unidade = resolverUnidade(item, tipoVenda)

    const precoUnitario = arredondar(normalizarNumero(item.preco_unitario))
    const quantidade = normalizarNumero(item.quantidade)
    const subtotal = calcularSubtotal(precoUnitario, quantidade)

    return {
      ...item,
      preco_unitario: precoUnitario,
      tipo_venda: tipoVenda,
      unidade,
      quantidade_unidades: normalizarUnidades(item.quantidade_unidades),
      quantidade,
      subtotal,
      observacao: normalizarObservacao(item.observacao),
    }
  })

  const total = calcularTotalPedido(itensSemPedido)

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert([
      {
        cliente_id: clienteId,
        total,
        status: 'pendente',
        observacao: normalizarObservacao(observacao),
        user_id: userId || null,
      },
    ])
    .select()
    .single()

  if (pedidoError) throw pedidoError

  const itensParaSalvar = itensSemPedido.map((item) =>
    montarItemParaSalvar(item, pedido.id)
  )

  const { error: itensError } = await supabase
    .from('pedido_itens')
    .insert(itensParaSalvar)

  if (itensError) {
    // Reverte o pedido caso os itens falhem
    await supabase.from('pedidos').delete().eq('id', pedido.id)
    throw itensError
  }

  return {
    ...pedido,
    total,
    itens: itensParaSalvar,
    pedido_itens: itensParaSalvar,
  }
}

export async function listarPedidos(filtros = {}) {
  let query = supabase
    .from('pedidos')
    .select(`
      *,
      clientes (*),
      pedido_itens (
        *,
        produtos (
          tipo_venda,
          unidade
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (filtros.dataInicio) {
    query = query.gte('created_at', filtros.dataInicio)
  }

  if (filtros.dataFim) {
    query = query.lte('created_at', filtros.dataFim)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map(normalizarPedidoItens)
}

export async function buscarPedidoPorId(id) {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      clientes(nome, telefone, endereco),
      pedido_itens (
        *,
        produtos (
          tipo_venda,
          unidade
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return normalizarPedidoItens(data)
}

// Alterna o status do pedido entre "pendente" e "feito" (usado no
// check "Pedido Enviado" do histórico).
export async function marcarStatusPedido(id, status) {
  const { error } = await supabase
    .from('pedidos')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

export async function excluirPedido(id) {
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

function inicioDoDiaISO(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function fimDoDiaISO(date = new Date()) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

export async function obterPedidosDoDia(date = new Date()) {
  return listarPedidos({
    dataInicio: inicioDoDiaISO(date),
    dataFim: fimDoDiaISO(date),
  })
}

export async function obterEstatisticasDashboard(date = new Date()) {
  const pedidosHoje = await obterPedidosDoDia(date)

  const totalVendidoHoje = arredondar(
    pedidosHoje.reduce((acc, p) => acc + Number(p.total || 0), 0)
  )

  const quantidadePedidos = pedidosHoje.length

  const porCliente = {}

  pedidosHoje.forEach((p) => {
    const nome = p.clientes?.nome || 'Cliente removido'
    porCliente[nome] = arredondar((porCliente[nome] || 0) + Number(p.total || 0))
  })

  const valorPorCliente = Object.entries(porCliente)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)

  return {
    totalVendidoHoje,
    quantidadePedidos,
    valorPorCliente,
    pedidosHoje,
  }
}

export async function atualizarPedido(id, { clienteId, itens, observacao }) {
  if (!clienteId) throw new Error('Selecione um cliente.')
  if (!itens || itens.length === 0) throw new Error('Adicione ao menos um produto.')

  const itensNormalizados = itens.map((item) => {
    const tipoVenda = resolverTipoVenda(item)
    const unidade = resolverUnidade(item, tipoVenda)

    const precoUnitario = arredondar(normalizarNumero(item.preco_unitario))
    const quantidade = normalizarNumero(item.quantidade)
    const subtotal = calcularSubtotal(precoUnitario, quantidade)

    return {
      ...item,
      preco_unitario: precoUnitario,
      tipo_venda: tipoVenda,
      unidade,
      quantidade_unidades: normalizarUnidades(item.quantidade_unidades),
      quantidade,
      subtotal,
      observacao: normalizarObservacao(item.observacao),
    }
  })

  const total = calcularTotalPedido(itensNormalizados)

  // Atualiza cabeçalho
  const { error: pedidoError } = await supabase
    .from('pedidos')
    .update({
      cliente_id: clienteId,
      total,
      observacao: normalizarObservacao(observacao),
    })
    .eq('id', id)

  if (pedidoError) throw pedidoError

  // Remove os itens antigos
  const { error: deleteError } = await supabase
    .from('pedido_itens')
    .delete()
    .eq('pedido_id', id)

  if (deleteError) throw deleteError

  // Insere os novos
  const itensParaSalvar = itensNormalizados.map((item) =>
    montarItemParaSalvar(item, id)
  )

  const { error: itensError } = await supabase
    .from('pedido_itens')
    .insert(itensParaSalvar)

  if (itensError) throw itensError

  return true
}