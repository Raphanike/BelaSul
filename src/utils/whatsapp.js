import { formatarMoeda, formatarQuantidade, formatarDataHora } from './formatters'

function normalizarTelefoneWhatsApp(telefone) {
  let numero = String(telefone || '').replace(/\D/g, '')

  // Remove zeros no começo
  numero = numero.replace(/^0+/, '')

  if (!numero) return ''

  // Se já começa com 55, não coloca 55 de novo
  if (numero.startsWith('55')) {
    return numero
  }

  return `55${numero}`
}

function montarLinhaItem(item) {
  const tipoVenda = item.tipo_venda || 'peso'
  const unidade = item.unidade || (tipoVenda === 'peso' ? 'kg' : 'un')

  const quantidadeFormatada = formatarQuantidade(
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

  const rotulo = tipoVenda === 'peso' ? 'Peso' : 'Qtd'

  return (
    `• ${item.nome_produto}\n` +
    `  ${unidadesFisicas}${rotulo}: ${quantidadeFormatada}\n` +
    `  Valor unit.: ${formatarMoeda(item.preco_unitario)}\n` +
    `  Subtotal: ${formatarMoeda(item.subtotal)}`
  )
}

export function montarMensagemPedido(pedido) {
  const nomeCliente = pedido.clientes?.nome || pedido.clienteNome || 'Cliente'
  const itens = pedido.pedido_itens || pedido.itens || []
  const dataHora = formatarDataHora(pedido.created_at || new Date().toISOString())

  const linhasItens = itens.map(montarLinhaItem).join('\n\n')

  const total =
    pedido.total ?? itens.reduce((acc, item) => acc + Number(item.subtotal || 0), 0)

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
  try {
    const mensagem = montarMensagemPedido(pedido)
    const numeroLimpo = normalizarTelefoneWhatsApp(telefone)

    const texto = encodeURIComponent(mensagem)

    const url = numeroLimpo
      ? `https://api.whatsapp.com/send?phone=${numeroLimpo}&text=${texto}`
      : `https://api.whatsapp.com/send?text=${texto}`

    window.location.href = url
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error)
    alert('Não foi possível abrir o WhatsApp. Verifique os dados do pedido.')
  }
}