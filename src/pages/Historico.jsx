import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import ConfirmacaoModal from '../components/ConfirmacaoModal'
import Modal from '../components/Modal'
import { listarPedidos, excluirPedido } from '../services/pedidosService'
import { formatarMoeda, formatarDataHora, formatarQuantidade } from '../utils/formatters'
import { baixarPdfPedido } from '../utils/pdfPedido'
import { abrirWhatsApp } from '../utils/whatsapp'
import { gerarPdfLote } from '../utils/pdfPedidoLote'


export default function Historico() {
  const [pedidos, setPedidos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [pedidoParaExcluir, setPedidoParaExcluir] = useState(null)
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null)
  const [selecionados, setSelecionados] = useState([])

  const navigate = useNavigate()

  const carregar = useCallback(async () => {
    setCarregando(true)
    const filtros = {}

    if (dataInicio) filtros.dataInicio = new Date(dataInicio + 'T00:00:00').toISOString()
    if (dataFim) filtros.dataFim = new Date(dataFim + 'T23:59:59').toISOString()

    const dados = await listarPedidos(filtros)
    setPedidos(dados)
    setCarregando(false)
  }, [dataInicio, dataFim])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handleExcluir() {
    if (!pedidoParaExcluir) return
    await excluirPedido(pedidoParaExcluir.id)
    setPedidoParaExcluir(null)
    carregar()
  }

  const totalGeral = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0)

  const toggleSelecionado = (id) => {
    setSelecionados(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  const selecionarTodos = () => {
    if (selecionados.length === pedidos.length) {
      setSelecionados([])
    } else {
      setSelecionados(pedidos.map(p => p.id))
    }
  }

  const pedidosSelecionados = pedidos.filter(p =>
    selecionados.includes(p.id)
  )

  return (
    <Layout>
      <h1>Histórico de Pedidos</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="linha-form-dupla">
          <div className="campo">
            <label>De</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>

          <div className="campo">
            <label>Até</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
        </div>

        <p style={{ fontWeight: 700 }}>
          Total: {formatarMoeda(totalGeral)} ({pedidos.length})
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={selecionarTodos}>
            {selecionados.length === pedidos.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>

          <button
            className="btn btn-secundario"
            disabled={selecionados.length === 0}
            onClick={() => gerarPdfLote(pedidosSelecionados)}
          >
            PDF em Lote ({selecionados.length})
          </button>
        </div>
      </div>

      {carregando ? (
        <Loading texto="Carregando pedidos..." />
      ) : pedidos.length === 0 ? (
        <div className="vazio">
          <p>Nenhum pedido encontrado.</p>
        </div>
      ) : (
        pedidos.map((pedido) => (
          <div key={pedido.id} className="lista-item historico-item">
  <div className="historico-topo">
    <input
      type="checkbox"
      checked={selecionados.includes(pedido.id)}
      onChange={() => toggleSelecionado(pedido.id)}
    />

    <div className="historico-info">
      <div className="info-principal">
        {pedido.clientes?.nome || 'Cliente removido'}
      </div>

      <div className="info-secundaria">
        {formatarDataHora(pedido.created_at)} • {pedido.pedido_itens?.length || 0} itens
      </div>
    </div>
  </div>

  <div className="historico-acoes">
    <strong className="historico-total">{formatarMoeda(pedido.total)}</strong>

    <button className="btn btn-outline" onClick={() => setPedidoDetalhe(pedido)}>
      Ver
    </button>

    <button
      className="btn btn-primario"
      onClick={() => navigate(`/pedido-novo/${pedido.id}`)}
    >
      Editar
    </button>

    <button className="btn btn-secundario" onClick={() => baixarPdfPedido(pedido)}>
      PDF
    </button>

    <button
      className="btn btn-sucesso"
      onClick={() => abrirWhatsApp(pedido, pedido.clientes?.telefone)}
    >
      WhatsApp
    </button>

    <button className="btn btn-perigo" onClick={() => setPedidoParaExcluir(pedido)}>
      Excluir
    </button>
  </div>
</div>
        ))
      )}

      <Modal
        titulo={`Pedido de ${pedidoDetalhe?.clientes?.nome || ''}`}
        aberto={!!pedidoDetalhe}
        onFechar={() => setPedidoDetalhe(null)}
      >
        {pedidoDetalhe && (
          <div>
            <p>{formatarDataHora(pedidoDetalhe.created_at)}</p>

          {pedidoDetalhe.pedido_itens?.map((item) => (
  <div key={item.id} className="item-carrinho">
    <div>
      <strong>{item.nome_produto}</strong>

      <div style={{ fontSize: 12 }}>
        {item.quantidade_unidades || 1} un •{' '}
        {formatarQuantidade(item.quantidade, item.tipo_venda, item.unidade)} ×{' '}
        {formatarMoeda(item.preco_unitario)}
      </div>
    </div>

    <strong>{formatarMoeda(item.subtotal)}</strong>
  </div>
))}

            <div className="total-carrinho">
              <span>Total</span>
              <span>{formatarMoeda(pedidoDetalhe.total)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmacaoModal
        aberto={!!pedidoParaExcluir}
        titulo="Excluir Pedido"
        mensagem="Deseja realmente excluir?"
        onConfirmar={handleExcluir}
        onCancelar={() => setPedidoParaExcluir(null)}
      />
    </Layout>
  )
}