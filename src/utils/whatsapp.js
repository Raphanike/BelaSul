import { formatarMoeda, formatarQuantidade, formatarDataHora } from './formatters'

function normalizarTelefoneWhatsApp(telefone) {
  let numero = String(telefone || '').replace(/\D/g, '')

  numero = numero.replace(/^0+/, '')

  if (!numero) return ''

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
    `  Unit.: ${formatarMoeda(item.preco_unitario)} | Subtotal: ${formatarMoeda(item.subtotal)}`
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

export async function abrirWhatsApp(pedido, telefone = '') {
  try {
    const mensagem = montarMensagemPedido(pedido)
    const numeroLimpo = normalizarTelefoneWhatsApp(telefone)

    const texto = encodeURIComponent(mensagem)

    const urlComTexto = numeroLimpo
      ? `https://wa.me/${numeroLimpo}?text=${texto}`
      : `https://wa.me/?text=${texto}`

    const urlSemTexto = numeroLimpo
      ? `https://wa.me/${numeroLimpo}`
      : `https://wa.me/`

    // Segurança: se o pedido tiver muitos itens, a URL pode ficar grande demais.
    // Nesse caso copia a mensagem e abre o WhatsApp sem texto.
    if (urlComTexto.length > 1800) {
      try {
        await navigator.clipboard.writeText(mensagem)
        alert('O pedido é grande. Copiei a mensagem. Quando o WhatsApp abrir, é só colar e enviar.')
      } catch {
        alert('O pedido é grande. Se o WhatsApp não levar a mensagem, copie o pedido manualmente.')
      }

      window.location.href = urlSemTexto
      return
    }

    // Tenta abrir em nova aba.
    const janela = window.open(urlComTexto, '_blank')

    // Se o navegador bloquear popup, abre na mesma aba.
    if (!janela) {
      window.location.href = urlComTexto
    }
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error)
    alert('Não foi possível abrir o WhatsApp. Verifique os dados do pedido.')
  }
}