import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoUrl from '../assets/logo.png'
import { imagemParaBase64 } from './imageToBase64'
import { formatarMoeda, formatarData, formatarDataHora } from './formatters'

const COR_AZUL = [43, 57, 144]
const COR_DOURADO = [242, 169, 59]
const COR_CINZA = [90, 90, 90]

export async function gerarPdfRelatorioDiario(pedidos, data = new Date()) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const larguraPagina = doc.internal.pageSize.getWidth()
  const margem = 15

  const logoBase64 = await imagemParaBase64(logoUrl)

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margem, 10, 22, 22)
  }

  doc.setTextColor(...COR_AZUL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('BELA SUL', margem + 28, 19)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COR_DOURADO)
  doc.text('Comercial de Alimentos - Tradição e Qualidade', margem + 28, 25)

  doc.setDrawColor(...COR_AZUL)
  doc.setLineWidth(0.6)
  doc.line(margem, 36, larguraPagina - margem, 36)

  doc.setTextColor(...COR_AZUL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('RELATÓRIO DIÁRIO DE PEDIDOS', larguraPagina / 2, 45, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COR_CINZA)
  doc.text(`Data de referência: ${formatarData(data)}`, larguraPagina / 2, 51, {
    align: 'center',
  })

  // Tabela de pedidos
  const corpoTabela = pedidos.map((pedido) => [
    (pedido.id || '').toString().slice(0, 8).toUpperCase(),
    pedido.clientes?.nome || 'Cliente removido',
    formatarDataHora(pedido.created_at),
    (pedido.pedido_itens || []).length.toString(),
    formatarMoeda(pedido.total),
  ])

  autoTable(doc, {
    startY: 58,
    head: [['Pedido', 'Cliente', 'Data/Hora', 'Itens', 'Total']],
    body: corpoTabela,
    theme: 'grid',
    headStyles: { fillColor: COR_AZUL, textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fontSize: 9.5, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 55 },
      2: { cellWidth: 45 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margem, right: margem },
  })

  let y = doc.lastAutoTable.finalY + 12

  // Totais por cliente
  const porCliente = {}
  pedidos.forEach((p) => {
    const nome = p.clientes?.nome || 'Cliente removido'
    porCliente[nome] = (porCliente[nome] || 0) + Number(p.total)
  })
  const linhasClientes = Object.entries(porCliente)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, total]) => [nome, formatarMoeda(total)])

  if (linhasClientes.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COR_AZUL)
    doc.text('Total por Cliente', margem, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Cliente', 'Total Comprado']],
      body: linhasClientes,
      theme: 'striped',
      headStyles: { fillColor: COR_DOURADO, textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: margem, right: margem },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  // Total geral
  const totalGeral = pedidos.reduce((acc, p) => acc + Number(p.total), 0)
  const larguraCaixa = 80
  doc.setFillColor(...COR_AZUL)
  doc.rect(larguraPagina - margem - larguraCaixa, y - 8, larguraCaixa, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(
    `TOTAL DO DIA: ${formatarMoeda(totalGeral)}`,
    larguraPagina - margem - larguraCaixa / 2,
    y,
    { align: 'center' }
  )

  const alturaPagina = doc.internal.pageSize.getHeight()
  doc.setTextColor(...COR_CINZA)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.text(
    `Relatório gerado em ${formatarDataHora(new Date().toISOString())}`,
    larguraPagina / 2,
    alturaPagina - 12,
    { align: 'center' }
  )

  return doc
}

export async function baixarPdfRelatorioDiario(pedidos, data = new Date()) {
  const doc = await gerarPdfRelatorioDiario(pedidos, data)
  doc.save(`relatorio-diario-${formatarData(data).replace(/\//g, '-')}.pdf`)
}
