import { formatarMoeda, formatarQuantidade, formatarDataHora } from './formatters'

export function montarMensagemPedido(pedido) {
  const nomeCliente = pedido.clientes?.nome || pedido.clienteNome || 'Cliente'
  const itens = pedido.pedido_itens || pedido.itens || []
  const dataHora = formatarDataHora(pedido.created_at || new Date().toISOString())

  const linhasItens = itens
    .map(
      (item) =>
        `• ${item.nome_produto} - ${formatarQuantidade(
          item.quantidade,
          item.tipo_venda,
          item.unidade
        )} x ${formatarMoeda(item.preco_unitario)} = ${formatarMoeda(item.subtotal)}`
    )
    .join('\n')

  const total = pedido.total ?? itens.reduce((acc, i) => acc + Number(i.subtotal), 0)

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
  const numeroLimpo = telefone.replace(/\D/g, '')
  const base = numeroLimpo ? `https://wa.me/55${numeroLimpo}` : 'https://wa.me/'
  const url = `${base}?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank')
}
