import { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import CampoBusca from '../components/CampoBusca'
import Modal from '../components/Modal'
import ConfirmacaoModal from '../components/ConfirmacaoModal'
import Loading from '../components/Loading'
import { useDebounce } from '../hooks/useDebounce'
import { formatarMoeda } from '../utils/formatters'
import {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  uploadImagemProduto,
} from '../services/produtosService'

const PRODUTO_VAZIO = { nome: '', preco: '', tipo_venda: 'quantidade', unidade: 'un', imagem_url: '' }

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const buscaAtrasada = useDebounce(busca, 300)

  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null)
  const [formulario, setFormulario] = useState(PRODUTO_VAZIO)
  const [arquivoImagem, setArquivoImagem] = useState(null)
  const [previaImagem, setPreviaImagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null)

  const carregar = useCallback(async (termo) => {
    setCarregando(true)
    try {
      const dados = await listarProdutos(termo)
      setProdutos(dados)
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar(buscaAtrasada)
  }, [buscaAtrasada, carregar])

  function abrirNovo() {
    setProdutoEmEdicao(null)
    setFormulario(PRODUTO_VAZIO)
    setArquivoImagem(null)
    setPreviaImagem('')
    setErro('')
    setModalAberto(true)
  }

  function abrirEdicao(produto) {
    setProdutoEmEdicao(produto)
    setFormulario({
      nome: produto.nome,
      preco: produto.preco,
      tipo_venda: produto.tipo_venda,
      unidade: produto.unidade || (produto.tipo_venda === 'peso' ? 'kg' : 'un'),
      imagem_url: produto.imagem_url || '',
    })
    setArquivoImagem(null)
    setPreviaImagem(produto.imagem_url || '')
    setErro('')
    setModalAberto(true)
  }

  function handleImagemSelecionada(e) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setArquivoImagem(arquivo)
    setPreviaImagem(URL.createObjectURL(arquivo))
  }

  async function handleSalvar(e) {
    e.preventDefault()
    if (!formulario.nome.trim() || !formulario.preco) {
      setErro('Nome e preço são obrigatórios.')
      return
    }
    setSalvando(true)
    setErro('')
    try {
      let imagemUrl = formulario.imagem_url
      if (arquivoImagem) {
        imagemUrl = await uploadImagemProduto(arquivoImagem)
      }

      const dadosProduto = { ...formulario, imagem_url: imagemUrl }

      if (produtoEmEdicao) {
        await atualizarProduto(produtoEmEdicao.id, dadosProduto)
      } else {
        await criarProduto(dadosProduto)
      }
      setModalAberto(false)
      carregar(buscaAtrasada)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir() {
    try {
      await excluirProduto(produtoParaExcluir.id)
      setProdutoParaExcluir(null)
      carregar(buscaAtrasada)
    } catch (err) {
      setErro(err.message)
      setProdutoParaExcluir(null)
    }
  }

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1>Produtos</h1>
        <button className="btn btn-primario" onClick={abrirNovo}>
          + Novo Produto
        </button>
      </div>

      <CampoBusca valor={busca} onChange={setBusca} placeholder="Pesquisar produto pelo nome..." />

      {carregando ? (
        <Loading texto="Carregando produtos..." />
      ) : produtos.length === 0 ? (
        <div className="vazio">
          <p>Nenhum produto cadastrado.</p>
        </div>
      ) : (
        <div>
          {produtos.map((produto) => (
            <div className="lista-item" key={produto.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {produto.imagem_url && (
                  <img
                    src={produto.imagem_url}
                    alt={produto.nome}
                    style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }}
                  />
                )}
                <div>
                  <div className="info-principal">{produto.nome}</div>
                  <div className="info-secundaria">
                    {formatarMoeda(produto.preco)}
                    {produto.tipo_venda === 'peso' ? ` / ${produto.unidade}` : ' / unidade'}
                  </div>
                </div>
              </div>
              <div className="acoes">
                <button className="btn btn-outline" onClick={() => abrirEdicao(produto)}>
                  Editar
                </button>
                <button className="btn btn-perigo" onClick={() => setProdutoParaExcluir(produto)}>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        titulo={produtoEmEdicao ? 'Editar Produto' : 'Novo Produto'}
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
      >
        {erro && <div className="mensagem-erro">{erro}</div>}
        <form onSubmit={handleSalvar}>
          <div className="campo">
            <label htmlFor="nome-produto">Nome do produto *</label>
            <input
              id="nome-produto"
              type="text"
              value={formulario.nome}
              onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="linha-form-dupla">
            <div className="campo">
              <label htmlFor="preco-produto">Preço (R$) *</label>
              <input
                id="preco-produto"
                type="number"
                step="0.01"
                min="0"
                value={formulario.preco}
                onChange={(e) => setFormulario({ ...formulario, preco: e.target.value })}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="tipo-venda">Tipo de venda *</label>
              <select
                id="tipo-venda"
                value={formulario.tipo_venda}
                onChange={(e) =>
                  setFormulario({
                    ...formulario,
                    tipo_venda: e.target.value,
                    unidade: e.target.value === 'peso' ? 'kg' : 'un',
                  })
                }
              >
                <option value="quantidade">Por quantidade (un)</option>
                <option value="peso">Por peso (kg)</option>
              </select>
            </div>
          </div>

          <div className="campo">
            <label htmlFor="imagem-produto">Imagem do produto</label>
            <input id="imagem-produto" type="file" accept="image/*" onChange={handleImagemSelecionada} />
            {previaImagem && (
              <img
                src={previaImagem}
                alt="Pré-visualização"
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 10, marginTop: 8 }}
              />
            )}
          </div>

          <button type="submit" className="btn btn-primario btn-grande" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </form>
      </Modal>

      <ConfirmacaoModal
        aberto={!!produtoParaExcluir}
        titulo="Excluir Produto"
        mensagem={`Tem certeza que deseja excluir "${produtoParaExcluir?.nome}"?`}
        onConfirmar={handleExcluir}
        onCancelar={() => setProdutoParaExcluir(null)}
      />
    </Layout>
  )
}
