import { formatarMoeda, formatarQuantidade, formatarDataHora } from './formatters'

function normalizarTelefoneWhatsApp(telefone) {
  let numero = String(telefone || '').replace(/\D/g, '')

  // Remove zero inicial, se tiver
  numero = numero.replace(/^0+/, '')

  if (!numero) return ''

  // Se já tiver código do Brasil, não adiciona de novo
  if (numero.startsWith('55')) {
    return numero
  }

  return `55${numero}`
}

function montarLinhaItem(item) {
  const tipoVenda = item.tipo_venda || 'peso'
  const unidade = item.unidade || (tipoVenda === 'peso' ? 'kg' : 'un')

  const quantidadeCalculada = formatarQuantidade(
    item.quantidade,
    tipoVenda,
    unidade
  )

  const unidadesFisicas =
    item.quantidade_unidades !== null &&
    item.quantidade_unidades !== undefined &&
    item.quantidade_unidades !== ''
      ? `${item.quantidade_unidades} un • `
      : ''

  const rotuloQuantidade = tipoVenda === 'peso' ? 'Peso' : 'Qtd'

  return (
    `• ${item.nome_produto}\n` +
    `  ${unidadesFisicas}${rotuloQuantidade}: ${quantidadeCalculada}\n` +
    `  Valor: ${formatarMoeda(item.preco_unitario)} = ${formatarMoeda(item.subtotal)}`
  )
}

export function montarMensagemPedido(pedido) {
  const nomeCliente = pedido.clientes?.nome || pedido.clienteNome || 'Cliente'
  const itens = pedido.pedido_itens || pedido.itens || []
  const dataHora = formatarDataHora(pedido.created_at || new Date().toISOString())

  const linhasItens = itens.map(montarLinhaItem).join('\n\n')

  const total =
    pedido.total ?? itens.reduce((acc, i) => acc + Number(i.subtotal || 0), 0)

  return (
    `*BELA SUL - Comercial de Alimentos*\n` +
    `Tradição e Qualidade\n\n` +
    `*Pedido de ${nomeCliente}*\n` +
    `Data: ${dataHora}\n\n` +
    `${linhasItens}\n\n` +
    `*TOTAL: ${formatarMoeda(total)}*\n\n` +
    `Obrigado pela preferência!`
  )
}

export function abrirWhatsApp(pedido, telefone = '') {
  const mensagem = montarMensagemPedido(pedido)
  const numeroLimpo = normalizarTelefoneWhatsApp(telefone)

  const url = numeroLimpo
    ? `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/?text=${encodeURIComponent(mensagem)}`

  window.open(url, '_blank')
}