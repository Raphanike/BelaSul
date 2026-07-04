import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import CampoBusca from '../components/CampoBusca'
import ProdutoCard from '../components/ProdutoCard'
import Loading from '../components/Loading'
import { useDebounce } from '../hooks/useDebounce'
import { listarProdutos } from '../services/produtosService'

export default function Catalogo() {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const buscaAtrasada = useDebounce(busca, 300)
  const navigate = useNavigate()

  const carregar = useCallback(async (termo) => {
    setCarregando(true)
    const dados = await listarProdutos(termo)
    setProdutos(dados)
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar(buscaAtrasada)
  }, [buscaAtrasada, carregar])

  function irParaPedido() {
    navigate('/pedido-novo')
  }

  return (
    <Layout>
      <h1>Catálogo de Produtos</h1>
      <CampoBusca valor={busca} onChange={setBusca} placeholder="Pesquisar produto..." />

      {carregando ? (
        <Loading texto="Carregando catálogo..." />
      ) : produtos.length === 0 ? (
        <div className="vazio">
          <p>Nenhum produto cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {produtos.map((produto) => (
            <ProdutoCard key={produto.id} produto={produto} onClick={irParaPedido} acaoRotulo="Fazer Pedido" />
          ))}
        </div>
      )}
    </Layout>
  )
}
