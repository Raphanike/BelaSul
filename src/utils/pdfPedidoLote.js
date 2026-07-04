import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '../assets/logo.png'
import { imagemParaBase64 } from './imageToBase64'
import { formatarMoeda, formatarDataHora, formatarQuantidade } from './formatters'

const COR_AZUL = [43, 57, 144]
const COR_DOURADO = [242, 169, 59]
const COR_CINZA = [90, 90, 90]

export async function gerarPdfLote(pedidos) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const largura = doc.internal.pageSize.getWidth()
  const altura = doc.internal.pageSize.getHeight()
  const margem = 12

  const logoBase64 = await imagemParaBase64(logoUrl)

  let index = 0

  const desenharCabecalho = (y) => {
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margem, y, 16, 16)
    }

    doc.setTextColor(...COR_AZUL)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('BELA SUL', margem + 20, y + 6)

    doc.setFontSize(8)
    doc.setTextColor(...COR_DOURADO)
    doc.text('Comercial de Alimentos', margem + 20, y + 11)

    doc.setDrawColor(...COR_AZUL)
    doc.line(margem, y + 18, largura - margem, y + 18)
  }

  const desenharPedido = (pedido, yStart) => {
    desenharCabecalho(yStart)

    let y = yStart + 25

    const nome = pedido?.clientes?.nome || 'Cliente'
    const data = formatarDataHora(pedido.created_at)
    const total = Number(pedido.total || 0)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.text(`Cliente: ${nome}`, margem, y)

    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Data: ${data}`, margem, y)

    y += 5

    autoTable(doc, {
      startY: y,
      head: [['Produto', 'Qtd', 'Unit', 'Subtotal']],
body: (pedido.pedido_itens || []).map(i => {
  const tipoVenda = i.tipo_venda || 'peso'
  const unidade = i.unidade || (tipoVenda === 'peso' ? 'kg' : 'un')

  return [
    i.nome_produto,
    `${i.quantidade_unidades || 1} un / ${formatarQuantidade(
      i.quantidade,
      tipoVenda,
      unidade
    )}`,
    formatarMoeda(i.preco_unitario),
    formatarMoeda(i.subtotal)
  ]
}),
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: {
        fillColor: COR_AZUL,
        textColor: 255
      },
      margin: { left: margem, right: margem }
    })

    const finalY = doc.lastAutoTable.finalY + 5

    doc.setFillColor(...COR_DOURADO)
    doc.rect(largura - 60, finalY, 48, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`R$ ${total.toFixed(2)}`, largura - 36, finalY + 5, {
      align: 'center'
    })

    return finalY + 12
  }

  // 🔥 LÓGICA: 2 PEDIDOS POR PÁGINA
  for (let i = 0; i < pedidos.length; i += 2) {
    if (i > 0) doc.addPage()

    let y1 = 15
    let y2 = altura / 2 + 5

    // pedido 1 (topo)
    if (pedidos[i]) {
      desenharPedido(pedidos[i], y1)
    }

    // pedido 2 (baixo)
    if (pedidos[i + 1]) {
      desenharPedido(pedidos[i + 1], y2)
    }
  }

  doc.save('pedidos-lote.pdf')
}