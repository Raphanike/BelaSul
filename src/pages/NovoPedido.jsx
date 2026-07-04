import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import CampoBusca from '../components/CampoBusca'
import Loading from '../components/Loading'
import { useDebounce } from '../hooks/useDebounce'
import { useAuthContext } from '../hooks/AuthContext'
import { listarClientes } from '../services/clientesService'
import { listarProdutos } from '../services/produtosService'
import {
  criarPedido,
  atualizarPedido,
  buscarPedidoPorId,
  calcularSubtotal,
  calcularTotalPedido,
} from '../services/pedidosService'
import { formatarMoeda, formatarQuantidade } from '../utils/formatters'
import { baixarPdfPedido } from '../utils/pdfPedido'
import { abrirWhatsApp } from '../utils/whatsapp'


export default function NovoPedido() {
  const { usuario } = useAuthContext()
  const { id } = useParams()

  // Cliente
  const [buscaCliente, setBuscaCliente] = useState('')
  const buscaClienteAtrasada = useDebounce(buscaCliente, 300)
  const [clientesEncontrados, setClientesEncontrados] = useState([])
  const [clienteSelecionado, setClienteSelecionado] = useState(null)

  // Produtos
  const [buscaProduto, setBuscaProduto] = useState('')
  const buscaProdutoAtrasada = useDebounce(buscaProduto, 300)
  const [produtosEncontrados, setProdutosEncontrados] = useState([])
  const [carregandoProdutos, setCarregandoProdutos] = useState(false)

  // Carrinho
  const [carrinho, setCarrinho] = useState([])

  // Estado geral
  const [erro, setErro] = useState('')
  const [finalizando, setFinalizando] = useState(false)
  const [pedidoConcluido, setPedidoConcluido] = useState(null)

  useEffect(() => {
    if (!buscaClienteAtrasada.trim()) {
      setClientesEncontrados([])
      return
    }
    listarClientes(buscaClienteAtrasada).then(setClientesEncontrados)
  }, [buscaClienteAtrasada])

  const carregarProdutos = useCallback(async (termo) => {
    setCarregandoProdutos(true)
    const dados = await listarProdutos(termo)
    setProdutosEncontrados(dados)
    setCarregandoProdutos(false)
  }, [])

  useEffect(() => {
    carregarProdutos(buscaProdutoAtrasada)
  }, [buscaProdutoAtrasada, carregarProdutos])

  useEffect(() => {
  async function carregarPedido() {
    if (!id) return

    const pedido = await buscarPedidoPorId(id)

    setClienteSelecionado({
  id: pedido.cliente_id,
  nome: pedido.clientes.nome,
  telefone: pedido.clientes.telefone,
})

    setCarrinho(
      pedido.pedido_itens.map(item => ({
        produto_id: item.produto_id,
        nome_produto: item.nome_produto,
        preco_unitario: item.preco_unitario,
        quantidade: item.quantidade,
        subtotal: item.subtotal,
        tipo_venda: item.tipo_venda,
        unidade: item.unidade
      }))
    )
  }

  carregarPedido()
}, [id])

  function adicionarProduto(produto) {
    const jaExiste = carrinho.find((item) => item.produto_id === produto.id)
    if (jaExiste) {
      atualizarQuantidade(produto.id, Number(jaExiste.quantidade) + 1)
      return
    }
    const quantidadeInicial = produto.tipo_venda === 'peso' ? 1 : 1
    const novoItem = {
      produto_id: produto.id,
      nome_produto: produto.nome,
      preco_unitario: produto.preco,
      tipo_venda: produto.tipo_venda,
      unidade: produto.unidade || (produto.tipo_venda === 'peso' ? 'kg' : 'un'),
      quantidade: quantidadeInicial,
      quantidade_unidades: 1, // NOVO
      subtotal: calcularSubtotal(produto.preco, quantidadeInicial),
    }
    setCarrinho((atual) => [...atual, novoItem])
  }

  function atualizarQuantidade(produtoId, novaQuantidade) {
    setCarrinho((atual) =>
      atual.map((item) =>
        item.produto_id === produtoId
          ? {
              ...item,
              quantidade: novaQuantidade,
              subtotal: calcularSubtotal(item.preco_unitario, novaQuantidade || 0),
            }
          : item
      )
    )
  }

  function removerItem(produtoId) {
    setCarrinho((atual) => atual.filter((item) => item.produto_id !== produtoId))
  }

  const total = calcularTotalPedido(carrinho)

  async function handleFinalizar() {
  setErro('')

  if (!clienteSelecionado) {
    setErro('Selecione um cliente para o pedido.')
    return
  }

  if (carrinho.length === 0) {
    setErro('Adicione ao menos um produto ao pedido.')
    return
  }

  setFinalizando(true)

  try {
    let pedidoSalvo

    if (id) {
      await atualizarPedido(id, {
        clienteId: clienteSelecionado.id,
        itens: carrinho,
      })

      pedidoSalvo = {
        id,
        total,
        pedido_itens: carrinho,
      }
    } else {
      pedidoSalvo = await criarPedido({
        clienteId: clienteSelecionado.id,
        itens: carrinho,
        userId: usuario?.id,
      })
    }

    setPedidoConcluido({
      ...pedidoSalvo,
      clientes: {
        nome: clienteSelecionado.nome,
        telefone: clienteSelecionado.telefone,
      },
    })
  } catch (err) {
    setErro(err.message)
  } finally {
    setFinalizando(false)
  }
}

  function iniciarNovoPedido() {
    setPedidoConcluido(null)
    setCarrinho([])
    setClienteSelecionado(null)
    setBuscaCliente('')
    setBuscaProduto('')
  }

  if (pedidoConcluido) {
    return (
      <Layout>
        <div className="card" style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <h1>{id ? '✅ Pedido Atualizado!' : '✅ Pedido Finalizado!'}</h1>
          <p style={{ fontSize: '1.2rem' }}>
            Cliente: <strong>{pedidoConcluido.clientes.nome}</strong>
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--azul-marinho)' }}>
            Total: {formatarMoeda(pedidoConcluido.total)}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            <button className="btn btn-secundario btn-grande" onClick={() => baixarPdfPedido(pedidoConcluido)}>
              📄 Baixar PDF do Pedido
            </button>
            <button
              className="btn btn-sucesso btn-grande"
              onClick={() => abrirWhatsApp(pedidoConcluido, pedidoConcluido.clientes.telefone)}
            >
              📲 Compartilhar no WhatsApp
            </button>
            <button className="btn btn-primario btn-grande" onClick={iniciarNovoPedido}>
              ➕ Criar Novo Pedido
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <h1>{id ? 'Editar Pedido' : 'Novo Pedido'}</h1>
      {erro && <div className="mensagem-erro">{erro}</div>}

      <div className="duas-colunas">
        <div>
          {/* Seleção de cliente */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h2>1. Selecione o Cliente</h2>
            {clienteSelecionado ? (
              <div className="lista-item">
                <div>
                  <div className="info-principal">{clienteSelecionado.nome}</div>
                  <div className="info-secundaria">{clienteSelecionado.telefone}</div>
                </div>
                <button className="btn btn-outline" onClick={() => setClienteSelecionado(null)}>
                  Trocar cliente
                </button>
              </div>
            ) : (
              <>
                <CampoBusca
                  valor={buscaCliente}
                  onChange={setBuscaCliente}
                  placeholder="Digite o nome do cliente..."
                />
                {clientesEncontrados.map((cliente) => (
                  <div
                    className="lista-item"
                    key={cliente.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setClienteSelecionado(cliente)
                      setClientesEncontrados([])
                    }}
                  >
                    <div>
                      <div className="info-principal">{cliente.nome}</div>
                      <div className="info-secundaria">{cliente.telefone}</div>
                    </div>
                    <button className="btn btn-primario btn-icone">Selecionar</button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Seleção de produtos */}
          <div className="card">
            <h2>2. Adicione os Produtos</h2>
            <CampoBusca valor={buscaProduto} onChange={setBuscaProduto} placeholder="Pesquisar produto..." />
            {carregandoProdutos ? (
              <Loading texto="Buscando produtos..." />
            ) : (
              <div className="grid-cards">
                {produtosEncontrados.map((produto) => (
                  <div
                    key={produto.id}
                    className="produto-card"
                    onClick={() => adicionarProduto(produto)}
                  >
                    {produto.imagem_url && (
                      <img src={produto.imagem_url} alt={produto.nome} className="imagem-produto" />
                    )}
                    <div className="conteudo-produto">
                      <span className="nome-produto">{produto.nome}</span>
                      <span className="preco-produto">
                        {formatarMoeda(produto.preco)}
                        {produto.tipo_venda === 'peso' ? ` / ${produto.unidade}` : ''}
                      </span>
                      <button className="btn btn-primario">+ Adicionar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div className="carrinho">
          <h2>Resumo do Pedido</h2>
          {carrinho.length === 0 ? (
            <p className="vazio">Nenhum produto adicionado ainda.</p>
          ) : (
            <>
              {carrinho.map((item) => (
                <div className="item-carrinho" key={item.produto_id}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{item.nome_produto}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {formatarMoeda(item.preco_unitario)}
                      {item.tipo_venda === 'peso' ? ` / ${item.unidade}` : ' / un'}
                    </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>

  <div>
    <div style={{ fontSize: 12 }}>Unidades</div>
    <input
      type="number"
      min="1"
      value={item.quantidade_unidades}
      onChange={(e) => {
        const valor = Number(e.target.value)

        setCarrinho(atual =>
          atual.map(i =>
            i.produto_id === item.produto_id
              ? {
                  ...i,
                  quantidade_unidades: valor
                }
              : i
          )
        )
      }}
      style={{
        width: 70,
        padding: 8,
        borderRadius: 8,
        border: '2px solid var(--cinza-claro)'
      }}
    />
  </div>

  <div>
    <div style={{ fontSize: 12 }}>
      {item.tipo_venda === 'peso' ? 'Peso' : 'Quantidade'}
    </div>

    <input
      type="number"
      min="0"
      step={item.tipo_venda === 'peso' ? '0.01' : '1'}
      value={item.quantidade}
      onChange={(e) => atualizarQuantidade(item.produto_id, Number(e.target.value))}
      style={{
        width: 90,
        padding: 8,
        borderRadius: 8,
        border: '2px solid var(--cinza-claro)'
      }}
    />
  </div>

</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--azul-marinho)' }}>
                      {formatarMoeda(item.subtotal)}
                    </div>
                    <button
                      className="btn btn-perigo btn-icone"
                      style={{ marginTop: 6 }}
                      onClick={() => removerItem(item.produto_id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}

              <div className="total-carrinho">
                <span>Total</span>
                <span>{formatarMoeda(total)}</span>
              </div>
            </>
          )}

          <button
            className="btn btn-primario btn-grande"
            style={{ marginTop: 18 }}
            onClick={handleFinalizar}
            disabled={finalizando || carrinho.length === 0}
          >
            {finalizando
  ? (id ? 'Salvando...' : 'Finalizando...')
  : (id ? '💾 Salvar Alterações' : '✅ Finalizar Pedido')}
          </button>
        </div>
      </div>
    </Layout>
  )
}
