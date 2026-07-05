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
import { formatarMoeda } from '../utils/formatters'
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

  function numeroDoInput(valor) {
    if (valor === '' || valor === null || valor === undefined) return 0

    const numero = Number(String(valor).replace(',', '.'))
    return Number.isFinite(numero) ? numero : 0
  }

  function limparNumeroDigitado(valor, permiteDecimal = false) {
    let texto = String(valor)

    if (!permiteDecimal) {
      return texto.replace(/\D/g, '')
    }

    texto = texto.replace(',', '.')
    texto = texto.replace(/[^0-9.]/g, '')

    const partes = texto.split('.')

    if (partes.length > 1) {
      return `${partes[0]}.${partes.slice(1).join('')}`
    }

    return texto
  }

  useEffect(() => {
    if (!buscaClienteAtrasada.trim()) {
      setClientesEncontrados([])
      return
    }

    listarClientes(buscaClienteAtrasada).then(setClientesEncontrados)
  }, [buscaClienteAtrasada])

  const carregarProdutos = useCallback(async (termo) => {
    setCarregandoProdutos(true)

    try {
      const dados = await listarProdutos(termo)
      setProdutosEncontrados(dados)
    } finally {
      setCarregandoProdutos(false)
    }
  }, [])

  useEffect(() => {
    carregarProdutos(buscaProdutoAtrasada)
  }, [buscaProdutoAtrasada, carregarProdutos])

  useEffect(() => {
    async function carregarPedido() {
      if (!id) return

      try {
        const pedido = await buscarPedidoPorId(id)

        setClienteSelecionado({
          id: pedido.cliente_id,
          nome: pedido.clientes.nome,
          telefone: pedido.clientes.telefone,
        })

        setCarrinho(
          pedido.pedido_itens.map((item) => {
            const tipoVenda =
              item.tipo_venda ||
              item.produtos?.tipo_venda ||
              'peso'

            const unidade =
              item.unidade ||
              item.produtos?.unidade ||
              (tipoVenda === 'peso' ? 'kg' : 'un')

            return {
              produto_id: item.produto_id,
              nome_produto: item.nome_produto,
              preco_unitario: item.preco_unitario,

              // Campo informativo
              quantidade_unidades:
                item.quantidade_unidades === null ||
                item.quantidade_unidades === undefined
                  ? ''
                  : String(item.quantidade_unidades),

              // Campo que calcula
              quantidade:
                item.quantidade === null ||
                item.quantidade === undefined
                  ? ''
                  : String(item.quantidade),

              subtotal: Number(item.subtotal || 0),
              tipo_venda: tipoVenda,
              unidade,
            }
          })
        )
      } catch (err) {
        setErro(err.message)
      }
    }

    carregarPedido()
  }, [id])

  function adicionarProduto(produto) {
    const jaExiste = carrinho.find((item) => item.produto_id === produto.id)

    if (jaExiste) {
      setErro('Este produto já está no pedido. Ajuste a quantidade no resumo.')
      return
    }

    setErro('')

    const tipoVenda = produto.tipo_venda || 'peso'
    const unidade = produto.unidade || (tipoVenda === 'peso' ? 'kg' : 'un')

    const novoItem = {
      produto_id: produto.id,
      nome_produto: produto.nome,
      preco_unitario: produto.preco,
      tipo_venda: tipoVenda,
      unidade,

      // Unidades = informativo, não entra no cálculo
      quantidade_unidades: '',

      // Quantidade = cálculo. Se for peso, vira Peso.
      quantidade: '',

      subtotal: 0,
    }

    setCarrinho((atual) => [...atual, novoItem])
  }

  function atualizarUnidades(produtoId, valorDigitado) {
    const unidades = limparNumeroDigitado(valorDigitado, false)

    setCarrinho((atual) =>
      atual.map((item) =>
        item.produto_id === produtoId
          ? {
              ...item,
              quantidade_unidades: unidades,
            }
          : item
      )
    )
  }

  function atualizarQuantidade(produtoId, valorDigitado) {
    setCarrinho((atual) =>
      atual.map((item) => {
        if (item.produto_id !== produtoId) return item

        const permiteDecimal = item.tipo_venda === 'peso'
        const quantidade = limparNumeroDigitado(valorDigitado, permiteDecimal)

        return {
          ...item,
          quantidade,
          subtotal: calcularSubtotal(
            item.preco_unitario,
            numeroDoInput(quantidade)
          ),
        }
      })
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

    const itemSemQuantidade = carrinho.find(
      (item) => numeroDoInput(item.quantidade) <= 0
    )

    if (itemSemQuantidade) {
      setErro(
        `Informe ${
          itemSemQuantidade.tipo_venda === 'peso' ? 'o peso' : 'a quantidade'
        } de ${itemSemQuantidade.nome_produto}.`
      )
      return
    }

    const itensParaSalvar = carrinho.map((item) => {
      const quantidadeNumerica = numeroDoInput(item.quantidade)

      return {
        ...item,
        quantidade: quantidadeNumerica,
        quantidade_unidades:
          item.quantidade_unidades === '' ||
          item.quantidade_unidades === null ||
          item.quantidade_unidades === undefined
            ? null
            : numeroDoInput(item.quantidade_unidades),
        subtotal: calcularSubtotal(item.preco_unitario, quantidadeNumerica),
      }
    })

    const totalParaSalvar = calcularTotalPedido(itensParaSalvar)

    setFinalizando(true)

    try {
      let pedidoSalvo

      if (id) {
        await atualizarPedido(id, {
          clienteId: clienteSelecionado.id,
          itens: itensParaSalvar,
        })

        pedidoSalvo = {
          id,
          total: totalParaSalvar,
          pedido_itens: itensParaSalvar,
        }
      } else {
        pedidoSalvo = await criarPedido({
          clienteId: clienteSelecionado.id,
          itens: itensParaSalvar,
          userId: usuario?.id,
        })

        pedidoSalvo = {
          ...pedidoSalvo,
          total: totalParaSalvar,
          pedido_itens: pedidoSalvo.pedido_itens || pedidoSalvo.itens || itensParaSalvar,
        }
      }

      setPedidoConcluido({
        ...pedidoSalvo,
        total: totalParaSalvar,
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
    setErro('')
  }

  if (pedidoConcluido) {
    return (
      <Layout>
        <div
          className="card"
          style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}
        >
          <h1>{id ? '✅ Pedido Atualizado!' : '✅ Pedido Finalizado!'}</h1>

          <p style={{ fontSize: '1.2rem' }}>
            Cliente: <strong>{pedidoConcluido.clientes.nome}</strong>
          </p>

          <p
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              color: 'var(--azul-marinho)',
            }}
          >
            Total: {formatarMoeda(pedidoConcluido.total)}
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 20,
            }}
          >
            <button
              className="btn btn-secundario btn-grande"
              onClick={() => baixarPdfPedido(pedidoConcluido)}
            >
              📄 Baixar PDF do Pedido
            </button>

            <button
              className="btn btn-sucesso btn-grande"
              onClick={() =>
                abrirWhatsApp(
                  pedidoConcluido,
                  pedidoConcluido.clientes.telefone
                )
              }
            >
              📲 Compartilhar no WhatsApp
            </button>

            <button
              className="btn btn-primario btn-grande"
              onClick={iniciarNovoPedido}
            >
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
          <div className="card" style={{ marginBottom: 20 }}>
            <h2>1. Selecione o Cliente</h2>

            {clienteSelecionado ? (
              <div className="lista-item">
                <div>
                  <div className="info-principal">{clienteSelecionado.nome}</div>
                  <div className="info-secundaria">
                    {clienteSelecionado.telefone}
                  </div>
                </div>

                <button
                  className="btn btn-outline"
                  onClick={() => setClienteSelecionado(null)}
                >
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

                    <button className="btn btn-primario btn-icone">
                      Selecionar
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="card">
            <h2>2. Adicione os Produtos</h2>

            <CampoBusca
              valor={buscaProduto}
              onChange={setBuscaProduto}
              placeholder="Pesquisar produto..."
            />

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
                      <img
                        src={produto.imagem_url}
                        alt={produto.nome}
                        className="imagem-produto"
                      />
                    )}

                    <div className="conteudo-produto">
                      <span className="nome-produto">{produto.nome}</span>

                      <span className="preco-produto">
                        {formatarMoeda(produto.preco)}
                        {produto.tipo_venda === 'peso'
                          ? ` / ${produto.unidade || 'kg'}`
                          : ' / un'}
                      </span>

                      <button className="btn btn-primario">
                        + Adicionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="carrinho">
          <h2>Resumo do Pedido</h2>

          {carrinho.length === 0 ? (
            <p className="vazio">Nenhum produto adicionado ainda.</p>
          ) : (
            <>
              {carrinho.map((item) => (
                <div className="item-carrinho" key={item.produto_id}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>
                      {item.nome_produto}
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {formatarMoeda(item.preco_unitario)}
                      {item.tipo_venda === 'peso'
                        ? ` / ${item.unidade}`
                        : ' / un'}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginTop: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12 }}>Unidades</div>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.quantidade_unidades ?? ''}
                          placeholder="Ex: 10"
                          onChange={(e) =>
                            atualizarUnidades(item.produto_id, e.target.value)
                          }
                          style={{
                            width: 90,
                            padding: 8,
                            borderRadius: 8,
                            border: '2px solid var(--cinza-claro)',
                          }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: 12 }}>
                          {item.tipo_venda === 'peso'
                            ? 'Peso'
                            : 'Quantidade'}
                        </div>

                        <input
                          type="text"
                          inputMode={
                            item.tipo_venda === 'peso'
                              ? 'decimal'
                              : 'numeric'
                          }
                          value={item.quantidade ?? ''}
                          placeholder={
                            item.tipo_venda === 'peso'
                              ? 'Ex: 25.5'
                              : 'Ex: 3'
                          }
                          onChange={(e) =>
                            atualizarQuantidade(
                              item.produto_id,
                              e.target.value
                            )
                          }
                          style={{
                            width: 100,
                            padding: 8,
                            borderRadius: 8,
                            border: '2px solid var(--cinza-claro)',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: 800,
                        color: 'var(--azul-marinho)',
                      }}
                    >
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
              ? id
                ? 'Salvando...'
                : 'Finalizando...'
              : id
                ? '💾 Salvar Alterações'
                : '✅ Finalizar Pedido'}
          </button>
        </div>
      </div>
    </Layout>
  )
}