import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import { obterEstatisticasDashboard } from '../services/pedidosService'
import { formatarMoeda, formatarData } from '../utils/formatters'
import { baixarPdfRelatorioDiario } from '../utils/pdfRelatorio'

export default function Dashboard() {
  const [estatisticas, setEstatisticas] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false)
  const navigate = useNavigate()

  const carregar = useCallback(async () => {
    setCarregando(true)
    const dados = await obterEstatisticasDashboard()
    setEstatisticas(dados)
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handleGerarRelatorio() {
    setGerandoRelatorio(true)
    try {
      await baixarPdfRelatorioDiario(estatisticas.pedidosHoje)
    } finally {
      setGerandoRelatorio(false)
    }
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1>Painel do Dia — {formatarData(new Date())}</h1>
        <button className="btn btn-primario btn-grande" onClick={() => navigate('/pedido-novo')} style={{ width: 'auto' }}>
          🛒 Novo Pedido
        </button>
      </div>

      {carregando ? (
        <Loading texto="Carregando estatísticas..." />
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="valor">{formatarMoeda(estatisticas.totalVendidoHoje)}</div>
              <div className="rotulo">Total vendido hoje</div>
            </div>
            <div className="stat-card">
              <div className="valor">{estatisticas.quantidadePedidos}</div>
              <div className="rotulo">Pedidos realizados hoje</div>
            </div>
            <div className="stat-card">
              <div className="valor">
                {formatarMoeda(
                  estatisticas.quantidadePedidos > 0
                    ? estatisticas.totalVendidoHoje / estatisticas.quantidadePedidos
                    : 0
                )}
              </div>
              <div className="rotulo">Ticket médio por pedido</div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ margin: 0 }}>Valor Total por Cliente (hoje)</h2>
              <button
                className="btn btn-secundario"
                onClick={handleGerarRelatorio}
                disabled={gerandoRelatorio || estatisticas.pedidosHoje.length === 0}
              >
                {gerandoRelatorio ? 'Gerando...' : '📄 Gerar Relatório Diário (PDF)'}
              </button>
            </div>

            {estatisticas.valorPorCliente.length === 0 ? (
              <p className="vazio">Nenhum pedido registrado hoje ainda.</p>
            ) : (
              <div style={{ marginTop: 16 }}>
                {estatisticas.valorPorCliente.map((item) => (
                  <div className="lista-item" key={item.nome}>
                    <div className="info-principal">{item.nome}</div>
                    <div style={{ fontWeight: 800, color: 'var(--azul-marinho)', fontSize: '1.1rem' }}>
                      {formatarMoeda(item.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
