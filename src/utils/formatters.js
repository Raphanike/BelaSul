export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatarData(dataISO) {
  const data = new Date(dataISO)
  return data.toLocaleDateString('pt-BR')
}

export function formatarDataHora(dataISO) {
  const data = new Date(dataISO)
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function formatarQuantidade(quantidade, tipoVenda, unidade) {
  const un = unidade || (tipoVenda === 'peso' ? 'kg' : 'un')
  const casas = tipoVenda === 'peso' ? 3 : 0
  return `${Number(quantidade).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })} ${un}`
}
