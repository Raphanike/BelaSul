import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '../assets/logo.png'
import { imagemParaBase64 } from './imageToBase64'
import { formatarMoeda, formatarDataHora, formatarQuantidade } from './formatters'

const COR_AZUL = [43, 57, 144]
const COR_DOURADO = [242, 169, 59]
const COR_CINZA = [90, 90, 90]

export async function gerarPdfPedido(pedido) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const larguraPagina = doc.internal.pageSize.getWidth()
  const margem = 15

  const logoBase64 = await imagemParaBase64(logoUrl)

  // Cabeçalho
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margem, 10, 24, 24)
  }

  doc.setTextColor(...COR_AZUL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('BELA SUL', margem + 30, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COR_DOURADO)
  doc.text('Comercial de Alimentos - Tradição e Qualidade', margem + 30, 26)

  doc.setDrawColor(...COR_AZUL)
  doc.setLineWidth(0.6)
  doc.line(margem, 38, larguraPagina - margem, 38)

  // Título do documento
  doc.setTextColor(...COR_AZUL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('PEDIDO', larguraPagina / 2, 47, { align: 'center' })

  // Dados do pedido
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...COR_CINZA)

  const nomeCliente = pedido.clientes?.nome || pedido.clienteNome || 'Cliente não informado'
  const telefoneCliente = pedido.clientes?.telefone || pedido.clienteTelefone || ''
  const dataHora = formatarDataHora(pedido.created_at || new Date().toISOString())
  const numeroPedido = (pedido.id || '').toString().slice(0, 8).toUpperCase()

  let y = 56
  doc.setFont('helvetica', 'bold')
  doc.text('Cliente:', margem, y)
  doc.setFont('helvetica', 'normal')
  doc.text(nomeCliente, margem + 22, y)

  doc.setFont('helvetica', 'bold')
  doc.text('Pedido nº:', larguraPagina - margem - 55, y)
  doc.setFont('helvetica', 'normal')
  doc.text(numeroPedido || '---', larguraPagina - margem - 30, y)

  y += 7
  if (telefoneCliente) {
    doc.setFont('helvetica', 'bold')
    doc.text('Telefone:', margem, y)
    doc.setFont('helvetica', 'normal')
    doc.text(telefoneCliente, margem + 22, y)
  }

  doc.setFont('helvetica', 'bold')
  doc.text('Data/Hora:', larguraPagina - margem - 55, y)
  doc.setFont('helvetica', 'normal')
  doc.text(dataHora, larguraPagina - margem - 30, y)

  y += 10

  // Tabela de itens
  const itens = pedido.pedido_itens || pedido.itens || []
 const corpoTabela = itens.map((item) => [
  item.nome_produto,
  `${item.quantidade_unidades || 1} un / ${formatarQuantidade(
    item.quantidade,
    item.tipo_venda,
    item.unidade
  )}`,
  formatarMoeda(item.preco_unitario),
  formatarMoeda(item.subtotal),
])

  autoTable(doc, {
    startY: y,
    head: [['Produto', 'Qtd./Peso', 'Valor Unit.', 'Subtotal']],
    body: corpoTabela,
    theme: 'grid',
    headStyles: {
      fillColor: COR_AZUL,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 10, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margem, right: margem },
  })

  const yFinal = doc.lastAutoTable.finalY + 10
  const total = pedido.total ?? itens.reduce((acc, i) => acc + Number(i.subtotal), 0)

  doc.setFillColor(...COR_DOURADO)
  doc.rect(larguraPagina - margem - 70, yFinal - 8, 70, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(`TOTAL: ${formatarMoeda(total)}`, larguraPagina - margem - 35, yFinal, {
    align: 'center',
  })

  // Rodapé
  const alturaPagina = doc.internal.pageSize.getHeight()
  doc.setTextColor(...COR_CINZA)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.text(
    'Bela Sul - Comercial de Alimentos | Obrigado pela preferência!',
    larguraPagina / 2,
    alturaPagina - 12,
    { align: 'center' }
  )

  return doc
}

export async function baixarPdfPedido(pedido) {
  const doc = await gerarPdfPedido(pedido)
  const numeroPedido = (pedido.id || 'novo').toString().slice(0, 8)
  doc.save(`pedido-${numeroPedido}.pdf`)
}

export async function obterPdfPedidoBlob(pedido) {
  const doc = await gerarPdfPedido(pedido)
  return doc.output('blob')
}
