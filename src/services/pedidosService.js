import { supabase } from './supabaseClient'

// Arredondamento seguro para 2 casas decimais (evita erros de ponto flutuante)
export function arredondar(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100
}

export function calcularSubtotal(precoUnitario, quantidade) {
  return arredondar(Number(precoUnitario) * Number(quantidade))
}

export function calcularTotalPedido(itens) {
  const total = itens.reduce((acc, item) => acc + Number(item.subtotal), 0)
  return arredondar(total)
}

export async function criarPedido({ clienteId, itens, userId }) {
  if (!clienteId) throw new Error('Selecione um cliente para o pedido.')
  if (!itens || itens.length === 0) throw new Error('Adicione ao menos um produto ao pedido.')

  const total = calcularTotalPedido(itens)

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert([
      {
        cliente_id: clienteId,
        total,
        status: 'finalizado',
        user_id: userId || null,
      },
    ])
    .select()
    .single()

  if (pedidoError) throw pedidoError

const itensParaSalvar = itens.map((item) => {
  const tipoVenda = item.tipo_venda || 'peso'
  const unidade = item.unidade || (tipoVenda === 'peso' ? 'kg' : 'un')

  return {
    pedido_id: pedido.id,
    produto_id: item.produto_id,
    nome_produto: item.nome_produto,
    preco_unitario: arredondar(item.preco_unitario),

    tipo_venda: tipoVenda,
    unidade: unidade,

    quantidade_unidades: Number(item.quantidade_unidades || 1),

    quantidade: Number(item.quantidade),
    subtotal: arredondar(item.subtotal),
  }
})

  const { error: itensError } = await supabase.from('pedido_itens').insert(itensParaSalvar)

  if (itensError) {
    // Reverte o pedido caso os itens falhem, mantendo consistência
    await supabase.from('pedidos').delete().eq('id', pedido.id)
    throw itensError
  }

  return { ...pedido, itens: itensParaSalvar }
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

  return (data || []).map((pedido) => ({
    ...pedido,
    pedido_itens: (pedido.pedido_itens || []).map((item) => {
      const tipoVenda =
        item.tipo_venda ||
        item.produtos?.tipo_venda ||
        'peso'

      const unidade =
        item.unidade ||
        item.produtos?.unidade ||
        (tipoVenda === 'peso' ? 'kg' : 'un')

      return {
        ...item,
        tipo_venda: tipoVenda,
        unidade,
      }
    }),
  }))
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

  return {
    ...data,
    pedido_itens: (data.pedido_itens || []).map((item) => {
      const tipoVenda =
        item.tipo_venda ||
        item.produtos?.tipo_venda ||
        'peso'

      const unidade =
        item.unidade ||
        item.produtos?.unidade ||
        (tipoVenda === 'peso' ? 'kg' : 'un')

      return {
        ...item,
        tipo_venda: tipoVenda,
        unidade,
      }
    }),
  }
}

export async function excluirPedido(id) {
  const { error } = await supabase.from('pedidos').delete().eq('id', id)
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
  return listarPedidos({ dataInicio: inicioDoDiaISO(date), dataFim: fimDoDiaISO(date) })
}

export async function obterEstatisticasDashboard(date = new Date()) {
  const pedidosHoje = await obterPedidosDoDia(date)

  const totalVendidoHoje = arredondar(pedidosHoje.reduce((acc, p) => acc + Number(p.total), 0))
  const quantidadePedidos = pedidosHoje.length

  const porCliente = {}
  pedidosHoje.forEach((p) => {
    const nome = p.clientes?.nome || 'Cliente removido'
    porCliente[nome] = arredondar((porCliente[nome] || 0) + Number(p.total))
  })

  const valorPorCliente = Object.entries(porCliente)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)

  return { totalVendidoHoje, quantidadePedidos, valorPorCliente, pedidosHoje }
}


export async function atualizarPedido(id, { clienteId, itens }) {
  if (!clienteId) throw new Error('Selecione um cliente.')
  if (!itens || itens.length === 0)
    throw new Error('Adicione ao menos um produto.')

  const total = calcularTotalPedido(itens)

  // Atualiza cabeçalho
  const { error: pedidoError } = await supabase
    .from('pedidos')
    .update({
      cliente_id: clienteId,
      total,
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
const itensParaSalvar = itens.map((item) => {
  const tipoVenda = item.tipo_venda || 'peso'
  const unidade = item.unidade || (tipoVenda === 'peso' ? 'kg' : 'un')

  return {
    pedido_id: id,
    produto_id: item.produto_id,
    nome_produto: item.nome_produto,
    preco_unitario: arredondar(item.preco_unitario),

    tipo_venda: tipoVenda,
    unidade: unidade,

    quantidade_unidades: Number(item.quantidade_unidades || 1),

    quantidade: Number(item.quantidade),
    subtotal: arredondar(item.subtotal),
  }
})

  const { error: itensError } = await supabase
    .from('pedido_itens')
    .insert(itensParaSalvar)

  if (itensError) throw itensError

  return true
}
